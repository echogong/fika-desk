import { APP_ID, APP_NAME } from '../shared/brand';
// 一个会话 = 一个 Agent 子进程 + 一个 ACP 会话。
// 负责：启动和握手、把 ACP 的实时更新整理成时间线、转发审批（什么时候问由 Agent 自己的权限模式决定）、排队发送、停止和重启，
// 以及接着之前的对话继续（服务重启后、Agent 退出后）和回放命令行里的历史会话。
import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { AgentPreset, Launch } from './agents';
import type { StoredSession } from './db';
import { JsonRpcConnection, RpcError } from './rpc';
import { selectConfiguredModel } from './configured-model';
import { ImageStore } from './images';
import { trackAgent } from './process-registry';
import {
  summarizeTitle,
  type ApprovalInfo,
  type ImageAttachment,
  type PermissionOptionInfo,
  type SessionMeta,
  type SessionSelect,
  type SessionSnapshot,
  type SessionSource,
  type TimelineItem,
  type TimelineOp,
  type ToolCategory,
  type ToolContent,
  type ToolItem,
} from '../shared/types';

const PROTOCOL_VERSION = 1;
const START_TIMEOUT = 180_000;
const MAX_TEXT = 60_000;
const MAX_DIFF_TEXT = 400_000;

export interface SessionEvents {
  meta(meta: SessionMeta): void;
  ops(sessionId: string, ops: TimelineOp[]): void;
  checkpoint?(): void;
}

/** stopped：从保存的记录恢复出来、还没启动 Agent */
type Phase = 'stopped' | 'starting' | 'ready' | 'error' | 'exited' | 'closed';

/**
 * new：新开一个对话；
 * continue：接着上次的 Agent 会话（支持恢复就恢复，不支持就新开并提示）；
 * load：打开命令行里的会话，让 Agent 把历史回放出来
 */
export type StartMode = 'new' | 'continue' | 'load';

export interface SessionInit {
  imageStore?: ImageStore;
  source: SessionSource;
  /** 保存过的记录：带着原来的标题、权限模式和对话记录恢复，Agent 先不启动 */
  stored?: StoredSession;
  timeline?: TimelineItem[];
  /** 要接上的 Agent 会话编号（命令行里开的会话） */
  resumeId?: string;
  title?: string;
  /** 模型只列这些（用第三方模型供应商时：Agent 自己列的其他模型，那家供应商不认）；null = 都列 */
  modelFilter?: () => string[] | null;
}

interface PendingApproval {
  resolve: (response: unknown) => void;
  itemId: string;
  options: PermissionOptionInfo[];
}

export class AgentSession {
  readonly meta: SessionMeta;
  readonly timeline: TimelineItem[] = [];
  readonly protocolLog: { at: number; dir: 'in' | 'out'; message: unknown }[] = [];

  /** 还在左侧列表里；点“结束会话”后为 false，记录留在历史会话里 */
  open = true;

  private phase: Phase = 'starting';
  private proc?: ChildProcess;
  private rpc?: JsonRpcConnection;
  private acpSessionId?: string;
  /** 上一个 Agent 会话的编号：重新启动、继续时用它接上之前的对话 */
  private resumeId?: string;
  /** 回放历史时：show 把回放的内容记进时间线，ignore 丢掉（我们自己已经存了） */
  private replay: 'show' | 'ignore' | null = null;
  private index = new Map<string, TimelineItem>();
  private running = false;
  private turnStartedAt = 0;
  private queue: { text: string; images: ImageAttachment[]; itemId: string }[] = [];
  private images?: ImageStore;
  private approvals = new Map<string, PendingApproval>();
  private approvalSeq = 0;
  private itemSeq = 0;
  private toolItems = new Map<string, string>();
  private lastText?: { kind: 'agent' | 'thought' | 'user'; id: string; messageId?: string };
  private stderrTail: string[] = [];
  private configOptions: any[] = [];
  private modes: { currentModeId: string; availableModes: any[] } | null = null;
  private legacyModels: { currentModelId: string; availableModels: any[] } | null = null;
  private disposed = false;
  private firstPrompt = '';
  private modelFilter: () => string[] | null;
  /** 这个会话要用的权限模式：恢复上次用的模式，你在状态栏换了就跟着换；新会话跟随 Agent */
  private wantedMode: string | null;

