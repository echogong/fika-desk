import { tx, useLocale } from '../i18n';
// 打开文件夹：在允许的目录范围里选一个文件夹作为工作区。
// 可以往下一层看，也可以新建文件夹。只能选允许范围里的，服务端会再核对一遍真实路径。
import { useEffect, useState, type FormEvent } from 'react';
import type { BrowseResult, WorkspaceInfo } from '../../../shared/types';
import { api } from '../api';
import { openSettings, selectWorkspace, setState, showToast } from '../store';
import { Chevron, Close, Folder } from './Icons';

const errorText = (e: unknown) => (e instanceof Error ? e.message : tx("出错了，稍后再试"));

export function FolderPicker() {
  useLocale();
  const [data, setData] = useState<BrowseResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [manyRoots, setManyRoots] = useState(false);

  const close = () => setState({ dialog: null });

  const load = async (dir?: string, select?: string) => {
    setError(null);
    try {
      const result = await api<BrowseResult>(`/api/settings/workspaces/browse${dir ? `?path=${encodeURIComponent(dir)}` : ''}`);
      if (!dir) {
        setManyRoots(result.entries.length > 1);
        // 只有一个允许的目录时，直接进去
        if (result.entries.length === 1) {
          void load(result.entries[0].path);
          return;
        }
      }
      setData(result);
      setSelected(select ?? null);
    } catch (e) {
      setError(errorText(e));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async (event: FormEvent) => {
    event.preventDefault();
    if (!data?.path || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ path: string }>('/api/settings/workspaces/mkdir', { parent: data.path, name: name.trim() });
      setCreating(false);
      setName('');
      await load(data.path, res.path);
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };

  // 选中的文件夹；没选时就是当前所在的这个
  const target = selected ?? (data?.path && !data.added ? data.path : null);
  const targetName = target ? (data?.entries.find((e) => e.path === target)?.displayPath ?? data?.displayPath) : null;

  const open = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ workspace: WorkspaceInfo }>('/api/settings/workspaces/add', { path: target });
      close();
      selectWorkspace(res.workspace.id);
      showToast(tx("已打开 {0}", [res.workspace.name]));
    } catch (e) {
      setError(errorText(e));
    }
    setBusy(false);
  };

  const noRoots = data && data.path === null && data.entries.length === 0;

  return (
    <div className="dialog-backdrop" onMouseDown={close}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={tx("打开文件夹")} onMouseDown={(e) => e.stopPropagation()}>
        <header className="dialog-head">
          <h2>{tx("打开文件夹")}</h2>
          <button className="icon-btn" type="button" aria-label={tx("关闭")} onClick={close}>
            <Close />
          </button>
        </header>
        <p className="dialog-sub">{tx("工作区就是一个项目文件夹，Agent 在里面读写文件、执行命令。")}</p>

        {noRoots ? (
          <div className="rootline">
            <span>{tx("还没有允许的目录范围。Agent 只能访问这个范围里的文件夹，先去设置里加一个，比如放项目的 ~/projects。")}</span>
            <button
              className="btn btn-ink"
              type="button"
              onClick={() => {
                close();
                openSettings('workspace');
              }}
            >{tx("去设置")}</button>
          </div>
        ) : (
          data && (
            <>
              <div className="rootline">
                {data.path === null ? (
                  <span>{tx("先选一个允许的目录：")}</span>
                ) : (
                  <>
                    {(data.parent || manyRoots) && (
                      <button className="btn btn-quiet btn-sm" type="button" onClick={() => void load(data.parent ?? undefined)}>{tx("‹ 上一层")}</button>
                    )}
                    <span>{tx("在") + " "}<code>{data.displayPath}</code>{" " + tx("里")}</span>
                  </>
                )}
              </div>
              <ul className="dirs">
                {data.entries.map((entry) => (
                  <li key={entry.path} className={selected === entry.path ? 'on' : entry.added ? 'added' : undefined}>
                    {data.path === null ? (
                      // 允许的目录列表：点一下就进去
                      <button className="rootpick" type="button" onClick={() => void load(entry.path)}>
                        <Folder />
                        <span className="nm">{entry.displayPath}</span>
                      </button>
                    ) : (
                      <label>
                        <input
                          type="radio"
                          name="folder"
                          checked={selected === entry.path}
                          disabled={entry.added}
                          onChange={() => setSelected(entry.path)}
                        />
                        <Folder />
                        <span className="nm">{entry.name}</span>
                        <span className="git">{entry.added ? tx("已是工作区") : entry.git ? `git  ${entry.branch ?? ''}` : ''}</span>
                      </label>
                    )}
                    <button className="into" type="button" aria-label={tx("打开 {0} 里面", [entry.name])} title={tx("看里面的文件夹")} onClick={() => void load(entry.path)}>
                      <Chevron size={14} />
                    </button>
                  </li>
                ))}
                {data.entries.length === 0 && <li className="none">{tx("这里面没有文件夹")}</li>}
              </ul>
              {data.path !== null &&
                (creating ? (
                  <form className="newdir-form" onSubmit={create}>
                    <input className="inp" autoFocus placeholder={tx("新文件夹的名字")} value={name} onChange={(e) => setName(e.target.value)} />
                    <button className="btn btn-line btn-sm" type="submit" disabled={busy || !name.trim()}>{tx("创建")}</button>
                    <button className="btn btn-quiet btn-sm" type="button" onClick={() => setCreating(false)}>{tx("取消")}</button>
                  </form>
                ) : (
                  <button className="btn btn-quiet btn-sm newdir" type="button" onClick={() => setCreating(true)}>{tx("+ 新建文件夹")}</button>
                ))}
            </>
          )
        )}

        {error && <p className="serr">{error}</p>}
        <footer className="dialog-foot">
          <span className="picked">{targetName ? <>{tx("将打开") + " "}<code>{targetName}</code></> : data?.added ? tx("这个文件夹已经是工作区了") : ''}</span>
          <button className="btn btn-quiet" type="button" onClick={close}>{tx("取消")}</button>
          <button className="btn btn-ink" type="button" disabled={!target || busy} onClick={open}>{tx("打开")}</button>
        </footer>
      </div>
    </div>
  );
}
