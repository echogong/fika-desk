import { APP_NAME } from '../../shared/brand';
import { tx, useLocale } from './i18n';
// 整体布局：左侧栏（工作区、会话）+ 顶部状态看板 + 右侧 Agent 窗口自动平铺。另外处理快捷键、配色和标签页标题。
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { pendingApprovals, decide, quickAllow } from './components/ApprovalBar';
import { FolderPicker } from './components/FolderPicker';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ProjectDrawer } from './components/ProjectDrawer';
import './project-tools.css';
import { Pane } from './components/Pane';
import { Settings } from './components/settings/Settings';
import { Sidebar } from './components/Sidebar';
import { StatusBoard } from './components/StatusBoard';
import { WorkspaceWelcome } from './components/WorkspaceWelcome';
import {
  addPane,
  closeSettings,
  currentSession,
  getState,
  layoutOf,
  selectWorkspace,
  setAgentMenu,
  setDrawer,
  setState,
  useStore,
} from './store';

/** 每列至少这么宽，屏幕不够时减少列数 */
const MIN_COLUMN = 400;

/** 2 个左右并排，3 个排成三列，4 个排成田字格，更多的三列往下排 */
function columnsFor(count: number, width: number, gap: number): number {
  let cols = count <= 3 ? count : count === 4 ? 2 : 3;
  while (cols > 1 && (width - (cols - 1) * gap) / cols < MIN_COLUMN) cols--;
  return Math.max(cols, 1);
}

/** 读取网格实际内容宽度与列间距，侧边留白不计入窗口可用宽度。 */
function useGridSize(ref: RefObject<HTMLElement | null>): { width: number; gap: number } {
  const [size, setSize] = useState({ width: 0, gap: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (contentWidth?: number) => {
      const style = getComputedStyle(el);
      const width = Math.max(0, contentWidth ?? el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
      const gap = parseFloat(style.columnGap) || 0;
      setSize((previous) => previous.width === width && previous.gap === gap ? previous : { width, gap });
    };
    measure();
    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    observer.observe(el);
    // 断点可能只改变 gap，因此窗口变化时也重新读取计算样式。
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [ref]);
  return size;
}

export function App() {
  useLocale();
  const ready = useStore((s) => s.ready);
  const connected = useStore((s) => s.connected);
  const sessions = useStore((s) => s.sessions);
  const layout = useStore((s) => layoutOf(s, s.currentWorkspace));
  const toast = useStore((s) => s.toast);
  const currentWorkspace = useStore((s) => s.currentWorkspace);
  const workspaces = useStore((s) => s.workspaces);
  const view = useStore((s) => s.view);
  const dialog = useStore((s) => s.dialog);
  const panesRef = useRef<HTMLElement>(null);
  const { width, gap } = useGridSize(panesRef);

  // 标签页标题显示等你批准的数量
  useEffect(() => {
    const waiting = Object.values(sessions).filter((s) => s.meta.state === 'waiting').length;
    document.title = (waiting ? `(${waiting}) ` : '') + APP_NAME;
  }, [sessions]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // 抽屉和原生图片查看器处理自己的键盘事件，避免关闭上层时同时关掉下层。
      if (event.defaultPrevented || getState().drawer || document.querySelector('dialog[open]')) return;
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) {
        if (event.key === 'Escape') {
          const s = getState();
          // 先关弹窗、菜单和抽屉，再按一次才离开设置页
          if (s.dialog) {
            setState({ dialog: null });
          } else if (s.agentMenu || s.drawer) {
            setAgentMenu(false);
            setDrawer(null);
          } else if (s.view === 'settings' && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement)) {
            closeSettings();
          }
        }
        return;
      }
      if (event.key === 'Enter') {
        const current = currentSession(getState());
        const target = event.target as HTMLElement;
        const typing = target instanceof HTMLTextAreaElement && target.value.trim();
        if (!current || typing) return;
        const first = pendingApprovals(current.timeline)[0];
        if (first) {
          event.preventDefault();
          const allow = quickAllow(first);
          if (allow) decide(current.meta, first, allow.optionId);
        }
      } else if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setAgentMenu(!getState().agentMenu);
      } else if (event.key === '\\') {
        // 再开一个窗口；所有会话都已经在窗口里了，就打开“启动 Agent”
        event.preventDefault();
        if (!addPane()) setAgentMenu(true);
      } else if (/^[1-9]$/.test(event.key)) {
        const w = getState().workspaces[Number(event.key) - 1];
        if (w) {
          event.preventDefault();
          selectWorkspace(w.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const workspace = workspaces.find((w) => w.id === currentWorkspace);
  const panes = layout.panes.filter((id) => sessions[id]);
  const cols = columnsFor(layout.maxed ? 1 : panes.length, width, gap);
  // 最后一行没排满时，最后一个窗口横跨剩下的列，不留空格（比如 3 个窗口只放得下 2 列时，第 3 个占满下面一整行）
  const lastSpan = layout.maxed || !panes.length ? 1 : cols - ((panes.length - 1) % cols);
  const gridStyle = { '--cols': cols, '--last-span': lastSpan } as CSSProperties;

  return (
    <div className="app">
      <Sidebar />
      {view === 'settings' && <Settings />}
      <div className="work" hidden={view === 'settings'}>
        <StatusBoard />
        <main className={`panes${panes.length ? '' : ' has-welcome'}`} ref={panesRef} style={gridStyle}>
          {panes.length > 0 ? (
            panes.map((id) => (
              <Pane
                key={id}
                session={sessions[id]}
                focused={id === layout.focus}
                multi={panes.length > 1}
                maxed={layout.maxed === id}
                hidden={layout.maxed !== null && layout.maxed !== id}
              />
            ))
          ) : (
            <WorkspaceWelcome ready={ready} connected={connected} workspace={workspace} />
          )}
        </main>
      </div>
      <HistoryDrawer />
      <ProjectDrawer />
      {dialog === 'folder' && <FolderPicker />}
      {ready && !connected && <div className="conn">{tx("和服务的连接断开了，正在重新连接…")}</div>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
