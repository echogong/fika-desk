// 测试连接（设置页）：启动进程 → 握手 → 新建会话，每一步记下耗时，卡在哪一步一眼能看出来。
// 顺便拿到版本、能力和可选模型；测试用的会话用完就关掉，不在 Agent 的历史里留空会话。
import { spawn, type ChildProcess } from 'node:child_process';
import { authMethodsOf, initializeAgent } from './agent-login';
import type { Launch } from './agents';
import { JsonRpcConnection, RpcError } from './rpc';
import { selectConfiguredModel } from './configured-model';
import { killTree } from './session';
import type { ProbeResult, SelectOption } from '../shared/types';

const STEP_TIMEOUT = 120_000;

export async function probeAgent(launch: Launch, cwd: string): Promise<ProbeResult> {
  // authMethods 一开始就给空数组：页面靠它区分“更新前测的旧结果”（没有这一项）和“没走到握手”（空的）
  const result: ProbeResult = { at: Date.now(), ok: false, steps: [], authMethods: [] };
  const stderr: string[] = [];
  const tail = () => stderr.slice(-8).join('\n') || undefined;

  let t = Date.now();
  let proc: ChildProcess;
  try {
    proc = spawn(launch.command, launch.args, {
      cwd,
      env: launch.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });
  } catch (error) {
    result.steps.push({ key: 'spawn', ok: false, ms: 0, error: messageOf(error) });
    return result;
  }
  proc.stderr?.setEncoding('utf8');
  proc.stderr?.on('data', (chunk: string) => {
    for (const line of chunk.split('\n')) if (line.trim()) stderr.push(line.slice(0, 300));
    if (stderr.length > 40) stderr.splice(0, stderr.length - 40);
  });
  const spawnError = await new Promise<string | null>((resolve) => {
    proc.once('spawn', () => resolve(null));
    proc.once('error', (error) => resolve(messageOf(error)));
  });
  result.steps.push({ key: 'spawn', ok: !spawnError, ms: Date.now() - t, error: spawnError ?? undefined });
  if (spawnError) return result;

  const rpc = new JsonRpcConnection(proc.stdout!, proc.stdin!, {
    // 测试时不会走到要审批的地方
    onRequest: async (method) => {
      throw new RpcError(`不支持的方法：${method}`, -32601);
    },
    onNotification: () => {},
  });
  proc.on('exit', (code, signal) => rpc.close(new Error(`Agent 进程退出了（${signal ? `信号 ${signal}` : `退出码 ${code}`}）`)));

  try {
    t = Date.now();
    let init: any;
    try {
      // 和登录时的握手一样，Agent 才会把能用的登录方式都报出来（比如 Codex 的验证码登录）
      init = await initializeAgent(rpc, STEP_TIMEOUT);
    } catch (error) {
      result.steps.push({ key: 'initialize', ok: false, ms: Date.now() - t, error: messageOf(error) });
      result.detail = tail();
      return result;
    }
    result.steps.push({ key: 'initialize', ok: true, ms: Date.now() - t });
    const info = init?.agentInfo ?? {};
    const name = String(info.name ?? '').replace(/^@[^/]+\//, '');
    result.version = [name, info.version].filter(Boolean).join(' ') || undefined;
    result.authMethods = authMethodsOf(init?.authMethods);
    const caps = init?.agentCapabilities ?? {};
    result.caps = {
      history: caps.sessionCapabilities?.list != null,
      resume: caps.loadSession === true || caps.sessionCapabilities?.resume != null,
      models: false,
      images: caps.promptCapabilities?.image === true,
    };

    t = Date.now();
    let session: any;
    try {
      session = await rpc.request('session/new', { ...launch.sessionParams, cwd, mcpServers: [] }, STEP_TIMEOUT);
      session = await selectConfiguredModel(rpc, session, launch.modelId, String(session.sessionId), STEP_TIMEOUT, launch.allowUnlistedModel);
    } catch (error) {
      const needsLogin = error instanceof RpcError && (error.code === -32000 || /auth|login|unauthor/i.test(error.message));
      result.steps.push({ key: 'session', ok: false, ms: Date.now() - t, error: needsLogin ? '还没有登录' : messageOf(error) });
      result.needsLogin = needsLogin;
      result.detail = tail();
      return result;
    }
    result.steps.push({ key: 'session', ok: true, ms: Date.now() - t });
    const { models, current } = modelsOf(session);
    result.models = models;
    result.currentModel = current;
    const modes = modesOf(session);
    result.modes = modes.modes;
    result.currentMode = modes.current;
    result.caps.models = models.length > 1;
    result.ok = true;
    if (caps.sessionCapabilities?.close != null && session?.sessionId) {
      await rpc.request('session/close', { sessionId: session.sessionId }, 5_000).catch(() => {});
    } else if (caps.sessionCapabilities?.delete != null && session?.sessionId) {
      await rpc.request('session/delete', { sessionId: session.sessionId }, 5_000).catch(() => {});
    }
    return result;
  } finally {
    rpc.close(new Error('测试结束'));
    killTree(proc, 'SIGTERM');
  }
}

/** 从新建会话的回应里找出可选模型：新版在 configOptions（category = model），旧版在 models */
function modelsOf(session: any): { models: SelectOption[]; current?: string } {
  const option = Array.isArray(session?.configOptions)
    ? session.configOptions.find((o: any) => o?.category === 'model' && o?.type === 'select')
    : undefined;
  if (option) {
    const models: SelectOption[] = [];
    for (const entry of option.options ?? []) {
      for (const o of Array.isArray(entry?.options) ? entry.options : [entry]) {
        if (o?.value != null) models.push({ value: String(o.value), name: String(o.name ?? o.value), description: o.description ?? undefined });
      }
    }
    return { models, current: option.currentValue != null ? String(option.currentValue) : undefined };
  }
  const legacy = session?.models;
  if (Array.isArray(legacy?.availableModels)) {
    return {
      models: legacy.availableModels.map((m: any) => ({ value: String(m.modelId), name: String(m.name ?? m.modelId) })),
      current: legacy.currentModelId != null ? String(legacy.currentModelId) : undefined,
    };
  }
  return { models: [] };
}

/** Agent 自己的权限模式：新版在 configOptions（category = mode），旧版在 modes */
function modesOf(session: any): { modes: SelectOption[]; current?: string } {
  const option = Array.isArray(session?.configOptions)
    ? session.configOptions.find((o: any) => o?.category === 'mode' && o?.type === 'select')
    : undefined;
  if (option) {
    const modes: SelectOption[] = [];
    for (const entry of option.options ?? []) {
      for (const o of Array.isArray(entry?.options) ? entry.options : [entry]) {
        if (o?.value != null) modes.push({ value: String(o.value), name: String(o.name ?? o.value), description: o.description ?? undefined });
      }
    }
    return { modes, current: option.currentValue != null ? String(option.currentValue) : undefined };
  }
  const legacy = session?.modes;
  if (Array.isArray(legacy?.availableModes)) {
    return {
      modes: legacy.availableModes.map((m: any) => ({ value: String(m.id), name: String(m.name ?? m.id), description: m.description ?? undefined })),
      current: legacy.currentModeId != null ? String(legacy.currentModeId) : undefined,
    };
  }
  return { modes: [] };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
