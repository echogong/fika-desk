import { tx, useLocale } from '../i18n';
import { useEffect, useMemo, useState } from 'react';
import type { ProjectDirectory, ProjectPreview, ProjectChanges, ProjectDiff, ProjectChange } from '../../../shared/project';
import { setDrawer, useStore } from '../store';
import { useProjectRead } from '../use-project-read';
import { DrawerShell } from './DrawerShell';
import { Back, Changes, Chevron, Doc, Download, Folder, Refresh, Search } from './Icons';
import { Markdown } from './Markdown';
import { fileLanguage, highlightLines } from '../highlight';
import { imagePreviewUrl } from '../../../shared/image-preview';
import { workspaceName } from '../format';

export function projectFileUrl(workspaceId: string, path: string, action: 'content' | 'download', revision?: number): string {
  return `/api/workspaces/${workspaceId}/files/${action}?path=${encodeURIComponent(path)}${revision === undefined ? '' : `&v=${revision}`}`;
}

function bytes(size: number): string { return size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`; }

function changeKind(entry: ProjectChange): 'untracked' | 'conflict' | 'deleted' | 'renamed' | 'added' | 'modified' {
  if (entry.index === '?') return 'untracked';
  if (entry.index === 'U' || entry.working === 'U' || ['AA', 'DD'].includes(entry.index + entry.working)) return 'conflict';
  if ((entry.index + entry.working).includes('D')) return 'deleted';
  if (entry.oldPath) return 'renamed';
  if ((entry.index + entry.working).includes('A')) return 'added';
  return 'modified';
}

function changeLabel(entry: ProjectChange): string {
  return tx({ untracked: '未跟踪', conflict: '有冲突', deleted: '已删除', renamed: '已重命名', added: '新增', modified: '修改' }[changeKind(entry)]);
}

function Empty({ title, detail }: { title: string; detail?: string }) {
  useLocale();
  return <div className="tool-empty"><Doc size={28} /><strong>{title}</strong>{detail && <p>{detail}</p>}</div>;
}

function ReadError({ message, retry }: { message: string; retry: () => void }) {
  useLocale();
  return <div className="tool-error" role="alert"><span>{message}</span><button type="button" onClick={retry}>{tx("重试")}</button></div>;
}

export function ProjectDrawer() {
  useLocale();
  const mode = useStore((s) => s.drawer);
  const workspaceId = useStore((s) => s.currentWorkspace);
  const workspace = useStore((s) => s.workspaces.find((w) => w.id === s.currentWorkspace));
  if ((mode !== 'files' && mode !== 'changes') || !workspaceId || !workspace) return null;
  return <ProjectPanel key={workspaceId} workspaceId={workspaceId} name={workspaceName(workspace)} mode={mode} />;
}

function ProjectPanel({ workspaceId, name, mode }: { workspaceId: string; name: string; mode: 'files' | 'changes' }) {
  useLocale();
  const [directory, setDirectory] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [changedFile, setChangedFile] = useState<string | null>(null);
  const [staged, setStaged] = useState(false);
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState('');
  const refresh = () => setRevision((value) => value + 1);
  const base = `/api/workspaces/${workspaceId}`;
  const folder = useProjectRead<ProjectDirectory>(mode === 'files' ? `${base}/files?path=${encodeURIComponent(directory)}` : null, revision, 7000);
  const changes = useProjectRead<ProjectChanges>(mode === 'changes' ? `${base}/changes` : null, revision, 7000);
  const preview = useProjectRead<ProjectPreview>(mode === 'files' && selected ? `${base}/files?preview=1&path=${encodeURIComponent(selected)}` : null, revision, 7000);
  const diff = useProjectRead<ProjectDiff>(mode === 'changes' && changedFile ? `${base}/changes/diff?path=${encodeURIComponent(changedFile)}&staged=${staged ? '1' : '0'}` : null, revision, 7000);
  const currentChange = changes.data?.entries.find((entry) => entry.path === changedFile);
  const chooseChange = (entry: ProjectChange) => { setChangedFile(entry.path); setStaged(entry.index !== '?' && entry.working === ' '); };
  useEffect(() => {
    if (!changes.data) return;
    const selected = changes.data.entries.find((entry) => entry.path === changedFile);
    if (!selected && changes.data.entries[0]) chooseChange(changes.data.entries[0]);
    else if (!selected) setChangedFile(null);
    else if (staged && (selected.index === ' ' || selected.index === '?')) setStaged(false);
    else if (!staged && selected.working === ' ') setStaged(true);
  }, [changes.data, changedFile, staged]);
  useEffect(() => { setFilter(''); }, [mode, directory]);
  const entries = mode === 'files' ? folder.data?.entries : changes.data?.entries;
  const displayed = entries?.filter((entry) => ('name' in entry ? entry.name : entry.path).toLocaleLowerCase().includes(filter.toLocaleLowerCase()));

  return <DrawerShell title={tx("项目文件")} subtitle={name} wide actions={<button className="icon-btn" type="button" aria-label={tx("刷新项目文件")} title={tx("刷新")} onClick={refresh}><Refresh /></button>}>
    <div className="tool-tabs" role="tablist" aria-label={tx("项目面板")}>
      <button id="project-files-tab" role="tab" aria-selected={mode === 'files'} aria-controls="project-panel" tabIndex={mode === 'files' ? 0 : -1} onClick={() => setDrawer('files')} onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setDrawer('changes'); requestAnimationFrame(() => document.getElementById('project-changes-tab')?.focus()); } }}><Folder />{tx("文件")}</button>
      <button id="project-changes-tab" role="tab" aria-selected={mode === 'changes'} aria-controls="project-panel" tabIndex={mode === 'changes' ? 0 : -1} onClick={() => setDrawer('changes')} onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); setDrawer('files'); requestAnimationFrame(() => document.getElementById('project-files-tab')?.focus()); } }}><Changes />{tx("改动")}{changes.data && <span>{changes.data.entries.length}{changes.data.truncated ? '+' : ''}</span>}</button>
    </div>
    <div id="project-panel" className="project-panel" role="tabpanel" aria-labelledby={mode === 'files' ? 'project-files-tab' : 'project-changes-tab'}>
      <div className="project-browser">
        <div className="project-browser-head">
          {mode === 'files' ? <div className="project-location">
            <button type="button" className="icon-btn" aria-label={tx("返回上一级文件夹")} disabled={!directory} onClick={() => setDirectory(directory.split('/').slice(0, -1).join('/'))}><Back /></button>
            <button type="button" className="project-root" title={tx("回到项目根目录")} onClick={() => setDirectory('')}>{directory || name}</button>
          </div> : <div className="project-location"><BranchLabel branch={changes.data?.branch} /></div>}
          <label className="tool-search"><Search /><input aria-label={mode === 'files' ? tx("筛选当前文件夹") : tx("筛选改动文件")} placeholder={mode === 'files' ? tx("筛选当前文件夹") : tx("筛选改动文件")} value={filter} onChange={(event) => setFilter(event.target.value)} /></label>
        </div>
        <div className="project-entries" aria-label={mode === 'files' ? tx("文件列表") : tx("改动文件列表")}>
          {(mode === 'files' ? folder.error : changes.error) && <ReadError message={(mode === 'files' ? folder.error : changes.error)!} retry={refresh} />}
          {mode === 'files' && displayed?.map((item) => 'directory' in item && <button key={item.path} type="button" className={`project-entry${selected === item.path && !item.directory ? ' is-selected' : ''}`} aria-pressed={!item.directory ? selected === item.path : undefined} onClick={() => item.directory ? setDirectory(item.path) : setSelected(item.path)} title={item.path}>
            {item.directory ? <Folder /> : <Doc size={16} />}<span>{item.name}</span>{item.directory ? <Chevron size={12} /> : <small>{bytes(item.size ?? 0)}</small>}
          </button>)}
          {mode === 'changes' && displayed?.map((item) => 'index' in item && <button key={item.path} type="button" className={`project-entry project-change${changedFile === item.path ? ' is-selected' : ''}`} aria-pressed={changedFile === item.path} onClick={() => chooseChange(item)} title={item.oldPath ? `${item.oldPath} → ${item.path}` : item.path}>
            <span className="change-status" data-kind={changeKind(item)}>{({ modified: 'M', deleted: 'D', renamed: 'R', conflict: '!', added: '+', untracked: '+' } as const)[changeKind(item)]}</span>
            <span>{item.path}<small>{changeLabel(item)}{item.index !== '?' && item.index !== ' ' ? tx(" · 已暂存") : ''}{item.working !== ' ' && item.index !== '?' ? tx(" · 工作区") : ''}</small></span>
          </button>)}
          {(mode === 'files' ? folder.loading : changes.loading) && !entries && <p className="tool-note" role="status">{tx("正在读取…")}</p>}
          {entries && displayed?.length === 0 && <p className="tool-note">{filter ? tx("没有匹配的文件") : mode === 'changes' ? changes.data?.repository ? tx("工作区很干净，没有改动") : tx("这个工作区还不是 Git 仓库") : tx("这个文件夹是空的")}</p>}
          {(mode === 'files' ? folder.data?.truncated : changes.data?.truncated) && <p className="tool-note">{tx("文件较多，当前显示前 500 项。")}</p>}
        </div>
      </div>
      <section className="project-preview" aria-label={mode === 'files' ? tx("文件预览") : tx("Git 差异预览")}>
        {mode === 'files' ? !selected ? <Empty title={tx("选择一个文件")} detail={tx("查看代码、文档、图片或 PDF")} /> : <>
          <div className="project-preview-head"><code title={selected}>{selected}</code>{preview.data && <span>{bytes(preview.data.size)}</span>}<a className="icon-btn" href={projectFileUrl(workspaceId, selected, 'download')} download aria-label={tx("下载当前文件")} title={tx("下载文件")}><Download /></a></div>
          {preview.error ? <ReadError message={preview.error} retry={refresh} /> : preview.data ? <FilePreview key={selected} workspaceId={workspaceId} preview={preview.data} /> : <p className="tool-note" role="status">{tx("正在打开文件…")}</p>}
        </> : !changedFile ? <Empty title={changes.data?.repository === false ? tx("选择一个 Git 项目") : tx("没有待查看的改动")} detail={tx("有文件变化时会自动更新列表")} /> : <>
          <div className="project-preview-head"><code title={changedFile}>{changedFile}</code><div className="diff-scope" role="group" aria-label={tx("比较范围")}>
            <button type="button" aria-pressed={!staged} disabled={!currentChange || currentChange.working === ' '} onClick={() => setStaged(false)}>{tx("工作区")}</button>
            <button type="button" aria-pressed={staged} disabled={!currentChange || currentChange.index === ' ' || currentChange.index === '?'} onClick={() => setStaged(true)}>{tx("已暂存")}</button>
          </div><button type="button" className="icon-btn" aria-label={tx("打开改动文件")} title={tx("打开文件")} disabled={currentChange?.working === 'D' || currentChange?.index === 'D'} onClick={() => { setSelected(changedFile); setDirectory(changedFile.split('/').slice(0, -1).join('/')); setDrawer('files'); }}><Doc size={16} /></button></div>
          {diff.error ? <ReadError message={diff.error} retry={refresh} /> : diff.data ? <GitPatch key={`${changedFile}:${staged}`} diff={diff.data} /> : <p className="tool-note" role="status">{tx("正在读取差异…")}</p>}
        </>}
      </section>
    </div>
    <footer className="tool-footer"><span>{tx("文件变化会自动刷新")}</span><span>{mode === 'files' ? tx("只读预览") : tx("Git 项目改动")}</span></footer>
  </DrawerShell>;
}

function BranchLabel({ branch }: { branch?: string }) {
  useLocale(); return <span className="project-branch">{branch ? tx("分支 · {0}", [branch]) : tx("项目改动")}</span>; }

function FilePreview({ workspaceId, preview }: { workspaceId: string; preview: ProjectPreview }) {
  useLocale();
  const [raw, setRaw] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const source = projectFileUrl(workspaceId, preview.path, 'content', preview.modifiedAt);
  useEffect(() => setMediaError(false), [source]);
  if (preview.kind === 'unsupported') return <Empty title={tx("此文件暂不支持在线预览")} detail={tx("可以下载后查看；代码和文档预览上限为 2 MB")} />;
  if (mediaError) return <Empty title={tx("文件暂时无法加载")} detail={tx("请刷新重试，或下载后查看")} />;
  if (preview.kind === 'image') return <div className="file-media"><img src={imagePreviewUrl(source, 'display')} alt={preview.name} decoding="async" onError={(event) => {
    if (event.currentTarget.getAttribute('src') !== source) event.currentTarget.src = source;
    else setMediaError(true);
  }} /></div>;
  if (preview.kind === 'pdf') return <iframe className="file-pdf" title={tx("PDF 预览：{0}", [preview.name])} src={source} />;
  if (preview.kind === 'audio') return <div className="file-media file-audio"><Doc size={32} /><strong>{preview.name}</strong><audio controls src={source} onError={() => setMediaError(true)} /></div>;
  return <>
    {preview.kind === 'markdown' && <div className="file-view-modes" role="group" aria-label={tx("文档显示方式")}><button type="button" aria-pressed={!raw} onClick={() => setRaw(false)}>{tx("预览")}</button><button type="button" aria-pressed={raw} onClick={() => setRaw(true)}>{tx("源码")}</button></div>}
    {preview.kind === 'markdown' && !raw ? <div className="file-markdown"><Markdown text={preview.text ?? ''} project={{ workspaceId, path: preview.path }} /></div> : <CodePreview text={preview.text ?? ''} path={preview.path} />}
  </>;
}

function CodePreview({ text, path }: { text: string; path: string }) {
  useLocale();
  const [expanded, setExpanded] = useState(false);
  const lines = useMemo(() => text.split('\n'), [text]);
  const shown = expanded ? lines.slice(0, 10000) : lines.slice(0, 400);
  const colored = useMemo(() => highlightLines(text.split('\n').slice(0, expanded ? 10000 : 400).join('\n'), fileLanguage(path)), [text, path, expanded]);
  return <div className="file-code-scroll"><pre className="file-code" tabIndex={0} aria-label={tx("文件源码")}>{shown.map((line, index) => <span className="file-code-line" key={index}><span className="code-line-number" aria-hidden="true">{index + 1}</span><code dangerouslySetInnerHTML={{ __html: colored[index] || ' ' }} /></span>)}</pre>{lines.length > shown.length && <button className="tool-more" type="button" onClick={() => setExpanded(!expanded)}>{expanded ? tx("文件有 {0} 行，下载可查看完整内容", [lines.length]) : tx("展开更多 · 共 {0} 行", [lines.length])}</button>}</div>;
}

function GitPatch({ diff }: { diff: ProjectDiff }) {
  useLocale();
  const [expanded, setExpanded] = useState(false);
  const lines = useMemo(() => {
    let oldLine = 0, newLine = 0;
    const rows = diff.patch.split('\n');
    if (rows.at(-1) === '') rows.pop();
    return rows.map((text) => {
      const hunk = text.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (hunk) { oldLine = Number(hunk[1]); newLine = Number(hunk[2]); }
      const meta = /^(diff |index |Index:|===|--- |\+\+\+ |new file |deleted file |old mode |new mode |similarity |dissimilarity |rename |copy |@@|\\)/.test(text);
      const kind = meta ? 'meta' : text.startsWith('+') ? 'add' : text.startsWith('-') ? 'del' : 'context';
      return { text, kind, old: meta || kind === 'add' ? '' : oldLine++, next: meta || kind === 'del' ? '' : newLine++ };
    });
  }, [diff.patch]);
  if (diff.binary) return <Empty title={tx("这是二进制文件的改动")} detail={tx("图片等文件可以切换到“文件”查看当前版本")} />;
  if (!diff.patch.trim()) return <Empty title={tx("这个范围内没有差异")} detail={tx("可以切换“工作区”或“已暂存”查看")} />;
  const shown = expanded ? lines.slice(0, 10000) : lines.slice(0, 400);
  return <div className="file-code-scroll"><pre className="git-patch" tabIndex={0} aria-label={tx("Git 文件差异")}>{shown.map((line, index) => <span key={index} className={`git-patch-line is-${line.kind}`}><span className="code-line-number" aria-hidden="true">{line.old}</span><span className="code-line-number" aria-hidden="true">{line.next}</span><code>{line.text || ' '}</code></span>)}</pre>{lines.length > shown.length && <button className="tool-more" type="button" onClick={() => setExpanded(!expanded)}>{expanded ? tx("差异超过 10000 行，请在终端查看完整内容") : tx("展开更多 · 共 {0} 行", [lines.length])}</button>}</div>;
}
