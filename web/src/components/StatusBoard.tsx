import { tx, useLocale, localizedLabels } from '../i18n';
// 顶部安灯看板：汇总所有工作区里需要看的会话，等得最久的排在最前；计数是筛选按钮，点一下只看这种状态的会话。
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { SessionMeta } from '../../../shared/types';
import { duration, STATE_LABEL, workspaceName } from '../format';
import { displayStateOf, hasUnreadCompletion } from '../session-attention';
import { layoutOf, openSessionById, setDrawer, useStore } from '../store';
import { pendingApprovals } from './ApprovalBar';
import { Dot, lampOf, type LampState } from './Lamp';
import { Branch, Changes, Folder } from './Icons';
import { AgentIcon } from './AgentIcon';

type BoardState = LampState;
interface BoardSession {
  meta: SessionMeta;
  since: number;
  state: BoardState;
}

const STATES: { state: BoardState; label: string }[] = localizedLabels([
  { state: 'wait', label: '等你' },
  { state: 'run', label: '工作中' },
  { state: 'ok', label: '已完成' },
  { state: 'err', label: '出错' },
]);

type Filter = BoardState | 'all';

function waitText(since: number, now: number): string {
  const minutes = Math.max(0, Math.floor((now - since) / 60_000));
  return minutes ? tx("已等 {0}", [duration(minutes * 60_000)]) : tx("已等不到 1 分钟");
}

