import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import type { WorkspaceInfo } from '../../../shared/types';
import { PROTECTED_BRANCHES, type BranchList, type CreateBranchResult, type DeleteBranchResult } from '../../../shared/branches';
import { api } from '../api';
import { setState, showToast } from '../store';
import { Branch, Plus, Trash } from './Icons';
import './composer-branch.css';
import { tx, useLocale } from '../i18n';

function requestNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `${Date.now()}-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function ComposerBranch({ workspace, disabled }: { workspace?: WorkspaceInfo; disabled: boolean }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<BranchList | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pending = useRef<string | null>(null);
  const locked = useRef(false);
  const loadVersion = useRef(0);
  const reposition = useRef<(() => void) | null>(null);
  const focusPending = useRef(false);
  const currentWorkspace = useRef(workspace?.id);
  currentWorkspace.current = workspace?.id;
  const inactive = disabled || busy || !workspace;
  const close = (restore = false) => {
    setOpen(false); loadVersion.current++;
    if (restore) trigger.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    pending.current = null; loadVersion.current++;
    setOpen(false); setInfo(null); setError(''); setFeedback('');
  }, [workspace?.id]);
  useEffect(() => { if (inactive) close(); }, [inactive]);

  const load = async () => {
    if (!workspace || inactive) return;
    const version = ++loadVersion.current;
    focusPending.current = true;
    setLoading(true); setInfo(null); setError('');
    try {
      const saved = await api<BranchList>(`/api/workspaces/${workspace.id}/branches`);
      // 返回的不是分支列表时按读取失败处理，不能让整个页面因为一次异常响应而崩溃。
      if (!saved || typeof saved.currentBranch !== 'string' || !Array.isArray(saved.branches)) throw new Error('分支列表暂时读不到，请重试');
      if (version === loadVersion.current) setInfo(saved);
    } catch (e) {
      if (version === loadVersion.current) setError(e instanceof Error ? tx(e.message) : tx('分支列表暂时读不到，请重试'));
    } finally { if (version === loadVersion.current) setLoading(false); }
  };
  const show = () => {
    if (inactive) return;
    setPosition({ visibility: 'hidden' }); setOpen(true); void load();
  };

  useLayoutEffect(() => {
    if (!open || !trigger.current || !menu.current) return;
    const place = () => {
      if (!trigger.current || !menu.current) return;
      const anchor = trigger.current.getBoundingClientRect();
      if (anchor.bottom <= 0 || anchor.top >= window.innerHeight) { close(); return; }
      const width = Math.min(320, window.innerWidth - 24);
      menu.current.style.width = `${width}px`;
      const above = anchor.top - 12, below = window.innerHeight - anchor.bottom - 12;
      const up = above >= below;
      const maxHeight = Math.max(60, Math.min(320, (up ? above : below) - 8));
      const height = Math.min(menu.current.scrollHeight, maxHeight);
      setPosition({ width, maxHeight, left: Math.max(12, Math.min(anchor.left, window.innerWidth - width - 12)), top: Math.max(12, up ? anchor.top - height - 8 : anchor.bottom + 8) });
    };
    reposition.current = place; place();
    return () => { reposition.current = null; };
  }, [open, loading, info, error]);
  useLayoutEffect(() => {
    if (!open || position.visibility === 'hidden' || !focusPending.current) return;
    const first = !loading && (menu.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]') ?? menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)'));
    (first || menu.current)?.focus({ preventScroll: true });
    if (!loading) focusPending.current = false;
  }, [open, position]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) close();
    };
    const resize = () => close(true);
    const scroll = (event: Event) => { if (!menu.current?.contains(event.target as Node)) reposition.current?.(); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [open]);

  const perform = async (switchTo?: string) => {
    if (locked.current || !workspace || inactive) return;
    const workspaceId = workspace.id;
    close(true); locked.current = true; setBusy(true);
    setFeedback(switchTo ? tx('正在切换分支') : tx('正在创建新分支'));
    try {
      // 网络中断后重试新建时沿用编号，避免重复生成分支。
      const body = switchTo ? { switchTo } : { requestId: pending.current ??= requestNonce() };
      const saved = await api<CreateBranchResult & { workspaces: WorkspaceInfo[] }>(`/api/workspaces/${workspaceId}/branches`, body);
      setState({ workspaces: saved.workspaces });
      if (currentWorkspace.current === workspaceId) {
        if (!switchTo) pending.current = null;
        const message = switchTo ? (saved.currentBranch.length <= 24 ? tx('已切换到 {0}', [saved.currentBranch]) : tx('已切换分支'))
          : saved.currentBranch === saved.branch ? tx('已创建并切换到新分支') : tx('已创建新分支');
        setFeedback(message); showToast(message);
      }
    } catch (e) {
      if (currentWorkspace.current === workspaceId) {
        const message = e instanceof Error ? tx(e.message) : tx('分支操作失败，请重试');
        setFeedback(message); showToast(message);
      }
    } finally { locked.current = false; setBusy(false); }
  };
  const remove = async (branch: string) => {
    if (locked.current || !workspace || inactive || branch === info?.currentBranch || PROTECTED_BRANCHES.includes(branch)) return;
    if (!window.confirm(tx('删除本地分支「{0}」？项目文件会保留，未合并的提交会阻止删除。', [branch]))) return;
    const workspaceId = workspace.id;
    close(true); locked.current = true; setBusy(true); setFeedback(tx('正在删除分支'));
    try {
      const saved = await api<DeleteBranchResult & { workspaces: WorkspaceInfo[] }>(`/api/workspaces/${workspaceId}/branches`, { deleteBranch: branch });
      setState({ workspaces: saved.workspaces });
      if (currentWorkspace.current === workspaceId) {
        setInfo(previous => previous && { ...previous, branches: previous.branches.filter(name => name !== branch) });
        setFeedback(tx('分支已删除')); showToast(tx('分支已删除'));
      }
    } catch (e) {
      if (currentWorkspace.current === workspaceId) {
        const message = e instanceof Error ? tx(e.message) : tx('删除分支失败，请重试');
        setFeedback(message); showToast(message);
      }
    } finally { locked.current = false; setBusy(false); }
  };
  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === 'Tab') { close(true); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    if (!buttons.length) return;
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus({ preventScroll: true });
    buttons[next].scrollIntoView({ block: 'nearest' });
  };
  const branches = info ? Array.from(new Set([info.currentBranch, ...info.branches].filter(Boolean))) : [];
  return (
    <>
      <button ref={trigger} className="composer-attach composer-attach-compact composer-branch-button" type="button"
        aria-label={tx("分支")} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        aria-busy={busy} disabled={inactive} title={workspace?.branch ? tx('切换或新建分支（当前：{0}）', [workspace.branch]) : tx('切换或新建分支')}
        onClick={() => open ? close() : show()} onKeyDown={(event) => {
          if (event.key === 'Escape' && open) { event.preventDefault(); close(true); }
          else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); if (!open) show(); }
        }}><Branch size={16} /><span className="composer-control-label">{workspace?.branch ?? tx("分支")}</span></button>
      <span className="sr-only" role="status">{feedback}</span>
      {open && createPortal(
        <div ref={menu} id={menuId} className="select-menu composer-branch-menu" role="menu" aria-label={tx("分支")} tabIndex={-1}
          style={position} onKeyDown={onMenuKey} onBlur={(event) => {
            const next = event.relatedTarget as Node | null;
            if (next && !menu.current?.contains(next) && !trigger.current?.contains(next)) close();
          }}>
          <div className="select-menu-label" role="presentation">{tx("切换分支")}</div>
          {loading ? <p className="composer-branch-note" role="status">{tx("加载中…")}</p> : error ? <>
            <p className="composer-branch-note" role="alert">{error}</p>
            <button className="select-option composer-branch-option" type="button" role="menuitem" onClick={() => void load()}>{tx("重新加载")}</button>
          </> : branches.map(branch => (
            <div className="composer-branch-row" key={branch} role="presentation">
              <button className="select-option composer-branch-option" type="button" role="menuitemradio"
                aria-checked={branch === info?.currentBranch} onClick={() => branch === info?.currentBranch ? close(true) : void perform(branch)}>
                <span className="select-option-copy">{branch}</span>{branch === info?.currentBranch && <small>{tx("当前")}</small>}
              </button>
              {branch !== info?.currentBranch && !PROTECTED_BRANCHES.includes(branch) && (
                <button className="composer-branch-delete" type="button" role="menuitem" aria-label={tx('删除分支 {0}', [branch])}
                  title={tx('删除分支 {0}', [branch])} onClick={() => void remove(branch)}><Trash size={14} /></button>
              )}
            </div>
          ))}
          <button className="select-option composer-branch-option composer-branch-create" type="button" role="menuitem"
            disabled={loading || !!error} onClick={() => void perform()}><span><Plus size={14} />{tx("新建分支")}</span></button>
        </div>, document.body,
      )}
    </>
  );
}
