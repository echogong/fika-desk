import { APP_ID, APP_NAME } from '../shared/brand';
// Agent 登录（设置 → Agent → 登录）：只用 Agent 自己在握手时报出来的登录方式（ACP 的 authMethods）。
// - 填 API Key、验证码登录：单独起一个 Agent 进程调 authenticate。Agent 要我们打开网址时（ACP 的 elicitation，
//   验证码登录就是这样），把网址和提示转给页面，你在自己的手机或电脑上打开。登录信息由 Agent 自己保存。
// - 设置向导（terminal 类，比如 Pi、Hermes）：在伪终端里运行 Agent 给的登录命令，页面上用终端窗口显示，
//   键盘输入原样转过去；命令正常退出就算设置好了。伪终端由 scripts/pty-helper.py 提供，服务器上要有 python3。
// - 有的 Agent 登录时直接“打开浏览器”（比如 CodeBuddy 的微信登录：打开网址后一直等你登录好）。服务器上没有浏览器，
//   所以登录时把环境变量 BROWSER 指向 scripts/open-url.sh：它把网址记下来，我们转给页面，你在自己的手机或电脑上打开。
// 同一个 Agent 同时只有一个登录在进行；发起登录的页面关了，登录也跟着结束。
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Writable } from 'node:stream';
import type { WebSocket } from 'ws';
import type { Launch } from './agents';
import { JsonRpcConnection, RpcError } from './rpc';
import { killTree } from './session';
import type { AuthMethodView, LoginState, ServerMsg } from '../shared/types';

const BASE_CAPABILITIES = { fs: { readTextFile: false, writeTextFile: false }, terminal: false };
/**
 * 测试连接和登录时，握手多声明两样：能替 Agent 打开网址（验证码登录要用）、能开设置向导。
 * 协议库新旧版本写法不同：新版 auth.terminal 是个对象，旧版（比如 pi-acp 用的 0.26）是 true/false，
 * 写法对不上，整个握手都会被拒（参数不对）。所以按新版、旧版、什么都不多带的顺序试。
 */
const CAPABILITY_TRIES = [
  { ...BASE_CAPABILITIES, elicitation: { url: {} }, auth: { terminal: {} } },
  { ...BASE_CAPABILITIES, elicitation: { url: {} }, auth: { terminal: true } },
  BASE_CAPABILITIES,
];

