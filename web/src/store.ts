import { readPreference, writePreference, isPreferenceKey } from './preferences';
import { tx } from './i18n';
// 浏览器端状态：服务端推来的会话、时间线，以及每个工作区的窗口布局。
import { useSyncExternalStore } from 'react';
import { emitLiveMessage, isWatchingInstall } from './live';
import { completionOf } from './session-attention';
import type {
  AgentQuota,
  InstallRunView,
  AgentInfo,
  HistoryItem,
  ServerMsg,
  SessionMeta,
  SessionSnapshot,
  TimelineItem,
  TimelineOp,
  WorkspaceInfo,
} from '../../shared/types';

export type ThemePref = 'light' | 'dark' | 'system';
export type SettingsTab = 'agent' | 'workspace' | 'language' | 'security' | 'about';

/** 一个工作区里打开的窗口 */
export interface Layout {
  /** 按显示顺序排列的会话 */
  panes: string[];
  /** 当前窗口：⌘↵ 批准的就是它 */
  focus: string | null;
  /** 临时放大的窗口 */
  maxed: string | null;
  /** 你关掉的窗口：会话还在后台跑，进入工作区时不再自动摆出来；在左侧点一下又会打开 */
  closed: string[];
}

/** 登录状态，来自服务端的 /api/auth/state */
export interface AuthState {
  /** 已经问过服务端 */
  checked: boolean;
  /** 还没设置密码 */
  needsSetup: boolean;
  loggedIn: boolean;
  /** 这个 IP 输错太多次被锁到什么时候（毫秒时间戳），0 表示没锁 */
  lockedUntil: number;
}

export interface AppState {
  auth: AuthState;
  connected: boolean;
  ready: boolean;
  home: string;
  agents: AgentInfo[];
  /** 各 Agent 账号的用量（目前只有 Codex） */
  quotas: Record<string, AgentQuota>;
  /** 各 Agent 最近一次安装、更新（在后台做，所有页面都知道） */
  installs: Record<string, InstallRunView>;
  workspaces: WorkspaceInfo[];
  sessions: Record<string, SessionSnapshot>;
  /** 每个会话已经看过的完成轮次；使用 turn.id，改标题或配置不会让完成灯重新亮起。 */
  seenCompletions: Record<string, string>;
  currentWorkspace: string | null;
  layouts: Record<string, Layout>;
  /** 左侧“启动 Agent”菜单是否打开 */
  agentMenu: boolean;
  /** 右侧抽屉 */
  drawer: 'history' | 'files' | 'changes' | null;
  /** 右侧显示 Agent 窗口，还是设置页 */
  view: 'panes' | 'settings';
  settingsTab: SettingsTab;
  /** 打开设置页时要展开的 Agent（比如从“启动 Agent”菜单点“去安装”） */
  settingsFocus: string | null;
  /** 弹窗：打开文件夹 */
  dialog: 'folder' | null;
  /** 每个工作区的历史会话；loading 表示还在读命令行里的会话 */
  history: Record<string, { items: HistoryItem[]; loading: boolean }>;
  theme: ThemePref;
  toast: string | null;
}

const EMPTY_LAYOUT: Layout = { panes: [], focus: null, maxed: null, closed: [] };
/** Agent 进程在运行的会话：进入工作区时自动摆出来 */
const LIVE_STATES = new Set(['starting', 'idle', 'running', 'waiting']);
/** 窗口布局存在这个浏览器里，刷新页面后恢复 */

const saved = readSaved();

let state: AppState = {
  auth: { checked: false, needsSetup: false, loggedIn: false, lockedUntil: 0 },
  connected: false,
  ready: false,
  home: '',
  quotas: {},
  installs: {},
  agents: [],
  workspaces: [],
  sessions: {},
  seenCompletions: readSeenCompletions(),
  currentWorkspace: saved.workspace,
  layouts: saved.layouts,
  agentMenu: false,
  drawer: null,
  history: {},
  view: 'panes',
  settingsTab: 'agent',
  settingsFocus: null,
  dialog: null,
  theme: readTheme(),
  toast: null,
};

