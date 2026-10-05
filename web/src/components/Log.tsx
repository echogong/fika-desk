import { tx, useLocale, localizedLabels } from '../i18n';
// 对话记录：你的消息靠右放进气泡，Agent 的名字、工作过程和回复靠左。
// 思考、读文件、跑命令、改文件收进“已工作 X 分钟”这一行，进行中自动展开；最后的回答用衬线字体。
// 等你批准的事是这一轮最后的一张“小票”：拿铁色的卡片，往上翻时贴在窗口底边，批准后变回记录里的一步。
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ApprovalInfo, NoticeItem, SessionMeta, TimelineItem, ToolItem, TurnItem, UserItem } from '../../../shared/types';
import { wordWrap } from '../cjk';
import { clock, commandText, duration, readSummary, relPath, stopwatch, tokens } from '../format';
import { DiffView } from './DiffView';
import { Chevron, Doc, Pencil, Prompt, Spark } from './Icons';
import { CoffeeMark } from './CoffeeMark';
import { Markdown } from './Markdown';
import { ImageGallery } from './ImageGallery';
import { Seal, type SealKind } from './Seal';

/** Agent 的一轮：从你说完话到这一轮结束 */
interface AgentBlock {
  type: 'agent';
  key: string;
  items: TimelineItem[];
  turn?: TurnItem;
  /** 这一轮从什么时候开始算（你那句话的时间） */
  startedAt: number;
}
type Block = { type: 'user'; item: UserItem } | { type: 'notice'; item: NoticeItem } | AgentBlock;
type Step = { type: 'item'; item: TimelineItem } | { type: 'reads'; items: ToolItem[]; key: string };

function buildBlocks(timeline: TimelineItem[]): Block[] {
  const blocks: Block[] = [];
  let current: AgentBlock | null = null;
  let userAt = 0;
  const ordered = timeline.filter((item) => !(item.kind === 'user' && item.delivery === 'queued')).slice().sort((a, b) => a.at - b.at);
  for (const item of ordered) {
    if (item.kind === 'user') {
      current = null;
      userAt = item.at;
      blocks.push({ type: 'user', item });
    } else if (item.kind === 'notice') {
      current = null;
      blocks.push({ type: 'notice', item });
    } else if (item.kind === 'turn') {
      if (current) current.turn = item;
      else blocks.push({ type: 'agent', key: item.id, items: [], turn: item, startedAt: userAt });
      current = null;
    } else {
      if (!current) {
        current = { type: 'agent', key: item.id, items: [], startedAt: userAt || item.at };
        blocks.push(current);
      }
      current.items.push(item);
    }
  }
  return blocks;
}

/** 一轮末尾连着的文字是回答，前面的都算过程 */
function splitAnswer(items: TimelineItem[]): { process: TimelineItem[]; answer: TimelineItem[] } {
  let cut = items.length;
  while (cut > 0 && items[cut - 1].kind === 'agent') cut--;
  return { process: items.slice(0, cut), answer: items.slice(cut) };
}

/** 等你批准的命令：底部审批条里已经有了，记录里先不显示（改文件的照样显示，要看改动） */
function waitingCommand(item: TimelineItem): boolean {
  return item.kind === 'tool' && item.approval?.state === 'pending' && item.category !== 'edit';
}

/** 连着读的文件合成一步 */
function buildSteps(items: TimelineItem[]): Step[] {
  const steps: Step[] = [];
  for (const item of items) {
    if (waitingCommand(item)) continue;
    if (item.kind === 'tool' && item.category === 'read' && !item.approval && !item.content.some((content) => content.type === 'image')) {
      const last = steps[steps.length - 1];
      if (last?.type === 'reads') last.items.push(item);
      else steps.push({ type: 'reads', items: [item], key: item.id });
    } else {
      steps.push({ type: 'item', item });
    }
  }
  return steps;
}

