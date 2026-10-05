import { APP_ID, APP_NAME } from '../shared/brand';
// 订阅用量：目前只有 Codex 能查。直接问 Codex 自己的账户接口（codex app-server 的 account/read、
// account/rateLimits/read），只读，不调模型、不花额度。用 ChatGPT 账号登录时有额度窗口（比如“本周”“5 小时”），
// 用 API Key 登录时按量计费、没有额度。
import { spawn, type ChildProcess } from 'node:child_process';
import { which, type Launch } from './agents';
import { JsonRpcConnection, RpcError } from './rpc';
import { killTree } from './session';
import type { AgentQuota, QuotaWindow } from '../shared/types';

const TIMEOUT = 20_000;

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  go: 'Go',
  plus: 'Plus',
  pro: 'Pro',
  prolite: 'Pro Lite',
  team: 'Team',
  business: 'Business',
  enterprise: 'Enterprise',
  edu: 'Edu',
};

export async function readCodexQuota(launch: Launch, cwd: string): Promise<AgentQuota> {
  const at = Date.now();
  // codex-acp 用的是哪个 codex，这里就问哪个：设了 CODEX_PATH 用它，否则按 PATH 找（项目自带的排在最前）
  const command = launch.env.CODEX_PATH || which('codex', launch.env.PATH ?? '');
  if (!command) return { at, kind: 'unknown', windows: [], error: '没找到 codex 命令' };
  let proc: ChildProcess | undefined;
  let rpc: JsonRpcConnection | undefined;
  try {
    proc = spawn(command, ['app-server'], { cwd, env: launch.env, stdio: ['pipe', 'pipe', 'ignore'], detached: process.platform !== 'win32' });
    const started = proc;
    await new Promise<void>((resolve, reject) => {
      started.once('spawn', () => resolve());
      started.once('error', reject);
    });
    const conn = new JsonRpcConnection(started.stdout!, started.stdin!, {
      onRequest: async (method) => {
        throw new RpcError(`不支持的方法：${method}`, -32601);
      },
      onNotification: () => {},
    });
    rpc = conn;
    started.on('exit', () => conn.close(new Error('codex 退出了')));
    await conn.request('initialize', { clientInfo: { name: APP_ID, title: APP_NAME, version: '1.0.0' }, capabilities: null }, TIMEOUT);
    conn.notify('initialized', undefined);
    const { account } = await conn.request<any>('account/read', { refreshToken: false }, TIMEOUT);
    if (!account) return { at, kind: 'unknown', windows: [], error: '还没有登录' };
    if (account.type === 'apiKey') return { at, kind: 'api-key', windows: [] };
    if (account.type !== 'chatgpt') return { at, kind: 'unknown', windows: [] };
    const res = await conn.request<any>('account/rateLimits/read', {}, TIMEOUT);
    const snapshots: any[] = Object.values(res?.rateLimitsByLimitId ?? {}).filter(Boolean);
    if (!snapshots.length && res?.rateLimits) snapshots.push(res.rateLimits);
    const windows: QuotaWindow[] = [];
    for (const snap of snapshots) {
      // 有的套餐按模型分开计（limitName），名字放在前面
      const prefix = snap.limitName ? `${snap.limitName} · ` : '';
      for (const w of [snap.primary, snap.secondary]) {
        if (w && typeof w.usedPercent === 'number') {
          windows.push({ label: prefix + windowLabel(w.windowDurationMins), usedPercent: w.usedPercent, resetsAt: w.resetsAt ? w.resetsAt * 1000 : undefined });
        }
      }
    }
    const main = res?.rateLimits ?? snapshots[0] ?? {};
    const planType = String(main.planType ?? account.planType ?? '');
    const credits = main.credits;
    return {
      at,
      kind: 'subscription',
      plan: PLAN_NAMES[planType] ?? (planType || undefined),
      windows,
      credits: credits?.unlimited ? '不限' : typeof credits?.balance === 'string' && (credits.hasCredits || credits.balance !== '0') ? credits.balance : undefined,
      resetCredits: typeof res?.rateLimitResetCredits?.availableCount === 'number' ? res.rateLimitResetCredits.availableCount : undefined,
    };
  } catch (error) {
    return { at, kind: 'unknown', windows: [], error: error instanceof Error ? error.message : String(error) };
  } finally {
    rpc?.close(new Error('读完了'));
    if (proc) killTree(proc, 'SIGTERM');
  }
}

/** 额度窗口的名字：300 分钟是“5 小时”，10080 分钟是“本周” */
function windowLabel(mins: number | null | undefined): string {
  if (mins === 300) return '5 小时';
  if (mins === 10080) return '本周';
  if (mins === 1440) return '今天';
  if (!mins) return '额度';
  if (mins % 1440 === 0) return `${mins / 1440} 天`;
  if (mins % 60 === 0) return `${mins / 60} 小时`;
  return `${mins} 分钟`;
}