  constructor(
    id: string,
    workspaceId: string,
    cwd: string,
    private preset: AgentPreset,
    /** 启动时才查找启动命令：记录恢复出来时 Agent 可能已经装好或卸掉了 */
    private getLaunch: () => Launch | null,
    private events: SessionEvents,
    init: SessionInit,
  ) {
    const now = Date.now();
    this.images = init.imageStore;
    this.meta = {
      id,
      workspaceId,
      agentId: preset.id,
      agentName: preset.name,
      color: preset.color,
      cwd,
      title: init.title?.trim().slice(0, 60) || '新会话',
      titleSource: init.title?.trim() ? 'agent' : 'default',
      source: init.source,
      state: 'starting',
      selects: [],
      queued: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.resumeId = init.resumeId;
    this.modelFilter = init.modelFilter ?? (() => null);
    this.wantedMode = null;
    const stored = init.stored;
    if (stored) {
      Object.assign(this.meta, {
        title: stored.title,
        titleSource: stored.titleSource,
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
        state: 'stopped',
      });
      this.phase = 'stopped';
      this.open = stored.open;
      this.wantedMode = stored.mode;
      this.resumeId = stored.acpSessionId ?? undefined;
      for (const saved of init.timeline ?? []) {
        const item = restoredItem(saved);
        this.timeline.push(item);
        this.index.set(item.id, item);
        this.itemSeq = Math.max(this.itemSeq, Number(item.id.slice(item.id.lastIndexOf('-') + 1)) || 0);
        if (item.kind === 'user' && item.delivery === 'queued') this.queue.push({ text: item.text, images: item.images ?? [], itemId: item.id });
      }
      this.meta.queued = this.queue.length;
      if (init.timeline?.some((item) => item.kind === 'user' && item.execution === 'running')) {
        this.addNotice('warning', '上次后台中断时有任务尚未确认结果。内容已保留；请先检查文件和对话结果，再决定是否重新发送。');
      }
    }
  }

  snapshot(): SessionSnapshot {
    return { meta: { ...this.meta }, timeline: this.timeline };
  }

  /** 要保存的会话信息 */
  record(): StoredSession {
    return {
      id: this.meta.id,
      cwd: this.meta.cwd,
      agentId: this.meta.agentId,
      acpSessionId: this.acpSessionId ?? this.resumeId ?? null,
      source: this.meta.source,
      open: this.open,
      title: this.meta.title,
      titleSource: this.meta.titleSource,
      mode: this.meta.selects.find((s) => s.category === 'mode')?.value ?? this.wantedMode,
      createdAt: this.meta.createdAt,
      updatedAt: this.meta.updatedAt,
    };
  }

  /** Agent 进程在运行（启动中或已就绪），占一个同时运行名额 */
  get live(): boolean {
    return this.phase === 'starting' || this.phase === 'ready';
  }

  /** Agent 那边的会话编号（没在运行时是上一次的） */
  get agentSessionId(): string | undefined {
    return this.acpSessionId ?? this.resumeId;
  }

  itemsById(ids: Iterable<string>): TimelineItem[] {
    const out: TimelineItem[] = [];
    for (const id of ids) {
      const item = this.index.get(id);
      if (item) out.push(item);
    }
    return out;
  }

  // ───────────────────────── 启动与关闭

  /** announce：重新启动时，在对话里说一声接上了没有 */
  async start(mode: StartMode = 'new', announce = false): Promise<void> {
    this.phase = 'starting';
    this.meta.error = undefined;
    this.refreshState();

    const launch = this.getLaunch();
    if (!launch) {
      this.fail(`这台机器上没找到 ${this.meta.agentName}，装好后点“重新启动”。`);
      return;
    }
    const { command, args, env } = launch;
    let proc: ChildProcess;
    try {
      proc = spawn(command, args, {
        cwd: this.meta.cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      });
      trackAgent(proc);
    } catch (error) {
      this.fail(`没能启动 ${this.meta.agentName}：${messageOf(error)}`);
      return;
    }
    this.proc = proc;
    proc.on('error', (error) => this.fail(`没能启动 ${this.meta.agentName}：${messageOf(error)}`));
    proc.on('exit', (code, signal) => this.onExit(proc, code, signal));
    proc.stderr?.setEncoding('utf8');
    proc.stderr?.on('data', (chunk: string) => {
      for (const line of chunk.split('\n')) {
        if (line.trim()) this.stderrTail.push(line.slice(0, 400));
      }
      if (this.stderrTail.length > 40) this.stderrTail.splice(0, this.stderrTail.length - 40);
    });

    const rpc = new JsonRpcConnection(
      proc.stdout!,
      proc.stdin!,
      {
        onRequest: (method, params) => this.onAgentRequest(method, params),
        onNotification: (method, params) => this.onAgentNotification(method, params),
      },
      (dir, message) => this.recordProtocol(dir, message),
    );
    this.rpc = rpc;

    try {
      const init = await rpc.request<any>(
        'initialize',
        {
          protocolVersion: PROTOCOL_VERSION,
          clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
          clientInfo: { name: APP_ID, title: APP_NAME, version: '1.0.0' },
        },
        START_TIMEOUT,
      );
      if (rpc !== this.rpc) return;
      this.meta.agentVersion = init?.agentInfo?.version;
      const caps = init?.agentCapabilities ?? {};
      this.meta.supportsImages = typeof caps.promptCapabilities?.image === 'boolean' ? caps.promptCapabilities.image : undefined;
      const previous = this.resumeId;
      const opened = await this.openAgentSession(rpc, mode, {
        load: caps.loadSession === true,
        resume: caps.sessionCapabilities?.resume != null,
      }, launch.sessionParams);
      const { resumed } = opened;
      const session = await selectConfiguredModel(rpc, opened.session, launch.modelId, this.acpSessionId!, START_TIMEOUT, launch.allowUnlistedModel);
      if (rpc !== this.rpc) return;
      if (announce && (resumed || !previous)) {
        this.addNotice('info', resumed ? `已重新启动 ${this.meta.agentName}，接着之前的对话。` : `已重新启动 ${this.meta.agentName}。`);
      }
      this.configOptions = Array.isArray(session.configOptions) ? session.configOptions : [];
      this.modes = session.modes ?? null;
      this.legacyModels = session.models ?? null;
      this.phase = 'ready';
      this.refreshSelects();
      await this.applyWantedMode(rpc);
      this.refreshState();
      this.drainQueue();
    } catch (error) {
      if (rpc !== this.rpc || this.disposed) return;
      if (error instanceof RpcError && (error.code === -32000 || /auth/i.test(error.message))) {
        const hint = this.preset.loginHint ?? '先到“设置 → Agent”里登录，再点“重新启动”。';
        this.fail(`${this.meta.agentName} 还没有登录。${hint}`, error.message);
      } else {
        this.fail(`${this.meta.agentName} 启动失败：${messageOf(error)}`);
      }
    }
  }

  /**
   * 打开 Agent 那边的会话：能接上之前的就接上，接不上就新开一个并在对话里说明。
   * 返回 Agent 给的设置项（模型、模式等）
   */
  private async openAgentSession(
    rpc: JsonRpcConnection,
    mode: StartMode,
    can: { load: boolean; resume: boolean },
    sessionParams?: Record<string, unknown>,
  ): Promise<{ session: any; resumed: boolean }> {
    const previous = this.resumeId;
    const base = { ...sessionParams, cwd: this.meta.cwd, mcpServers: [] };
    if (previous && mode !== 'new') {
      try {
        if (mode === 'load') {
          if (!can.load) throw new Error(`${this.meta.agentName} 不支持读取之前的会话`);
          this.acpSessionId = previous;
          const session = await this.withReplay('show', () =>
            rpc.request<any>('session/load', { ...base, sessionId: previous }, START_TIMEOUT),
          );
          return { session, resumed: true };
        }
        if (can.resume) {
          this.acpSessionId = previous;
          const session = await rpc.request<any>('session/resume', { ...base, sessionId: previous }, START_TIMEOUT);
          return { session, resumed: true };
        }
        if (can.load) {
          // 不支持“恢复”只支持“读取”：让它回放一遍，回放的内容我们已经有了，丢掉
          this.acpSessionId = previous;
          const session = await this.withReplay('ignore', () =>
            rpc.request<any>('session/load', { ...base, sessionId: previous }, START_TIMEOUT),
          );
          return { session, resumed: true };
        }
        this.addNotice('info', `${this.meta.agentName} 不支持接着之前的对话。这是一个新的对话，它不记得前面的内容。`);
      } catch (error) {
        this.acpSessionId = undefined;
        if (rpc !== this.rpc) throw error;
        if (mode === 'load') throw error;
        this.addNotice('warning', `没能接上之前的对话（${messageOf(error)}）。这是一个新的对话，它不记得前面的内容。`);
      }
    }
    const session = await rpc.request<any>('session/new', base, START_TIMEOUT);
    this.acpSessionId = String(session.sessionId);
    this.resumeId = this.acpSessionId;
    return { session, resumed: false };
  }

  private async withReplay<T>(mode: 'show' | 'ignore', run: () => Promise<T>): Promise<T> {
    this.replay = mode;
    this.lastText = undefined;
    this.toolItems.clear();
    try {
      return await run();
    } finally {
      this.replay = null;
      this.lastText = undefined;
      this.toolItems.clear();
    }
  }

  /** 重新启动 Agent，并尽量接着之前的对话 */
  restart(preserveQueue = false): void {
    const announce = this.phase !== 'stopped';
    const queued = preserveQueue ? [...this.queue] : [];
    if (!preserveQueue) for (const item of this.queue) this.patch(item.itemId, { delivery: 'failed' });
    this.stopProcess();
    this.resetConversation();
    this.queue = queued;
    this.meta.queued = queued.length;
    void this.start('continue', announce);
  }

  dispose(): void {
    this.disposed = true;
    this.phase = 'closed';
    this.cancelApprovals();
    this.stopProcess();
  }

  private stopProcess(): void {
    const proc = this.proc;
    this.proc = undefined;
    this.rpc?.close(new Error('会话已关闭'));
    this.rpc = undefined;
    if (!proc || proc.exitCode !== null || proc.signalCode !== null) return;
    killTree(proc, 'SIGTERM');
    setTimeout(() => {
      if (proc.exitCode === null && proc.signalCode === null) killTree(proc, 'SIGKILL');
    }, 2500).unref();
  }

  private resetConversation(): void {
    this.cancelApprovals();
    this.forgetAgentSession();
    this.running = false;
    this.queue = [];
    this.meta.queued = 0;
    this.toolItems.clear();
    this.lastText = undefined;
    this.stderrTail = [];
    this.configOptions = [];
    this.modes = null;
    this.legacyModels = null;
    this.meta.selects = [];
    this.meta.usage = undefined;
  }

  private onExit(proc: ChildProcess, code: number | null, signal: NodeJS.Signals | null): void {
    if (proc !== this.proc || this.disposed) return;
    this.proc = undefined;
    this.rpc?.close(new Error('Agent 进程已退出'));
    this.rpc = undefined;
    this.cancelApprovals();
    this.running = false;
    this.forgetAgentSession();
    if (this.phase === 'error') return;
    this.phase = 'exited';
    for (const item of this.queue) this.patch(item.itemId, { delivery: 'failed' });
    this.queue = [];
    this.meta.queued = 0;
    const how = signal ? `被信号 ${signal} 结束` : `退出码 ${code}`;
    this.meta.error = `${this.meta.agentName} 意外退出了（${how}）`;
    this.addNotice('error', `${this.meta.error}。点“重新启动”可以再开一个。`, this.stderrTail.slice(-8).join('\n') || undefined);
    this.refreshState();
  }

  /** Agent 进程没了：当前会话编号作废，但记下来，下次启动时用它接上 */
  private forgetAgentSession(): void {
    if (this.acpSessionId) this.resumeId = this.acpSessionId;
    this.acpSessionId = undefined;
  }

  private fail(message: string, detail?: string): void {
    if (this.phase === 'error' || this.disposed) return;
    this.phase = 'error';
    for (const item of this.queue) this.patch(item.itemId, { delivery: 'failed' });
    this.queue = [];
    this.meta.queued = 0;
    this.meta.error = message;
    this.running = false;
    this.cancelApprovals();
    const tail = this.stderrTail.slice(-8).join('\n');
    this.addNotice('error', message, [detail, tail].filter(Boolean).join('\n') || undefined);
    this.stopProcess();
    this.refreshState();
  }

  // ───────────────────────── 对话

  prompt(text: string, images: ImageAttachment[] = [], requestId?: string): void {
    const trimmed = text.trim();
    if (!trimmed && !images.length) return;
    if (requestId && this.timeline.some((item) => item.kind === 'user' && item.requestId === requestId)) return;
    const itemId = this.add({ kind: 'user', text: trimmed, ...(images.length ? { images } : {}), ...(requestId ? { requestId } : {}), delivery: 'queued' } as TimelineItem);
    this.events.checkpoint?.();
    const prompt = { text: trimmed, images, itemId };
    if (this.phase === 'stopped') {
      // 服务重启后恢复出来的会话：发消息时自动启动 Agent，接着之前的对话，这条消息排在启动之后
      const queued = [...this.queue, prompt];
      this.restart(true);
      this.queue = queued;
      this.meta.queued = queued.length;
      this.pushMeta();
      return;
    }
    if (this.phase === 'error' || this.phase === 'exited' || this.phase === 'closed') {
      this.patch(itemId, { delivery: 'failed' });
      this.addNotice('warning', `${this.meta.agentName} 现在没有在运行，先点“重新启动”。`);
      return;
    }
    if (this.running || this.phase === 'starting') {
      this.queue.push(prompt);
      this.meta.queued = this.queue.length;
      this.pushMeta();
      return;
    }
    void this.runTurn(prompt);
  }

  cancel(): void {
    for (const queued of this.queue) this.patch(queued.itemId, { delivery: 'failed' });
    this.queue = [];
    this.meta.queued = 0;
    if (this.running && this.rpc && this.acpSessionId) {
      this.rpc.notify('session/cancel', { sessionId: this.acpSessionId });
    }
    this.cancelApprovals();
    this.refreshState();
  }

  rename(title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    this.meta.title = trimmed.slice(0, 60);
    this.meta.titleSource = 'user';
    this.pushMeta();
  }

  private drainQueue(): void {
    if (this.running || this.phase !== 'ready') return;
    const next = this.queue.shift();
    this.meta.queued = this.queue.length;
    if (next !== undefined) void this.runTurn(next);
    else this.pushMeta();
  }

  private async runTurn(message: { text: string; images: ImageAttachment[]; itemId: string }): Promise<void> {
    const { text, images, itemId } = message;
    const rpc = this.rpc;
    const sessionId = this.acpSessionId;
    if (!rpc || !sessionId) return;
    this.running = true;
    this.turnStartedAt = Date.now();
    this.lastText = undefined;
    // 每一轮的工具步骤单独记，避免有的 Agent 跨轮重复使用同一个步骤编号时改到上一轮的记录
    this.toolItems.clear();
    if (this.meta.titleSource === 'default') {
      this.meta.title = summarizeTitle(text || images[0]?.name || '图片');
      this.meta.titleSource = 'summary';
      this.firstPrompt = text.trim();
    }
    this.refreshState();
    let dispatched = false;
    try {
      this.patch(itemId, { at: Date.now() });
      if (images.length && this.meta.supportsImages === false) throw new Error(`${this.meta.agentName} 不支持图片输入，请换一个支持图片的 Agent。`);
      const blocks: any[] = text ? [{ type: 'text', text }] : [];
      for (const image of images) {
        if (!this.images) throw new Error('图片存储不可用');
        const saved = this.images.read(this.meta.id, image.id);
        blocks.push({ type: 'image', mimeType: saved.image.mimeType, data: saved.data.toString('base64') });
      }
      this.patch(itemId, { delivery: 'sent', execution: 'running' });
      // Persist intent before handing a potentially paid or side-effecting request to ACP.
      this.events.checkpoint?.();
      dispatched = true;
      const result = await rpc.request<any>('session/prompt', {
        sessionId,
        prompt: blocks,
      });
      this.add({
        kind: 'turn',
        stopReason: String(result?.stopReason ?? 'end_turn'),
        durationMs: Date.now() - this.turnStartedAt,
        usage: result?.usage
          ? {
              inputTokens: result.usage.inputTokens,
              outputTokens: result.usage.outputTokens,
              cachedTokens: result.usage.cachedReadTokens ?? undefined,
              totalTokens: result.usage.totalTokens,
            }
          : undefined,
      } as TimelineItem);
      this.patch(itemId, { execution: 'complete' });
      this.events.checkpoint?.();
    } catch (error) {
      this.patch(itemId, { delivery: dispatched ? 'sent' : 'failed', ...(dispatched ? { execution: 'unknown' } : {}) });
      if (rpc === this.rpc && !this.disposed) {
        this.addNotice('error', `这一轮出错了：${messageOf(error)}`);
        this.add({ kind: 'turn', stopReason: 'error', durationMs: Date.now() - this.turnStartedAt } as TimelineItem);
      }
    } finally {
      try { this.events.checkpoint?.(); } catch (error) { console.error('执行记录保存失败：', error); }
      if (rpc === this.rpc) {
        this.running = false;
        this.lastText = undefined;
        this.cancelApprovals();
        this.refreshState();
        this.drainQueue();
      }
    }
  }

  // ───────────────────────── 设置：模型、思考强度、权限模式（都是 Agent 自己的选项）

  async setSelect(selectId: string, value: string): Promise<void> {
    const rpc = this.rpc;
    const sessionId = this.acpSessionId;
    if (!rpc || !sessionId) return;
    try {
      if (selectId === '__mode') {
        await rpc.request('session/set_mode', { sessionId, modeId: value });
        if (this.modes) this.modes.currentModeId = value;
      } else if (selectId === '__model') {
        await rpc.request('session/set_model', { sessionId, modelId: value });
        if (this.legacyModels) this.legacyModels.currentModelId = value;
      } else {
        const result = await rpc.request<any>('session/set_config_option', { sessionId, configId: selectId, value });
        if (Array.isArray(result?.configOptions)) this.configOptions = result.configOptions;
        else {
          const option = this.configOptions.find((o) => o.id === selectId);
          if (option) option.currentValue = value;
        }
      }
    } catch (error) {
      this.addNotice('warning', `没能切换设置：${messageOf(error)}`);
    }
    this.refreshSelects();
    // 换的是权限模式：记下来，Agent 重启、服务重启后接着用
    const mode = this.meta.selects.find((s) => s.category === 'mode');
    if (mode && (mode.id === selectId || selectId === '__mode')) this.wantedMode = mode.value;
    this.pushMeta();
  }

  /** 切到这个会话要用的权限模式（设置里的默认模式，或者上次用的） */
  private async applyWantedMode(rpc: JsonRpcConnection): Promise<void> {
    const target = this.wantedMode;
    const sessionId = this.acpSessionId;
    if (!target || rpc !== this.rpc || !sessionId) return;
    try {
      const modeOption = this.configOptions.find((o) => o.id === 'mode' || o.category === 'mode');
      if (modeOption) {
        if (modeOption.currentValue === target) return;
        if (!flattenOptions(modeOption.options).some((o) => o.value === target)) return;
        const result = await rpc.request<any>('session/set_config_option', {
          sessionId,
          configId: modeOption.id,
          value: target,
        });
        if (Array.isArray(result?.configOptions)) this.configOptions = result.configOptions;
        else modeOption.currentValue = target;
      } else if (this.modes && this.modes.currentModeId !== target) {
        if (!this.modes.availableModes.some((m) => m.id === target)) return;
        await rpc.request('session/set_mode', { sessionId, modeId: target });
        this.modes.currentModeId = target;
      }
      this.refreshSelects();
    } catch (error) {
      this.addNotice('warning', `没能切换到权限模式 ${target}：${messageOf(error)}`);
    }
  }

  private refreshSelects(): void {
    const selects: SessionSelect[] = [];
    for (const option of this.configOptions) {
      if (option?.type !== 'select') continue;
      selects.push({
        id: String(option.id),
        name: String(option.name ?? option.id),
        category: option.category ?? undefined,
        value: String(option.currentValue),
        options: flattenOptions(option.options),
      });
    }
    const hasMode = selects.some((s) => s.category === 'mode');
    if (!hasMode && this.modes && this.modes.availableModes?.length) {
      selects.push({
        id: '__mode',
        name: '模式',
        category: 'mode',
        value: this.modes.currentModeId,
        options: this.modes.availableModes.map((m: any) => ({ value: m.id, name: m.name, description: m.description })),
      });
    }
    const hasModel = selects.some((s) => s.category === 'model');
    if (!hasModel && this.legacyModels?.availableModels?.length) {
      selects.push({
        id: '__model',
        name: '模型',
        category: 'model',
        value: this.legacyModels.currentModelId,
        options: this.legacyModels.availableModels.map((m: any) => ({ value: m.modelId, name: m.name })),
      });
    }
    const only = this.modelFilter();
    if (only) {
      // 模型的值可能带着思考强度，比如 deepseek-flash[medium]
      const allowed = (value: string) => only.some((m) => value === m || value.startsWith(`${m}[`));
      for (const select of selects) {
        if (select.category === 'model') select.options = select.options.filter((o) => allowed(o.value) || o.value === select.value);
      }
    }
    const order = (s: SessionSelect) => ({ model: 0, thought_level: 1, mode: 2 })[s.category ?? ''] ?? 3;
    selects.sort((a, b) => order(a) - order(b));
    this.meta.selects = selects;
  }

  // ───────────────────────── 审批

  /** 你选了 Agent 给的哪个选项（允许一次、总是允许、拒绝……），原样告诉 Agent */
  respondApproval(requestId: string, optionId: string): PermissionOptionInfo | undefined {
    const pending = this.approvals.get(requestId);
    const option = pending?.options.find((o) => o.optionId === optionId);
    if (!pending || !option) return undefined;
    this.approvals.delete(requestId);
    pending.resolve({ outcome: { outcome: 'selected', optionId: option.optionId } });
    this.patchApproval(pending.itemId, {
      state: option.kind.startsWith('reject') ? 'rejected' : 'approved',
      chosen: option.optionId,
    });
    this.refreshState();
    return option;
  }

  private async onPermissionRequest(params: any): Promise<unknown> {
    const toolCall = params?.toolCall ?? {};
    const toolCallId = String(toolCall.toolCallId ?? `perm-${this.approvalSeq + 1}`);
    this.upsertTool({ ...toolCall, toolCallId });
    const itemId = this.toolItems.get(toolCallId)!;
    const options: PermissionOptionInfo[] = (Array.isArray(params?.options) ? params.options : []).map((o: any) => ({
      optionId: String(o.optionId),
      name: String(o.name ?? o.optionId),
      kind: String(o.kind ?? ''),
    }));
    // 会话恢复后计数从头开始；随机标识避免新审批与历史记录重名，旧页面也不能批准新的命令。
    const requestId = `${this.meta.id}-a${++this.approvalSeq}-${randomUUID()}`;

    // 什么时候来问由 Agent 自己的权限模式决定；问了就交给你选
    this.patchApproval(itemId, { requestId, state: 'pending', options });
    return new Promise((resolve) => {
      this.approvals.set(requestId, { resolve, itemId, options });
      this.refreshState();
    });
  }

  private cancelApprovals(): void {
    for (const pending of this.approvals.values()) {
      pending.resolve({ outcome: { outcome: 'cancelled' } });
      this.patchApproval(pending.itemId, { state: 'cancelled' });
    }
    this.approvals.clear();
  }

  private patchApproval(itemId: string, change: Partial<ApprovalInfo>): void {
    const item = this.findItem(itemId) as ToolItem | undefined;
    if (!item) return;
    const approval = { ...(item.approval ?? { requestId: '', state: 'pending', options: [] }), ...change } as ApprovalInfo;
    this.patch(itemId, { approval });
  }

  // ───────────────────────── 来自 Agent 的请求和通知

  private async onAgentRequest(method: string, params: any): Promise<unknown> {
    if (method === 'session/request_permission') return this.onPermissionRequest(params);
    throw new RpcError(`不支持的方法：${method}`, -32601);
  }

  private onAgentNotification(method: string, params: any): void {
    if (method === 'session/update') {
      if (params?.sessionId && this.acpSessionId && params.sessionId !== this.acpSessionId) return;
      this.onUpdate(params?.update ?? {});
    }
  }

  private onUpdate(update: any): void {
    // 接上之前的对话时 Agent 会把历史回放一遍，我们自己已经存了，只留设置的变化
    if (this.replay === 'ignore' && update.sessionUpdate !== 'current_mode_update' && update.sessionUpdate !== 'config_option_update') {
      return;
    }
    switch (update.sessionUpdate) {
      case 'user_message_chunk':
        // 回放历史时，用户说过的话
        if (this.replay === 'show') this.appendContent('user', update.content, update.messageId);
        break;
      case 'agent_message_chunk': {
        const text = blockText(update.content);
        // Codex 用第三方模型时，每轮都先说一句“没有这个模型的参数，用通用的”，对你没用，不显示
        if (FALLBACK_NOTICE.test(text)) break;
        this.appendContent('agent', update.content, update.messageId);
        break;
      }
      case 'agent_thought_chunk':
        this.appendText('thought', blockText(update.content), update.messageId);
        break;
      case 'tool_call':
      case 'tool_call_update':
        this.upsertTool(update);
        break;
      case 'plan':
        this.setPlan(update.entries);
        break;
      case 'plan_update':
        if (update.plan?.type === 'items') this.setPlan(update.plan.entries);
        break;
      case 'current_mode_update':
        if (this.modes) this.modes.currentModeId = update.currentModeId;
        this.refreshSelects();
        this.pushMeta();
        break;
      case 'config_option_update':
        if (Array.isArray(update.configOptions)) this.configOptions = update.configOptions;
        this.refreshSelects();
        this.pushMeta();
        break;
      case 'session_info_update':
        if (
          typeof update.title === 'string' &&
          update.title.trim() &&
          this.meta.titleSource !== 'user' &&
          // 有的 Agent 先把第一句话原样当标题，这种情况保留我们自己的简短标题
          update.title.trim() !== this.firstPrompt
        ) {
          this.meta.title = update.title.trim().slice(0, 60);
          this.meta.titleSource = 'agent';
          this.pushMeta();
        }
        break;
      case 'usage_update':
        if (typeof update.used === 'number' && typeof update.size === 'number') {
          this.meta.usage = { used: update.used, size: update.size, cost: update.cost ?? undefined };
          this.pushMeta();
        }
        break;
      case 'notice':
        this.addNotice(
          update.severity === 'error' ? 'error' : update.severity === 'warning' ? 'warning' : 'info',
          String(update.title ?? ''),
          update.description ?? undefined,
        );
        break;
      default:
        break;
    }
  }

  private imageFromBlock(content: any): ImageAttachment | null {
    try { return this.images?.fromBlock(this.meta.id, content) ?? null; }
    catch (error) { this.addNotice('warning', `图片无法显示：${messageOf(error)}`); return null; }
  }

  private appendContent(kind: 'agent' | 'user', content: any, messageId?: string): void {
    if (content?.type === 'resource' && content.resource?.blob && /^image\//.test(content.resource.mimeType ?? '')) {
      content = { type: 'image', data: content.resource.blob, mimeType: content.resource.mimeType, name: content.resource.uri };
    }
    if (content?.type === 'image') {
      if (!content.data && content.uri) { this.appendText(kind, `\n![图片](${content.uri})\n`, messageId); return; }
      const image = this.imageFromBlock(content);
      if (image) this.add({ kind, text: '', images: [image] } as TimelineItem);
      else this.appendText(kind, '\n[图片格式暂不支持]\n', messageId);
      return;
    }
    this.appendText(kind, blockText(content), messageId);
  }

  private appendText(kind: 'agent' | 'thought' | 'user', text: string, messageId?: string): void {
    if (!text) return;
    const last = this.lastText;
    const sameMessage = last && last.kind === kind && (!messageId || !last.messageId || last.messageId === messageId);
    if (last && sameMessage && this.findItem(last.id)) {
      const item = this.findItem(last.id) as { text: string };
      if (item.text.length < MAX_TEXT * 4) this.appendOp(last.id, text);
      return;
    }
    const id = this.add({ kind, text } as TimelineItem, false);
    this.lastText = { kind, id, messageId };
  }

  private upsertTool(update: any): void {
    const toolCallId = String(update.toolCallId ?? '');
    if (!toolCallId) return;
    const existingId = this.toolItems.get(toolCallId);
    const content = Array.isArray(update.content) ? convertContent(update.content, (block) => this.imageFromBlock(block)) : undefined;
    const locations = Array.isArray(update.locations)
      ? update.locations.filter((l: any) => l?.path).map((l: any) => ({ path: String(l.path), line: l.line ?? undefined }))
      : undefined;
    const command = commandOf(update.rawInput);

    if (!existingId) {
      const toolKind = String(update.kind ?? 'other');
      const id = this.add({
        kind: 'tool',
        toolCallId,
        title: String(update.title ?? ''),
        toolKind,
        category: categoryOf(toolKind),
        status: String(update.status ?? 'pending'),
        content: content ?? [],
        locations: locations ?? [],
        command,
      } as TimelineItem);
      this.toolItems.set(toolCallId, id);
      return;
    }
    const patch: Record<string, unknown> = {};
    if (update.title) patch.title = String(update.title);
    if (update.kind) {
      patch.toolKind = String(update.kind);
      patch.category = categoryOf(String(update.kind));
    }
    if (update.status) patch.status = String(update.status);
    if (content) patch.content = content;
    if (locations) patch.locations = locations;
    if (command) patch.command = command;
    if (Object.keys(patch).length) this.patch(existingId, patch);
  }

  private setPlan(entries: any): void {
    if (!Array.isArray(entries)) return;
    const clean = entries.map((e: any) => ({ content: String(e?.content ?? ''), status: String(e?.status ?? 'pending') }));
    // 同一轮里计划会反复更新，更新最近那条计划，不重复添加
    for (let i = this.timeline.length - 1; i >= 0; i--) {
      const item = this.timeline[i];
      if (item.kind === 'user' || item.kind === 'turn') break;
      if (item.kind === 'plan') {
        this.patch(item.id, { entries: clean });
        return;
      }
    }
    this.add({ kind: 'plan', entries: clean } as TimelineItem);
  }

  private addNotice(level: 'info' | 'warning' | 'error', text: string, detail?: string): void {
    if (!text) return;
    this.add({ kind: 'notice', level, text, detail } as TimelineItem);
  }

  // ───────────────────────── 时间线与状态

  private add(item: TimelineItem, breaksText = true): string {
    const id = `${this.meta.id}-${++this.itemSeq}`;
    // 回放的历史不知道原来的时间，记 0，界面上就不显示时间
    const full = { ...item, id, at: this.replay === 'show' ? 0 : Date.now() } as TimelineItem;
    this.timeline.push(full);
    this.index.set(id, full);
    if (breaksText) this.lastText = undefined;
    // 发出去的是副本：更新会先攒 30 毫秒再发，期间原对象还会被追加文字，直接引用会让文字重复
    this.events.ops(this.meta.id, [{ op: 'add', item: { ...full } as TimelineItem }]);
    this.touch();
    return id;
  }

  private appendOp(id: string, text: string): void {
    const item = this.findItem(id) as { text: string } | undefined;
    if (!item) return;
    item.text += text;
    this.events.ops(this.meta.id, [{ op: 'append', id, text }]);
  }

  private patch(id: string, patch: Record<string, unknown>): void {
    const item = this.findItem(id);
    if (!item) return;
    Object.assign(item, patch);
    this.events.ops(this.meta.id, [{ op: 'patch', id, patch }]);
  }

  private findItem(id: string): TimelineItem | undefined {
    return this.index.get(id);
  }

  private refreshState(): void {
    const state: SessionMeta['state'] =
      this.phase === 'error'
        ? 'error'
        : this.phase === 'exited' || this.phase === 'closed'
          ? 'exited'
          : this.phase === 'stopped'
            ? 'stopped'
            : this.phase === 'starting'
              ? 'starting'
              : this.approvals.size > 0
                ? 'waiting'
                : this.running
                  ? 'running'
                  : 'idle';
    this.meta.state = state;
    this.pushMeta();
  }

  private touch(): void {
    this.meta.updatedAt = Date.now();
  }

  private pushMeta(): void {
    this.touch();
    this.events.meta({ ...this.meta, selects: this.meta.selects.map((s) => ({ ...s })) });
  }

  private recordProtocol(dir: 'in' | 'out', message: unknown): void {
    let stored = message;
    const text = JSON.stringify(message);
    if (text && text.length > 4000) stored = { truncated: text.slice(0, 4000) };
    this.protocolLog.push({ at: Date.now(), dir, message: stored });
    if (this.protocolLog.length > 400) this.protocolLog.splice(0, this.protocolLog.length - 400);
  }
}

// ───────────────────────── 工具函数

/** 恢复出来的记录：服务停掉时还在等批准的，算作已取消 */
function restoredItem(item: TimelineItem): TimelineItem {
  if (item.kind === 'user' && item.execution === 'running') return { ...item, delivery: 'sent', execution: 'unknown' };
  if (item.kind === 'tool' && item.approval?.state === 'pending') {
    return { ...item, approval: { ...item.approval, state: 'cancelled' } };
  }
  return item;
}

/** Codex 不认识第三方模型时的提示（单独一块发来） */
const FALLBACK_NOTICE = /^Warning: Model metadata for `[^`]*` not found\. Defaulting to fallback metadata; this can degrade performance and cause issues\.\s*$/;

export function killTree(proc: ChildProcess, signal: NodeJS.Signals): void {
  try {
    if (proc.pid && process.platform !== 'win32') process.kill(-proc.pid, signal);
    else proc.kill(signal);
  } catch {
    try {
      proc.kill(signal);
    } catch {
      // 进程已经不在了
    }
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function flattenOptions(options: any): { value: string; name: string; description?: string }[] {
  if (!Array.isArray(options)) return [];
  const out: { value: string; name: string; description?: string }[] = [];
  for (const option of options) {
    if (Array.isArray(option?.options)) {
      for (const inner of option.options) out.push(toOption(inner));
    } else if (option) {
      out.push(toOption(option));
    }
  }
  return out;
}

function toOption(o: any): { value: string; name: string; description?: string } {
  return { value: String(o.value), name: String(o.name ?? o.value), description: o.description ?? undefined };
}

function blockText(content: any): string {
  if (!content) return '';
  switch (content.type) {
    case 'text':
      return String(content.text ?? '');
    case 'image':
      return '\n[图片]\n';
    case 'resource_link':
      return `${/^image\//.test(content.mimeType ?? '') ? '!' : ''}[${content.title ?? content.name ?? content.uri}](${content.uri})`;
    case 'resource':
      return String(content.resource?.text ?? content.resource?.uri ?? '');
    default:
      return '';
  }
}