export const Log = memo(function Log({ meta, timeline, tail }: { meta: SessionMeta; timeline: TimelineItem[]; tail?: ReactNode }) {
  useLocale();
  const blocks = buildBlocks(timeline);
  const busy = meta.state === 'running' || meta.state === 'waiting';
  // 正在进行的一轮：最后一个还没结束的 Agent 回合；你刚说完、Agent 还没回话时也补一个，好显示“工作中”
  const last = blocks[blocks.length - 1];
  if (busy && !(last?.type === 'agent' && !last.turn)) {
    const userAt = [...blocks].reverse().find((b): b is Extract<Block, { type: 'user' }> => b.type === 'user')?.item.at ?? 0;
    blocks.push({ type: 'agent', key: 'live', items: [], startedAt: userAt });
  }

  // 你说一句话开始新的一轮，这一轮里的东西放进同一个 section，工单才能在这一轮里贴顶
  const groups: { key: string; items: { block: Block; index: number }[] }[] = [];
  blocks.forEach((block, index) => {
    const key = block.type === 'agent' ? block.key : block.item.id;
    if (block.type === 'user' || groups.length === 0) groups.push({ key, items: [] });
    groups[groups.length - 1].items.push({ block, index });
  });

  return (
    <div className="log">
      {meta.source === 'cli' && <p className="banner">{tx("在命令行里开的会话，已同步到这里，可以直接接着聊。")}</p>}
      {groups.map((group) => (
        <section key={group.key} className="turn">
          {group.items.map(({ block, index }) => {
            if (block.type === 'user') return <UserMessage key={block.item.id} item={block.item} />;
            if (block.type === 'notice') return <Notice key={block.item.id} item={block.item} />;
            const live = busy && index === blocks.length - 1 && !block.turn;
            return <AgentTurn key={block.key} block={block} meta={meta} live={live} tail={live ? tail : undefined} />;
          })}
        </section>
      ))}
      {!busy && tail && <div className="ap-wrap">{tail}</div>}
      {timeline.filter((item): item is UserItem => item.kind === 'user' && item.delivery === 'queued').map((item) => <UserMessage key={item.id} item={item} />)}
    </div>
  );
});

/** 你说的话：角色和时间放在气泡上方，长消息保留原有换行 */
function UserMessage({ item }: { item: UserItem }) {
  useLocale();
  return (
    <div className="msg-me">
      <div className="user-note">
        <div className="user-meta">
          <span>{tx("你")}</span>
          {item.at > 0 && <time dateTime={new Date(item.at).toISOString()}>{clock(item.at)}</time>}
        </div>
        <div className="user-bubble">
          {item.text && wordWrap(item.text)}
          <ImageGallery images={item.images} />
          {item.delivery === 'queued' && <span className="user-delivery">{tx("等待发送")}</span>}
          {item.delivery === 'failed' && <span className="user-delivery is-failed">{tx("发送未完成，内容已保留")}</span>}
          {item.execution === 'unknown' && <span className="user-delivery is-failed">{tx("结果尚未确认，请检查后再重发")}</span>}
        </div>
      </div>
    </div>
  );
}

/** 进行中每秒刷新一次，好让“工作中 · 12 秒”走起来 */
function useTick(active: boolean): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
}

const STOP_TEXT: Record<string, string> = localizedLabels({
  cancelled: '已停止',
  error: '这一轮出错了',
  refusal: 'Agent 拒绝了这次请求',
  max_tokens: '回复太长，被截断了',
  max_turn_requests: '步骤太多，先停在这里',
});

/** 过程里做了什么：改了几个文件、执行了几条命令（只算已经做完的，等你批准、被拒绝的不算） */
function workSummary(items: TimelineItem[]): string {
  const files = new Set<string>();
  let commands = 0;
  for (const item of items) {
    if (item.kind !== 'tool' || item.status !== 'completed' || item.approval?.state === 'rejected' || item.approval?.state === 'cancelled') continue;
    if (item.category === 'edit') {
      const paths = item.locations.length ? item.locations.map((l) => l.path) : item.content.flatMap((c) => (c.type === 'diff' ? [c.path] : []));
      for (const p of paths.length ? paths : [item.id]) files.add(p);
    }
    if (item.category === 'execute') commands++;
  }
  return [files.size && tx("改了 {0} 个文件", [files.size]), commands && tx("执行了 {0} 条命令", [commands])].filter(Boolean).join(' · ');
}

