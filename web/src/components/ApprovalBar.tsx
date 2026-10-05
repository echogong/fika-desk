import { tx, useLocale, localizedLabels } from '../i18n';
// 审批卡：Agent 要执行命令或改文件时出现，接在过程竖线的末尾。样子是一张咖啡馆的拿铁色小票：上半是命令，中间一道带半圆缺口的虚线撕口，下半是按钮。按钮就是 Agent 自己给的选项（允许一次、以后都允许、拒绝……），⌘↵ 允许一次。
// 选项全部直接摆出来：允许这一次（主按钮）、以后都允许、拒绝，不再收进下拉菜单。
import { useId } from 'react';
import type { PermissionOptionInfo, SessionMeta, TimelineItem, ToolItem } from '../../../shared/types';
import { commandText, relPath, tildify } from '../format';
import { send } from '../ws';
import { AgentIcon } from './AgentIcon';
import { Folder } from './Icons';

export function pendingApprovals(timeline: TimelineItem[]): ToolItem[] {
  return timeline.filter((i): i is ToolItem => i.kind === 'tool' && i.approval?.state === 'pending');
}

export function decide(meta: SessionMeta, item: ToolItem, optionId: string): void {
  if (!item.approval) return;
  send({ type: 'approval', id: meta.id, requestId: item.approval.requestId, optionId });
}

/** ⌘↵ 用的选项：允许一次（没有就用第一个“允许”） */
export function quickAllow(item: ToolItem): PermissionOptionInfo | undefined {
  const options = item.approval?.options ?? [];
  return options.find((o) => o.kind === 'allow_once') ?? options.find((o) => o.kind.startsWith('allow'));
}

const KIND_LABELS: Record<string, string> = localizedLabels({
  allow_once: '允许这一次',
  allow_always: '以后都允许',
  reject_once: '拒绝',
  reject_always: '以后都拒绝',
});
/** 顺序：允许这一次（主按钮）、以后都允许、拒绝、以后都拒绝；Agent 自定义的选项排在中间 */
const KIND_ORDER: Record<string, number> = { allow_once: 0, allow_always: 1, reject_once: 3, reject_always: 4 };

/** Agent 的选项按类别排好、配上中文名；同一类有好几个时用 Agent 自己的说法，免得重名 */
function buttonsOf(options: PermissionOptionInfo[]): { option: PermissionOptionInfo; label: string }[] {
  const count = (kind: string) => options.filter((o) => o.kind === kind).length;
  return [...options]
    .sort((a, b) => (KIND_ORDER[a.kind] ?? 2) - (KIND_ORDER[b.kind] ?? 2))
    .map((option) => ({ option, label: KIND_LABELS[option.kind] && count(option.kind) === 1 ? KIND_LABELS[option.kind] : option.name }));
}

export function ApprovalBar({
  meta,
  pending,
  home,
  focused,
}: {
  meta: SessionMeta;
  pending: ToolItem[];
  home: string;
  /** 只有当前窗口能用 ⌘↵ 批准 */
  focused: boolean;
}) {
  useLocale();
  const item = pending[0];
  const id = useId();
  if (!item) return null;
  const verb =
    item.category === 'execute'
      ? tx("想执行")
      : item.toolKind === 'delete'
        ? tx("想删除")
        : item.category === 'edit'
          ? tx("想修改")
          : tx("请求批准");
  const diffPaths = item.content.flatMap((c) => (c.type === 'diff' ? [c.path] : []));
  const paths = item.locations.length ? item.locations.map((l) => l.path) : diffPaths;
  const target =
    item.category === 'execute'
      ? commandText(item)
      : paths.length
        ? paths.map((p) => relPath(p, meta.cwd)).join('、')
        : item.title;
  const primary = quickAllow(item);

  return (
    <div className={`ap a-${meta.color}`} role="alertdialog" aria-label={tx("待批准：{0} {1}", [meta.agentName, verb])} aria-describedby={`${id}-target`}>
      <div className="what">
        <div className="ap-top">
          <span className="ttl">
            <span className="ap-mark"><AgentIcon id={meta.agentId} name={meta.agentName} /></span>
            <span className="ap-say">「<span className="ap-name">{meta.agentName}</span> <span className="ap-verb">{verb}</span>」</span>
          </span>
          <span className="where">
            <Folder size={12} />
            <span className="where-path" title={tx("在 {0} 里执行", [tildify(meta.cwd, home)])}>{tildify(meta.cwd, home)}</span>
          </span>
        </div>
        <code id={`${id}-target`} data-command={item.category === 'execute' || undefined} title={target} tabIndex={0}>{target}</code>
      </div>
      <div className="acts">
        {buttonsOf(item.approval?.options ?? []).map(({ option, label }) => {
          const quick = option === primary;
          const style = quick ? 'btn-ink' : option.kind.startsWith('reject') ? 'btn-line' : 'btn-soft';
          const hint = option.kind === 'allow_always' ? tx("这类操作不再问") : option.name;
          return (
            <button key={option.optionId} className={`btn ${style}`} type="button" title={hint} onClick={() => decide(meta, item, option.optionId)}>
              {label}
              {quick && focused && <kbd>⌘↵</kbd>}
            </button>
          );
        })}
        {pending.length > 1 && <span className="ap-queue" role="status">{tx('还有 {0} 项待批准', [pending.length - 1])}</span>}
      </div>
    </div>
  );
}
