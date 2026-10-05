import { APP_NAME } from '../../../shared/brand';
import { readPreference, writePreference } from '../preferences';
import { tx, useLocale } from '../i18n';
// 左侧栏：工作区、当前工作区里的 Agent 会话；所有工作区的状态和待审批会话放在顶部看板。
// 最底下是“启动 Agent”（左侧栏唯一的主动作）和设置。
// 菜单浮在页面最上层（不被左侧栏的滚动区域裁掉），下面放不下就往上弹，再放不下就在菜单里滚动。
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { SessionMeta, WorkspaceInfo } from '../../../shared/types';
import { startAgent } from '../actions';
import { api } from '../api';
import { STATE_CLASS, STATE_LABEL, workspaceName } from '../format';
import { displayStateOf, hasUnreadCompletion } from '../session-attention';
import {
  applyServerMessage,
  closeSettings,
  getState,
  layoutOf,
  openSessionById,
  openSettings,
  selectWorkspace,
  sessionsIn,
  setAgentMenu,
  setDrawer,
  setState,
  showToast,
  useStore,
} from '../store';
import { send } from '../ws';
import { AgentIcon } from './AgentIcon';
import { Chevron, Clock, Close, Folder, Gear, PixelClose, Plus } from './Icons';
import { Chip, Dot, lampOf, Mark } from './Lamp';
import { SidebarGlassList } from './SidebarGlassList';
import { ThemeSwitch } from './ThemeSwitch';
import './sidebar-workspaces.css';