function AgentTurn({ block, meta, live, tail }: { block: AgentBlock; meta: SessionMeta; live: boolean; tail?: ReactNode }) {
  useLocale();
  const { process, answer } = splitAnswer(block.items);
  // 默认：进行中展开、结束后收起；你点过就按你的来
  const [manual, setManual] = useState<boolean | null>(null);
  const open = manual ?? live;
  useTick(live);

  const lastAt = block.items.reduce((t, i) => Math.max(t, i.at), 0);
  // 进行中：等你批准时是黄灯，在干活是绿灯；后面是一块走着的秒表
  const waiting = live && meta.state === 'waiting';
  // 进行中：秒表从你说完话算起；等你批准还是在干活写在窗口标题栏上，这里不重复
  const watchFrom = block.startedAt;
  const head = live
    ? tx("已工作")
    : block.turn
      ? tx("已工作 {0}", [duration(block.turn.durationMs)])
      : block.startedAt > 0 && lastAt > block.startedAt
        ? tx("已工作 {0}", [duration(lastAt - block.startedAt)])
        : tx("工作过程");
  const summary = workSummary(process);
  const u = block.turn?.usage;
  const usage = u
    ? [u.inputTokens !== undefined && tx("输入 {0}", [tokens(u.inputTokens)]), u.outputTokens !== undefined && tx("输出 {0}", [tokens(u.outputTokens)]), u.cachedTokens && tx("缓存 {0}", [tokens(u.cachedTokens)])]
        .filter(Boolean)
        .join('　')
    : '';
  const steps = buildSteps(process);
  // 正在写：只有 Agent 在干活时才有光标，等你批准时它停着
  const writing = live && meta.state === 'running';

  return (
    <div className="turn-a">
      <div className="agent-author">
        <span className="agent-avatar" aria-hidden="true"><CoffeeMark working={writing} /></span>
        <span className="agent-author-name">{meta.agentName}</span>
      </div>
      {(process.length > 0 || live) && (
        <div className={`turn-work${open ? ' open' : ''}`}>
          <button className="work-head" type="button" aria-expanded={open} title={usage || undefined} onClick={() => setManual(!open)}>
            <span className={live ? (waiting ? 'wh-wait' : 'wh-run') : undefined}>{head}</span>
            {live && watchFrom > 0 && <time className="watch">{stopwatch(Date.now() - watchFrom)}</time>}
            {summary && <span className="work-sum">{summary}</span>}
            {steps.length > 0 && <Chevron size={14} />}
          </button>
          {open && steps.length > 0 && (
            <div className="work-body">
              {steps.map((step) =>
                step.type === 'reads' ? (
                  <div key={step.key} className={`node ${step.items.some((i) => i.status === 'in_progress' || i.status === 'pending') ? 'n-run' : 'n-done'}`}>
                    <ReadGroup items={step.items} cwd={meta.cwd} />
                  </div>
                ) : (
                  <WorkStep key={step.item.id} item={step.item} meta={meta} live={writing && step === steps[steps.length - 1]} />
                ),
              )}
            </div>
          )}
          {tail && <div className="ap-wrap">{tail}</div>}
        </div>
      )}
      {answer.map((item, i) => (
        <div key={item.id}>
          <Markdown text={item.kind === 'agent' ? item.text : ''} streaming={writing && i === answer.length - 1} sessionId={meta.id} />
          {item.kind === 'agent' && <ImageGallery images={item.images} />}
        </div>
      ))}
      {block.turn && STOP_TEXT[block.turn.stopReason] && <p className="turn-stop">{STOP_TEXT[block.turn.stopReason]}</p>}
    </div>
  );
}

/** 这一步在竖线上点哪种灯 */
function nodeOf(item: TimelineItem): string {
  if (item.kind !== 'tool') return 'n-note';
  const a = item.approval?.state;
  if (a === 'pending') return 'n-wait';
  if (a === 'rejected' || a === 'cancelled') return 'n-off';
  if (item.status === 'failed') return 'n-err';
  if (item.status === 'in_progress' || item.status === 'pending') return 'n-run';
  return 'n-done';
}

/** 过程里的一步：思考、中间说的话、工具（带审批标记）、计划 */
function WorkStep({ item, meta, live }: { item: TimelineItem; meta: SessionMeta; live: boolean }) {
  useLocale();
  return (
    <div className={`node ${nodeOf(item)}`}>
      <StepBody item={item} meta={meta} live={live} />
    </div>
  );
}

