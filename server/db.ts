// 存储：会话、对话记录、登录信息都存在一个 SQLite 文件里（Node 自带的 node:sqlite，不用另装），服务重启后还在。
// 数据目录默认 ~/.fika-desk/（升级时兼容原数据目录），可以用 --data 或环境变量 FIKA_DESK_DATA_DIR 换一个。
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { DatabaseSync, StatementSync } from 'node:sqlite';
import type { SessionMeta, SessionSource, TimelineItem } from '../shared/types';

export interface StoredSession {
  id: string;
  /** 工作区目录 */
  cwd: string;
  agentId: string;
  /** Agent 那边的会话编号，恢复会话时要用 */
  acpSessionId: string | null;
  source: SessionSource;
  /** 还在左侧列表里（没有点“结束会话”） */
  open: boolean;
  title: string;
  titleSource: SessionMeta['titleSource'];
  /** 这个会话选的权限模式（Agent 自己的模式），重启后接着用；null = Agent 自己的默认 */
  mode: string | null;
  createdAt: number;
  updatedAt: number;
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  cwd TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  acp_session_id TEXT,
  source TEXT NOT NULL,
  open INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_source TEXT NOT NULL,
  level TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_by_cwd ON sessions (cwd, updated_at DESC);
CREATE TABLE IF NOT EXISTS items (
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (session_id, seq)
) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS logins (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  keep INTEGER NOT NULL,
  ip TEXT,
  agent TEXT
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  kind TEXT NOT NULL,
  ip TEXT,
  detail TEXT
);
PRAGMA user_version = 2;
`;

/** 打开数据库（没有就新建），文件权限 600，只有运行服务的用户能读 */
export function openDatabase(dir: string): DatabaseSync {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, 'data.db');
  const { DatabaseSync } = loadSqlite();
  const db = new DatabaseSync(file);
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // 权限改不了不影响使用
  }
  db.exec(SCHEMA);
  return db;
}

/** Node 的 SQLite 还标着“实验功能”，加载时会打一行警告。只屏蔽这一条，别的警告照常 */
function loadSqlite(): typeof import('node:sqlite') {
  const emit = process.emitWarning;
  process.emitWarning = function (warning: string | Error, ...rest: unknown[]) {
    const text = typeof warning === 'string' ? warning : warning?.message;
    if (/SQLite is an experimental feature/i.test(String(text))) return;
    return (emit as (...args: unknown[]) => void).call(process, warning, ...rest);
  } as typeof process.emitWarning;
  try {
    return createRequire(import.meta.url)('node:sqlite');
  } finally {
    process.emitWarning = emit;
  }
}

/** 时间线条目的编号是“会话编号-序号”，按序号存和排序 */
function seqOf(item: TimelineItem): number {
  return Number(item.id.slice(item.id.lastIndexOf('-') + 1)) || 0;
}

export class SessionStore {
  private stmt: Record<'saveSession' | 'saveItem' | 'setOpen' | 'get' | 'findByAcp' | 'open' | 'inCwd' | 'items', StatementSync>;

  constructor(private db: DatabaseSync) {
    this.stmt = {
      saveSession: this.db.prepare(`
        INSERT INTO sessions (id, cwd, agent_id, acp_session_id, source, open, title, title_source, level, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          acp_session_id = excluded.acp_session_id, open = excluded.open, title = excluded.title,
          title_source = excluded.title_source, level = excluded.level, updated_at = excluded.updated_at`),
      saveItem: this.db.prepare(`INSERT OR REPLACE INTO items (session_id, seq, data) VALUES (?, ?, ?)`),
      setOpen: this.db.prepare(`UPDATE sessions SET open = ? WHERE id = ?`),
      get: this.db.prepare(`SELECT * FROM sessions WHERE id = ?`),
      findByAcp: this.db.prepare(`SELECT * FROM sessions WHERE agent_id = ? AND acp_session_id = ? AND cwd = ? ORDER BY updated_at DESC LIMIT 1`),
      open: this.db.prepare(`SELECT * FROM sessions WHERE open = 1 ORDER BY updated_at DESC`),
      inCwd: this.db.prepare(`SELECT * FROM sessions WHERE cwd = ? ORDER BY updated_at DESC LIMIT ?`),
      items: this.db.prepare(`SELECT data FROM items WHERE session_id = ? ORDER BY seq`),
    };
  }

  saveSession(s: StoredSession): void {
    this.stmt.saveSession.run(
      s.id,
      s.cwd,
      s.agentId,
      s.acpSessionId,
      s.source,
      s.open ? 1 : 0,
      s.title,
      s.titleSource,
      // 数据库里这一列叫 level：以前存我们自己的审批档位，现在存 Agent 的权限模式，空字符串表示没选
      s.mode ?? '',
      s.createdAt,
      s.updatedAt,
    );
  }

  saveItems(sessionId: string, items: TimelineItem[]): void {
    for (const item of items) this.stmt.saveItem.run(sessionId, seqOf(item), JSON.stringify(item));
  }

  setOpen(id: string, open: boolean): void {
    this.stmt.setOpen.run(open ? 1 : 0, id);
  }

  get(id: string): StoredSession | null {
    return toSession(this.stmt.get.get(id));
  }

  /** 找出某个 Agent 会话在这里的记录（命令行会话在网页里打开过，就有记录） */
  findByAcp(agentId: string, acpSessionId: string, cwd: string): StoredSession | null {
    return toSession(this.stmt.findByAcp.get(agentId, acpSessionId, cwd));
  }

  openSessions(): StoredSession[] {
    return this.stmt.open.all().map(toSession).filter((s): s is StoredSession => s !== null);
  }

  sessionsIn(cwd: string, limit = 200): StoredSession[] {
    return this.stmt.inCwd.all(cwd, limit).map(toSession).filter((s): s is StoredSession => s !== null);
  }

  /** 参数化全文检索，不限于侧栏最近 200 条；坏掉的旧 JSON 不影响搜索。 */
  searchIn(cwd: string, query: string, limit = 101): StoredSession[] {
    return this.db.prepare(`SELECT s.* FROM sessions s WHERE s.cwd = ? AND (
      instr(lower(s.title), lower(?)) > 0 OR EXISTS (
        SELECT 1 FROM items i, json_tree(CASE WHEN json_valid(i.data) THEN i.data ELSE '{}' END) value
        WHERE i.session_id = s.id AND value.type = 'text'
        AND value.key IN ('text', 'command', 'title', 'detail', 'path', 'content', 'oldText', 'newText')
        AND instr(lower(value.value), lower(?)) > 0
      )) ORDER BY s.updated_at DESC LIMIT ?`).all(cwd, query, query, limit).map(toSession).filter((s): s is StoredSession => s !== null);
  }

  timeline(id: string): TimelineItem[] {
    const out: TimelineItem[] = [];
    for (const row of this.stmt.items.all(id) as { data: string }[]) {
      try {
        out.push(JSON.parse(row.data) as TimelineItem);
      } catch {
        // 坏掉的一条跳过，不影响其他记录
      }
    }
    return out;
  }

  /** 一批写入放在一个事务里，快且不会写一半 */
  transaction(fn: () => void): void {
    this.db.exec('BEGIN');
    try {
      fn();
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

}

/** 旧版本存的审批档位不是 Agent 的模式，读出来当作没选 */
function modeOf(value: unknown): string | null {
  const v = value == null ? '' : String(value);
  return !v || ['ask', 'read', 'edit', 'all'].includes(v) ? null : v;
}

function toSession(row: unknown): StoredSession | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id),
    cwd: String(r.cwd),
    agentId: String(r.agent_id),
    acpSessionId: r.acp_session_id == null ? null : String(r.acp_session_id),
    source: r.source === 'cli' ? 'cli' : 'web',
    open: Number(r.open) === 1,
    title: String(r.title),
    titleSource: String(r.title_source) as StoredSession['titleSource'],
    mode: modeOf(r.level),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}