/** 握手：只有“参数不对”（-32602）才换一种写法再试，超时、进程退出这类错误直接报出去 */
export async function initializeAgent(rpc: JsonRpcConnection, timeoutMs: number): Promise<any> {
  let lastError: unknown;
  for (const clientCapabilities of CAPABILITY_TRIES) {
    try {
      return await rpc.request(
        'initialize',
        { protocolVersion: 1, clientCapabilities, clientInfo: { name: APP_ID, title: APP_NAME, version: '1.0.0' } },
        timeoutMs,
      );
    } catch (error) {
      if (!(error instanceof RpcError && error.code === -32602)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

const INIT_TIMEOUT = 60_000;
/** 各种登录方式最多等多久：验证码登录要等你在别的设备上操作完 */
const TIMEOUTS = { 'api-key': 60_000, 'device-code': 15 * 60_000, agent: 10 * 60_000 };
/** Agent 自己打开浏览器登录时，页面上的说明 */
const BROWSER_MESSAGE = '按页面上的提示登录，比如微信扫码。登录好后这里会自动更新。';
const TERMINAL_TIMEOUT = 30 * 60_000;

/** 把 Agent 报的登录方式整理成页面上用的样子 */
export function authMethodsOf(raw: unknown): AuthMethodView[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && typeof m.id === 'string')
    .map((m): AuthMethodView => {
      const apiKey = m._meta?.['api-key'];
      return {
        id: m.id,
        name: String(m.name ?? m.id),
        description: typeof m.description === 'string' ? m.description : undefined,
        kind: m.type === 'terminal' ? 'terminal' : apiKey ? 'api-key' : /device/i.test(m.id) ? 'device-code' : 'agent',
        provider: typeof apiKey?.provider === 'string' ? apiKey.provider : undefined,
      };
    });
}

export interface LoginHost {
  /** 这个 Agent 的启动方式（含已有的启动配置）；null 表示没有这个 Agent */
  launchOf(agentId: string): { launch: Launch | null; name: string } | null;
  /** 应用核实的原生模型/账号向导，只能从服务器固定预设选择。 */
  modelSetupOf?(agentId: string, methodId: string): Launch | null;
  /** 登录时 Agent 进程的工作目录 */
  cwd(): string;
  send(ws: WebSocket, msg: ServerMsg): void;
  /** 记进审计日志 */
  audit(ws: WebSocket, ok: boolean, detail: Record<string, unknown>): void;
  /** 登录成功了（账号可能换了） */
  loggedIn(agentId: string): void;
}

interface Running {
  owner: WebSocket;
  agentId: string;
  name: string;
  methodId: string;
  /** 知道是哪类登录方式之后填上，审计日志用 */
  kind?: AuthMethodView['kind'];
  procs: ChildProcess[];
  rpc?: JsonRpcConnection;
  pty?: ChildProcess;
  timer?: NodeJS.Timeout;
  /** Agent 要打开的网址记在这个文件里（见 scripts/open-url.sh） */
  urlFile?: string;
  urlTimer?: NodeJS.Timeout;
  urlCount?: number;
  finished: boolean;
}

export class LoginManager {
  private running = new Map<string, Running>();

  constructor(
    private root: string,
    private host: LoginHost,
  ) {
    // 拷代码时可能丢了可执行权限
    try {
      fs.chmodSync(this.openUrlScript(), 0o755);
    } catch {
      // 改不了就算了，Agent 打不开网址时页面上一直等着，可以取消
    }
  }

  async start(ws: WebSocket, agentId: string, methodId: string, opts: { apiKey?: string; cols?: number; rows?: number } = {}): Promise<void> {
    const agent = this.host.launchOf(agentId);
    if (!agent) return;
    const previous = this.running.get(agentId);
    if (previous) this.finish(previous, { phase: 'cancelled' });
    const run: Running = { owner: ws, agentId, name: agent.name, methodId, procs: [], finished: false };
    this.running.set(agentId, run);
    const nativeSetup = this.host.modelSetupOf?.(agentId, methodId);
    if (nativeSetup) {
      run.kind = 'terminal';
      this.openTerminal(run, nativeSetup, {}, opts);
      return;
    }
    if (!agent.launch) {
      this.finish(run, { phase: 'failed', error: `没找到 ${agent.name} 的命令` });
      return;
    }
    this.send(run, { phase: 'starting' });
    try {
      const { init, proc } = await this.connect(run, agent.launch);
      if (run.finished) return;
      const method = (Array.isArray(init?.authMethods) ? init.authMethods : []).find((m: any) => m?.id === methodId);
      if (!method) throw new Error(`${agent.name} 现在不提供这种登录方式了。重新测试一下连接再试。`);
      const [view] = authMethodsOf([method]);
      run.kind = view.kind;
      if (view.kind === 'terminal') {
        // 设置向导不走协议：关掉这个进程，在伪终端里另起 Agent 给的登录命令
        run.rpc?.close(new Error('改开设置向导'));
        killTree(proc, 'SIGTERM');
        this.openTerminal(run, agent.launch, method, opts);
        return;
      }
      const key = String(opts.apiKey ?? '').trim();
      if (view.kind === 'api-key' && !key) throw new Error('先填 API Key');
      await run.rpc!.request(
        'authenticate',
        { methodId, ...(view.kind === 'api-key' ? { _meta: { 'api-key': { apiKey: key } } } : {}) },
        TIMEOUTS[view.kind as keyof typeof TIMEOUTS],
      );
      this.finish(run, { phase: 'done' });
    } catch (error) {
      this.finish(run, { phase: 'failed', error: messageOf(error) });
    }
  }

  /** 设置向导里的键盘输入 */
  input(ws: WebSocket, agentId: string, data: string): void {
    const run = this.running.get(agentId);
    if (run?.owner === ws && run.pty?.stdin?.writable) run.pty.stdin.write(data);
  }

  resize(ws: WebSocket, agentId: string, cols: number, rows: number): void {
    const run = this.running.get(agentId);
    const control = run?.owner === ws ? (run.pty?.stdio[3] as Writable | null | undefined) : undefined;
    if (control?.writable) control.write(`${size(cols, 100)} ${size(rows, 30)}\n`);
  }

  cancel(ws: WebSocket, agentId: string): void {
    const run = this.running.get(agentId);
    if (run?.owner === ws) this.finish(run, { phase: 'cancelled' });
  }

  /** 页面关了：它发起的登录都结束 */
  dropOwner(ws: WebSocket): void {
    for (const run of [...this.running.values()]) if (run.owner === ws) this.finish(run, { phase: 'cancelled' });
  }

  disposeAll(): void {
    for (const run of [...this.running.values()]) this.finish(run, { phase: 'cancelled' });
  }

  isBusy(): boolean { return this.running.size > 0; }

  private openUrlScript(): string {
    return path.join(this.root, 'scripts', 'open-url.sh');
  }

  /**
   * Agent 想“打开浏览器”时，网址交给我们：返回要加的环境变量。每 300 毫秒看一下记网址的文件，
   * 有新的就发给页面（设置向导开着时，显示在终端上面）
   */
  private watchBrowser(run: Running): Record<string, string> {
    if (!run.urlFile) {
      run.urlFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fika-desk-login-')), 'urls');
      run.urlCount = 0;
      run.urlTimer = setInterval(() => {
        let lines: string[];
        try {
          lines = fs.readFileSync(run.urlFile!, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
        } catch {
          return;
        }
        for (const url of lines.slice(run.urlCount)) {
          if (!/^https?:\/\//i.test(url) || url.length > 4000) continue;
          this.send(run, run.pty ? { phase: 'terminal', url } : { phase: 'url', url, message: BROWSER_MESSAGE });
        }
        run.urlCount = lines.length;
      }, 300);
    }
    return { BROWSER: this.openUrlScript(), FIKA_DESK_OPEN_URL_FILE: run.urlFile };
  }

  /** 起一个 Agent 进程并握手；它要我们打开网址时转给页面 */
  private async connect(run: Running, launch: Launch): Promise<{ init: any; proc: ChildProcess }> {
    const proc = spawn(launch.command, launch.args, {
      cwd: this.host.cwd(),
      env: { ...launch.env, ...this.watchBrowser(run) },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });
    run.procs.push(proc);
    const stderr: string[] = [];
    proc.stderr?.setEncoding('utf8');
    proc.stderr?.on('data', (chunk: string) => {
      for (const line of chunk.split('\n')) if (line.trim()) stderr.push(line.slice(0, 300));
      if (stderr.length > 20) stderr.splice(0, stderr.length - 20);
    });
    await new Promise<void>((resolve, reject) => {
      proc.once('spawn', () => resolve());
      proc.once('error', reject);
    });
    const rpc = new JsonRpcConnection(proc.stdout!, proc.stdin!, {
      onRequest: async (method, params) => {
        if (method === 'elicitation/create' && params?.mode === 'url') {
          const url = String(params.url ?? '');
          // 只转 https 网址：它要在你自己的设备上打开
          if (!/^https:\/\//i.test(url)) throw new RpcError('只能打开 https 网址', -32602);
          this.send(run, { phase: 'url', url, message: String(params.message ?? '') });
          return { action: 'accept' };
        }
        throw new RpcError(`不支持的方法：${method}`, -32601);
      },
      onNotification: () => {},
    });
    run.rpc = rpc;
    proc.on('exit', (code, signal) => {
      const last = stderr.slice(-3).join('\n');
      rpc.close(new Error(`Agent 进程退出了（${signal ? `信号 ${signal}` : `退出码 ${code}`}）${last ? `：${last}` : ''}`));
    });
    const init = await initializeAgent(rpc, INIT_TIMEOUT);
    return { init, proc };
  }

  /** 在伪终端里运行设置向导：Agent 的启动命令后面接上它给的参数 */
  private openTerminal(run: Running, launch: Launch, method: any, opts: { cols?: number; rows?: number }): void {
    if (run.finished) return;
    const args = [...launch.args, ...(Array.isArray(method.args) ? method.args.map(String) : [])];
    const extraEnv: Record<string, string> = {};
    if (method.env && typeof method.env === 'object') {
      for (const [k, v] of Object.entries(method.env)) if (typeof v === 'string') extraEnv[k] = v;
    }
    const helper = path.join(this.root, 'scripts', 'pty-helper.py');
    const pty = spawn('python3', [helper, String(size(opts.cols, 100)), String(size(opts.rows, 30)), launch.command, ...args], {
      cwd: this.host.cwd(),
      env: { ...launch.env, ...extraEnv, ...this.watchBrowser(run), TERM: 'xterm-256color' },
      stdio: ['pipe', 'pipe', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });
    run.pty = pty;
    run.procs.push(pty);
    pty.once('error', (error: NodeJS.ErrnoException) =>
      this.finish(run, { phase: 'failed', error: error.code === 'ENOENT' ? '服务器上没有 python3，开不了设置向导' : error.message }),
    );
    pty.once('spawn', () => this.send(run, { phase: 'terminal' }));
    for (const stream of [pty.stdout!, pty.stderr!]) {
      stream.setEncoding('utf8');
      stream.on('data', (data: string) => {
        if (!run.finished) this.host.send(run.owner, { type: 'login:output', agentId: run.agentId, data });
      });
    }
    // close 在输出都读完之后才来，保证页面先看到向导最后说的话
    pty.on('close', (code, signal) =>
      this.finish(
        run,
        code === 0
          ? { phase: 'done' }
          : signal || code === null
            ? { phase: 'cancelled' }
            : { phase: 'failed', error: `设置向导没有正常退出（退出码 ${code}）`, exitCode: code },
      ),
    );
    run.timer = setTimeout(() => this.finish(run, { phase: 'failed', error: '设置向导开了太久，已经关掉了' }), TERMINAL_TIMEOUT);
  }

  private send(run: Running, state: LoginState): void {
    if (!run.finished) this.host.send(run.owner, { type: 'login', agentId: run.agentId, state });
  }

  private finish(run: Running, state: LoginState): void {
    if (run.finished) return;
    this.host.send(run.owner, { type: 'login', agentId: run.agentId, state });
    run.finished = true;
    if (run.timer) clearTimeout(run.timer);
    if (run.urlTimer) clearInterval(run.urlTimer);
    if (run.urlFile) fs.rmSync(path.dirname(run.urlFile), { recursive: true, force: true });
    run.rpc?.close(new Error('登录已经结束'));
    for (const proc of run.procs) if (proc.exitCode === null && proc.signalCode === null) killTree(proc, 'SIGTERM');
    if (this.running.get(run.agentId) === run) this.running.delete(run.agentId);
    if (state.phase === 'done' || state.phase === 'failed') {
      this.host.audit(run.owner, state.phase === 'done', { agent: run.name, method: run.kind ?? run.methodId });
    }
    if (state.phase === 'done') this.host.loggedIn(run.agentId);
  }
}

/** 终端的列数、行数：不合理就用默认值 */
function size(value: unknown, fallback: number): number {
  const n = Math.round(Number(value));
  return n >= 10 && n <= 500 ? n : fallback;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
