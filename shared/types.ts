// 前后端共用的数据结构。服务端把 ACP 消息整理成这里的“时间线条目”，浏览器只负责显示。
import type { ModelApi, ModelBilling, ModelAccessView } from './model-access';

/** 会话状态：启动中 / 空闲 / 工作中 / 等你 / 出错 / 已退出 / 未运行（服务重启后恢复的记录，发消息会接着聊） */
export type SessionState = 'starting' | 'idle' | 'running' | 'waiting' | 'error' | 'exited' | 'stopped';

/** 会话是在哪里开的：网页里，还是命令行里（从历史会话打开） */
export type SessionSource = 'web' | 'cli';

export interface AgentInfo {
  id: string;
  name: string;
  /** 身份色的样式名，对应 CSS 里的 .a-<color> */
  color: string;
  /** 实际启动命令，显示用 */
  commandLine: string;
  available: boolean;
  /** 在设置里停用了：不出现在“启动 Agent”菜单和历史会话里 */
  enabled: boolean;
  /** 不可用时的原因，比如“没找到 pi 命令” */
  missing?: string;
  /** 安装提示 */
  install?: string;
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  path: string;
  /** 显示用路径，家目录缩写成 ~ */
  displayPath: string;
  branch?: string;
  /** 启动参数指定的，不能在网页上移除（默认工作区也是） */
  fixed?: boolean;
  /** 默认工作区（系统用户主目录）：一直都在，排第一 */
  isDefault?: boolean;
}

export interface SelectOption {
  value: string;
  name: string;
  description?: string;
}

/** 状态栏里的下拉选项：模型、思考强度、模式等，来自 Agent 的 ACP 配置 */
export interface SessionSelect {
  id: string;
  name: string;
  category?: string;
  value: string;
  options: SelectOption[];
}

export interface SessionUsage {
  used: number;
  size: number;
  cost?: { amount: number; currency: string };
}