const listeners = new Set<() => void>();

export function getState(): AppState {
  return state;
}

export function setState(update: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
  const partial = typeof update === 'function' ? update(state) : update;
  state = { ...state, ...partial };
  for (const listener of listeners) listener();
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(state),
  );
}

export function sessionsIn(sessions: Record<string, SessionSnapshot>, workspaceId: string): SessionMeta[] {
  const rank: Record<string, number> = { waiting: 0, running: 1, starting: 2, error: 3, exited: 3, idle: 4, stopped: 5 };
  return Object.values(sessions)
    .map((x) => x.meta)
    .filter((m) => m.workspaceId === workspaceId)
    .sort((a, b) => (rank[a.state] ?? 9) - (rank[b.state] ?? 9) || b.updatedAt - a.updatedAt);
}

// ───────────────────────── 窗口布局

export function layoutOf(s: AppState, workspaceId: string | null): Layout {
  return (workspaceId && s.layouts[workspaceId]) || EMPTY_LAYOUT;
}

/** 当前工作区里的当前窗口 */
export function currentSession(s: AppState): SessionSnapshot | null {
  const id = layoutOf(s, s.currentWorkspace).focus;
  return id ? (s.sessions[id] ?? null) : null;
}

/** 仅确认调用方实际看过的那一轮；延迟回调不能把刚完成的新一轮误标为已读。 */
export function markSessionRead(id: string, expectedTurnId: string): void {
  if (!expectedTurnId || completionOf(state.sessions[id]) !== expectedTurnId || state.seenCompletions[id] === expectedTurnId) return;
  const seenCompletions = mergeSeenCompletions(mergeSeenCompletions(state.seenCompletions, readSeenCompletions()), { [id]: expectedTurnId });
  setState({ seenCompletions });
  saveSeenCompletions(seenCompletions);
}

/**
 * 整理一个工作区的窗口：去掉已经不存在的会话；在运行的 Agent 都摆出来平铺（你关掉的除外，先开的在左边）；
 * 一个窗口都没有时放进最该看的那个会话
 */
function normalize(layout: Layout, workspaceId: string, sessions: Record<string, SessionSnapshot>, fallbackIndex = 0): Layout {
  const here = (id: string) => sessions[id]?.meta.workspaceId === workspaceId;
  const closed = (layout.closed ?? []).filter(here);
  let panes = layout.panes.filter((id, i, all) => here(id) && all.indexOf(id) === i);
  const live = Object.values(sessions)
    .map((x) => x.meta)
    .filter((m) => m.workspaceId === workspaceId && LIVE_STATES.has(m.state) && !panes.includes(m.id) && !closed.includes(m.id))
    .sort((a, b) => a.createdAt - b.createdAt);
  panes = [...panes, ...live.map((m) => m.id)];
  if (!panes.length) {
    const top = sessionsIn(sessions, workspaceId).find((m) => !closed.includes(m.id));
    if (top) panes = [top.id];
  }
  const focus =
    layout.focus && panes.includes(layout.focus) ? layout.focus : (panes[Math.min(fallbackIndex, panes.length - 1)] ?? null);
  const maxed = layout.maxed && panes.includes(layout.maxed) && panes.length > 1 ? layout.maxed : null;
  return { panes, focus, maxed, closed };
}

function putLayout(s: AppState, workspaceId: string, layout: Layout): Partial<AppState> {
  return { layouts: { ...s.layouts, [workspaceId]: layout } };
}

function workspaceOf(id: string): string | null {
  return state.sessions[id]?.meta.workspaceId ?? null;
}

export function selectWorkspace(id: string): void {
  setState((s) => ({ currentWorkspace: id, view: 'panes', ...putLayout(s, id, normalize(layoutOf(s, id), id, s.sessions)) }));
  const focus = layoutOf(state, id).focus;
  if (focus) focusComposer(focus);
}

/**
 * 把会话放进窗口：已经在窗口里就切过去。split 为真、或者当前窗口里的 Agent 正在运行时新开一个窗口
 * （在运行的都要看得见），否则换掉当前窗口里的会话
 */
