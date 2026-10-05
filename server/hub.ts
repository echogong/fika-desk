// 管理所有会话，并通过 WebSocket 同步给浏览器；会话和对话记录实时存进数据库。
// 浏览器只是“显示器”：会话和 Agent 进程都在服务端，刷新页面或断线重连后状态照旧；
// 服务重启后，没结束的会话从记录里恢复出来，发消息或点“继续”时接着聊。
import { randomBytes } from 'node:crypto';
import os from 'node:os';
import type { WebSocket } from 'ws';
import { readAgentFiles } from './agent-files';
import { checkUpdate, InstallManager, newer, setupPlan, type SetupPlan } from './agent-install';
import { LoginManager } from './agent-login';
import type { AgentSettingsPatch, AgentSettingsStore } from './agent-settings';
import { describeAgents, presets, resolveLaunch, searchPath, which, type AgentPreset, type Launch } from './agents';
import { historicalPreset } from './archived-agents';
import { checkProvider, providerForView, testProvider } from './model-provider';
import { AgentModelConfigs, modelAccessFor, modelDriver, modelSetup } from './agent-model-config';
import type { SessionStore } from './db';
import { HistoryLister } from './history';
import type { HistorySearch } from '../shared/project';
import { exportSessionMarkdown, timelineText } from './session-export';
import { probeAgent } from './probe';
import { readCodexQuota } from './quota';
import { AgentSession, type SessionInit } from './session';
import { ImageStore } from './images';
import { MAX_IMAGES_PER_MESSAGE, MAX_MESSAGE_IMAGE_BYTES } from '../shared/images';
import { validateClientMessage } from '../shared/validation';
import { AGENT_CATALOG, type AgentCatalogView } from '../shared/agent-catalog';
import { tildify, type WorkspaceManager } from './workspaces';
import type {
  AgentInfo,
  AgentQuota,
  AgentSettingsView,
  AgentUpdateCheck,
  ClientMsg,
  ProviderTestResult,
  HistoryItem,
  ServerMsg,
  SessionMeta,
  TimelineOp,
  ToolItem,
  WorkspaceInfo,
} from '../shared/types';

/** 一个浏览器连接：属于哪次登录、从哪个 IP 来 */
export interface Client {
  loginId: string;
  ip: string;
}

export type AuditFn = (kind: string, ip?: string, detail?: Record<string, unknown>) => void;

/** 实时更新攒一下再发给浏览器 */
const FLUSH_MS = 30;
/** 对话记录攒一下再写数据库 */
const SAVE_MS = 1000;
/** 检查更新的结果多久内不重复查 */
const UPDATE_TTL = 6 * 60 * 60_000;

export class Hub {
  private sessions = new Map<string, AgentSession>();
  private clients = new Map<WebSocket, Client>();
  private pendingOps = new Map<string, TimelineOp[]>();
  private flushTimer?: NodeJS.Timeout;
  private presets: AgentPreset[];
  private agents: AgentInfo[] = [];
  private pathValue: string;
  private lister = new HistoryLister();
  private dirtyMeta = new Set<string>();
  private dirtyItems = new Map<string, Set<string>>();
  private saveTimer?: NodeJS.Timeout;
  private closing = false;
  private draining = false;
  private probes = new Map<string, Promise<AgentSettingsView>>();
  /** 设置页里的 Agent 登录 */
  private logins: LoginManager;
  private modelConfigs: AgentModelConfigs;
  /** 设置页里的一键安装、更新 Agent */
  private installs: InstallManager;
  /** 检查更新的结果（只查用 npm 装的） */
  private updates = new Map<string, AgentUpdateCheck>();
  private updatesPending: Promise<Record<string, AgentUpdateCheck>> | null = null;
  /** 各 Agent 账号的用量（目前只有 Codex），读过的缓存在这里 */
  private quotas = new Map<string, AgentQuota>();
  private quotaPending = new Map<string, Promise<AgentQuota>>();
  private quotaTimers = new Map<string, NodeJS.Timeout>();
  /** 每个会话上一次的状态：从“启动中”变成“空闲”时顺便读一次用量 */
  private lastStates = new Map<string, string>();