export function Sidebar() {
  useLocale();
  const workspaces = useStore((s) => s.workspaces);
  const currentWorkspace = useStore((s) => s.currentWorkspace);
  const sessions = useStore((s) => s.sessions);
  const seenCompletions = useStore((s) => s.seenCompletions);
  const layout = useStore((s) => layoutOf(s, s.currentWorkspace));
  const agents = useStore((s) => s.agents);
  const menuOpen = useStore((s) => s.agentMenu);
  const historyOpen = useStore((s) => s.drawer === 'history');
  const inSettings = useStore((s) => s.view === 'settings');
  const connected = useStore((s) => s.connected);
  const [closingWorkspaceId, setClosingWorkspaceId] = useState<string | null>(null);
  const closingWorkspace = useRef<string | null>(null);
  const restoreWorkspaceFocus = useRef(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspacesCollapsed, setWorkspacesCollapsed] = useState(() => {
    try { return readPreference('workspaces-collapsed') === '1'; } catch { return false; }
  });
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const navTrigger = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const dismiss = useRef<HTMLButtonElement>(null);
  const restoreNavFocus = useRef(false);
  const mobileModal = mobileOpen && narrow;

  useLayoutEffect(() => {
    if (!restoreWorkspaceFocus.current || closingWorkspaceId) return;
    restoreWorkspaceFocus.current = false;
    navigation.current?.querySelector<HTMLButtonElement>('.ws[aria-current="page"], .workspace-open')?.focus({ preventScroll: true });
  }, [workspaces, closingWorkspaceId]);


  const closeMobile = () => {
    restoreNavFocus.current = true;
    setMobileOpen(false);
    setAgentMenu(false);
  };

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const onChange = () => {
      setNarrow(media.matches);
      if (!media.matches) setMobileOpen(false);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useLayoutEffect(() => {
    if (!mobileModal) return;
    const side = navigation.current;
    if (!side) return;
    // 导航是移动端模态层，背景内容同时退出键盘与辅助技术的访问范围。
    const background = Array.from(side.parentElement?.children ?? [])
      .filter((el): el is HTMLElement => el instanceof HTMLElement && el !== side && !el.classList.contains('side-scrim'));
    const previousInert = background.map((el) => el.inert);
    background.forEach((el) => { el.inert = true; });
    dismiss.current?.focus();
    const focusable = () => {
      const selector = 'button, a[href], input, select, textarea, [tabindex]';
      const items = [side, pop.current].flatMap((root) => root ? Array.from(root.querySelectorAll<HTMLElement>(selector)) : []);
      return items.filter((el) => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (getState().agentMenu) {
          setAgentMenu(false);
          trigger.current?.focus();
        } else closeMobile();
      } else if (event.key === 'Tab') {
        const items = focusable();
        const index = items.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : (index + 1) % items.length;
        event.preventDefault();
        items[next]?.focus();
      }
    };
    // 捕获 Escape，避免 App 同时关闭下一层抽屉或设置页。
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      background.forEach((el, i) => { el.inert = previousInert[i]; });
      if (restoreNavFocus.current && navTrigger.current?.getClientRects().length) navTrigger.current.focus();
      restoreNavFocus.current = false;
    };
  }, [mobileModal]);

  const list = useMemo(() => (currentWorkspace ? sessionsIn(sessions, currentWorkspace) : []), [sessions, currentWorkspace]);
  const current = workspaces.find((w) => w.id === currentWorkspace);
  // 停用的不出现在菜单里（在设置页里还能看到、重新启用）
  const available = agents.filter((a) => a.available && a.enabled);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setAgentMenu(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpen]);

  // 菜单的位置：贴着“启动 Agent”按钮，下面空间不够就往上弹
  const trigger = useRef<HTMLButtonElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const [popStyle, setPopStyle] = useState<CSSProperties>({ visibility: 'hidden' });
  useLayoutEffect(() => {
    if (!menuOpen) return;
    const place = () => {
      const r = trigger.current?.getBoundingClientRect();
      if (!r) return;
      const height = pop.current?.scrollHeight ?? 0;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const down = height <= below || below >= above;
      setPopStyle({
        left: Math.max(8, Math.min(r.left, window.innerWidth - (pop.current?.offsetWidth ?? 340) - 8)),
        ...(down ? { top: r.bottom + 4 } : { bottom: window.innerHeight - r.top + 4 }),
        maxHeight: Math.max(160, down ? below : above),
      });
    };
    place();
    window.addEventListener('resize', place);
    // 左侧栏滚动时跟着按钮走
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      setPopStyle({ visibility: 'hidden' });
    };
  }, [menuOpen, available.length, current?.name, connected]);

  // 定位完成后立即进入菜单，快速按 Tab 也不会留在触发按钮上。
  useLayoutEffect(() => {
    if (menuOpen && popStyle.visibility !== 'hidden') pop.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [menuOpen, popStyle.visibility]);

  const start = (agentId: string) => {
    if (!currentWorkspace || !connected) return;
    startAgent(currentWorkspace, agentId);
    setAgentMenu(false);
    setMobileOpen(false);
  };

  const closeWorkspace = async (workspace: WorkspaceInfo) => {
    if (workspace.isDefault || workspace.fixed || !connected || closingWorkspace.current) return;
    closingWorkspace.current = workspace.id;
    setClosingWorkspaceId(workspace.id);
    try {
      await api('/api/settings/workspaces/remove', { id: workspace.id });
      // WebSocket 通常已经更新列表；只移除这个入口，保留其他页面同时添加的工作区。
      const current = getState().workspaces;
      if (current.some((w) => w.id === workspace.id)) {
        applyServerMessage({ type: 'workspaces', workspaces: current.filter((w) => w.id !== workspace.id) });
      }
      restoreWorkspaceFocus.current = true;
      showToast(tx("已关闭文件夹：{0}", [workspaceName(workspace)]));
    } catch (error) {
      showToast(error instanceof Error ? error.message : tx("出错了，稍后再试"));
    } finally {
      closingWorkspace.current = null;
      setClosingWorkspaceId(null);
    }
  };

  const rename = (id: string, title: string) => {
    send({ type: 'session:rename', id, title });
    setRenamingId(null);
  };

  /** 结束会话：Agent 停下，会话从左侧拿掉，记录留在“历史会话”里。正在干活的先确认 */
  const end = (meta: SessionMeta) => {
    const busy = meta.state === 'running' || meta.state === 'waiting' || meta.state === 'starting';
    if (busy && !window.confirm(tx("{0} 正在工作，结束会打断它。结束这个会话吗？记录会留在“历史会话”里。", [meta.agentName]))) return;
    send({ type: 'session:close', id: meta.id });
  };

  return (
    <>
    <button ref={navTrigger} className="mobile-menu icon-btn" type="button" aria-label={tx("工作区与会话")} aria-expanded={mobileOpen} aria-controls="workspace-navigation" onClick={() => setMobileOpen(!mobileOpen)}><Folder size={20} /></button>
    {mobileOpen && <button className="side-scrim" type="button" aria-label={tx("收起导航")} tabIndex={-1} onClick={closeMobile} />}
    <aside ref={navigation} id="workspace-navigation" className={`side${mobileOpen ? ' is-open' : ''}`} role={mobileModal ? 'dialog' : undefined} aria-modal={mobileModal ? true : undefined} aria-owns={mobileModal && menuOpen ? 'agent-launch-menu' : undefined} aria-label={tx("导航")}>
      <div className="brand">
        <a className="brand-home" href="#home" aria-label={`${APP_NAME} · ${tx('返回登录首页')}`} title={tx('返回登录首页')}>
          <Mark />
          <span>{APP_NAME}<small title={tx("你的多 Agent 工作台")}>{tx("你的多 Agent 工作台")}</small></span>
        </a>
        <button ref={dismiss} className="icon-btn side-dismiss" type="button" aria-label={tx("收起导航")} onClick={closeMobile}><Close /></button>
      </div>

        <div className="menu-wrap side-launch">
          <button
            ref={trigger}
            className="quiet start"
            type="button"
            aria-haspopup="menu"
            aria-controls="agent-launch-menu"
            aria-expanded={menuOpen}
            onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty('--glass-x', `${event.clientX - bounds.left}px`);
              event.currentTarget.style.setProperty('--glass-y', `${event.clientY - bounds.top}px`);
            }}
            onPointerLeave={(event) => {
              event.currentTarget.style.removeProperty('--glass-x');
              event.currentTarget.style.removeProperty('--glass-y');
            }}
            onClick={(event) => {
              event.stopPropagation();
              setAgentMenu(!menuOpen);
            }}
          >
            <Plus size={14} />{tx("启动 Agent")}<kbd>⌘K</kbd>
          </button>
          {menuOpen &&
            createPortal(
            <div
              ref={pop}
              id="agent-launch-menu"
              className="pop agent-pop"
              role="menu"
              aria-label={tx("启动本机 Agent")}
              style={popStyle}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  setAgentMenu(false);
                  trigger.current?.focus();
                  return;
                }
                if (event.key === 'Tab' && !mobileModal) {
                  setAgentMenu(false);
                  trigger.current?.focus();
                  return;
                }
                if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                event.stopPropagation();
                const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
                const index = items.indexOf(document.activeElement as HTMLButtonElement);
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
                  : event.key === 'ArrowDown' ? (index + 1) % items.length : index <= 0 ? items.length - 1 : index - 1;
                items[next]?.focus();
              }}
            >
              {current ? (
                <>
                  <h3>{tx('在 {0} 里启动', [workspaceName(current)])}</h3>
                  {available.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      role="menuitem"
                      className={`opt agent-launch-option a-${agent.color}`}
                      disabled={!connected}
                      aria-label={tx("启动 {0}", [agent.name])}
                      onClick={() => start(agent.id)}
                    >
                      <AgentIcon id={agent.id} name={agent.name} />
                      <Chip color={agent.color} name={agent.name} />
                    </button>
                  ))}
                  {available.length === 0 && <p className="hint">{tx("当前没有可启动的本机 Agent。")}</p>}
                </>
              ) : (
                // 一个工作区都没有（默认工作区也没建成）：先去打开一个文件夹
                <>
                  <p className="hint">{tx("Agent 要在一个文件夹里干活，先打开一个文件夹。")}</p>
                  <button
                    className="mi"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAgentMenu(false);
                      setMobileOpen(false);
                      setState({ dialog: 'folder' });
                    }}
                  >{tx("打开文件夹")}</button>
                </>
              )}
              {!connected && <p className="hint" role="status">{tx("连接恢复后可启动或重新扫描。")}</p>}
              <hr />
              <button className="mi" type="button" role="menuitem" disabled={!connected} onClick={() => send({ type: 'agents:rescan' })}>{tx("重新扫描")}</button>
              <button className="mi" type="button" role="menuitem" onClick={() => { openSettings('agent'); setMobileOpen(false); }}>{tx("管理 Agent")}</button>
            </div>,
              document.body,
            )}
        </div>

      <section className="side-workspaces" data-collapsed={workspacesCollapsed || undefined} aria-label={tx("工作区")}>
        <h2 className="lbl workspace-section-heading"><button className="workspace-toggle" type="button" aria-expanded={!workspacesCollapsed} aria-controls="workspace-list" onClick={() => {
          const collapsed = !workspacesCollapsed;
          setWorkspacesCollapsed(collapsed);
          try { writePreference('workspaces-collapsed', collapsed ? '1' : '0'); } catch { /* 存储禁用时仍可折叠 */ }
        }}><Chevron size={14} /><span>{tx("工作区")}</span><span className="section-count">{workspaces.length}</span></button></h2>
        <SidebarGlassList id="workspace-list" hidden={workspacesCollapsed} activeKey={currentWorkspace} activeSelector=".ws.is-on" revision={workspaces.map((w) => `${w.id}:${w.branch ?? ''}:${w.isDefault}`).join('|')}>
        {workspaces.map((w, i) => {
          const workspaceSessions = sessionsIn(sessions, w.id);
          const waiting = workspaceSessions.filter((s) => s.state === 'waiting').length;
          const running = workspaceSessions.some((s) => s.state === 'running' || s.state === 'starting');
          return (
            <div key={w.id} className="ws-row" data-workspace={w.id}>
            <button
              type="button"
              className={`row-btn ws${w.id === currentWorkspace ? ' is-on' : ''}`}
              title={w.path}
              aria-current={w.id === currentWorkspace ? 'page' : undefined}
              aria-label={`${workspaceName(w)}${waiting ? tx("，{0} 个会话等你", [waiting]) : running ? tx("，有 Agent 工作中") : ''}`}
              onClick={() => { selectWorkspace(w.id); setMobileOpen(false); }}
            >
              <Folder size={16} />
              <span className="ws-copy"><span className="nm">{workspaceName(w)}</span>{(w.branch || w.isDefault) && <span className="br">{w.branch ?? tx("默认目录")}</span>}</span>
              {waiting > 0 ? <span className="workspace-wait">{waiting}</span> : running ? <Dot state="run" /> : null}
              <kbd className="num">⌘{i + 1}</kbd>
            </button>
            {!w.isDefault && !w.fixed && (
              <button className="ws-close" type="button" aria-label={tx("关闭文件夹：{0}", [workspaceName(w)])} title={closingWorkspaceId === w.id ? tx("正在关闭文件夹") : tx("关闭文件夹（保留文件和会话记录）")} disabled={!connected || closingWorkspaceId !== null} aria-busy={closingWorkspaceId === w.id} onClick={() => void closeWorkspace(w)}>
                <PixelClose size={10} />
              </button>
            )}
            </div>
          );
        })}
        <button className="quiet workspace-open" type="button" onClick={() => { setState({ dialog: 'folder' }); setMobileOpen(false); }}>
          <Plus size={14} />{tx("打开文件夹")}</button>
        </SidebarGlassList>
      </section>

      <section className="side-sessions" aria-label="Agent">
        {current && <h2 className="lbl">{tx("当前会话")}<span className="section-count">{list.length}</span></h2>}
        <SidebarGlassList activeKey={layout.focus} activeSelector=".ag.is-focus" revision={`${list.map((meta) => meta.id).join('|')}:${renamingId ?? ''}`}>
        {list.map((meta) => {
          const unread = hasUnreadCompletion(sessions[meta.id], seenCompletions[meta.id]);
          const displayState = displayStateOf(sessions[meta.id]);
          const state = <span className={`st ${unread ? 's-ok' : STATE_CLASS[displayState]}`} title={unread ? tx("回复已完成，查看最新内容后熄灯") : undefined}>{unread ? tx("已完成") : STATE_LABEL[displayState]}</span>;
          if (renamingId === meta.id) {
            return (
              <div key={meta.id} className={`row-btn ag a-${meta.color} is-on`}>
                <Dot state={lampOf(displayState, unread)} />
                <span className="session-agent"><AgentIcon id={meta.agentId} name={meta.agentName} /><Chip color={meta.color} name={meta.agentName} /></span>
                {state}
                <input
                  className="tt-edit"
                  autoFocus
                  defaultValue={meta.title}
                  aria-label={tx("会话标题")}
                  onFocus={(event) => event.target.select()}
                  onBlur={(event) => rename(meta.id, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
                    if (event.key === 'Escape') setRenamingId(null);
                  }}
                />
              </div>
            );
          }
          return (
            <div key={meta.id} className="ag-row">
              <button
                type="button"
                className={`row-btn ag a-${meta.color}${layout.panes.includes(meta.id) ? ' is-on' : ''}${layout.focus === meta.id ? ' is-focus' : ''}`}
                aria-current={layout.focus === meta.id ? 'true' : undefined}
                title={tx("{0} · {1}\n按住 ⌥ 点击并排打开，双击修改标题", [meta.agentName, meta.title])}
                onClick={(event) => { openSessionById(meta.id, event.altKey); setMobileOpen(false); }}
                onDoubleClick={() => setRenamingId(meta.id)}
              >
                <Dot state={lampOf(displayState, unread)} />
                <span className="session-agent"><AgentIcon id={meta.agentId} name={meta.agentName} /><Chip color={meta.color} name={meta.agentName} /></span>
                {state}
                <span className="tt">{meta.title}</span>
              </button>
              <button className="ag-x" type="button" aria-label={tx("结束会话：{0}", [meta.title])} title={tx("结束会话（记录留在“历史会话”里）")} onClick={() => end(meta)}>
                <PixelClose size={10} />
              </button>
            </div>
          );
        })}
        </SidebarGlassList>
        <button
          className={`quiet session-history${historyOpen ? ' is-on' : ''}`}
          type="button"
          aria-expanded={historyOpen}
          onClick={() => { setDrawer(historyOpen ? null : 'history'); setMobileOpen(false); }}
        >
          <Clock size={14} />{tx("历史会话")}</button>
      </section>

      <div className="grow" />
      <div className="foot">
        <div className="foot-actions">
          <button
            className={`quiet settings-btn${inSettings ? ' is-on' : ''}`}
            type="button"
            aria-pressed={inSettings}
            onClick={() => { inSettings ? closeSettings() : openSettings(); setMobileOpen(false); }}
          >
            <Gear size={14} />{tx("设置")}</button>
          <ThemeSwitch />
        </div>
        <div className="server-presence"><Dot state={connected ? 'ok' : 'err'} /><span>{connected ? tx("已连接 · 会话持续在后台运行") : tx("连接中 · 正在恢复会话")}</span></div>
      </div>
    </aside>
    </>
  );
}
