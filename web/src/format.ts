import { tx, localizedLabels, getLocale } from './i18n';
// 显示用的小工具：时间、时长、路径、状态文字。
import type { AgentQuota, SessionState, ToolItem, WorkspaceInfo } from '../../shared/types';

/** Only the built-in default label is UI text; user folder names remain unchanged. */
export function workspaceName(workspace: Pick<WorkspaceInfo, 'name' | 'isDefault'>): string {
  return workspace.isDefault && workspace.name === '默认' ? tx('默认') : workspace.name;
}

export function clock(at: number): string {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 额度什么时候重置：今天 18:39、明天 09:00、10月6日 18:39 */
export function resetText(at: number): string {
  const d = new Date(at);
  const today = new Date();
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86_400_000);
  const day = days === 0 ? tx("今天") : days === 1 ? tx("明天") : new Intl.DateTimeFormat(getLocale(), { month: 'short', day: 'numeric' }).format(d);
  return `${day} ${clock(at)}`;
}

/** 订阅额度剩得最少的那个窗口剩多少（百分比） */
export function quotaLeft(quota: AgentQuota | undefined): number | null {
  if (!quota || quota.kind !== 'subscription' || !quota.windows.length) return null;
  return Math.max(0, Math.round(Math.min(...quota.windows.map((w) => 100 - w.usedPercent))));
}

/** 额度的详细说明：套餐、每个窗口剩多少、什么时候重置、积分 */
export function quotaLines(quota: AgentQuota): string[] {
  const lines: string[] = [];
  if (quota.plan) lines.push(tx("ChatGPT {0} 账号", [quota.plan]));
  for (const w of quota.windows) {
    lines.push(tx("{0}剩 {1}%{2}", [w.label, Math.max(0, Math.round(100 - w.usedPercent)), w.resetsAt ? tx("，{0} 重置", [resetText(w.resetsAt)]) : '']));
  }
  if (quota.credits) lines.push(tx("积分 {0}", [quota.credits]));
  if (quota.resetCredits) lines.push(tx("还有 {0} 次免费重置额度", [quota.resetCredits]));
  return lines;
}

export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return tx("{0} 秒", [s]);
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest ? tx("{0} 分 {1} 秒", [m, rest]) : tx("{0} 分钟", [m]);
  const h = Math.floor(m / 60);
  if (h < 24) return tx("{0} 小时 {1} 分", [h, m % 60]);
  return tx("{0} 天 {1} 小时", [Math.floor(h / 24), h % 24]);
}

/** 秒表：进行中的一轮用，秒补成两位，走起来宽度不跳：8 秒、6 分 03 秒、1 时 02 分 */
export function stopwatch(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return tx("{0} 时 {1} 分", [h, String(m).padStart(2, '0')]);
  return m ? tx("{0} 分 {1} 秒", [m, String(s % 60).padStart(2, '0')]) : tx("{0} 秒", [s]);
}

export function tokens(n: number | undefined): string {
  if (n === undefined || n === null) return '';
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : String(n);
}

export function tildify(path: string, home: string): string {
  return home && (path === home || path.startsWith(home + '/')) ? '~' + path.slice(home.length) : path;
}

/** 工具里的绝对路径，在工作目录里的就显示成相对路径 */
export function relPath(path: string, cwd: string): string {
  if (!path) return path;
  if (path === cwd) return '.';
  return path.startsWith(cwd + '/') ? path.slice(cwd.length + 1) : path;
}

export const STATE_LABEL: Record<SessionState, string> = localizedLabels({
  starting: '启动中',
  idle: '空闲',
  running: '工作中',
  waiting: '等你',
  error: '出错',
  exited: '已退出',
  stopped: '未运行',
});

export const STATE_CLASS: Record<SessionState, string> = {
  starting: 's-start',
  idle: 's-idle',
  running: 's-run',
  waiting: 's-wait',
  error: 's-err',
  exited: 's-err',
  stopped: 's-idle',
};

/** 历史会话里的时间：刚刚、5 分钟前、今天 14:02、昨天 09:30、3 天前、8月19日 */
export function ago(at: number, now = Date.now()): string {
  if (!at) return '';
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return tx("刚刚");
  if (minutes < 60) return tx("{0} 分钟前", [minutes]);
  const d = new Date(at);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const day = 86_400_000;
  if (at >= today.getTime()) return tx("今天 {0}", [clock(at)]);
  if (at >= today.getTime() - day) return tx("昨天 {0}", [clock(at)]);
  const days = Math.ceil((today.getTime() - at) / day);
  if (days < 7) return new Intl.RelativeTimeFormat(getLocale(), { numeric: 'always' }).format(-days, 'day');
  const sameYear = d.getFullYear() === today.getFullYear();
  return new Intl.DateTimeFormat(getLocale(), { ...(sameYear ? {} : { year: 'numeric' as const }), month: 'short', day: 'numeric' }).format(d);
}

const SELECT_LABELS: Record<string, string> = localizedLabels({
  model: '模型',
  thought_level: '思考',
  mode: '权限',
});

export function selectLabel(category: string | undefined, name: string): string {
  if (category && SELECT_LABELS[category]) return SELECT_LABELS[category];
  if (/collaboration/i.test(name)) return tx("协作");
  if (/fast/i.test(name)) return tx("快速");
  if (/environment/i.test(name)) return tx("环境");
  return name;
}

/** Agent 给的选项名（思考强度、权限模式）常见的翻成中文，模型名和不认识的照原样 */
const OPTION_LABELS: Record<string, string> = localizedLabels({
  minimal: '最低',
  low: '低',
  medium: '中',
  high: '高',
  xhigh: '最高',
  'read only': '只读',
  'read-only': '只读',
  auto: '自动',
  'full access': '完全访问',
});

export function optionLabel(category: string | undefined, name: string): string {
  if (category === 'model') return name;
  return OPTION_LABELS[name.trim().toLowerCase()] ?? name;
}

/** 给执行类工具取要显示的命令 */
export function commandText(item: ToolItem): string {
  return item.command || item.title || tx("命令");
}

/** 连续的读取类步骤合并成一行时的摘要，例如“读取了 4 个文件，搜索 1 次” */
export function readSummary(items: ToolItem[]): string {
  let files = 0;
  let searches = 0;
  let fetches = 0;
  let other = 0;
  for (const item of items) {
    if (item.toolKind === 'read') files += Math.max(1, item.locations.length);
    else if (item.toolKind === 'search') searches++;
    else if (item.toolKind === 'fetch') fetches++;
    else other++;
  }
  const parts: string[] = [];
  if (files) parts.push(tx("读取了 {0} 个文件", [files]));
  if (searches) parts.push(tx("{0}搜索 {1} 次", ['', searches]));
  if (fetches) parts.push(tx("访问网页 {0} 次", [fetches]));
  if (other) parts.push(tx("其他 {0} 步", [other]));
  return new Intl.ListFormat(getLocale(), { style: 'short', type: 'conjunction' }).format(parts) || tx("{0} 个步骤", [items.length]);
}