function place(layout: Layout, id: string, split: boolean, sessions: Record<string, SessionSnapshot>): Layout {
  let panes = layout.panes;
  if (!panes.includes(id)) {
    const focusLive = layout.focus !== null && LIVE_STATES.has(sessions[layout.focus]?.meta.state ?? '');
    panes =
      split || focusLive || !layout.focus || !panes.includes(layout.focus)
        ? [...panes, id]
        : panes.map((p) => (p === layout.focus ? id : p));
  }
  return { panes, focus: id, maxed: layout.maxed === id ? id : null, closed: (layout.closed ?? []).filter((c) => c !== id) };
}

export function openSessionById(id: string, split = false): void {
  const ws = workspaceOf(id);
  if (!ws) return;
  setState((s) => ({ currentWorkspace: ws, view: 'panes', ...putLayout(s, ws, place(layoutOf(s, ws), id, split, s.sessions)) }));
  focusComposer(id);
}

/** 再开一个窗口，放进一个还没显示的会话。没有可放的会话时返回 false */
export function addPane(): boolean {
  const ws = state.currentWorkspace;
  if (!ws) return false;
  const shown = layoutOf(state, ws).panes;
  const next = sessionsIn(state.sessions, ws).find((m) => !shown.includes(m.id));
  if (!next) return false;
  openSessionById(next.id, true);
  return true;
}

/** 关掉窗口：会话还在后台运行，左侧列表里点一下就能再打开 */
export function closePane(id: string): void {
  const ws = workspaceOf(id);
  if (!ws) return;
  setState((s) => {
    const layout = layoutOf(s, ws);
    const index = layout.panes.indexOf(id);
    const next = { ...layout, panes: layout.panes.filter((p) => p !== id), closed: [...(layout.closed ?? []).filter((c) => c !== id), id] };
    return putLayout(s, ws, normalize(next, ws, s.sessions, Math.max(0, index - 1)));
  });
}

export function focusPane(id: string): void {
  const ws = workspaceOf(id);
  if (!ws || layoutOf(state, ws).focus === id) return;
  setState((s) => putLayout(s, ws, { ...layoutOf(s, ws), focus: id }));
}

/** 放大或还原（只有一个窗口时不用放大） */
export function toggleMax(id: string): void {
  const ws = workspaceOf(id);
  if (!ws) return;
  setState((s) => {
    const layout = layoutOf(s, ws);
    if (layout.panes.length < 2 && !layout.maxed) return {};
    return putLayout(s, ws, { ...layout, focus: id, maxed: layout.maxed === id ? null : id });
  });
}

export function setAgentMenu(open: boolean): void {
  if (state.agentMenu !== open) setState({ agentMenu: open });
}

export function setDrawer(drawer: AppState['drawer']): void {
  if (state.drawer !== drawer) setState({ drawer });
}

/** 打开设置页（占右侧窗口区，左侧栏不动） */
export function openSettings(tab?: SettingsTab, focus: string | null = null): void {
  setState({ view: 'settings', drawer: null, agentMenu: false, settingsFocus: focus, ...(tab ? { settingsTab: tab } : {}) });
}

/** 回到 Agent 窗口 */
export function closeSettings(): void {
  if (state.view !== 'panes') setState({ view: 'panes' });
}

// ───────────────────────── 启动 Agent、打开历史会话：记住是这个页面发起的，建好后放进窗口

/** 请求编号 → 是否新开窗口（否则换掉当前窗口里的会话） */
const pendingCreates = new Map<string, boolean>();

export function expectSession(split: boolean): string {
  const id = Math.random().toString(36).slice(2, 10);
  pendingCreates.set(id, split);
  return id;
}

// ───────────────────────── 输入框焦点：新开或切换窗口后把光标放进输入框

let pendingFocus: string | null = null;
const focusListeners = new Set<(id: string) => void>();

export function focusComposer(id: string): void {
  pendingFocus = id;
  for (const listener of focusListeners) listener(id);
}

