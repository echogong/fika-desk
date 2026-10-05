// 网页上一键安装、更新 Agent（设置 → Agent）。只运行对照表（agents.ts 的 setup）里写好的命令：
// 页面只能说“装哪个 Agent”，不能传命令进来。
// - npm 包：没装的装到 ~/.npm-global（不用管理员权限，检测 Agent 时先找这个目录）；更新时装回它原来所在的位置，
//   原来的位置没有写权限（比如用 sudo 装在系统目录）就把新版本装到 ~/.npm-global，以后用这份。
//   用服务器上 npm 自己的设置，比如国内服务器先设好镜像源（npm config set registry …）。
// - 固定脚本 / uv 命令：页面上先显示完整命令，点了才运行；更新用原生更新命令（如 hermes update）或原安装计划。
// - 项目自带的（Codex）：跟着 Fika Desk 一起安装和更新，这里只显示版本。
// 命令在伪终端里运行（scripts/pty-helper.py），页面上用终端窗口显示，要回答问题可以直接打字。
// 同一时间只做一件：几个 npm 同时往一个目录装容易出错。关掉窗口、关掉页面都在后台接着做完，做完重新检测 Agent、
// 测一次连接，所有页面都会收到结果；重新打开窗口能看到到现在为止的输出。
import { execFile, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Writable } from 'node:stream';
import type { WebSocket } from 'ws';
import { which, type AgentPreset } from './agents';
import { killTree } from './session';
import { tildify } from './workspaces';
import type { AgentSetupView, AgentUpdateCheck, InstallRunView, InstallState, ServerMsg } from '../shared/types';

/** 最多跑多久：装 Hermes 要下载不少东西 */
const TIMEOUT = 30 * 60_000;
const VIEW_TIMEOUT = 20_000;

export interface SetupCommand {
  command: string;
  args: string[];
  /** 页面上显示的样子（主目录写成 ~） */
  display: string;
}

export interface SetupPlan {
  view: AgentSetupView;
  install?: SetupCommand;
  update?: SetupCommand;
  /** 检查更新用：用 npm 装好的包和版本 */
  packages?: { pkg: string; name: string; version: string }[];
  npm?: string;
}