export interface SessionMeta {
  id: string;
  workspaceId: string;
  agentId: string;
  agentName: string;
  color: string;
  cwd: string;
  title: string;
  titleSource: 'default' | 'summary' | 'agent' | 'user';
  source: SessionSource;
  state: SessionState;
  error?: string;
  /** 模型、思考强度、权限模式等，都是 Agent 自己提供的选项。什么时候来问你批准，由 Agent 自己的权限模式决定 */
  selects: SessionSelect[];
  usage?: SessionUsage;
  queued: number;
  agentVersion?: string;
  /** ACP 握手中声明的图片输入能力；旧 Agent 未声明时保持 undefined。 */
  supportsImages?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ToolCategory = 'read' | 'edit' | 'execute' | 'other';

export interface ImageAttachment {
  id: string;
  name: string;
  mimeType: string;
  /** 经登录鉴权读取的服务端图片地址。 */
  url: string;
}

export type ToolContent =
  | { type: 'text'; text: string }
  | { type: 'image'; image: ImageAttachment }
  | { type: 'diff'; path: string; oldText: string | null; newText: string }
  | { type: 'terminal'; terminalId: string };

/** auto：旧版本按我们自己的审批档位自动放行过的记录，现在不会再出现 */
export type ApprovalState = 'pending' | 'approved' | 'auto' | 'rejected' | 'cancelled';

export interface PermissionOptionInfo {
  optionId: string;
  name: string;
  kind: string;
}

export interface ApprovalInfo {
  requestId: string;
  state: ApprovalState;
  options: PermissionOptionInfo[];
  chosen?: string;
}

export interface TurnUsage {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  totalTokens?: number;
}

interface ItemBase {
  id: string;
  at: number;
}

export interface UserItem extends ItemBase {
  kind: 'user';
  text: string;
  images?: ImageAttachment[];
  /** 尚未发送的消息在服务重启后仍可以继续排队。旧记录和 ACP 回放没有这个字段。 */
  delivery?: 'queued' | 'sent' | 'failed';
  /** Stable browser request identity; reconnects cannot submit the same turn twice. */
  requestId?: string;
  execution?: 'running' | 'complete' | 'unknown';
}
export interface AgentTextItem extends ItemBase {
  kind: 'agent';
  text: string;
  images?: ImageAttachment[];
}
export interface ThoughtItem extends ItemBase {
  kind: 'thought';
  text: string;
}
export interface ToolItem extends ItemBase {
  kind: 'tool';
  toolCallId: string;
  title: string;
  toolKind: string;
  category: ToolCategory;
  status: string;
  content: ToolContent[];
  locations: { path: string; line?: number }[];
  command?: string;
  approval?: ApprovalInfo;
}
export interface PlanItem extends ItemBase {
  kind: 'plan';
  entries: { content: string; status: string }[];
}
export interface NoticeItem extends ItemBase {
  kind: 'notice';
  level: 'info' | 'warning' | 'error';
  text: string;
  detail?: string;
}
export interface TurnItem extends ItemBase {
  kind: 'turn';
  stopReason: string;
  durationMs: number;
  usage?: TurnUsage;
}

export type TimelineItem = UserItem | AgentTextItem | ThoughtItem | ToolItem | PlanItem | NoticeItem | TurnItem;

export type TimelineOp =
  | { op: 'add'; item: TimelineItem }
  | { op: 'append'; id: string; text: string }
  | { op: 'patch'; id: string; patch: Record<string, unknown> };

export interface SessionSnapshot {
  meta: SessionMeta;
  timeline: TimelineItem[];
}

/** 历史会话列表里的一行 */
export interface HistoryItem {
  /** web:<会话编号> 或 cli:<Agent>:<Agent 的会话编号> */
  key: string;
  source: SessionSource;
  agentId: string;
  agentName: string;
  color: string;
  title: string;
  updatedAt: number;
  /** 已经在网页里打开过的会话，对应的会话编号 */
  sessionId?: string;
  /** 正在左侧列表里 */
  open: boolean;
}

// ───────────────────────── 设置页

/** 测试连接的一步：启动进程、握手、新建会话 */
export interface ProbeStep {
  key: 'spawn' | 'initialize' | 'session';
  ok: boolean;
  ms: number;
  error?: string;
}

export interface ProbeResult {
  at: number;
  ok: boolean;
  steps: ProbeStep[];
  /** 比如 codex-acp 2.0.0 */
  version?: string;
  caps?: { history: boolean; resume: boolean; models: boolean; images: boolean };
  needsLogin?: boolean;
  /** 新建会话时 Agent 给的可选模型 */
  models?: SelectOption[];
  currentModel?: string;
  /** Agent 自己的权限模式（比如 Codex 的只读、可写工作区、完全放开），没有就是空的 */
  modes?: SelectOption[];
  currentMode?: string;
  /** 失败时 Agent 最后输出的几行错误 */
  detail?: string;
  /** Agent 握手时报出来的登录方式 */
  authMethods?: AuthMethodView[];
}

/** 订阅额度的一个窗口，比如“本周”“5 小时” */
export interface QuotaWindow {
  label: string;
  usedPercent: number;
  /** 什么时候重置（毫秒时间戳） */
  resetsAt?: number;
}

/** Agent 账号的用量。目前只有 Codex 能查（问 Codex 自己的账户接口） */
export interface AgentQuota {
  at: number;
  /** subscription 订阅账号 · api-key 按量计费 · unknown 查不到 */
  kind: 'subscription' | 'api-key' | 'unknown';
  /** 套餐，比如 Plus、Pro */
  plan?: string;
  windows: QuotaWindow[];
  /** 积分余额 */
  credits?: string;
  /** 还能用几次免费的额度重置 */
  resetCredits?: number;
  error?: string;
}

/** Agent 自己提供的一种登录方式（ACP 的 authMethods） */
export interface AuthMethodView {
  id: string;
  name: string;
  description?: string;
  /** api-key 填 Key · device-code 验证码登录 · terminal 设置向导 · agent 交给 Agent 自己处理 */
  kind: 'api-key' | 'device-code' | 'terminal' | 'agent';
  /** api-key：哪家的 Key，比如 openai */
  provider?: string;
}

/** 网页上安装、更新这个 Agent 的方式（设置页用） */
export interface AgentSetupView {
  /** npm 用 npm 装 · script 用 Agent 官方的安装脚本 · bundled 项目自带，跟着 Fika Desk 一起更新 */
  how: 'npm' | 'script' | 'bundled';
  /** 还没装：点“安装”会在服务器上运行的命令 */
  installCommand?: string;
  /** 装好了：点“更新”会运行的命令 */
  updateCommand?: string;
  /** 装好的各个部分的版本，比如 pi 1.0.0、pi-acp 0.0.34 */
  versions: { name: string; version: string }[];
  /** 不能在网页上安装或更新的原因 */
  note?: string;
}

/** 第三方模型供应商（给 Codex 用）：页面上看到的样子，Key 只给末尾 4 位 */
export interface ModelProviderView {
  /** 预设的编号（deepseek、kimi……），自己填的是 custom */
  preset: string;
  name: string;
  baseUrl: string;
  model: string;
  keyTail: string;
  api: ModelApi;
  billing: ModelBilling;
  contextWindow?: number;
}

/** 测第三方模型供应商的结果 */
export interface ProviderTestResult {
  steps: { ok: boolean; text: string; level?: 'ok' | 'warning' | 'error' }[];
  /** 供应商列出来的模型 */
  models?: string[];
}

/** 检查更新的结果（只查用 npm 装的） */
export interface AgentUpdateCheck {
  at: number;
  /** 有新版本的部分；空的就是已经是最新 */
  outdated: { name: string; from: string; to: string }[];
  error?: string;
}

/** 安装、更新进行到哪一步 */
export type InstallState =
  | { phase: 'running' }
  | { phase: 'done' }
  | { phase: 'failed'; error: string; exitCode?: number }
  | { phase: 'cancelled' };

/** 一次安装、更新：所有页面都知道，关掉窗口也在后台接着做 */
export interface InstallRunView {
  id: number;
  name: string;
  action: 'install' | 'update';
  command: string;
  state: InstallState;
}

/** 登录进行到哪一步（只发给发起登录的页面） */
export type LoginState =
  | { phase: 'starting' }
  /** 请你在自己的手机或电脑上打开这个网址；message 里一般有验证码 */
  | { phase: 'url'; url: string; message: string }
  /** 设置向导开着，终端输出另发；url：向导想打开的网址（服务器上没有浏览器，请你自己打开） */
  | { phase: 'terminal'; url?: string }
  | { phase: 'done' }
  /** exitCode：设置向导退出了但不是正常退出；有的 Agent 登录好了也这样，页面会再测一次连接为准 */
  | { phase: 'failed'; error: string; exitCode?: number }
  | { phase: 'cancelled' };

export interface AgentSettingsView {
  id: string;
  name: string;
  color: string;
  /** ok 可用 · missing 没装 · config-only 有配置文件但找不到命令 · disabled 停用了 */
  status: 'ok' | 'missing' | 'config-only' | 'disabled';
  statusText: string;
  /** 实际的启动命令 */
  command: string;
  install?: string;
  /** Agent 自己的配置文件（只读） */
  configFile?: { path: string; exists: boolean; model?: string };
  enabled: boolean;
  /** 能查账号用量（目前只有 Codex） */
  quota?: boolean;
  /** 最近一次测试连接的结果 */
  probe?: ProbeResult;
  /** 网页上怎么安装、更新 */
  setup?: AgentSetupView;
  /** 怎么换成第三方模型：codex 在设置页里填供应商 · wizard 在 Agent 自己的设置向导里选 */
  providers?: 'codex' | 'wizard';
  /** 每个 Agent 实际提供的第三方模型与原生订阅配置方式。 */
  modelAccess: ModelAccessView;
  /** 现在用的第三方模型供应商；null = 用 Agent 自己的（比如 Codex 用 OpenAI） */
  provider?: ModelProviderView | null;
  /** 最近一次检查更新的结果 */
  update?: AgentUpdateCheck;
}

export interface LoginView {
  id: string;
  /** 比如 Mac · Chrome */
  device: string;
  ip: string;
  createdAt: number;
  seenAt: number;
  keep: boolean;
  current: boolean;
}

export interface AuditView {
  id: number;
  at: number;
  kind: string;
  ip: string | null;
  detail: Record<string, unknown> | null;
}

/** 打开文件夹时列出的一个文件夹 */
export interface BrowseEntry {
  name: string;
  path: string;
  displayPath: string;
  git: boolean;
  branch?: string;
  /** 已经是工作区了 */
  added: boolean;
}

export interface BrowseResult {
  /** 当前所在目录；null = 列出各个允许的目录 */
  path: string | null;
  displayPath: string | null;
  /** 上一层（还在允许范围里时） */
  parent: string | null;
  /** 当前目录属于哪个允许的目录 */
  root: string | null;
  /** 当前目录已经是工作区了 */
  added: boolean;
  entries: BrowseEntry[];
}

export interface WorkspaceSettingsView {
  roots: { path: string; displayPath: string }[];
  workspaces: (WorkspaceInfo & { live: number })[];
  limit: number;
  /** 现在在运行的 Agent 进程数 */
  running: number;
}

export interface AboutView {
  version: string;
  dataDir: string;
  startedAt: number;
  node: string;
  platform: string;
  workspaces: { name: string; path: string }[];
}

/** 服务端 → 浏览器 */
export type ServerMsg =
  | {
      type: 'hello';
      agents: AgentInfo[];
      workspaces: WorkspaceInfo[];
      sessions: SessionSnapshot[];
      home: string;
      /** 各 Agent 账号的用量（读过的才有） */
      quotas: Record<string, AgentQuota>;
      /** 各 Agent 最近一次安装、更新 */
      installs: Record<string, InstallRunView>;
    }
  | { type: 'agents'; agents: AgentInfo[] }
  /** 工作区增删了 */
  | { type: 'workspaces'; workspaces: WorkspaceInfo[] }
  /** requestId：由哪个页面发起的启动，那个页面把它放进新窗口 */
  | { type: 'session:add'; session: SessionSnapshot; requestId?: string }
  | { type: 'session:meta'; meta: SessionMeta }
  | { type: 'session:ops'; id: string; ops: TimelineOp[] }
  | { type: 'session:remove'; id: string }
  /** loading：还在读取各 Agent 在命令行里的会话 */
  | { type: 'history'; workspaceId: string; items: HistoryItem[]; loading: boolean }
  | { type: 'toast'; text: string }
  /** Agent 账号的用量更新了；null = 没有用量可看（比如换成了第三方模型） */
  | { type: 'quota'; agentId: string; quota: AgentQuota | null }
  /** Agent 登录的进展 */
  | { type: 'login'; agentId: string; state: LoginState }
  /** 设置向导的终端输出 */
  | { type: 'login:output'; agentId: string; data: string }
  /** 安装、更新的进度（发给所有页面） */
  | { type: 'install'; agentId: string; run: InstallRunView }
  /** 终端输出；replay：打开窗口时补上的、到现在为止的全部输出 */
  | { type: 'install:output'; agentId: string; data: string; replay?: boolean }
  /** 现在不能开始（正在装别的、或者这个 Agent 装不了），只发给点了的页面 */
  | { type: 'install:busy'; agentId: string; error: string }
  /** 装好、更新完后，服务器测完了一次连接：设置页重新读 */
  | { type: 'agent:tested'; agentId: string }

/** 浏览器 → 服务端 */
export type ClientMsg =
  | { type: 'session:create'; workspaceId: string; agentId: string; requestId?: string }
  | { type: 'session:prompt'; id: string; text: string; images?: string[]; requestId?: string }
  | { type: 'session:cancel'; id: string }
  | { type: 'session:close'; id: string }
  | { type: 'session:restart'; id: string }
  | { type: 'session:select'; id: string; selectId: string; value: string }
  | { type: 'session:rename'; id: string; title: string }
  /** 选 Agent 给的哪个选项（允许一次、总是允许、拒绝……） */
  | { type: 'approval'; id: string; requestId: string; optionId: string }
  | { type: 'agents:rescan' }
  | { type: 'history:list'; workspaceId: string }
  | { type: 'history:open'; workspaceId: string; key: string; requestId?: string }
  /** 用 Agent 的一种登录方式登录；apiKey 只在填 Key 的方式里用，cols/rows 是设置向导的终端大小 */
  | { type: 'login:start'; agentId: string; methodId: string; apiKey?: string; cols?: number; rows?: number }
  /** 设置向导里的键盘输入 */
  | { type: 'login:input'; agentId: string; data: string }
  | { type: 'login:resize'; agentId: string; cols: number; rows: number }
  | { type: 'login:cancel'; agentId: string }
  /** 安装、更新 Agent：只说装哪个，命令由服务端的对照表决定 */
  | { type: 'install:start'; agentId: string; action: 'install' | 'update'; cols?: number; rows?: number }
  /** 打开窗口看正在做的（或者上一次的）安装、更新 */
  | { type: 'install:attach'; agentId: string }
  | { type: 'install:input'; agentId: string; data: string }
  | { type: 'install:resize'; agentId: string; cols: number; rows: number }
  | { type: 'install:cancel'; agentId: string }
  /** 马上重新读一次用量 */
  | { type: 'quota:refresh'; agentId: string };

/** 把第一句话压缩成简短标题：去掉客套开头，截到第一个标点，最多 14 个字 */
export function summarizeTitle(text: string): string {
  const first = text
    .trim()
    .replace(/^(请你|请|帮我|麻烦你|麻烦|你能不能|能不能|可以)+/, '')
    // 英文标点只在后面跟空格或结尾时才算断句，避免把 src/price.js 这类文件名截断
    .split(/[，。！？；：\n]|[,.!?;:](?=\s|$)/)[0]
    .trim();
  const base = first || text.trim();
  // 按显示宽度截断：汉字算 2，英文字母算 1，最多 28（约 14 个汉字）
  let width = 0;
  let out = '';
  for (const ch of base) {
    width += /[⺀-鿿豈-﫿＀-￯]/.test(ch) ? 2 : 1;
    if (width > 28) return out.trimEnd() + '…';
    out += ch;
  }
  return out || '新会话';
}
