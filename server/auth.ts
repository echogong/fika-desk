// 登录与访问控制：单用户密码、首次设置链接、登录状态、防暴力破解、审计日志。
// 密码只存 scrypt 哈希；登录凭证是随机串，数据库里只存它的 SHA-256，拿到数据库也登录不了。
import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import type { DatabaseSync, StatementSync } from 'node:sqlite';
import type { AuditView, LoginView } from '../shared/types';

export const MIN_PASSWORD = 12;
const MAX_PASSWORD = 256;
/** 勾选“保持登录”：30 天，每次使用往后顺延 */
const KEEP_MS = 30 * 86_400_000;
/** 不勾选：12 小时，关掉浏览器也就失效了 */
const SHORT_MS = 12 * 3_600_000;
/** 同一 IP 连续输错 5 次，锁定 15 分钟 */
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;
const SCRYPT: ScryptOptions = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export interface Login {
  /** 登录凭证的哈希，也是这条登录记录的编号 */
  id: string;
  keep: boolean;
}

export type AuthResult =
  | { ok: true; token: string; keep: boolean }
  | { ok: false; status: number; error: string; remaining?: number; retryAfter?: number };

export class Auth {
  private setupKey: string | null = null;
  private fails = new Map<string, { count: number; lockedUntil: number; at: number }>();
  private stmt: Record<
    | 'getSetting'
    | 'setSetting'
    | 'deleteSetting'
    | 'insertLogin'
    | 'getLogin'
    | 'touchLogin'
    | 'deleteLogin'
    | 'deleteLogins'
    | 'listLogins'
    | 'audit'
    | 'listAudit',
    StatementSync
  >;

