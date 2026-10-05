import { tx } from './i18n';
// 调服务端接口（设置页用）：带上登录 Cookie；登录过期就回到登录页。
import { checkAuth } from './auth';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly data: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

export async function api<T>(path: string, body?: unknown, options?: { signal?: AbortSignal }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
      signal: options?.signal,
    });
  } catch {
    throw new ApiError(tx("连不上服务，稍后再试"), 0);
  }
  if (res.status === 401) {
    void checkAuth();
    throw new ApiError(tx("登录已过期，请重新登录"), 401);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(typeof data.error === 'string' ? tx(data.error) : tx("出错了（{0}）", [res.status]), res.status, data);
  return data as T;
}