/** 这个 Agent 现在该怎么装、怎么更新。extraEnv 是兼容已有设置的启动环境 */
export function setupPlan(preset: AgentPreset, pathValue: string, root: string, extraEnv: Record<string, string> = {}): SetupPlan | null {
  const setup = preset.setup;
  if (!setup) return null;

  if ('bundled' in setup) {
    const versions = setup.bundled.flatMap((p) => {
      const version = packageVersion(path.join(root, 'node_modules', p.pkg));
      return version ? [{ name: p.bin, version }] : [];
    });
    const custom = setup.override ? extraEnv[setup.override] || process.env[setup.override] : undefined;
    return {
      view: {
        how: 'bundled',
        versions,
        note: custom ? `${setup.override} 指定了服务器上另装的版本（${tildify(custom)}），那个要在服务器上自己更新` : undefined,
      },
    };
  }

  if ('script' in setup) {
    const found = preset.requires?.some((bin) => !which(bin, pathValue)) ? null : which(setup.bin, pathValue);
    if (found && setup.update) {
      const display = [setup.bin, ...setup.update].join(' ');
      return { view: { how: 'script', versions: [], updateCommand: display }, update: { command: found, args: setup.update, display } };
    }
    const lacking = ['bash', ...(setup.requires ?? ['curl'])].filter((bin) => !which(bin, pathValue));
    if (lacking.length) {
      return { view: { how: 'script', versions: [], note: `服务器上没有 ${lacking.join('、')}，请先安装依赖工具` } };
    }
    const command = { command: which('bash', pathValue)!, args: ['-o', 'pipefail', '-c', setup.script], display: setup.script };
    if (found) return { view: { how: 'script', versions: [], updateCommand: setup.script }, update: command };
    return {
      view: { how: 'script', versions: [], installCommand: setup.script },
      install: command,
    };
  }

  const npm = which('npm', pathValue) ?? undefined;
  const [main] = setup.npm;
  const found = which(main.bin, pathValue);
  const own = path.join(os.homedir(), '.npm-global');
  const libraries = setup.libraries ?? [];
  const prefix = found ? npmPrefixOf(found, main.pkg) : null;
  const allPackages = [...setup.npm.map((p) => p.pkg), ...libraries];
  const missingLibrary = libraries.some((pkg) => !prefix || !packageVersion(path.join(prefix, 'lib', 'node_modules', pkg)));
  if (!found || setup.npm.some((p) => !which(p.bin, pathValue)) || missingLibrary) {
    if (!npm) return { view: { how: 'npm', versions: [], note: '服务器上没找到 npm' } };
    const prefix = own;
    const pkgs = allPackages;
    const display = `npm install -g --prefix ${tildify(prefix)} ${pkgs.join(' ')}`;
    return { view: { how: 'npm', versions: [], installCommand: display }, install: { command: npm, args: ['install', '-g', '--prefix', prefix, ...pkgs], display } };
  }
  if (!prefix) {
    return { view: { how: 'npm', versions: [], note: `${main.bin} 不是用 npm 装的（${tildify(found)}），要用它自己的方式更新` } };
  }
  const packages = [...setup.npm.flatMap((p) => {
    const version = packageVersion(path.join(prefix, 'lib', 'node_modules', p.pkg));
    return version ? [{ pkg: p.pkg, name: p.bin, version }] : [];
  }), ...libraries.flatMap((pkg) => {
    const version = packageVersion(path.join(prefix, 'lib', 'node_modules', pkg));
    return version ? [{ pkg, name: pkg, version }] : [];
  })];
  const versions = packages.map(({ name, version }) => ({ name, version }));
  if (!npm) return { view: { how: 'npm', versions, note: '服务器上没找到 npm，不能在网页上更新' } };
  const latest = allPackages.map((pkg) => `${pkg}@latest`);
  // 原来的位置没有写权限（比如用 sudo 装在系统目录）：新版本装到 ~/.npm-global，检测时先找那里，以后就用这份
  const target = writable(path.join(prefix, 'lib', 'node_modules')) ? prefix : own;
  const display = `npm install -g --prefix ${tildify(target)} ${latest.join(' ')}`;
  return {
    view: {
      how: 'npm',
      versions,
      updateCommand: display,
      note:
        target === prefix
          ? undefined
          : `原来那份装在 ${tildify(prefix)}，服务没有权限改。点“更新”会把新版本装到 ${tildify(own)}，以后用新装的这份；原来那份可以留着，也可以以后在服务器上用 sudo npm uninstall -g ${allPackages.join(' ')} 删掉。`,
    },
    update: { command: npm, args: ['install', '-g', '--prefix', target, ...latest], display },
    packages,
    npm,
  };
}

/** 用 npm 全局装的命令：真实路径在 <前缀>/lib/node_modules/<包名>/ 里面，由此找出装在哪个前缀 */
function npmPrefixOf(bin: string, pkg: string): string | null {
  let real: string;
  try {
    real = fs.realpathSync(bin);
  } catch {
    return null;
  }
  const marker = path.join(path.sep, 'lib', 'node_modules', pkg) + path.sep;
  const i = real.indexOf(marker);
  return i > 0 ? real.slice(0, i) : null;
}

function packageVersion(dir: string): string | null {
  try {
    const version = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).version;
    return typeof version === 'string' ? version : null;
  } catch {
    return null;
  }
}

function writable(dir: string): boolean {
  try {
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/** 查用 npm 装的各个包有没有新版本（问 npm 源，只读） */
export async function checkUpdate(plan: SetupPlan, env: NodeJS.ProcessEnv): Promise<AgentUpdateCheck | null> {
  if (!plan.npm || !plan.packages?.length) return null;
  const at = Date.now();
  try {
    const latest = await Promise.all(plan.packages.map((p) => npmView(plan.npm!, p.pkg, env)));
    const outdated = plan.packages.flatMap((p, i) => (newer(latest[i], p.version) ? [{ name: p.name, from: p.version, to: latest[i] }] : []));
    return { at, outdated };
  } catch (error) {
    return { at, outdated: [], error: error instanceof Error ? error.message : String(error) };
  }
}

function npmView(npm: string, pkg: string, env: NodeJS.ProcessEnv): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(npm, ['view', pkg, 'version'], { env, timeout: VIEW_TIMEOUT, cwd: os.homedir() }, (error, stdout, stderr) => {
      const version = String(stdout).trim().split('\n').pop()?.trim() ?? '';
      if (!error && /^\d+\.\d+/.test(version)) return resolve(version);
      // npm 的报错很长，只留最有用的一行，比如 npm error code ETIMEDOUT
      const line = String(stderr)
        .split('\n')
        .map((l) => l.trim())
        .find((l) => /^npm (ERR!|error)/.test(l));
      reject(new Error(error?.killed ? '连 npm 源超时了' : line ? line.replace(/^npm (ERR!|error)\s*/, '') : '问不到 npm 源'));
    });
  });
}

