import { tx, useLocale } from '../../i18n';
// 设置页 · 工作区：允许的目录范围、工作区列表、同时运行上限。
import { useEffect, useState, type FormEvent } from 'react';
import type { WorkspaceSettingsView } from '../../../../shared/types';
import { api } from '../../api';
import { workspaceName } from '../../format';
import { setState, showToast, useStore } from '../../store';
import { Plus } from '../Icons';
import './workspace-settings.css';

const errorText = (e: unknown) => (e instanceof Error ? e.message : tx("出错了，稍后再试"));

export function WorkspaceTab() {
  useLocale();
  const [data, setData] = useState<WorkspaceSettingsView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [root, setRoot] = useState('');
  // 在别处（打开文件夹、别的页面）增删了工作区，这里跟着刷新
  const workspaces = useStore((s) => s.workspaces);

  useEffect(() => {
    api<WorkspaceSettingsView>('/api/settings/workspaces').then(setData, (e) => setError(errorText(e)));
  }, [workspaces]);

  const run = async (path: string, body: unknown, done: string) => {
    setBusy(true);
    setError(null);
    try {
      setData(await api<WorkspaceSettingsView>(path, body));
      showToast(done);
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addRoot = async (event: FormEvent) => {
    event.preventDefault();
    if (root.trim() && (await run('/api/settings/workspaces/roots', { path: root.trim() }, tx("已添加")))) setRoot('');
  };

  return (
    <>
      <header className="shead workspace-settings-head">
        <div className="txt">
          <h2>{tx("工作区")}</h2>
          <p>{tx("管理运行 Fika Desk 的电脑上的项目文件夹，以及网页可添加项目的目录范围。")}</p>
        </div>
      </header>
      {error && <p className="serr">{error}</p>}
      {data && (
        <>
          <div className="workspace-heading">
            <h3>{tx("项目文件夹")}</h3>
            <button className="btn btn-line" type="button" disabled={busy} onClick={() => setState({ dialog: 'folder' })}><Plus size={14} />{tx("打开文件夹")}</button>
          </div>
          {data.workspaces.length > 0 ? (
            <ul className="roots workspace-list">
              {data.workspaces.map((w) => (
                <li key={w.id}>
                  <div className="workspace-info">
                    <span className="wsn">{workspaceName(w)}</span>
                    <code>{w.displayPath}</code>
                  </div>
                  <div className="workspace-meta">
                    {w.branch && <span className="note">{w.branch}</span>}
                    {w.live > 0 && <span className="note">{tx('已启动 {0} 个 Agent', [w.live])}</span>}
                    {w.isDefault ? (
                      <span className="note">{tx("默认工作区")}</span>
                    ) : w.fixed ? (
                      <span className="note">{tx("系统预设")}</span>
                    ) : (
                      <button
                        className="btn btn-quiet btn-sm"
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(tx("把 {0} 从工作区里拿掉？文件夹里的东西不会动。", [w.name]))) {
                            void run('/api/settings/workspaces/remove', { id: w.id }, tx("已移除 {0}", [w.name]));
                          }
                        }}
                      >{tx("移除")}</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="help">{tx("还没有工作区。")}</p>
          )}
          <p className="help workspace-project-help">{tx("每个工作区对应一个项目文件夹。移除只移除列表入口，文件和历史会话仍会保留；有 Agent 已启动时，需要先结束会话。")}</p>

          <details className="workspace-advanced">
            <summary><span>{tx("高级设置")}</span><span className="workspace-summary-note">{tx("目录范围与运行上限")}</span></summary>
            <div className="workspace-advanced-content">
              <h3>{tx("可添加项目的目录")}</h3>
              <p className="help">{tx("网页可以从以下目录及其子目录选择项目文件夹。")}</p>
              {data.roots.length > 0 ? (
                <ul className="roots workspace-roots">
                  {data.roots.map((r) => (
                    <li key={r.path}>
                      <code>{r.displayPath}</code>
                      <button className="btn btn-quiet btn-sm" type="button" disabled={busy}
                        onClick={() => void run('/api/settings/workspaces/roots/remove', { path: r.path }, tx("已移除"))}>{tx("移除")}</button>
                    </li>
                  ))}
                </ul>
              ) : <p className="help">{tx("还没有。先添加一个存放项目的目录。")}</p>}
              <label className="workspace-root-label" htmlFor="workspace-root-path">{tx("添加允许的目录")}</label>
              <form className="rootadd" onSubmit={addRoot}>
                <input id="workspace-root-path" className="inp mono" placeholder={tx("完整路径，比如 ~/projects")}
                  spellCheck={false} value={root} onChange={(e) => setRoot(e.target.value)} />
                <button className="btn btn-line" type="submit" disabled={busy || !root.trim()}>{tx("添加目录")}</button>
              </form>
              <p className="help">{tx("~ 表示服务器用户的主目录。想收窄选择范围，先添加存放项目的目录，再移除主目录。")}</p>

              <h3>{tx("同时运行上限")}</h3>
              <div className="workspace-limit-row">
                <div className="stepper">
                  <button type="button" aria-label={tx("减少运行上限")} disabled={busy || data.limit <= 1}
                    onClick={() => void run('/api/settings/workspaces/limit', { limit: data.limit - 1 }, tx("上限改为 {0}", [data.limit - 1]))}>−</button>
                  <span>{data.limit}</span>
                  <button type="button" aria-label={tx("增加运行上限")} disabled={busy || data.limit >= 20}
                    onClick={() => void run('/api/settings/workspaces/limit', { limit: data.limit + 1 }, tx("上限改为 {0}", [data.limit + 1]))}>+</button>
                </div>
                <span className="workspace-limit-status" role="status">{tx('当前已启动 {0} 个 Agent，上限 {1} 个', [data.running, data.limit])}</span>
              </div>
              <p className="help">{tx("空闲和等待审批的 Agent 也占用名额。达到上限时，新启动前需要先结束一个会话。")}</p>
            </div>
          </details>
        </>
      )}
    </>
  );
}
