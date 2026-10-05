import { appEnv } from './brand-compat';
// 工作区：服务器上的项目文件夹。
// 允许的目录范围、工作区列表、同时运行上限存在数据库里，在设置页管理；网页上只能打开允许范围里的文件夹。
// 允许的目录范围没设置过时，默认是整个主目录。
// 默认工作区（系统用户主目录，开发模式下是演示项目）一直都在、不能移除：还没打开项目时也能直接开 Agent。
// 启动参数 --workspace（或 FIKA_DESK_WORKSPACES）指定的是“固定工作区”：不受范围限制、不能在网页上移除，开发和测试用。
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { DatabaseSync, StatementSync } from 'node:sqlite';
import type { BrowseEntry, BrowseResult, WorkspaceInfo } from '../shared/types';

export const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 20;
const MAX_ENTRIES = 300;

/** 给用户看的错误，原样显示在页面上 */
export class WorkspaceError extends Error {}

export class WorkspaceManager {
  private fixed: string[];
  private defaultDir: string | null;
  private stmt: Record<'get' | 'set', StatementSync>;

  /** defaultInput：默认工作区放哪（--default-workspace），不传就用 FIKA_DESK_DEFAULT_WORKSPACE 或系统用户主目录 */
  constructor(db: DatabaseSync, projectRoot: string, extraDirs: string[], demo: boolean, defaultInput?: string) {
    this.stmt = {
      get: db.prepare(`SELECT value FROM settings WHERE key = ?`),
      set: db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`),
    };
    this.defaultDir = ensureDefault(defaultInput ?? appEnv('DEFAULT_WORKSPACE'), projectRoot, demo);
    const fromEnv = (appEnv('WORKSPACES') ?? '').split(path.delimiter).filter(Boolean);
    const dirs = [...extraDirs, ...fromEnv].map((dir) => path.resolve(expandHome(dir)));
    this.fixed = [...new Set(dirs)].filter((dir) => {
      if (dir === this.defaultDir) return false;
      if (isDir(dir)) return true;
      console.warn(`跳过不存在的工作区：${dir}`);
      return false;
    });
  }

  /** 默认工作区排第一，然后是启动参数指定的，最后是在网页上打开的 */
  list(): WorkspaceInfo[] {
    const out: WorkspaceInfo[] = [];
    if (this.defaultDir) out.push(info(this.defaultDir, true, true));
    for (const dir of this.fixed) out.push(info(dir, true));
    for (const dir of this.storedPaths()) {
      if (!out.some((w) => w.path === dir)) out.push(info(dir, false));
    }
    return out;
  }

  get(id: string): WorkspaceInfo | undefined {
    return this.list().find((w) => w.id === id);
  }

  /** 没设置过时默认是整个主目录；设置过（哪怕删光了）就照设置的来 */
  roots(): string[] {
    return this.read<string[]>('workspace.roots', [homeDir()]);
  }

  limit(): number {
    const n = Number(this.read<number>('workspace.limit', DEFAULT_LIMIT));
    return Number.isInteger(n) && n >= 1 && n <= MAX_LIMIT ? n : DEFAULT_LIMIT;
  }

  setLimit(value: number): number {
    const n = Math.round(Number(value));
    if (!(n >= 1 && n <= MAX_LIMIT)) throw new WorkspaceError(`上限要在 1 到 ${MAX_LIMIT} 之间`);
    this.write('workspace.limit', n);
    return n;
  }

  /** 加一个允许的目录（解析成真实路径，防止用链接绕出去） */
  addRoot(input: string): string {
    const dir = real(input);
    if (dir === path.parse(dir).root) throw new WorkspaceError('不能把整个磁盘设为允许的目录');
    const roots = this.roots();
    if (roots.includes(dir)) throw new WorkspaceError('这个目录已经在范围里了');
    this.write('workspace.roots', [...roots, dir]);
    return dir;
  }

  removeRoot(dir: string): void {
    const roots = this.roots().filter((r) => r !== dir);
    const orphans = this.storedPaths().filter((p) => !roots.some((r) => inside(p, r)));
    if (orphans.length) {
      throw new WorkspaceError(`这个范围里还有工作区：${orphans.map((p) => path.basename(p)).join('、')}。先把它们移除。`);
    }
    this.write('workspace.roots', roots);
  }

  /** 看允许范围里的文件夹：不传路径时列出各个允许的目录 */
  browse(input?: string): BrowseResult {
    const roots = this.roots();
    const listed = new Set(this.list().map((w) => w.path));
    if (!input) {
      return {
        path: null,
        displayPath: null,
        parent: null,
        root: null,
        added: false,
        entries: roots.filter(isDir).map((r) => entry(r, tildify(r), listed)),
      };
    }
    const dir = real(input);
    const root = roots.find((r) => inside(dir, r));
    if (!root) throw new WorkspaceError('这个目录不在允许的范围里');
    let items: fs.Dirent[];
    try {
      items = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      throw new WorkspaceError('没有权限读取这个目录');
    }
    const entries: BrowseEntry[] = [];
    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      const full = path.join(dir, item.name);
      let ok = item.isDirectory();
      if (item.isSymbolicLink()) {
        // 链接指向的地方也要在允许范围里
        try {
          const target = fs.realpathSync(full);
          ok = isDir(target) && roots.some((r) => inside(target, r));
        } catch {
          ok = false;
        }
      }
      if (!ok) continue;
      entries.push(entry(full, item.name, listed));
      if (entries.length >= MAX_ENTRIES) break;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    return {
      path: dir,
      displayPath: tildify(dir),
      parent: dir === root ? null : path.dirname(dir),
      root,
      added: listed.has(dir),
      entries,
    };
  }

  /** 在允许范围里新建一个文件夹 */
  mkdir(parentInput: string, name: string): string {
    const parent = real(parentInput);
    if (!this.roots().some((r) => inside(parent, r))) throw new WorkspaceError('这个目录不在允许的范围里');
    const clean = String(name ?? '').trim();
    if (!clean || clean.startsWith('.') || /[/\\\0]/.test(clean) || clean.length > 100) {
      throw new WorkspaceError('文件夹名不能为空，不能以点开头，也不能带斜杠');
    }
    const dir = path.join(parent, clean);
    if (fs.existsSync(dir)) throw new WorkspaceError('已经有同名的文件夹了');
    fs.mkdirSync(dir);
    return dir;
  }

  add(input: string): WorkspaceInfo {
    const dir = real(input);
    if (!this.roots().some((r) => inside(dir, r))) {
      throw new WorkspaceError('这个目录不在允许的范围里。先在“允许的目录范围”里加上它所在的目录。');
    }
    if (this.list().some((w) => w.path === dir)) throw new WorkspaceError('这个文件夹已经是工作区了');
    this.write('workspace.list', [...this.storedPaths(), dir].map((p) => ({ path: p })));
    return info(dir, false);
  }

  /** 从列表里拿掉（不删除任何文件） */
  remove(id: string): WorkspaceInfo {
    const ws = this.get(id);
    if (!ws) throw new WorkspaceError('没有这个工作区');
    if (ws.isDefault) throw new WorkspaceError('默认工作区不能移除');
    if (ws.fixed) throw new WorkspaceError('这个工作区是启动参数指定的，不能在网页上移除');
    this.write(
      'workspace.list',
      this.storedPaths()
        .filter((p) => p !== ws.path)
        .map((p) => ({ path: p })),
    );
    return ws;
  }

  private storedPaths(): string[] {
    return this.read<{ path: string }[]>('workspace.list', [])
      .map((w) => w?.path)
      .filter((p): p is string => typeof p === 'string');
  }

  private read<T>(key: string, fallback: T): T {
    const row = this.stmt.get.get(key) as { value: string } | undefined;
    if (!row) return fallback;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: unknown): void {
    this.stmt.set.run(key, JSON.stringify(value));
  }
}

function info(dir: string, fixed: boolean, isDefault = false): WorkspaceInfo {
  return {
    // 编号由路径算出来：重启服务、增删别的工作区都不会变
    id: `w${createHash('sha1').update(dir).digest('hex').slice(0, 8)}`,
    name: isDefault ? '默认' : path.basename(dir) || dir,
    path: dir,
    displayPath: tildify(dir),
    branch: gitBranch(dir, true) || undefined,
    fixed,
    ...(isDefault ? { isDefault } : {}),
  };
}

/** 准备好默认工作区的文件夹（没有就建），返回真实路径；建不了就没有默认工作区 */
function ensureDefault(input: string | undefined, projectRoot: string, demo: boolean): string | null {
  const dir = input ? path.resolve(expandHome(input)) : demo ? ensureDemoProject(projectRoot) : os.homedir();
  try {
    fs.mkdirSync(dir, { recursive: true });
    return fs.realpathSync(dir);
  } catch (error) {
    console.warn(`建不了默认工作区 ${tildify(dir)}：${error instanceof Error ? error.message : error}`);
    return null;
  }
}

function homeDir(): string {
  try {
    return fs.realpathSync(os.homedir());
  } catch {
    return os.homedir();
  }
}

function entry(dir: string, name: string, listed: Set<string>): BrowseEntry {
  const branch = gitBranch(dir, false);
  let real = dir;
  try {
    real = fs.realpathSync(dir);
  } catch {
    // 读不了就用原路径
  }
  return { name, path: dir, displayPath: tildify(dir), git: branch !== undefined, branch: branch || undefined, added: listed.has(real) };
}

/**
 * 当前分支：直接读 .git/HEAD，不启动 git 进程（列文件夹时仓库多也不慢）。
 * walkUp：工作区可能是仓库里的子目录，往上找 .git。返回 '' 表示是仓库但不在任何分支上
 */
function gitBranch(dir: string, walkUp: boolean): string | undefined {
  for (let current = dir; ; current = path.dirname(current)) {
    const dotGit = path.join(current, '.git');
    try {
      let gitDir = dotGit;
      if (fs.statSync(dotGit).isFile()) {
        // git worktree：.git 是个文件，指向真正的目录
        const pointer = fs.readFileSync(dotGit, 'utf8').match(/^gitdir:\s*(.+)$/m);
        if (!pointer) return '';
        gitDir = path.resolve(current, pointer[1].trim());
      }
      const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
      return head.match(/^ref:\s*refs\/heads\/(.+)$/)?.[1] ?? '';
    } catch {
      // 这一层没有 .git
    }
    if (!walkUp || path.dirname(current) === current) return undefined;
  }
}

export function tildify(dir: string): string {
  const home = os.homedir();
  return dir === home || dir.startsWith(home + path.sep) ? '~' + dir.slice(home.length) : dir;
}

function expandHome(input: string): string {
  return input === '~' || input.startsWith('~/') ? path.join(os.homedir(), input.slice(1)) : input;
}

/** 用户填的路径 → 真实路径（必须是已有的文件夹） */
function real(input: string): string {
  const raw = expandHome(String(input ?? '').trim());
  if (!raw) throw new WorkspaceError('先填一个路径');
  if (!path.isAbsolute(raw)) throw new WorkspaceError('要填完整路径，比如 /home/你/projects 或 ~/projects');
  let dir: string;
  try {
    dir = fs.realpathSync(raw);
  } catch {
    throw new WorkspaceError(`找不到这个目录：${tildify(raw)}`);
  }
  if (!isDir(dir)) throw new WorkspaceError(`这不是一个文件夹：${tildify(raw)}`);
  return dir;
}

/** child 在 parent 里面（或者就是 parent） */
function inside(child: string, parent: string): boolean {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function isDir(dir: string): boolean {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/** 生成一个很小的演示项目：价格计算有个 bug，测试会失败，适合试着让 Agent 修 */
function ensureDemoProject(root: string): string {
  const dir = path.join(root, 'sandbox', 'demo');
  if (fs.existsSync(path.join(dir, 'package.json'))) return dir;
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  const files: Record<string, string> = {
    'README.md': [
      '# 演示项目',
      '',
      '一个很小的价格计算模块，用来试用 Fika Desk。',
      '',
      '- `src/price.js`：计算打折后的价格',
      '- `test.js`：运行 `node test.js` 检查结果',
      '',
      '现在测试会失败：折扣算错了。可以让 Agent 帮你修。',
      '',
    ].join('\n'),
    'package.json': JSON.stringify({ name: 'demo', private: true, type: 'module', scripts: { test: 'node test.js' } }, null, 2) + '\n',
    'src/price.js': [
      '// 计算打折后的价格。discount 是折扣比例，比如 0.2 表示减 20%。',
      'export function finalPrice(price, discount) {',
      "  if (discount < 0 || discount > 1) throw new Error('折扣必须在 0 到 1 之间');",
      '  return price * discount;',
      '}',
      '',
    ].join('\n'),
    'test.js': [
      "import assert from 'node:assert/strict';",
      "import { finalPrice } from './src/price.js';",
      '',
      'assert.equal(finalPrice(100, 0.2), 80);',
      'assert.equal(finalPrice(59.9, 0), 59.9);',
      "console.log('全部测试通过');",
      '',
    ].join('\n'),
  };
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content);
  try {
    const git = (...args: string[]) => execFileSync('git', ['-C', dir, ...args], { stdio: 'ignore', timeout: 10_000 });
    git('init', '-q', '-b', 'main');
    git('add', '-A');
    git('-c', 'user.name=Fika Desk', '-c', 'user.email=fika-desk@localhost', 'commit', '-q', '-m', '初始化演示项目');
  } catch {
    // 没装 git 也能用，只是看不到分支
  }
  return dir;
}