  constructor(
    private root: string,
    /** 工作区：可以在设置页里增删 */
    private wsm: WorkspaceManager,
    private demo: boolean,
    private store: SessionStore,
    /** 审计日志：记录每次审批 */
    private audit: AuditFn,
    /** 设置页里每个 Agent 的设置 */
    private agentSettings: AgentSettingsStore,
    private images: ImageStore,
    dataDir: string,
  ) {
    this.modelConfigs = new AgentModelConfigs(dataDir);
    this.presets = presets(root);
    this.pathValue = searchPath(root);
    this.logins = new LoginManager(root, {
      launchOf: (agentId) => {
        const preset = this.presetOf(agentId);
        return preset ? { launch: this.launchOf(preset), name: preset.name } : null;
      },
      modelSetupOf: (agentId, methodId) => {
        const preset = this.presetOf(agentId);
        const setup = modelSetup(agentId, methodId);
        if (!preset || !setup) return null;
        // 原生登录使用 CLI 的原有配置；不把第三方 Key 注入其他账号的认证流程。
        return resolveLaunch({ ...preset, requires: undefined, launches: [{ command: setup.command, args: setup.args }] },
          this.pathValue, this.agentSettings.get(agentId).env);
      },
      cwd: () => this.wsm.list()[0]?.path ?? os.homedir(),
      send: (ws, msg) => this.sendTo(ws, msg),
      audit: (ws, ok, detail) => this.audit(ok ? 'agent-login' : 'agent-login-failed', this.clients.get(ws)?.ip, detail),
      // 换了账号或刚登录：之前读的用量作废，重新读
      loggedIn: (agentId) => {
        this.quotas.delete(agentId);
        this.scheduleQuota(agentId, false);
      },
    });
    this.installs = new InstallManager(root, {
      planOf: (agentId) => {
        const preset = this.presetOf(agentId);
        return preset ? { name: preset.name, plan: this.planOf(preset) } : null;
      },
      env: () => ({ ...process.env, PATH: this.pathValue }),
      send: (ws, msg) => this.sendTo(ws, msg),
      broadcast: (msg) => this.broadcast(msg),
      ipOf: (ws) => this.clients.get(ws)?.ip,
      audit: (ip, ok, detail) => this.audit(ok ? 'agent-install' : 'agent-install-failed', ip, detail),
      // 做完了：版本变了，重新检测，之前查的新版本作废；装好了就测一次连接，测完告诉页面
      finished: (agentId, ok) => {
        this.updates.delete(agentId);
        this.rescanAndBroadcast();
        if (ok) void this.testAgent(agentId)?.then(() => this.broadcast({ type: 'agent:tested', agentId }));
      },
    });
    this.rescan();
    this.restoreOpenSessions();
  }

  rescan(): void {
    this.pathValue = searchPath(this.root);
    this.agents = describeAgents(this.presets, this.pathValue, this.demo, (id) => this.agentSettings.get(id).enabled);
  }

  /** 重新检测并通知所有页面（设置改了、点了重新扫描） */
  rescanAndBroadcast(): void {
    this.rescan();
    this.broadcast({ type: 'agents', agents: this.agents });
  }

  /** 启动方式，兼容已有的启动配置，并注入模型供应商配置（见 model-provider.ts） */
  private launchOf(preset: AgentPreset): Launch | null {
    const settings = this.agentSettings.get(preset.id);
    let launch = resolveLaunch(preset, this.pathValue, settings.env);
    if (launch && preset.id === 'harn') launch = { ...launch, sessionParams: { environmentPolicy: { kind: 'inherited' } } };
    return launch && settings.provider ? this.modelConfigs.apply(preset.id, settings.provider, launch) : launch;
  }

  private enabled(preset: AgentPreset): boolean {
    return this.agentSettings.get(preset.id).enabled;
  }

  attach(ws: WebSocket, client: Client): void {
    this.clients.set(ws, client);
    this.sendTo(ws, {
      type: 'hello',
      agents: this.agents,
      workspaces: this.wsm.list(),
      sessions: [...this.sessions.values()].map((s) => s.snapshot()),
      home: os.homedir(),
      quotas: Object.fromEntries(this.quotas),
      installs: this.installs.snapshot(),
    });
    ws.on('message', (data) => {
      let msg: ClientMsg;
      try {
        msg = validateClientMessage(JSON.parse(String(data)));
      } catch (error) {
        this.sendTo(ws, { type: 'toast', text: error instanceof Error ? (error.name === 'SyntaxError' ? '消息不是有效的 JSON，请刷新页面后重试' : error.message) : '消息参数不正确' });
        return;
      }
      try { this.handle(ws, msg); }
      catch (error) { this.toast(ws, error instanceof Error ? error.message : '请求处理失败'); }
    });
    const gone = () => {
      this.clients.delete(ws);
      this.logins.dropOwner(ws);
    };
    ws.on('close', gone);
    ws.on('error', gone);
  }

  /** 退出登录：断开这些登录的所有实时连接 */
  dropLogin(...loginIds: string[]): void {
    const ids = new Set(loginIds);
    for (const [ws, client] of this.clients) {
      if (ids.has(client.loginId)) ws.close(4001, 'logged out');
    }
  }

  dropAllLogins(): void {
    for (const ws of this.clients.keys()) ws.terminate();
  }

  // ───────────────────────── 工作区

  sessionSnapshot(id: string) {
    return this.sessions.get(id)?.snapshot();
  }

