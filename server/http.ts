import { appEnv } from './brand-compat';
// 网络请求的小工具：读 JSON、回 JSON、客户端 IP、Cookie、安全响应头。
import type http from 'node:http';
import { InputError } from '../shared/validation';

// 同一主机的不同端口共用 Cookie；开发、测试实例必须使用各自的名称。
export const COOKIE = appEnv('COOKIE_NAME') || 'ma_session';
if (!/^[A-Za-z0-9_]+$/.test(COOKIE)) throw new Error('FIKA_DESK_COOKIE_NAME 只能包含字母、数字和下划线');

/**
 * 客户端 IP。服务只监听 127.0.0.1，外面的请求都经过本机的 Nginx 或 Caddy，
 * 它们会把真实 IP 追加到 X-Forwarded-For 的最后，所以取最后一个（前面的可能是客户端自己伪造的）
 */
export function clientIp(req: http.IncomingMessage): string {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (forwarded.length) return forwarded.at(-1)!;
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real) return real;
  return req.socket.remoteAddress ?? '';
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    if (name) {
      try { out[name] = decodeURIComponent(part.slice(eq + 1).trim()); } catch { /* malformed cookie is ignored */ }
    }
  }
  return out;
}

/** 登录 Cookie：脚本读不到（HttpOnly），别的网站带不过来（SameSite=Strict），HTTPS 下只走加密连接（Secure） */
export function loginCookie(token: string, keep: boolean, secure: boolean): string {
  const parts = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Strict'];
  if (keep) parts.push(`Max-Age=${30 * 86_400}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(secure: boolean): string {
  return [`${COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', ...(secure ? ['Secure'] : [])].join('; ');
}

/** 每个响应都带的安全头：不让别的网站把页面嵌进去，不在跳转时带出网址（设置链接里有钥匙） */
export function securityHeaders(res: http.ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  res.setHeader('Referrer-Policy', 'no-referrer');
}

export function sendJson(res: http.ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}

/** 读 JSON 请求体，最多 16KB */
export function readJson(req: http.IncomingMessage, limit = 16_384): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    if (!String(req.headers['content-type'] ?? '').includes('application/json')) {
      reject(new InputError('需要 JSON 请求体'));
      return;
    }
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new InputError('请求太大'));
        chunks.length = 0;
        return;
      }
      if (size <= limit) chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > limit) return;
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('请求体必须是 JSON 对象');
        resolve(value);
      } catch (error) {
        reject(error instanceof InputError ? error : new InputError('请求体不是有效的 JSON'));
      }
    });
    req.on('error', reject);
  });
}