function StepBody({ item, meta, live }: { item: TimelineItem; meta: SessionMeta; live: boolean }) {
  useLocale();
  switch (item.kind) {
    case 'thought':
      return (
        <div className="w-thought w-row">
          <Spark />
          <div>
            <span className="w-label">{live ? tx("思考中…") : tx("思考")}</span>
            <span className="thought-text">{wordWrap(item.text)}</span>
          </div>
        </div>
      );
    case 'agent':
      return (
        <div className="w-text">
          <Markdown text={item.text} streaming={live} sessionId={meta.id} />
          <ImageGallery images={item.images} />
        </div>
      );
    case 'tool':
      return <Tool item={item} cwd={meta.cwd} sessionId={meta.id} />;
    case 'plan':
      return (
        <ul className="plan">
          {item.entries.map((entry, i) => (
            <li key={i} className={`plan-${entry.status}`}>
              <span className="plan-mark" aria-hidden="true">
                {entry.status === 'completed' ? '✓' : entry.status === 'in_progress' ? '◐' : '○'}
              </span>
              {entry.content}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

function ReadGroup({ items, cwd }: { items: ToolItem[]; cwd: string }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const running = items.some((i) => i.status === 'in_progress' || i.status === 'pending');
  return (
    <div>
      <button className="steps" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Doc />
        {readSummary(items)}
        {running && <span className="dots">…</span>}
        <Chevron size={14} />
      </button>
      {open && (
        <ul className="step-list">
          {items.map((item) => (
            <li key={item.id}>
              {item.locations.length ? item.locations.map((l) => relPath(l.path, cwd)).join('、') : item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_TEXT: Record<string, string> = localizedLabels({
  pending: '准备中',
  in_progress: '运行中',
  completed: '完成',
  failed: '失败',
});

function toolStatus(item: ToolItem): { text: string; cls: string } {
  const a = item.approval?.state;
  if (a === 'pending') return { text: tx("等你批准"), cls: 'is-pending' };
  if (a === 'rejected' || a === 'cancelled') return { text: tx("未执行"), cls: 'is-rejected' };
  return { text: STATUS_TEXT[item.status] ?? item.status, cls: `is-${item.status}` };
}

function Tool({ item, cwd }: { item: ToolItem; cwd: string; sessionId: string }) {
  useLocale();
  const status = toolStatus(item);
  const diffs = item.content.filter((c) => c.type === 'diff');
  const texts = item.content.filter((c) => c.type === 'text');
  const images = item.content.filter((c) => c.type === 'image').map((c) => c.image);

  if (item.category === 'edit' && diffs.length) {
    // 审批标记放在第一个文件的标题行右边
    const mark = item.approval ? <ApprovalMark approval={item.approval} /> : null;
    return (
      <div className={status.cls === 'is-rejected' ? 'rejected' : undefined}>
        {diffs.map((d, i) => (
          <DiffView key={i} path={d.path} oldText={d.oldText} newText={d.newText} cwd={cwd} aside={i === 0 ? mark : null} defaultOpen={item.approval?.state === 'pending'} />
        ))}
        {item.status === 'failed' && <div className="tool-state is-failed">{status.text}</div>}
        <ImageGallery images={images} />
      </div>
    );
  }

  const label =
    item.category === 'execute'
      ? tx("执行")
      : item.category === 'edit'
        ? item.toolKind === 'delete'
          ? tx("删除")
          : tx("修改")
        : '';
  const target =
    item.category === 'execute'
      ? commandText(item)
      : item.locations.length
        ? item.locations.map((l) => relPath(l.path, cwd)).join('、')
        : item.title;

  return (
    <div className={`cmd ${status.cls}`}>
      <div className="cmd-line">
        {item.category === 'execute' ? <Prompt /> : item.category === 'edit' ? <Pencil /> : null}
        {label && <span className="cmd-verb">{label}</span>}
        <code>{target}</code>
        <span className="cs">
          {item.approval && <ApprovalSeal approval={item.approval} />}
          {status.text}
        </span>
      </div>
      {texts.length > 0 && <pre className="cmd-out">{texts.map((t) => t.text).join('\n')}</pre>}
      <ImageGallery images={images} />
    </div>
  );
}

/** 改文件的审批：一个勾加一句话，放在改动的标题行右边 */
const MARK_TEXT: Record<string, string> = localizedLabels({
  pending: '等你批准',
  approved: '已批准',
  auto: '自动放行',
  rejected: '已拒绝',
  cancelled: '已取消',
});

function ApprovalMark({ approval }: { approval: ApprovalInfo }) {
  useLocale();
  return (
    <span className={`appr is-${approval.state}`}>
      <ApprovalSeal approval={approval} />
      <span className="appr-t">{MARK_TEXT[approval.state] ?? MARK_TEXT.pending}</span>
    </span>
  );
}

function ApprovalSeal({ approval }: { approval: ApprovalInfo }) {
  useLocale();
  const map: Record<string, [SealKind, string]> = {
    pending: ['pending', tx("等你批准")],
    approved: ['approve', tx("你批准了")],
    auto: ['auto', tx("自动放行（旧记录）")],
    rejected: ['reject', tx("你拒绝了")],
    cancelled: ['reject', tx("已取消")],
  };
  // 只在“等你批准 → 批准”这一刻按下去，刷新页面时不重复播放
  const previous = useRef(approval.state);
  const [stamping, setStamping] = useState(false);
  useEffect(() => {
    if (previous.current === 'pending' && approval.state !== 'pending') setStamping(true);
    previous.current = approval.state;
  }, [approval.state]);
  const [kind, label] = map[approval.state] ?? map.pending;
  return <Seal kind={kind} label={label} stamping={stamping} />;
}

function Notice({ item }: { item: Extract<TimelineItem, { kind: 'notice' }> }) {
  useLocale();
  return (
    <div className={`notice notice-${item.level}`}>
      <p>{item.text}</p>
      {item.detail && <pre>{item.detail}</pre>}
    </div>
  );
}
