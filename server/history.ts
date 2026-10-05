import { APP_ID, APP_NAME } from '../shared/brand';
// 历史会话：读取各 Agent 在命令行里开的会话（ACP 的 session/list）。
// 得先启动一次 Agent 才能问，所以同一时间只问一次，结果缓存一会儿，问完就把进程关掉。
import { spawn } from 'node:child_process';
import type { Launch } from './agents';
import { JsonRpcConnection, RpcError } from './rpc';
import { killTree } from './session';

export interface AgentSessionInfo {
  sessionId: string;
  title?: string;
  updatedAt?: number;
}

const CACHE_MS = 20_000;
const MAX_PAGES = 3;
const MAX_SESSIONS = 60;

export class HistoryLister {
  private cache = new Map<string, { at: number; list: AgentSessionInfo[] }>();
  private inflight = new Map<string, Promise<AgentSessionInfo[]>>();

  list(agentId: string, launch: Launch, cwd: string): Promise<AgentSessionInfo[]> {
    const key = `${agentId}\n${cwd}`;
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.list);
    let pending = this.inflight.get(key);
    if (!pending) {
      pending = listSessions(launch, cwd)
        .then((list) => {
          this.cache.set(key, { at: Date.now(), list });
          return list;
        })
        .finally(() => this.inflight.delete(key));
      this.inflight.set(key, pending);
    }
    return pending;
  }

  /** 最近一次列出来的某个会话（打开时要用它的标题） */
  find(agentId: string, cwd: string, sessionId: string): AgentSessionInfo | undefined {
    return this.cache.get(`${agentId}\n${cwd}`)?.list.find((s) => s.sessionId === sessionId);
  }
}

async function listSessions(launch: Launch, cwd: string): Promise<AgentSessionInfo[]> {
  const proc = spawn(launch.command, launch.args, {
    cwd,
    env: launch.env,
    stdio: ['pipe', 'pipe', 'ignore'],
    detached: process.platform !== 'win32',
  });
  const rpc = new JsonRpcConnection(proc.stdout!, proc.stdin!, {
    // 只是列会话，不会有审批之类的请求
    onRequest: async (method) => {
      throw new RpcError(`不支持的方法：${method}`, -32601);
    },
    onNotification: () => {},
  });
  proc.on('error', (error) => rpc.close(error));
  proc.on('exit', () => rpc.close(new Error('Agent 进程已退出')));
  try {
    const init = await rpc.request<any>(
      'initialize',
      {
        protocolVersion: 1,
        clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
        clientInfo: { name: APP_ID, title: APP_NAME, version: '1.0.0' },
      },
      60_000,
    );
    if (init?.agentCapabilities?.sessionCapabilities?.list == null) return [];
    const out: AgentSessionInfo[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES && out.length < MAX_SESSIONS; page++) {
      const result = await rpc.request<any>('session/list', cursor ? { cwd, cursor } : { cwd }, 30_000);
      const sessions: any[] = Array.isArray(result?.sessions) ? result.sessions : [];
      for (const s of sessions) {
        // 有的 Agent 不按目录筛，这里再筛一遍
        if (!s?.sessionId || (s.cwd && s.cwd !== cwd)) continue;
        out.push({
          sessionId: String(s.sessionId),
          title: typeof s.title === 'string' && s.title.trim() ? s.title.trim().slice(0, 60) : undefined,
          updatedAt: s.updatedAt ? Date.parse(s.updatedAt) || undefined : undefined,
        });
      }
      cursor = result?.nextCursor ?? undefined;
      if (!cursor || sessions.length === 0) break;
    }
    return out.slice(0, MAX_SESSIONS);
  } finally {
    rpc.close(new Error('读取完成'));
    killTree(proc, 'SIGTERM');
  }
}