function convertContent(list: any[], imageOf: (content: any) => ImageAttachment | null): ToolContent[] {
  const out: ToolContent[] = [];
  for (const entry of list) {
    if (entry?.type === 'diff') {
      out.push({
        type: 'diff',
        path: String(entry.path ?? ''),
        oldText: entry.oldText == null ? null : clip(String(entry.oldText), MAX_DIFF_TEXT),
        newText: clip(String(entry.newText ?? ''), MAX_DIFF_TEXT),
      });
    } else if (entry?.type === 'terminal') {
      out.push({ type: 'terminal', terminalId: String(entry.terminalId ?? '') });
    } else if (entry?.type === 'content') {
      if (entry.content?.type === 'image') {
        const image = imageOf(entry.content);
        if (image) out.push({ type: 'image', image });
        continue;
      }
      const text = blockText(entry.content);
      if (text) out.push({ type: 'text', text: clip(text, MAX_TEXT) });
    }
  }
  return out;
}

function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + `\n…（还有 ${text.length - max} 个字符没有显示）` : text;
}

/** 从工具的原始参数里找出要执行的命令，兼容字符串和 ["bash", "-lc", "..."] 两种写法 */
function commandOf(rawInput: any): string | undefined {
  if (!rawInput || typeof rawInput !== 'object') return undefined;
  const value = rawInput.command ?? rawInput.cmd;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const parts = value.map(String);
    const flag = parts.findIndex((p) => p === '-lc' || p === '-c');
    if (flag >= 0 && parts[flag + 1]) return parts[flag + 1];
    return parts.join(' ');
  }
  return undefined;
}

function categoryOf(toolKind: string): ToolCategory {
  switch (toolKind) {
    case 'read':
    case 'search':
    case 'fetch':
    case 'think':
      return 'read';
    case 'edit':
    case 'move':
    case 'delete':
      return 'edit';
    case 'execute':
      return 'execute';
    default:
      return 'other';
  }
}
