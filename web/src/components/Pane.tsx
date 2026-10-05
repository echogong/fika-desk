import { tx, useLocale } from '../i18n';
// 一个 Agent 窗口：标题栏、对话记录、底部的审批条和输入框。
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SessionSnapshot } from '../../../shared/types';
import { STATE_CLASS, STATE_LABEL } from '../format';
import { completionOf, displayStateOf } from '../session-attention';
import { addPane, closePane, focusPane, setAgentMenu, setState, toggleMax, useStore } from '../store';
import { useCompletionRead } from '../use-completion-read';
import { send } from '../ws';
import { downloadSession } from '../download-session';
import { AgentIcon } from './AgentIcon';
import { ApprovalBar, pendingApprovals } from './ApprovalBar';
import { Composer } from './Composer';
import { Close, More } from './Icons';
import { Chip, Dot, lampOf } from './Lamp';
import { Log } from './Log';

interface PaneProps {
  session: SessionSnapshot;
  /** 当前窗口：边线略亮，⌘↵ 批准的是它 */
  focused: boolean;
  /** 同时开着不止一个窗口 */
  multi: boolean;
  maxed: boolean;
  /** 别的窗口放大时藏起来（不卸载，保留滚动位置和没发出去的草稿） */
  hidden: boolean;
}