/** 输入框挂载时调用：刚才有人要求把光标放到这里就返回 true */
export function takeComposerFocus(id: string): boolean {
  if (pendingFocus !== id) return false;
  pendingFocus = null;
  return true;
}

export function onComposerFocus(listener: (id: string) => void): () => void {
  focusListeners.add(listener);
  return () => focusListeners.delete(listener);
}

// ───────────────────────── 提示和配色

export function showToast(text: string): void {
  setState({ toast: text });
  window.setTimeout(() => {
    if (state.toast === text) setState({ toast: null });
  }, 2600);
}

export function setTheme(theme: ThemePref): void {
  try {
    writePreference('theme', theme);
  } catch {
    // 无痕模式等情况下存不了，不影响使用
  }
  setState({ theme });
}

function readTheme(): ThemePref {
  try {
    const value = readPreference('theme');
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // 忽略
  }
  // 默认深色（Coffee 配色）
  return 'dark';
}

// ───────────────────────── 刷新页面后恢复窗口

function parseSeenCompletions(value: string | null): Record<string, string> | null {
  if (value === null) return {};
  try {
    const raw: unknown = JSON.parse(value);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    return Object.fromEntries(Object.entries(raw).filter(([id, turnId]) => id && typeof turnId === 'string' && turnId));
  } catch {
    return null;
  }
}

function readSeenCompletions(): Record<string, string> {
  try {
    return parseSeenCompletions(readPreference('seen-completions')) ?? {};
  } catch {
    return {};
  }
}

/** 标签页收到旧的 storage 事件时，已读只能向更新的轮次推进，不能退回。 */
function mergeSeenCompletions(current: Record<string, string>, incoming: Record<string, string>): Record<string, string> {
  const merged = { ...current };
  for (const [id, next] of Object.entries(incoming)) {
    const previous = merged[id];
    if (typeof previous !== 'string' || previous === next) {
      merged[id] = next;
      continue;
    }
    const timeline = state.sessions[id]?.timeline ?? [];
    const beforeIndex = timeline.findIndex((item) => item.kind === 'turn' && item.id === previous);
    const nextIndex = timeline.findIndex((item) => item.kind === 'turn' && item.id === next);
    if (beforeIndex >= 0 && nextIndex >= 0) {
      const difference = timeline[nextIndex].at - timeline[beforeIndex].at;
      if (difference > 0 || (difference === 0 && nextIndex > beforeIndex)) merged[id] = next;
      continue;
    }
    // 另一页可能先收到新的时间线。服务端的 item.id 是会话 ID 加单调递增序号，重启后也会续号。
    const sequence = (turnId: string): number | null => {
      if (!turnId.startsWith(`${id}-`)) return null;
      const suffix = turnId.slice(id.length + 1);
      if (!/^\d+$/.test(suffix)) return null;
      const number = Number(suffix);
      return Number.isSafeInteger(number) ? number : null;
    };
    const beforeSequence = sequence(previous);
    const nextSequence = sequence(next);
    if (beforeSequence !== null && nextSequence !== null) {
      if (nextSequence > beforeSequence) merged[id] = next;
    } else if (nextIndex >= 0 || (beforeIndex < 0 && next > previous)) {
      // 没有时间线且不是服务端 ID 的旧记录稳定取同一个值，避免标签页互相覆盖、反复写入。
      merged[id] = next;
    }
  }
  return merged;
}

function sameSeenCompletions(left: Record<string, string>, right: Record<string, string>): boolean {
  return Object.keys(left).length === Object.keys(right).length && Object.entries(left).every(([id, turnId]) => right[id] === turnId);
}

