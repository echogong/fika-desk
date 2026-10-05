import { tx } from './i18n';
// 登录：问服务端登录状态、首次设置密码、登录、退出。登录凭证在 HttpOnly Cookie 里，页面脚本碰不到。
import { setState } from './store';

export interface ServerAuthState {
  needsSetup: boolean;
  loggedIn: boolean;
  /** 这个 IP 还要锁多少秒 */
  lockedFor: number;
}

export async function fetchAuth(): Promise<ServerAuthState> {
  const res = await fetch('/api/auth/state', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) throw new Error(tx("登录状态查询失败：{0}", [res.status]));
  return (await res.json()) as ServerAuthState;
}

export function applyAuth(s: ServerAuthState): void {
  setState({
    auth: {
      checked: true,
      needsSetup: s.needsSetup,
      loggedIn: s.loggedIn,
      lockedUntil: s.lockedFor ? Date.now() + s.lockedFor * 1000 : 0,
    },
  });
}

/** 打开页面时问一次；服务还没起来就过一会儿再问 */
export async function checkAuth(): Promise<void> {
  try {
    applyAuth(await fetchAuth());
  } catch {
    window.setTimeout(() => void checkAuth(), 2000);
  }
}

export interface AuthResponse {
  ok: boolean;
  status: number;
  error?: string;
  remaining?: number;
  retryAfter?: number;
}

async function post(path: string, body: unknown): Promise<AuthResponse> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    const data = (await res.json().catch(() => ({}))) as Omit<AuthResponse, 'ok' | 'status'>;
    return { ok: res.ok, status: res.status, ...data };
  } catch {
    return { ok: false, status: 0, error: 'network' };
  }
}

export function setupPassword(key: string, password: string): Promise<AuthResponse> {
  return post('/api/auth/setup', { key, password });
}

export function loginWith(password: string, keep: boolean): Promise<AuthResponse> {
  return post('/api/auth/login', { password, keep });
}

export function logoutRequest(): Promise<AuthResponse> {
  return post('/api/auth/logout', {});
}