/** a 比 b 新吗：按 x.y.z 的数字比；比不了（比如带测试版后缀）就看是不是不一样 */
export function newer(a: string, b: string): boolean {
  const parse = (v: string) => v.split('-')[0].split('.').map((n) => Number(n));
  const x = parse(a);
  const y = parse(b);
  if (x.some(Number.isNaN) || y.some(Number.isNaN)) return a !== b;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  }
  return false;
}

export interface InstallHost {
  /** 这个 Agent 现在的安装方案；null = 没有这个 Agent */
  planOf(agentId: string): { name: string; plan: SetupPlan | null } | null;
  /** 运行命令用的环境变量（PATH 和检测 Agent 时用的一样） */
  env(): NodeJS.ProcessEnv;
  send(ws: WebSocket, msg: ServerMsg): void;
  broadcast(msg: ServerMsg): void;
  ipOf(ws: WebSocket): string | undefined;
  /** 记进审计日志 */
  audit(ip: string | undefined, ok: boolean, detail: Record<string, unknown>): void;
  /** 做完了：重新检测 Agent；ok 时再测一次连接 */
  finished(agentId: string, ok: boolean): void;
}

interface Run {
  id: number;
  agentId: string;
  name: string;
  action: 'install' | 'update';
  display: string;
  /** 发起的页面所在的 IP，审计日志用 */
  ip: string | undefined;
  state: InstallState;
  /** 终端输出，留最后 256K：重新打开窗口时先补上 */
  output: string;
  pty?: ChildProcess;
  timer?: NodeJS.Timeout;
}

const VERB = { install: '安装', update: '更新' };
const KEEP_OUTPUT = 256 * 1024;

export class InstallManager {
  /** 每个 Agent 最近一次安装、更新（做完的也留着，打开窗口还能看输出） */
  private runs = new Map<string, Run>();
  private current: Run | null = null;
  private seq = 0;

  constructor(
    private root: string,
    private host: InstallHost,
  ) {}

  /** 给新打开的页面：每个 Agent 最近一次安装、更新的情况 */
  snapshot(): Record<string, InstallRunView> {
    return Object.fromEntries([...this.runs.values()].map((run) => [run.agentId, this.view(run)]));
  }

  start(ws: WebSocket, agentId: string, action: 'install' | 'update', opts: { cols?: number; rows?: number } = {}): void {
    const target = this.host.planOf(agentId);
    if (!target) return;
    const refuse = (error: string) => this.host.send(ws, { type: 'install:busy', agentId, error });
    const busy = this.current;
    if (busy) {
      refuse(
        busy.agentId === agentId
          ? `${target.name} 正在${VERB[busy.action]}，等它做完`
          : `正在${VERB[busy.action]} ${busy.name}，一次只做一件，等它做完再试`,
      );
      return;
    }
    const command = action === 'install' ? target.plan?.install : target.plan?.update;
    if (!command) {
      refuse(target.plan?.view.note ?? `${target.name} 现在不能在网页上${VERB[action]}。点“重新扫描”再看看`);
      return;
    }
    const run: Run = {
      id: ++this.seq,
      agentId,
      name: target.name,
      action,
      display: command.display,
      ip: this.host.ipOf(ws),
      state: { phase: 'running' },
      output: '',
    };
    this.runs.set(agentId, run);
    this.current = run;
    // 发起的页面从头开始看（别的页面打开窗口时再补）
    this.host.send(ws, { type: 'install:output', agentId, data: '', replay: true });
    this.host.broadcast({ type: 'install', agentId, run: this.view(run) });
    const helper = path.join(this.root, 'scripts', 'pty-helper.py');
    const pty = spawn('python3', [helper, String(size(opts.cols, 100)), String(size(opts.rows, 30)), command.command, ...command.args], {
      cwd: os.homedir(),
      env: { ...this.host.env(), TERM: 'xterm-256color', npm_config_update_notifier: 'false', npm_config_fund: 'false' },
      stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });
    run.pty = pty;
    pty.once('error', (error: NodeJS.ErrnoException) =>
      this.finish(run, { phase: 'failed', error: error.code === 'ENOENT' ? '服务器上没有 python3，开不了终端' : error.message }),
    );
    // 先把要运行的命令打在终端最上面
    pty.once('spawn', () => this.output(run, `\x1b[2m$ ${command.display}\x1b[0m\r\n`));
    for (const stream of [pty.stdout!, pty.stderr!]) {
      stream.setEncoding('utf8');
      stream.on('data', (data: string) => this.output(run, data));
    }
    // close 在输出都读完之后才来，保证页面先看到最后的输出
    pty.on('close', (code, signal) =>
      this.finish(
        run,
        code === 0
          ? { phase: 'done' }
          : signal || code === null
            ? { phase: 'cancelled' }
            : { phase: 'failed', error: `命令没有正常结束（退出码 ${code}）`, exitCode: code },
      ),
    );
    run.timer = setTimeout(() => this.finish(run, { phase: 'failed', error: '运行了 30 分钟还没结束，已经停掉了' }), TIMEOUT);
  }