  /** onSetupKey：生成了新的首次设置钥匙，要把链接打印到终端 */
  constructor(
    private db: DatabaseSync,
    private onSetupKey: (key: string) => void,
  ) {
    this.stmt = {
      getSetting: db.prepare(`SELECT value FROM settings WHERE key = ?`),
      setSetting: db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`),
      deleteSetting: db.prepare(`DELETE FROM settings WHERE key = ?`),
      insertLogin: db.prepare(`INSERT INTO logins (id, created_at, seen_at, expires_at, keep, ip, agent) VALUES (?, ?, ?, ?, ?, ?, ?)`),
      getLogin: db.prepare(`SELECT * FROM logins WHERE id = ?`),
      touchLogin: db.prepare(`UPDATE logins SET seen_at = ?, expires_at = ? WHERE id = ?`),
      deleteLogin: db.prepare(`DELETE FROM logins WHERE id = ?`),
      deleteLogins: db.prepare(`DELETE FROM logins`),
      listLogins: db.prepare(`SELECT * FROM logins WHERE expires_at > ? ORDER BY seen_at DESC`),
      audit: db.prepare(`INSERT INTO audit (at, kind, ip, detail) VALUES (?, ?, ?, ?)`),
      listAudit: db.prepare(`SELECT * FROM audit WHERE id < ? ORDER BY id DESC LIMIT ?`),
    };
  }

  // ───────────────────────── 设置页“安全”

  /** 还有效的登录（设备）。页面上用编号的前 16 位指代，完整编号不外传 */
  listLogins(currentId: string): LoginView[] {
    const rows = this.stmt.listLogins.all(Date.now()) as {
      id: string;
      created_at: number;
      seen_at: number;
      keep: number;
      ip: string | null;
      agent: string | null;
    }[];
    return rows.map((row) => ({
      id: row.id.slice(0, 16),
      device: deviceOf(row.agent ?? ''),
      ip: row.ip ?? '',
      createdAt: row.created_at,
      seenAt: row.seen_at,
      keep: row.keep === 1,
      current: row.id === currentId,
    }));
  }

  /** 退出某一台设备，返回它的完整编号（用来断开它的实时连接） */
  logoutDevice(shortId: string, ip: string): string | null {
    const rows = this.stmt.listLogins.all(0) as { id: string; agent: string | null }[];
    const row = shortId.length === 16 ? rows.find((r) => r.id.startsWith(shortId)) : undefined;
    if (!row) return null;
    this.stmt.deleteLogin.run(row.id);
    this.audit('logout-device', ip, { device: deviceOf(row.agent ?? '') });
    return row.id;
  }

  /** 退出除了这一台以外的所有设备 */
  logoutOthers(keepId: string, ip: string): string[] {
    const ids = (this.stmt.listLogins.all(0) as { id: string }[]).map((r) => r.id).filter((id) => id !== keepId);
    for (const id of ids) this.stmt.deleteLogin.run(id);
    this.audit('logout-others', ip, { count: ids.length });
    return ids;
  }

  /** 修改密码：先核对当前密码（输错同样计入锁定），改好后其他设备都要重新登录 */
  async changePassword(
    loginId: string,
    current: string,
    next: string,
    ip: string,
  ): Promise<{ ok: true; dropped: string[] } | { ok: false; status: number; error: string; remaining?: number; retryAfter?: number }> {
    const locked = this.lockedFor(ip);
    if (locked) return { ok: false, status: 429, error: 'locked', retryAfter: locked };
    const stored = this.password();
    if (!stored || !(await verifyPassword(current, stored))) {
      const remaining = this.fail(ip, 'password-change-failed');
      return remaining
        ? { ok: false, status: 401, error: 'wrong-password', remaining }
        : { ok: false, status: 429, error: 'locked', retryAfter: LOCK_MS / 1000 };
    }
    const problem = passwordProblem(next);
    if (problem) return { ok: false, status: 400, error: problem };
    this.stmt.setSetting.run('password', await hashPassword(next));
    this.fails.delete(ip);
    const dropped = (this.stmt.listLogins.all(0) as { id: string }[]).map((r) => r.id).filter((id) => id !== loginId);
    for (const id of dropped) this.stmt.deleteLogin.run(id);
    this.audit('password-changed', ip, { loggedOut: dropped.length });
    return { ok: true, dropped };
  }

  /** 审计日志，新的在前；before = 上一页最后一条的编号 */
  listAudit(limit = 50, before = Number.MAX_SAFE_INTEGER): AuditView[] {
    const rows = this.stmt.listAudit.all(before, Math.min(Math.max(limit, 1), 200)) as {
      id: number;
      at: number;
      kind: string;
      ip: string | null;
      detail: string | null;
    }[];
    return rows.map((row) => {
      let detail: Record<string, unknown> | null = null;
      try {
        detail = row.detail ? (JSON.parse(row.detail) as Record<string, unknown>) : null;
      } catch {
        // 坏掉的一条只显示事件名
      }
      return { id: row.id, at: row.at, kind: row.kind, ip: row.ip, detail };
    });
  }

  needsSetup(): boolean {
    return !this.password();
  }

  /** 还没设置密码时，拿到这次运行的一次性设置钥匙（第一次拿时生成，并通知打印链接） */
  ensureSetupKey(): string | null {
    if (!this.needsSetup()) {
      this.setupKey = null;
      return null;
    }
    if (!this.setupKey) {
      this.setupKey = randomBytes(24).toString('base64url');
      this.onSetupKey(this.setupKey);
    }
    return this.setupKey;
  }

  /** 这个 IP 还要锁多少秒，0 表示没锁 */
  lockedFor(ip: string): number {
    const f = this.fails.get(ip);
    const left = f ? f.lockedUntil - Date.now() : 0;
    return left > 0 ? Math.ceil(left / 1000) : 0;
  }

  async setup(key: string, password: string, ip: string, agent: string): Promise<AuthResult> {
    const locked = this.lockedFor(ip);
    if (locked) return { ok: false, status: 429, error: 'locked', retryAfter: locked };
    const expected = this.ensureSetupKey();
    if (!expected) return { ok: false, status: 409, error: 'already-set' };
    if (!safeEqual(key, expected)) {
      const remaining = this.fail(ip, 'setup-failed');
      return remaining ? { ok: false, status: 403, error: 'bad-key' } : { ok: false, status: 429, error: 'locked', retryAfter: LOCK_MS / 1000 };
    }
    const problem = passwordProblem(password);
    if (problem) return { ok: false, status: 400, error: problem };
    this.stmt.setSetting.run('password', await hashPassword(password));
    this.setupKey = null;
    this.fails.delete(ip);
    this.audit('setup', ip);
    return this.issue(true, ip, agent);
  }

  async login(password: string, keep: boolean, ip: string, agent: string): Promise<AuthResult> {
    const locked = this.lockedFor(ip);
    if (locked) return { ok: false, status: 429, error: 'locked', retryAfter: locked };
    const stored = this.password();
    if (!stored) return { ok: false, status: 409, error: 'needs-setup' };
    if (!(await verifyPassword(password, stored))) {
      const remaining = this.fail(ip, 'login-failed');
      return remaining
        ? { ok: false, status: 401, error: 'wrong-password', remaining }
        : { ok: false, status: 429, error: 'locked', retryAfter: LOCK_MS / 1000 };
    }
    this.fails.delete(ip);
    this.audit('login', ip, { keep });
    return this.issue(keep, ip, agent);
  }

  /** 查登录凭证：有效就返回登录记录，并顺延有效期（一小时最多写一次库） */
  check(token: string | undefined): Login | null {
    if (!token) return null;
    const id = hashToken(token);
    const row = this.stmt.getLogin.get(id) as { seen_at: number; expires_at: number; keep: number } | undefined;
    if (!row) return null;
    const now = Date.now();
    if (row.expires_at <= now) {
      this.stmt.deleteLogin.run(id);
      return null;
    }
    const keep = row.keep === 1;
    if (now - row.seen_at > 3_600_000) this.stmt.touchLogin.run(now, now + (keep ? KEEP_MS : SHORT_MS), id);
    return { id, keep };
  }

  /** 退出这一处登录，返回它的编号（用来断开它的实时连接） */
  logout(token: string | undefined, ip: string): string | null {
    const login = this.check(token);
    if (!login) return null;
    this.stmt.deleteLogin.run(login.id);
    this.audit('logout', ip);
    return login.id;
  }

  /** 忘记密码时在服务器上运行：清掉密码和所有登录，下次打开会重新走首次设置 */
  resetPassword(): void {
    this.stmt.deleteSetting.run('password');
    this.stmt.deleteLogins.run();
    this.setupKey = null;
    this.audit('reset-password', 'server');
  }

  audit(kind: string, ip?: string, detail?: Record<string, unknown>): void {
    try {
      this.stmt.audit.run(Date.now(), kind, ip ?? null, detail ? JSON.stringify(detail) : null);
    } catch (error) {
      console.error('写审计日志失败：', error);
    }
  }

  private password(): string | null {
    const row = this.stmt.getSetting.get('password') as { value: string } | undefined;
    return row?.value ?? null;
  }

  /** 记一次失败，返回还能再错几次；到了上限就锁定这个 IP */
  private fail(ip: string, kind: string): number {
    const now = Date.now();
    const f = this.fails.get(ip) ?? { count: 0, lockedUntil: 0, at: now };
    f.count += 1;
    f.at = now;
    this.audit(kind, ip);
    if (f.count >= MAX_FAILS) {
      f.count = 0;
      f.lockedUntil = now + LOCK_MS;
      this.audit('locked', ip, { minutes: LOCK_MS / 60_000 });
    }
    this.fails.set(ip, f);
    // 顺手清掉一天前的记录
    for (const [key, value] of this.fails) {
      if (now - value.at > 86_400_000 && value.lockedUntil < now) this.fails.delete(key);
    }
    return f.lockedUntil > now ? 0 : MAX_FAILS - f.count;
  }

  private issue(keep: boolean, ip: string, agent: string): AuthResult {
    const token = randomBytes(32).toString('base64url');
    const now = Date.now();
    this.stmt.insertLogin.run(hashToken(token), now, now, now + (keep ? KEEP_MS : SHORT_MS), keep ? 1 : 0, ip, agent.slice(0, 300));
    return { ok: true, token, keep };
  }
}

/** 从浏览器标识里认出设备和浏览器，比如“Mac · Chrome” */
export function deviceOf(agent: string): string {
  const os = /iPhone|iPad/.test(agent)
    ? 'iPhone / iPad'
    : /Android/.test(agent)
      ? 'Android'
      : /Mac OS X|Macintosh/.test(agent)
        ? 'Mac'
        : /Windows/.test(agent)
          ? 'Windows'
          : /Linux/.test(agent)
            ? 'Linux'
            : '';
  const browser = /Edg\//.test(agent)
    ? 'Edge'
    : /Firefox\//.test(agent)
      ? 'Firefox'
      : /Chrome\//.test(agent)
        ? 'Chrome'
        : /Safari\//.test(agent)
          ? 'Safari'
          : '';
  return [os, browser].filter(Boolean).join(' · ') || '未知设备';
}

function passwordProblem(password: string): string | null {
  const length = [...password].length;
  if (length < MIN_PASSWORD) return 'too-short';
  if (length > MAX_PASSWORD) return 'too-long';
  return null;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function derive(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFC'), salt, 64, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, SCRYPT);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await derive(password, Buffer.from(salt, 'base64'), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}