export const Pane = memo(function Pane({ session, focused, multi, maxed, hidden }: PaneProps) {
  useLocale();
  const { meta, timeline } = session;
  const home = useStore((s) => s.home);
  const workspaces = useStore((s) => s.workspaces);
  const seenTurn = useStore((s) => s.seenCompletions[meta.id]);
  const unobstructed = useStore((s) => s.view === 'panes' && !s.dialog && !s.drawer && !s.agentMenu);
  const workspace = workspaces.find((w) => w.id === meta.workspaceId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const lastScrollRef = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const pending = pendingApprovals(timeline);
  /** Agent 出错或意外退出 */
  const dead = meta.state === 'error' || meta.state === 'exited';
  /** 服务重启后恢复出来的会话，Agent 还没启动 */
  const resting = meta.state === 'stopped';
  const completedTurn = completionOf(session);
  const unread = completedTurn !== null && completedTurn !== seenTurn;
  const displayState = displayStateOf(session);
  const lamp = lampOf(displayState, unread);
  const stateLabel = unread ? tx("已完成") : STATE_LABEL[displayState];
  useCompletionRead(meta.id, completedTurn, unread && focused && !hidden && unobstructed && !menuOpen && !renaming, tailRef);

  // 用户在底部时，新内容进来自动滚到底；往上翻看时不打扰
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current && !hidden) el.scrollTop = el.scrollHeight;
  }, [timeline, meta.state, hidden]);

  // 图片加载和草稿预览会改变高度：仍在底部时继续跟随，往上翻看时保持位置。
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || hidden) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { if (stickRef.current) el.scrollTop = el.scrollHeight; });
    });
    observer.observe(el);
    const log = el.querySelector('.log');
    if (log) observer.observe(log);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [hidden]);

  // 从隐藏恢复时回到原来的位置
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && !hidden) el.scrollTop = stickRef.current ? el.scrollHeight : lastScrollRef.current;
  }, [hidden]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpen]);

  const menuItem = (label: string, action: () => void, hint?: string, danger?: boolean) => (
    <button
      className={`mi${danger ? ' danger' : ''}`}
      type="button"
      onClick={(event) => {
        // 不让这次点击传到外面，免得刚打开的“启动 Agent”菜单被立刻关掉
        event.stopPropagation();
        setMenuOpen(false);
        action();
      }}
    >
      {label}
      {hint && <span className="k">{hint}</span>}
    </button>
  );

  return (
    <section
      className={`pane a-${meta.color}${focused ? ' is-focus' : ''}`}
      data-s={lamp}
      hidden={hidden}
      aria-label={`${meta.title}（${stateLabel}）`}
      onMouseDown={() => focusPane(meta.id)}
      onFocus={() => focusPane(meta.id)}
    >
      <header
        className="phead"
        onDoubleClick={(event) => {
          if (multi && !(event.target as HTMLElement).closest('button, input, .pop')) toggleMax(meta.id);
        }}
      >
        <span className="pane-avatar" aria-hidden="true"><AgentIcon id={meta.agentId} name={meta.agentName} /></span>
        <div className="pane-heading">
          <div className="pane-byline"><Dot state={lamp} /><Chip color={meta.color} name={meta.agentName} size="lg" /><span className={`state ${unread ? 's-ok' : STATE_CLASS[displayState]}`}>{meta.state === 'waiting' ? tx("等你批准") : stateLabel}</span></div>
          {renaming ? (
            <input
              className="rename"
              autoFocus
              defaultValue={meta.title}
              aria-label={tx("会话标题")}
              onBlur={(event) => {
                send({ type: 'session:rename', id: meta.id, title: event.target.value });
                setRenaming(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
                if (event.key === 'Escape') setRenaming(false);
              }}
            />
          ) : (
            <h2 className="t" title={multi ? tx("{0}（双击{1}）", [meta.title, maxed ? tx("还原") : tx("放大")]) : meta.title}>
              {meta.title}
            </h2>
          )}
        </div>
        {maxed && (
          <button className="btn btn-quiet btn-sm" type="button" onClick={() => toggleMax(meta.id)}>{tx("还原")}</button>
        )}
        <div className="menu-wrap">
          <button
            className="icon-btn"
            type="button"
            aria-label={tx("更多")}
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <More />
          </button>
          {menuOpen && (
            <div className="pop pane-pop" role="menu">
              {menuItem(tx("修改标题"), () => setRenaming(true))}
              {menuItem(tx("导出为 Markdown"), () => { void downloadSession(meta.workspaceId, meta.id).catch((error) => setState({ toast: error instanceof Error ? error.message : tx("导出失败") })); })}
              {menuItem(tx("再开一个窗口"), () => addPane() || setAgentMenu(true), '⌘\\')}
              {multi && menuItem(maxed ? tx("还原") : tx("放大这个窗口"), () => toggleMax(meta.id), tx("双击标题"))}
              {menuItem(`${resting ? tx("启动") : tx("重新启动")} ${meta.agentName}`, () => send({ type: 'session:restart', id: meta.id }))}
              <hr />
              {menuItem(
                tx("结束会话"),
                () => {
                  if (window.confirm(tx("结束这个会话？{0} 会停止运行，对话记录留在“历史会话”里，以后还能接着聊。", [meta.agentName]))) {
                    send({ type: 'session:close', id: meta.id });
                  }
                },
                undefined,
                true,
              )}
            </div>
          )}
        </div>
        {multi && !maxed && (
          <button
            className="icon-btn btn-close"
            type="button"
            aria-label={tx("关闭这个窗口")}
            title={tx("关闭窗口（会话还在后台运行，左侧点一下能再打开）")}
            onClick={() => closePane(meta.id)}
          >
            <Close />
          </button>
        )}
      </header>

      <div
        className="scroll"
        ref={scrollRef}
        onScroll={(event) => {
          if (hidden) return;
          const el = event.currentTarget;
          lastScrollRef.current = el.scrollTop;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        <Log meta={meta} timeline={timeline} tail={pending.length > 0 ? <ApprovalBar meta={meta} pending={pending} home={home} focused={focused} /> : null} />
        <div ref={tailRef} className="read-tail" aria-hidden="true" />
      </div>

      <footer className="dock">
        {dead && (
          <div className="stopped">
            <span>{meta.error ?? tx("{0} 没有在运行", [meta.agentName])}</span>
            <button className="btn btn-ink" type="button" onClick={() => send({ type: 'session:restart', id: meta.id })}>{tx("重新启动")}</button>
          </div>
        )}
        {resting && (
          <div className="stopped">
            <span>{meta.agentName}{" " + tx("没有在运行。发消息或点“继续”，会接着之前的对话。")}</span>
            <button className="btn btn-line" type="button" onClick={() => send({ type: 'session:restart', id: meta.id })}>{tx("继续")}</button>
          </div>
        )}
        <Composer meta={meta} workspace={workspace} home={home} />
      </footer>
    </section>
  );
});