  /** 打开窗口看某个 Agent 的安装、更新：先把到现在为止的输出补上，之后的跟着推 */
  attach(ws: WebSocket, agentId: string): void {
    const run = this.runs.get(agentId);
    if (!run) return;
    this.host.send(ws, { type: 'install:output', agentId, data: run.output, replay: true });
    this.host.send(ws, { type: 'install', agentId, run: this.view(run) });
  }

  /** 终端里的键盘输入（比如回答安装脚本的问题）。哪个页面打开着窗口都能输入 */
  input(agentId: string, data: string): void {
    const run = this.runningFor(agentId);
    if (run?.pty?.stdin?.writable) run.pty.stdin.write(data);
  }

  resize(agentId: string, cols: number, rows: number): void {
    const control = this.runningFor(agentId)?.pty?.stdio[3] as Writable | null | undefined;
    if (control?.writable) control.write(`${size(cols, 100)} ${size(rows, 30)}\n`);
  }

  /** 点了“中断”。关掉窗口、关掉页面都不会中断，在后台接着做完 */
  cancel(agentId: string): void {
    const run = this.runningFor(agentId);
    if (run) this.finish(run, { phase: 'cancelled' });
  }

  disposeAll(): void {
    if (this.current) this.finish(this.current, { phase: 'cancelled' });
  }

  private runningFor(agentId: string): Run | null {
    return this.current?.agentId === agentId ? this.current : null;
  }

  private view(run: Run): InstallRunView {
    return { id: run.id, name: run.name, action: run.action, command: run.display, state: run.state };
  }

  private output(run: Run, data: string): void {
    if (run.state.phase !== 'running') return;
    run.output += data;
    if (run.output.length > KEEP_OUTPUT) run.output = run.output.slice(-KEEP_OUTPUT);
    this.host.broadcast({ type: 'install:output', agentId: run.agentId, data });
  }

  private finish(run: Run, state: InstallState): void {
    if (run.state.phase !== 'running') return;
    run.state = state;
    if (run.timer) clearTimeout(run.timer);
    if (run.pty && run.pty.exitCode === null && run.pty.signalCode === null) killTree(run.pty, 'SIGTERM');
    if (this.current === run) this.current = null;
    this.host.broadcast({ type: 'install', agentId: run.agentId, run: this.view(run) });
    this.host.audit(run.ip, state.phase === 'done', {
      agent: run.name,
      action: run.action,
      command: run.display,
      ...(state.phase === 'cancelled' ? { cancelled: true } : {}),
      ...(state.phase === 'failed' && state.exitCode !== undefined ? { exitCode: state.exitCode } : {}),
    });
    this.host.finished(run.agentId, state.phase === 'done');
  }
}

/** 终端的列数、行数：不合理就用默认值 */
function size(value: unknown, fallback: number): number {
  const n = Math.round(Number(value));
  return n >= 10 && n <= 500 ? n : fallback;
}