  searchHistory(workspaceId: string, query: string): HistorySearch {
    const workspace = this.wsm.get(workspaceId);
    if (!workspace) throw new Error('工作区不存在');
    this.saveDirty();
    const needle = query.trim().slice(0, 200);
    const stored = this.store.searchIn(workspace.path, needle, 101);
    const items = stored.slice(0, 100).map((record) => {
      const live = this.sessions.get(record.id);
      const preset = this.historicalPresetOf(record.agentId);
      const timeline = live?.snapshot().timeline ?? this.store.timeline(record.id);
      const text = needle ? timeline.map(timelineText).find((value) => value.toLocaleLowerCase().includes(needle.toLocaleLowerCase())) : undefined;
      const offset = text?.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase()) ?? -1;
      const snippet = text && offset >= 0 ? `${offset > 60 ? '…' : ''}${text.slice(Math.max(0, offset - 60), offset + needle.length + 120).replace(/\s+/g, ' ')}${text.length > offset + needle.length + 120 ? '…' : ''}` : undefined;
      return {
        key: `web:${record.id}`, source: record.source, agentId: record.agentId,
        agentName: preset?.name ?? record.agentId, color: preset?.color ?? record.agentId,
        title: live?.meta.title ?? record.title, updatedAt: live?.meta.updatedAt ?? record.updatedAt,
        sessionId: record.id, open: Boolean(live), ...(snippet ? { snippet } : {}),
      };
    });
    return { items, truncated: stored.length > 100 };
  }

  exportHistory(workspaceId: string, id: string): { name: string; markdown: string } | null {
    const workspace = this.wsm.get(workspaceId);
    if (!workspace) return null;
    this.saveDirty();
    const record = this.store.get(id);
    if (!record || record.cwd !== workspace.path) return null;
    const live = this.sessions.get(id)?.snapshot();
    const title = live?.meta.title ?? record.title;
    return {
      name: `${title.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 80) || '会话'}-${id.slice(0, 8)}.md`,
      markdown: exportSessionMarkdown({
        title, cwd: record.cwd, createdAt: record.createdAt,
        agentName: live?.meta.agentName ?? this.historicalPresetOf(record.agentId)?.name ?? record.agentId,
        timeline: live?.timeline ?? this.store.timeline(id),
      }),
    };
  }

  /** 每个工作区里在运行的 Agent 进程数 */
  liveIn(workspacePath: string): number {
    let n = 0;
    for (const s of this.sessions.values()) if (s.live && s.meta.cwd === workspacePath) n++;
    return n;
  }

  liveCount(): number {
    let n = 0;
    for (const s of this.sessions.values()) if (s.live) n++;
    return n;
  }

  /**
   * 工作区增删之后：通知所有页面；移除的工作区里没在运行的会话从列表里拿下（记录还在，重新加回来会恢复），
   * 新加的工作区里没结束的会话恢复出来
   */
  workspacesChanged(): void {
    const list = this.wsm.list();
    const paths = new Set(list.map((w) => w.path));
    this.saveDirty();
    for (const [id, session] of this.sessions) {
      if (paths.has(session.meta.cwd) || session.live) continue;
      session.dispose();
      this.sessions.delete(id);
      this.pendingOps.delete(id);
      this.broadcast({ type: 'session:remove', id });
    }
    this.broadcast({ type: 'workspaces', workspaces: list });
    for (const session of this.restoreOpenSessions()) this.broadcast({ type: 'session:add', session: session.snapshot() });
  }

  /** 同时运行上限：到了就提示发起的页面，不再启动新的 Agent */
  private underLimit(ws: WebSocket): boolean {
    const limit = this.wsm.limit();
    if (this.liveCount() < limit) return true;
    this.toast(ws, `同时运行的 Agent 已经有 ${limit} 个了。先结束一个不用的会话，或者在 设置 → 工作区 里调高上限。`);
    return false;
  }

  private toast(ws: WebSocket, text: string): void {
    this.sendTo(ws, { type: 'toast', text });
  }

  // ───────────────────────── 设置页：Agent

  agentSettingsViews(): AgentSettingsView[] {
    return this.presets.filter((p) => this.demo || !p.demoOnly).map((p) => this.settingsView(p));
  }

  /** 只返回已核实安装计划和 ACP 接入预设的目录条目。 */
  agentCatalogViews(): AgentCatalogView[] {
    return AGENT_CATALOG.filter((entry) => this.presets.some((p) => p.id === entry.id && !p.demoOnly)).map((entry) => {
      return {
        ...entry,
        integrated: this.presets.some((p) => p.id === entry.id && !p.demoOnly),
        detectedCommand: entry.commands.map((command) => which(command, this.pathValue)).find((found): found is string => found !== null),
      };
    });
  }

  /** 改一个 Agent 的设置。只影响之后新开的会话，开着的会话不变 */
  updateAgentSettings(agentId: string, patch: AgentSettingsPatch): AgentSettingsView | null {
    const preset = this.presetOf(agentId);
    if (!preset) return null;
    if (patch.provider) {
      const driver = modelDriver(agentId);
      if (!driver) throw new Error('这个 Agent 请使用原生模型配置或订阅登录，网页第三方配置尚未接入');
      if (driver.supportsContextWindow === false && patch.provider.contextWindow != null && patch.provider.contextWindow !== '') {
        throw new Error('这个 Agent 使用自身的上下文设置，暂不支持在网页覆盖上下文长度');
      }
      checkProvider(patch.provider, this.agentSettings.get(agentId).provider ?? undefined, driver.apis, agentId);
    }
    this.agentSettings.update(agentId, patch);
    if (patch.provider !== undefined) {
      // 换了模型供应商：账号用量不算数了（用第三方模型时没有额度可看），改回来再重新读
      this.quotas.delete(agentId);
      this.broadcast({ type: 'quota', agentId, quota: null });
      if (!patch.provider) this.scheduleQuota(agentId, false);
    }
    this.rescanAndBroadcast();
    return this.settingsView(preset);
  }

  /** 检查供应商协议；同一凭据范围内可复用保存的 Key，不发送对话内容。 */
  async testProvider(agentId: string, input: Record<string, unknown>): Promise<ProviderTestResult | null> {
    const preset = this.presetOf(agentId);
    const driver = modelDriver(agentId);
    if (!preset || !driver) return null;
    if (driver.supportsContextWindow === false && input.contextWindow != null && input.contextWindow !== '') {
      throw new Error('这个 Agent 使用自身的上下文设置，暂不支持在网页覆盖上下文长度');
    }
    const saved = this.agentSettings.get(agentId).provider;
    const provider = checkProvider(input, saved ?? undefined, driver.apis, agentId);
    return testProvider(provider);
  }

  /** 测试连接：启动进程 → 握手 → 新建会话。同一个 Agent 同时只测一次 */
  testAgent(agentId: string): Promise<AgentSettingsView> | null {
    const preset = this.presetOf(agentId);
    if (!preset) return null;
    let pending = this.probes.get(agentId);
    if (!pending) {
      pending = (async () => {
        const providerRevision = JSON.stringify(this.agentSettings.get(agentId).provider);
        const launch = this.launchOf(preset);
        const probe = launch
          ? await probeAgent(launch, this.wsm.list()[0]?.path ?? os.homedir())
          : {
              at: Date.now(),
              ok: false,
              steps: [{ key: 'spawn' as const, ok: false, ms: 0, error: `没找到 ${preset.launches[0].command} 命令` }],
            };
        if (JSON.stringify(this.agentSettings.get(agentId).provider) === providerRevision) {
          this.agentSettings.setProbe(agentId, probe);
        }
        return this.settingsView(preset);
      })().finally(() => this.probes.delete(agentId));
      this.probes.set(agentId, pending);
    }
    return pending;
  }

  private settingsView(preset: AgentPreset): AgentSettingsView {
    const settings = this.agentSettings.get(preset.id);
    const launch = this.launchOf(preset);
    const plan = this.planOf(preset);
    const files = readAgentFiles(preset.id) ?? undefined;
    const primary = preset.launches[0];
    const missing =
      (preset.requires ?? []).find((bin) => !which(bin, this.pathValue)) ?? preset.launches.map((l) => l.command).join(' 或 ');
    const status: AgentSettingsView['status'] = !launch
      ? files?.exists
        ? 'config-only'
        : 'missing'
      : settings.enabled
        ? 'ok'
        : 'disabled';
    const statusText = {
      ok: '可用',
      disabled: '已停用',
      missing: `没找到 ${missing} 命令`,
      'config-only': `找到了配置文件，但没找到 ${missing} 命令`,
    }[status];
    return {
      id: preset.id,
      name: preset.name,
      color: preset.color,
      status,
      statusText,
      command: launch
        ? [tildify(launch.command), ...launch.args].join(' ')
        : [primary.command, ...primary.args].join(' '),
      install: preset.install,
      configFile: files ? { path: tildify(files.path), exists: files.exists, model: files.model } : undefined,
      enabled: settings.enabled,
      // 用第三方模型时，OpenAI 账号的额度和它无关
      quota: Boolean(preset.quota) && !settings.provider,
      providers: preset.providers,
      modelAccess: modelAccessFor(preset.id),
      provider: settings.provider ? providerForView(settings.provider) : null,
      probe: this.agentSettings.getProbe(preset.id),
      setup: plan?.view,
      update: plan ? this.currentUpdate(preset.id, plan) : undefined,
    };
  }

  // ───────────────────────── 安装、更新 Agent

  private planOf(preset: AgentPreset): SetupPlan | null {
    return setupPlan(preset, this.pathValue, this.root, this.agentSettings.get(preset.id).env);
  }

  /**
   * 检查用 npm 装的 Agent 有没有新版本（问 npm 源，只读）。6 小时内查过的直接用，force 时重新查。
   * 打开设置页的 Agent 时查一次，“检查更新”按钮会 force
   */
  checkUpdates(force = false): Promise<Record<string, AgentUpdateCheck>> {
    if (!this.updatesPending) {
      this.updatesPending = (async () => {
        const env = { ...process.env, PATH: this.pathValue };
        const result: Record<string, AgentUpdateCheck> = {};
        await Promise.all(
          this.presets
            .filter((p) => this.demo || !p.demoOnly)
            .map(async (preset) => {
              const plan = this.planOf(preset);
              if (!plan) return;
              const cached = this.updates.get(preset.id);
              if (force || !cached || cached.error || Date.now() - cached.at >= UPDATE_TTL) {
                const fresh = await checkUpdate(plan, env);
                if (fresh) this.updates.set(preset.id, fresh);
                else this.updates.delete(preset.id);
              }
              const current = this.currentUpdate(preset.id, plan);
              if (current) result[preset.id] = current;
            }),
        );
        return result;
      })().finally(() => (this.updatesPending = null));
    }
    return this.updatesPending;
  }

  /** 查到的新版本对照现在装的版本：在服务器上自己更新过的，就不再算有新版本 */
  private currentUpdate(agentId: string, plan: SetupPlan): AgentUpdateCheck | undefined {
    const check = this.updates.get(agentId);
    if (!check) return undefined;
    const outdated = check.outdated.flatMap((o) => {
      const installed = plan.packages?.find((p) => p.name === o.name)?.version;
      return installed && newer(o.to, installed) ? [{ ...o, from: installed }] : [];
    });
    return { ...check, outdated };
  }

  // ───────────────────────── 账号用量

  /**
   * 读一个 Agent 账号的用量（目前只有 Codex）。一分钟内读过就用缓存；force（一轮结束、点“刷新”）时也至少隔 30 秒，
   * 免得频繁启动 codex。读到的结果推给所有页面
   */
  quotaOf(agentId: string, force = false): Promise<AgentQuota | null> {
    const preset = this.presetOf(agentId);
    if (!preset?.quota || this.agentSettings.get(agentId).provider) return Promise.resolve(null);
    const cached = this.quotas.get(agentId);
    if (cached && Date.now() - cached.at < (force ? 30_000 : 60_000)) return Promise.resolve(cached);
    let pending = this.quotaPending.get(agentId);
    if (!pending) {
      const launch = this.launchOf(preset);
      const cwd = this.wsm.list()[0]?.path ?? os.homedir();
      pending = (launch ? readCodexQuota(launch, cwd) : Promise.resolve<AgentQuota>({ at: Date.now(), kind: 'unknown', windows: [], error: '没找到命令' }))
        .then((quota) => {
          this.quotas.set(agentId, quota);
          this.broadcast({ type: 'quota', agentId, quota });
          return quota;
        })
        .finally(() => this.quotaPending.delete(agentId));
      this.quotaPending.set(agentId, pending);
    }
    return pending;
  }

  private scheduleQuota(agentId: string, force: boolean): void {
    if (!this.presetOf(agentId)?.quota || this.quotaTimers.has(agentId) || this.closing) return;
    this.quotaTimers.set(
      agentId,
      setTimeout(() => {
        this.quotaTimers.delete(agentId);
        void this.quotaOf(agentId, force);
      }, 3_000),
    );
  }

  protocolLog(sessionId: string): unknown[] | null {
    return this.sessions.get(sessionId)?.protocolLog ?? null;
  }

  sessionList(): { id: string; agent: string; state: string; title: string }[] {
    return [...this.sessions.values()].map((s) => ({
      id: s.meta.id,
      agent: s.meta.agentName,
      state: s.meta.state,
      title: s.meta.title,
    }));
  }

  /** Runner updates wait for prompts, approvals, logins and installations to finish. */
  isBusy(): boolean {
    return [...this.sessions.values()].some((s) => ['starting', 'running', 'waiting'].includes(s.meta.state) || s.meta.queued > 0)
      || this.logins.isBusy() || Object.values(this.installs.snapshot()).some((run) => run.state.phase === 'running') || this.probes.size > 0;
  }

  beginUpdate(): boolean {
    if (this.isBusy()) return false;
    this.draining = true;
    return true;
  }

  /** 服务要停了：结束所有 Agent 进程，把没写完的记录写进数据库。会话仍算“没结束”，下次启动时恢复 */
  disposeAll(): void {
    this.logins.disposeAll();
    this.installs.disposeAll();
    for (const timer of this.quotaTimers.values()) clearTimeout(timer);
    this.quotaTimers.clear();
    for (const session of this.sessions.values()) session.dispose();
    this.saveDirty();
    this.closing = true;
    this.sessions.clear();
  }

  private handle(ws: WebSocket, msg: ClientMsg): void {
    if (this.draining && ['session:create', 'session:prompt', 'session:restart', 'history:open', 'install:start', 'login:start'].includes(msg.type)) {
      this.toast(ws, '后台正在更新，请稍后重新发送；这条请求尚未执行。');
      return;
    }
    switch (msg.type) {
      case 'agents:rescan':
        this.rescanAndBroadcast();
        return;
      case 'session:create':
        this.createSession(ws, msg.workspaceId, msg.agentId, typeof msg.requestId === 'string' ? msg.requestId : undefined);
        return;
      case 'history:list':
        void this.sendHistory(ws, msg.workspaceId);
        return;
      case 'history:open':
        this.openHistory(ws, msg.workspaceId, String(msg.key ?? ''), typeof msg.requestId === 'string' ? msg.requestId : undefined);
        return;
      case 'login:start':
        void this.logins.start(ws, String(msg.agentId), String(msg.methodId), {
          apiKey: typeof msg.apiKey === 'string' ? msg.apiKey : undefined,
          cols: msg.cols,
          rows: msg.rows,
        });
        return;
      case 'login:input':
        if (typeof msg.data === 'string') this.logins.input(ws, String(msg.agentId), msg.data.slice(0, 65536));
        return;
      case 'login:resize':
        this.logins.resize(ws, String(msg.agentId), msg.cols, msg.rows);
        return;
      case 'login:cancel':
        this.logins.cancel(ws, String(msg.agentId));
        return;
      case 'quota:refresh':
        void this.quotaOf(String(msg.agentId), true);
        return;
      case 'install:start':
        this.installs.start(ws, String(msg.agentId), msg.action === 'update' ? 'update' : 'install', { cols: msg.cols, rows: msg.rows });
        return;
      case 'install:attach':
        this.installs.attach(ws, String(msg.agentId));
        return;
      case 'install:input':
        if (typeof msg.data === 'string') this.installs.input(String(msg.agentId), msg.data.slice(0, 65536));
        return;
      case 'install:resize':
        this.installs.resize(String(msg.agentId), msg.cols, msg.rows);
        return;
      case 'install:cancel':
        this.installs.cancel(String(msg.agentId));
        return;
    }
    const session = this.sessions.get(msg.id);
    if (!session) return;
    switch (msg.type) {
      case 'session:prompt':
        // 未运行的会话发消息会自动启动 Agent，也要看上限
        if (session.meta.state === 'stopped' && !this.underLimit(ws)) break;
        try {
          const ids = msg.images ?? [];
          if (!Array.isArray(ids) || ids.length > MAX_IMAGES_PER_MESSAGE || ids.some((id) => typeof id !== 'string')) throw new Error('每条消息最多添加 4 张图片');
          const selected = ids.map((id) => this.images.read(session.meta.id, id));
          if (selected.reduce((sum, image) => sum + image.data.length, 0) > MAX_MESSAGE_IMAGE_BYTES) throw new Error('每条消息的图片总大小不能超过 20 MB');
          session.prompt(msg.text, selected.map((item) => item.image), msg.requestId);
        } catch (error) {
          this.toast(ws, error instanceof Error ? error.message : '图片发送失败');
        }
        break;
      case 'session:cancel':
        session.cancel();
        break;
      case 'session:restart':
        if (!session.live && !this.underLimit(ws)) break;
        session.restart();
        break;
      case 'session:close':
        this.endSession(session);
        break;
      case 'session:select':
        void session.setSelect(msg.selectId, msg.value);
        break;
      case 'session:rename':
        session.rename(String(msg.title ?? ''));
        break;
      case 'approval': {
        const item = session.timeline.find(
          (i): i is ToolItem => i.kind === 'tool' && i.approval?.requestId === msg.requestId && i.approval.state === 'pending',
        );
        const option = item?.approval?.state === 'pending' ? session.respondApproval(msg.requestId, String(msg.optionId)) : undefined;
        if (item && option) {
          // decision 记的是 Agent 那个选项的类别（allow_once、allow_always、reject_once……），choice 是它的原话
          this.audit('approval', this.clients.get(ws)?.ip, {
            agent: session.meta.agentName,
            session: session.meta.title,
            action: item.command ?? item.title,
            decision: option.kind,
            choice: option.name,
          });
        }
        break;
      }
    }
  }

  // ───────────────────────── 会话

  private presetOf(agentId: string): AgentPreset | undefined {
    return this.presets.find((p) => p.id === agentId && (this.demo || !p.demoOnly));
  }

  private historicalPresetOf(agentId: string): AgentPreset | undefined {
    return this.presetOf(agentId) ?? historicalPreset(agentId);
  }

  private addSession(id: string, workspace: WorkspaceInfo, preset: AgentPreset, init: SessionInit): AgentSession {
    init.imageStore = this.images;
    // 用第三方模型供应商时，模型只列它那一个：Agent 自己列的其他模型，那家供应商不认
    let activeModel: string | undefined;
    init.modelFilter = () => activeModel ? [activeModel] : null;
    const session = new AgentSession(
      id,
      workspace.id,
      workspace.path,
      preset,
      () => {
        const launch = this.launchOf(preset);
        activeModel = launch?.modelId;
        return launch;
      },
      {
        meta: (meta) => this.onMeta(meta),
        ops: (sessionId, ops) => this.queueOps(sessionId, ops),
        checkpoint: () => this.saveDirty(true),
      },
      init,
    );
    this.sessions.set(id, session);
    if (init.stored && session.timeline.some((item) => item.kind === 'user' && item.execution === 'unknown')) {
      this.dirtyMeta.add(id);
      this.dirtyItems.set(id, new Set(session.timeline.map((item) => item.id)));
      this.scheduleSave();
    }
    return session;
  }

  private createSession(ws: WebSocket, workspaceId: string, agentId: string, requestId?: string): void {
    const workspace = this.wsm.get(workspaceId);
    const preset = this.presetOf(agentId);
    if (!workspace || !preset) return;
    if (!this.launchOf(preset)) {
      this.toast(ws, `这台机器上没找到 ${preset.name}`);
      return;
    }
    if (!this.enabled(preset)) {
      this.toast(ws, `${preset.name} 在设置里停用了`);
      return;
    }
    if (!this.underLimit(ws)) return;
    const session = this.addSession(newSessionId(), workspace, preset, {
      source: 'web',
    });
    this.broadcast({ type: 'session:add', session: session.snapshot(), requestId });
    void session.start('new');
  }

  /** 结束会话：停掉 Agent，从左侧列表去掉，记录留在历史会话里 */
  private endSession(session: AgentSession): void {
    const id = session.meta.id;
    this.lastStates.delete(id);
    session.dispose();
    session.open = false;
    this.dirtyMeta.add(id);
    this.saveDirty();
    this.sessions.delete(id);
    this.pendingOps.delete(id);
    this.broadcast({ type: 'session:remove', id });
  }

  /** 没结束的会话从记录里恢复（服务启动时、加回工作区时），Agent 先不启动。返回新恢复的 */
  private restoreOpenSessions(): AgentSession[] {
    const workspaces = this.wsm.list();
    const restored: AgentSession[] = [];
    for (const stored of this.store.openSessions()) {
      if (this.sessions.has(stored.id)) continue;
      const workspace = workspaces.find((w) => w.path === stored.cwd);
      const preset = this.historicalPresetOf(stored.agentId);
      if (!workspace || !preset) continue;
      restored.push(
        this.addSession(stored.id, workspace, preset, {
          source: stored.source,
          stored,
          timeline: this.store.timeline(stored.id),
        }),
      );
    }
    return restored;
  }

  // ───────────────────────── 历史会话

  private async sendHistory(ws: WebSocket, workspaceId: string): Promise<void> {
    const workspace = this.wsm.get(workspaceId);
    if (!workspace) return;
    this.saveDirty();
    const listable = this.presets.filter((p) => p.listHistory && (this.demo || !p.demoOnly) && this.enabled(p) && this.launchOf(p));
    // 先把网页里的记录发过去，命令行里的会话要启动 Agent 去问，稍后再补上
    this.sendTo(ws, { type: 'history', workspaceId, items: this.localHistory(workspace), loading: listable.length > 0 });
    if (!listable.length) return;

    const results = await Promise.all(
      listable.map(async (preset) => {
        try {
          return { preset, list: await this.lister.list(preset.id, this.launchOf(preset)!, workspace.path) };
        } catch (error) {
          console.warn(`读取 ${preset.name} 的命令行会话失败：`, error instanceof Error ? error.message : error);
          return { preset, list: [] };
        }
      }),
    );
    this.saveDirty();
    const local = this.localHistory(workspace);
    // 网页里打开过的（包括从命令行打开的）已经有记录，不重复列
    const known = new Set<string>();
    for (const s of this.store.sessionsIn(workspace.path)) if (s.acpSessionId) known.add(`${s.agentId}:${s.acpSessionId}`);
    for (const s of this.sessions.values()) if (s.agentSessionId) known.add(`${s.meta.agentId}:${s.agentSessionId}`);
    const cli: HistoryItem[] = [];
    for (const { preset, list } of results) {
      for (const info of list) {
        if (known.has(`${preset.id}:${info.sessionId}`)) continue;
        cli.push({
          key: `cli:${preset.id}:${info.sessionId}`,
          source: 'cli',
          agentId: preset.id,
          agentName: preset.name,
          color: preset.color,
          title: info.title ?? '（没有标题）',
          updatedAt: info.updatedAt ?? 0,
          open: false,
        });
      }
    }
    const items = [...local, ...cli].sort((a, b) => b.updatedAt - a.updatedAt);
    this.sendTo(ws, { type: 'history', workspaceId, items, loading: false });
  }

  private localHistory(workspace: WorkspaceInfo): HistoryItem[] {
    const out: HistoryItem[] = [];
    for (const stored of this.store.sessionsIn(workspace.path)) {
      const preset = this.historicalPresetOf(stored.agentId);
      if (!preset) continue;
      const live = this.sessions.get(stored.id);
      out.push({
        key: `web:${stored.id}`,
        source: stored.source,
        agentId: stored.agentId,
        agentName: preset.name,
        color: preset.color,
        title: live?.meta.title ?? stored.title,
        updatedAt: live?.meta.updatedAt ?? stored.updatedAt,
        sessionId: stored.id,
        open: Boolean(live),
      });
    }
    return out;
  }

  /** 打开历史会话：网页里的记录直接恢复出来；命令行里的让 Agent 把历史回放出来 */
  private openHistory(ws: WebSocket, workspaceId: string, key: string, requestId?: string): void {
    const workspace = this.wsm.get(workspaceId);
    if (!workspace) return;

    if (key.startsWith('web:')) {
      const id = key.slice(4);
      const live = this.sessions.get(id);
      if (live) {
        this.broadcast({ type: 'session:add', session: live.snapshot(), requestId });
        return;
      }
      const stored = this.store.get(id);
      const preset = stored ? this.historicalPresetOf(stored.agentId) : undefined;
      if (!stored || !preset || stored.cwd !== workspace.path) {
        this.toast(ws, '这个会话的记录找不到了');
        return;
      }
      const session = this.addSession(stored.id, workspace, preset, {
        source: stored.source,
        stored,
        timeline: this.store.timeline(stored.id),
      });
      session.open = true;
      this.store.setOpen(stored.id, true);
      this.broadcast({ type: 'session:add', session: session.snapshot(), requestId });
      return;
    }

    if (key.startsWith('cli:')) {
      const rest = key.slice(4);
      const sep = rest.indexOf(':');
      const agentId = rest.slice(0, sep);
      const agentSessionId = rest.slice(sep + 1);
      const preset = this.presetOf(agentId);
      if (sep < 0 || !preset || !agentSessionId) return;
      // 这个命令行会话之前在网页里打开过：用那份记录
      const known = this.store.findByAcp(agentId, agentSessionId, workspace.path);
      if (known) {
        this.openHistory(ws, workspaceId, `web:${known.id}`, requestId);
        return;
      }
      const live = [...this.sessions.values()].find(
        (s) => s.meta.agentId === agentId && s.agentSessionId === agentSessionId && s.meta.cwd === workspace.path,
      );
      if (live) {
        this.broadcast({ type: 'session:add', session: live.snapshot(), requestId });
        return;
      }
      if (!this.launchOf(preset)) {
        this.toast(ws, `这台机器上没找到 ${preset.name}`);
        return;
      }
      // 回放历史要启动 Agent，也要看同时运行上限
      if (!this.underLimit(ws)) return;
      const session = this.addSession(newSessionId(), workspace, preset, {
        source: 'cli',
        resumeId: agentSessionId,
        title: this.lister.find(agentId, workspace.path, agentSessionId)?.title,
      });
      this.broadcast({ type: 'session:add', session: session.snapshot(), requestId });
      void session.start('load');
    }
  }

  // ───────────────────────── 推送给浏览器、写数据库

  private onMeta(meta: SessionMeta): void {
    if (!this.sessions.has(meta.id)) return;
    // Agent 刚启动好：读一次账号用量
    if (this.lastStates.get(meta.id) === 'starting' && meta.state === 'idle') this.scheduleQuota(meta.agentId, false);
    this.lastStates.set(meta.id, meta.state);
    this.dirtyMeta.add(meta.id);
    this.scheduleSave();
    // 先把这个会话积攒的时间线更新发出去，保证浏览器先看到内容再看到状态变化
    this.flushSession(meta.id);
    this.broadcast({ type: 'session:meta', meta });
  }

  private queueOps(sessionId: string, ops: TimelineOp[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    // 一轮结束了，用量变了：过一会儿重新读
    if (ops.some((op) => op.op === 'add' && op.item.kind === 'turn')) this.scheduleQuota(session.meta.agentId, true);
    let dirty = this.dirtyItems.get(sessionId);
    if (!dirty) this.dirtyItems.set(sessionId, (dirty = new Set()));
    for (const op of ops) dirty.add(op.op === 'add' ? op.item.id : op.id);
    this.dirtyMeta.add(sessionId);
    this.scheduleSave();

    const list = this.pendingOps.get(sessionId);
    if (list) list.push(...ops);
    else this.pendingOps.set(sessionId, [...ops]);
    if (!this.flushTimer) this.flushTimer = setTimeout(() => this.flushAll(), FLUSH_MS);
  }

  private scheduleSave(): void {
    if (!this.saveTimer && !this.closing) this.saveTimer = setTimeout(() => this.saveDirty(), SAVE_MS);
  }

  private saveDirty(strict = false): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    if (this.closing || (!this.dirtyMeta.size && !this.dirtyItems.size)) return;
    const metas = [...this.dirtyMeta];
    const items = [...this.dirtyItems];
    try {
      this.store.transaction(() => {
        for (const id of metas) {
          const session = this.sessions.get(id);
          if (session) this.store.saveSession(session.record());
        }
        for (const [id, itemIds] of items) {
          const session = this.sessions.get(id);
          if (session) this.store.saveItems(id, session.itemsById(itemIds));
        }
      });
      this.dirtyMeta.clear();
      this.dirtyItems.clear();
    } catch (error) {
      console.error('保存会话记录失败：', error);
      this.scheduleSave();
      if (strict) throw new Error('会话记录暂时无法保存，请检查服务器磁盘后重试');
    }
  }

  private flushAll(): void {
    this.flushTimer = undefined;
    for (const id of [...this.pendingOps.keys()]) this.flushSession(id);
  }

  private flushSession(sessionId: string): void {
    const ops = this.pendingOps.get(sessionId);
    if (!ops?.length) return;
    this.pendingOps.delete(sessionId);
    this.broadcast({ type: 'session:ops', id: sessionId, ops: mergeAppends(ops) });
  }

  private broadcast(msg: ServerMsg): void {
    const data = JSON.stringify(msg);
    for (const ws of this.clients.keys()) {
      if (ws.readyState === ws.OPEN) ws.send(data);
    }
  }

  private sendTo(ws: WebSocket, msg: ServerMsg): void {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  }
}

function newSessionId(): string {
  return `s${Date.now().toString(36)}${randomBytes(3).toString('hex')}`;
}

/** 把连续追加到同一段文字的更新合并成一条，减少浏览器重绘 */
function mergeAppends(ops: TimelineOp[]): TimelineOp[] {
  const out: TimelineOp[] = [];
  for (const op of ops) {
    const last = out[out.length - 1];
    if (op.op === 'append' && last?.op === 'append' && last.id === op.id) {
      out[out.length - 1] = { op: 'append', id: op.id, text: last.text + op.text };
    } else {
      out.push(op);
    }
  }
  return out;
}
