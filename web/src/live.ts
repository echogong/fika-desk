// 登录窗口、安装窗口用的实时消息：只有开着的窗口关心，不放进全局状态（终端输出很碎）
import type { ServerMsg } from '../../shared/types';

export type LiveMsg = Extract<ServerMsg, { type: 'login' | 'login:output' | 'install:output' | 'install:busy' | 'agent:tested' }>;

const listeners = new Set<(msg: LiveMsg) => void>();

export function onLiveMessage(fn: (msg: LiveMsg) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitLiveMessage(msg: LiveMsg): void {
  for (const fn of listeners) fn(msg);
}

/** 开着安装窗口的 Agent：做完了窗口里会显示结果，就不另外弹提示 */
const watching = new Map<string, number>();

export function watchInstall(agentId: string): () => void {
  watching.set(agentId, (watching.get(agentId) ?? 0) + 1);
  return () => {
    const n = (watching.get(agentId) ?? 1) - 1;
    if (n > 0) watching.set(agentId, n);
    else watching.delete(agentId);
  };
}

export function isWatchingInstall(agentId: string): boolean {
  return watching.has(agentId);
}