function saveSeenCompletions(seenCompletions: Record<string, string>): void {
  try {
    if (!sameSeenCompletions(seenCompletions, readSeenCompletions())) {
      writePreference('seen-completions', JSON.stringify(seenCompletions));
    }
  } catch {
    // 存储被禁用或已满时，当前页面仍然可以正常确认已读。
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (!isPreferenceKey('seen-completions', event.key) && event.key !== null) return;
    const incoming = parseSeenCompletions(event.newValue);
    if (!incoming) return;
    const saved = readSeenCompletions();
    // 主动清空浏览器存储时允许重置；延迟到达的清空事件不能覆盖之后写入的记录。
    if (event.newValue === null && Object.keys(saved).length === 0) {
      setState({ seenCompletions: {} });
      return;
    }
    const seenCompletions = mergeSeenCompletions(mergeSeenCompletions(state.seenCompletions, incoming), saved);
    if (!sameSeenCompletions(state.seenCompletions, seenCompletions)) setState({ seenCompletions });
    saveSeenCompletions(seenCompletions);
  });
}

function readSaved(): { workspace: string | null; layouts: Record<string, Layout> } {
  const layouts: Record<string, Layout> = {};
  try {
    const raw = JSON.parse(readPreference('layout') ?? 'null');
    if (raw && typeof raw === 'object' && raw.layouts && typeof raw.layouts === 'object') {
      for (const [ws, value] of Object.entries(raw.layouts as Record<string, Partial<Layout>>)) {
        if (!value || !Array.isArray(value.panes)) continue;
        layouts[ws] = {
          panes: value.panes.filter((id): id is string => typeof id === 'string'),
          focus: typeof value.focus === 'string' ? value.focus : null,
          maxed: typeof value.maxed === 'string' ? value.maxed : null,
          closed: Array.isArray(value.closed) ? value.closed.filter((id): id is string => typeof id === 'string') : [],
        };
      }
      return { workspace: typeof raw.workspace === 'string' ? raw.workspace : null, layouts };
    }
  } catch {
    // 存的内容坏了或读不了，从头开始
  }
  return { workspace: null, layouts };
}

let savedLayouts = state.layouts;
let savedWorkspace = state.currentWorkspace;
listeners.add(() => {
  if (!state.ready || (state.layouts === savedLayouts && state.currentWorkspace === savedWorkspace)) return;
  savedLayouts = state.layouts;
  savedWorkspace = state.currentWorkspace;
  try {
    writePreference('layout', JSON.stringify({ workspace: savedWorkspace, layouts: savedLayouts }));
  } catch {
    // 存不了就只在这次打开时有效
  }
});

// ───────────────────────── 处理服务端消息