export function StatusBoard() {
  useLocale();
  const sessions = useStore((s) => s.sessions);
  const seenCompletions = useStore((s) => s.seenCompletions);
  const workspaces = useStore((s) => s.workspaces);
  const currentWorkspace = useStore((s) => s.currentWorkspace);
  const drawer = useStore((s) => s.drawer);
  const layout = useStore((s) => layoutOf(s, s.currentWorkspace));
  const [now, setNow] = useState(Date.now);
  const [picked, setPicked] = useState<Filter>('all');
  const strip = useRef<HTMLDivElement>(null);
  // 卡片放不下时：两边是否还有内容（用来显示渐隐），以及右边被藏起来的卡片
  const [edges, setEdges] = useState({ left: false, right: false, hidden: [] as string[], before: [] as string[], next: 0 });

  const groups = useMemo(() => {
    const result: Record<BoardState, BoardSession[]> = { wait: [], run: [], ok: [], idle: [], err: [] };
    for (const session of Object.values(sessions)) {
      const { meta, timeline } = session;
      // 审批请求的时间不会随其他会话更新而改变，等待时长从这里算。
      const since = meta.state === 'waiting' ? (pendingApprovals(timeline)[0]?.at ?? meta.updatedAt) : meta.updatedAt;
      const state = lampOf(displayStateOf(session), hasUnreadCompletion(session, seenCompletions[meta.id]));
      result[state].push({ meta, since, state });
    }
    for (const list of Object.values(result)) list.sort((a, b) => a.since - b.since);
    return result;
  }, [sessions, seenCompletions]);

  const hasWaiting = groups.wait.length > 0;
  useEffect(() => {
    if (!hasWaiting) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, [hasWaiting]);

  const all = [...groups.wait, ...groups.run, ...groups.err, ...groups.ok];
  // 筛选的那种状态没有会话了，就回到“全部”，不留一个空的看板。
  const filter: Filter = picked !== 'all' && groups[picked].length === 0 ? 'all' : picked;
  const cards = filter === 'all' ? all : groups[filter];
  const cardKey = cards.map(({ meta }) => meta.id).join('|');
  useLayoutEffect(() => {
    const el = strip.current;
    if (!el) return;
    const measure = () => {
      const view = el.getBoundingClientRect();
      const cells = Array.from(el.querySelectorAll<HTMLElement>('.board-cell'));
      // 一半以上在可见区域右边的卡片算作“被藏起来”，计入 +N；点 +N 滚到第一张被切到的卡片
      const cutCells = cells.filter(cell => cell.getBoundingClientRect().right > view.right + 8);
      const hiddenCells = cells.filter(cell => { const r = cell.getBoundingClientRect(); return r.left + r.width / 2 > view.right; });
      const left = el.scrollLeft > 2;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      const hidden = hiddenCells.map(cell => cell.title);
      // 左边同理：一半以上滚出左边的卡片计入左边的 +N
      const before = cells.filter(cell => { const r = cell.getBoundingClientRect(); return r.left + r.width / 2 < view.left; }).map(cell => cell.title);
      const next = cutCells.length ? el.scrollLeft + cutCells[0].getBoundingClientRect().left - view.left : 0;
      setEdges(prev => prev.left === left && prev.right === right && prev.next === next && prev.hidden.join('\n') === hidden.join('\n') && prev.before.join('\n') === before.join('\n') ? prev : { left, right, hidden, before, next });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    // 鼠标滚轮上下滚也能左右翻这一行，不用找横向滚动条
    const wheel = (event: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => { observer.disconnect(); el.removeEventListener('scroll', measure); el.removeEventListener('wheel', wheel); };
  }, [cardKey, now]);
  const showMore = () => {
    const el = strip.current;
    if (!el) return;
    // 减少动态效果时、页面不在前台时（浏览器会暂停平滑滚动）直接跳过去
    const smooth = document.visibilityState === 'visible' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: Math.max(0, edges.next - 4), behavior: smooth ? 'smooth' : 'auto' });
  };
  /** 往回翻一组：大约一屏宽，留一点重叠 */
  const showPrevious = () => {
    const el = strip.current;
    if (!el) return;
    const smooth = document.visibilityState === 'visible' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: Math.max(0, el.scrollLeft - el.clientWidth + 40), behavior: smooth ? 'smooth' : 'auto' });
  };
  const visibleStates = STATES.filter(({ state }) => (state !== 'err' && state !== 'ok') || groups[state].length > 0);
  const current = workspaces.find((w) => w.id === currentWorkspace);

  return (
    <div className="workspace-overview">
      <header className="workspace-header">
        <div className="workspace-heading">
          <h1 className="workspace-title">{tx("工作台")}</h1>
          <div className="workspace-context" aria-label={tx("当前工作区：{0}", [current ? workspaceName(current) : tx("尚未选择")])}>
            <Folder size={14} />
            <span className="workspace-name" title={current ? workspaceName(current) : undefined}>{current ? workspaceName(current) : tx("选择工作区")}</span>
            {current?.branch && <span className="workspace-branch" title={current.branch}><Branch />{current.branch}</span>}
          </div>
        </div>
        <span className="sr-only" role="status" aria-atomic="true">
          {visibleStates.map(({ state, label }) => tx("{0} {1} 个会话", [label, groups[state].length])).join('，')}
        </span>
        <div className="board-summary">
          <div className="workspace-tools" aria-label={tx("当前项目工具")}>
            <button type="button" aria-label={tx("文件")} title={tx("浏览项目文件")} aria-expanded={drawer === 'files'} disabled={!currentWorkspace} onClick={() => setDrawer('files')}><Folder size={14} /><span>{tx("文件")}</span></button>
            <button type="button" aria-label={tx("改动")} title={tx("查看项目改动")} aria-expanded={drawer === 'changes'} disabled={!currentWorkspace} onClick={() => setDrawer('changes')}><Changes size={14} /><span>{tx("改动")}</span></button>
          </div>
          <span className="board-scope">{tx("所有工作区")}</span>
          <div className="board-counts" role="group" aria-label={tx("按状态筛选所有工作区的会话")}>
            <button className="board-count" data-s="all" type="button" disabled={all.length === 0} aria-pressed={filter === 'all'} onClick={() => setPicked('all')}>
              <span>{tx("全部")}</span>
              <strong>{all.length}</strong>
            </button>
            {visibleStates.map(({ state, label }) => (
              <button
                key={state}
                className="board-count"
                data-s={state}
                type="button"
                disabled={groups[state].length === 0}
                aria-pressed={filter === state}
                aria-label={tx("只看{0}的会话，共 {1} 个", [label, groups[state].length])}
                onClick={() => setPicked(filter === state ? 'all' : state)}
              >
                <Dot state={state} animated={false} />
                <span>{label}</span>
                <strong>{groups[state].length}</strong>
              </button>
            ))}
          </div>
      </div>
      </header>
      <section className={`status-board${all.length ? '' : ' is-calm'}`} aria-label={tx("Agent 状态看板")}>
        <span className="board-caption">{tx("全局动态")}</span>
        <div className={`board-strip${edges.left ? ' has-left' : ''}${edges.right ? ' has-right' : ''}`}>
        {edges.before.length > 0 && (
          <button className="board-more" type="button" onClick={showPrevious}
            title={tx("前面还有 {0} 个会话：", [edges.before.length]) + '\n' + edges.before.join('\n')}
            aria-label={tx("前面还有 {0} 个会话，滚回上一组", [edges.before.length])}>+{edges.before.length}</button>
        )}
        <div ref={strip} className="board-sessions" aria-label={tx("进行中和待查看的会话")}>
          {cards.map(({ meta, since, state }) => {
            const matchedWorkspace = workspaces.find((w) => w.id === meta.workspaceId);
            const workspace = matchedWorkspace ? workspaceName(matchedWorkspace) : meta.cwd;
            const shown = meta.workspaceId === currentWorkspace && layout.panes.includes(meta.id) && (!layout.maxed || layout.maxed === meta.id);
            const status = state === 'wait' ? waitText(since, now) : state === 'ok' ? tx("已完成 · 未读") : STATE_LABEL[displayStateOf(sessions[meta.id])];
            return (
              <button
                key={meta.id}
                className={`board-cell${shown ? ' is-shown' : ''}`}
                data-s={state}
                type="button"
                title={`${meta.agentName} · ${workspace} · ${meta.title} · ${status}`}
                aria-current={shown && layout.focus === meta.id ? 'true' : undefined}
                onClick={(event) => openSessionById(meta.id, event.altKey)}
              >
                <Dot state={state} />
                <span className="board-identity">
                  <AgentIcon id={meta.agentId} name={meta.agentName} />
                  <strong>{meta.agentName}</strong>
                  <span>{workspace}</span>
                </span>
                <span className="board-state">{status}</span>
                <span className="board-title">{meta.title}</span>
              </button>
            );
          })}
          {all.length === 0 && <span className="board-calm">{tx("当前没有进行中的会话")}</span>}
        </div>
        {edges.hidden.length > 0 && (
          <button className="board-more" type="button" onClick={showMore}
            title={tx("还有 {0} 个会话：", [edges.hidden.length]) + '\n' + edges.hidden.join('\n')}
            aria-label={tx("还有 {0} 个会话，滚到下一组", [edges.hidden.length])}>+{edges.hidden.length}</button>
        )}
        </div>
      </section>
    </div>
  );
}
