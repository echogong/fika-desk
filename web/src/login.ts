// Agent 登录的消息只有登录窗口关心，不放进全局状态（设置向导的终端输出很碎）
import type { ServerMsg } from '../../shared/types';

export type LoginMsg = Extract<ServerMsg, { type: 'login' | 'login:output' }>;

const listeners = new Set<(msg: LoginMsg) => void>();

export function onLoginMessage(fn: (msg: LoginMsg) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitLoginMessage(msg: LoginMsg): void {
  for (const fn of listeners) fn(msg);
}