export function applyServerMessage(msg: ServerMsg): void {
  switch (msg.type) {
    case 'hello': {
      const sessions: Record<string, SessionSnapshot> = {};
      for (const snap of msg.sessions) sessions[snap.meta.id] = { meta: snap.meta, timeline: [...snap.timeline] };
      setState((s) => {
        const currentWorkspace =
          s.currentWorkspace && msg.workspaces.some((w) => w.id === s.currentWorkspace)
            ? s.currentWorkspace
            : (msg.workspaces[0]?.id ?? null);
        const layouts: Record<string, Layout> = {};
        for (const w of msg.workspaces) layouts[w.id] = normalize(layoutOf(s, w.id), w.id, sessions);
        return {
          ready: true,
          home: msg.home,
          quotas: msg.quotas ?? {},
          installs: msg.installs ?? {},
          agents: msg.agents,
          workspaces: msg.workspaces,
          sessions,
          currentWorkspace,
          layouts,
        };
      });
      const focus = layoutOf(state, state.currentWorkspace).focus;
      if (focus) focusComposer(focus);
      break;
    }
    case 'agents':
      setState({ agents: msg.agents });
      break;
    case 'workspaces':
      setState((s) => {
        const layouts: Record<string, Layout> = {};
        for (const w of msg.workspaces) layouts[w.id] = normalize(layoutOf(s, w.id), w.id, s.sessions);
        const currentWorkspace =
          s.currentWorkspace && msg.workspaces.some((w) => w.id === s.currentWorkspace)
            ? s.currentWorkspace
            : (msg.workspaces[0]?.id ?? null);
        return { workspaces: msg.workspaces, layouts, currentWorkspace };
      });
      break;
    case 'session:add': {
      const { meta, timeline } = msg.session;
      const split = msg.requestId ? pendingCreates.get(msg.requestId) : undefined;
      const mine = split !== undefined;
      if (msg.requestId) pendingCreates.delete(msg.requestId);
      setState((s) => {
        const sessions = { ...s.sessions, [meta.id]: { meta, timeline: [...timeline] } };
        const layout = layoutOf(s, meta.workspaceId);
        // 这个页面发起的：放进窗口并切过去；别处发起的：只在没有窗口时顺便显示
        const next = mine ? place(layout, meta.id, split, sessions) : normalize(layout, meta.workspaceId, sessions);
        return {
          sessions,
          currentWorkspace: mine ? meta.workspaceId : s.currentWorkspace,
          view: mine ? 'panes' : s.view,
          ...putLayout(s, meta.workspaceId, next),
        };
      });
      if (mine) focusComposer(meta.id);
      break;
    }
    case 'session:meta':
      setState((s) => {
        const existing = s.sessions[msg.meta.id];
        if (!existing) return {};
        return { sessions: { ...s.sessions, [msg.meta.id]: { ...existing, meta: msg.meta } } };
      });
      break;
    case 'session:ops':
      setState((s) => {
        const existing = s.sessions[msg.id];
        if (!existing) return {};
        return { sessions: { ...s.sessions, [msg.id]: { ...existing, timeline: applyOps(existing.timeline, msg.ops) } } };
      });
      break;
    case 'session:remove':
      setState((s) => {
        const meta = s.sessions[msg.id]?.meta;
        const sessions = { ...s.sessions };
        delete sessions[msg.id];
        if (!meta) return { sessions };
        const layout = layoutOf(s, meta.workspaceId);
        const index = layout.panes.indexOf(msg.id);
        const next = { ...layout, panes: layout.panes.filter((p) => p !== msg.id) };
        return { sessions, ...putLayout(s, meta.workspaceId, normalize(next, meta.workspaceId, sessions, Math.max(0, index - 1))) };
      });
      break;
    case 'history':
      setState((s) => ({ history: { ...s.history, [msg.workspaceId]: { items: msg.items, loading: msg.loading } } }));
      break;
    case 'toast':
      showToast(msg.text);
      break;
    case 'quota':
      setState((s) => {
        const quotas = { ...s.quotas };
        if (msg.quota) quotas[msg.agentId] = msg.quota;
        else delete quotas[msg.agentId];
        return { quotas };
      });
      break;
    case 'install': {
      const before = state.installs[msg.agentId];
      setState((s) => ({ installs: { ...s.installs, [msg.agentId]: msg.run } }));
      // 关着窗口时在后台做完了：提示一下
      const ended = msg.run.state.phase !== 'running' && (before?.id !== msg.run.id || before.state.phase === 'running');
      if (ended && !isWatchingInstall(msg.agentId)) {
        const verb = msg.run.action === 'install' ? tx("安装") : tx("更新");
        if (msg.run.state.phase === 'done') showToast(`${msg.run.name} ${msg.run.action === 'install' ? tx("装好了") : tx("更新好了")}`);
        else if (msg.run.state.phase === 'failed') showToast(tx("{0} {1}没成功，到“设置 → Agent”里点“查看”看输出", [msg.run.name, verb]));
      }
      break;
    }
    case 'login':
    case 'login:output':
    case 'install:output':
    case 'install:busy':
    case 'agent:tested':
      emitLiveMessage(msg);
      break;
  }
}

function applyOps(timeline: TimelineItem[], ops: TimelineOp[]): TimelineItem[] {
  const next = [...timeline];
  const indexOf = (id: string) => {
    for (let i = next.length - 1; i >= 0; i--) if (next[i].id === id) return i;
    return -1;
  };
  for (const op of ops) {
    if (op.op === 'add') {
      next.push(op.item);
    } else if (op.op === 'append') {
      const i = indexOf(op.id);
      if (i >= 0) next[i] = { ...next[i], text: (next[i] as { text: string }).text + op.text } as TimelineItem;
    } else {
      const i = indexOf(op.id);
      if (i >= 0) next[i] = { ...next[i], ...op.patch } as TimelineItem;
    }
  }
  return next;
}
