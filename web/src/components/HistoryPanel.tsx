import { tx, useLocale } from '../i18n';
import { useEffect, useMemo, useState } from 'react';
import type { HistoryMatch, HistorySearch } from '../../../shared/project';
import { openHistoryItem, requestHistory } from '../actions';
import { ago } from '../format';
import { downloadSession } from '../download-session';
import { setDrawer, useStore } from '../store';
import { useProjectRead } from '../use-project-read';
import { AgentIcon } from './AgentIcon';
import { DrawerShell } from './DrawerShell';
import { Close, Download, Refresh, Search } from './Icons';

function highlight(text: string, query: string) {
  const offset = query ? text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) : -1;
  return offset < 0 ? text : <>{text.slice(0, offset)}<mark>{text.slice(offset, offset + query.length)}</mark>{text.slice(offset + query.length)}</>;
}

export function HistoryPanel({ workspaceId }: { workspaceId: string }) {
  useLocale();
  const workspace = useStore((s) => s.workspaces.find((w) => w.id === workspaceId));
  const entry = useStore((s) => s.history[workspaceId]);
  const connected = useStore((s) => s.connected);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [revision, setRevision] = useState(0);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const needle = query.trim();
  useEffect(() => { if (connected) requestHistory(workspaceId); }, [workspaceId, connected]);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(needle), 220);
    return () => clearTimeout(timer);
  }, [needle]);
  const search = useProjectRead<HistorySearch>(debounced ? `/api/workspaces/${workspaceId}/history/search?q=${encodeURIComponent(debounced)}` : null, revision);
  const items = useMemo<HistoryMatch[]>(() => {
    const local = (entry?.items ?? []).filter((item) => item.title.toLocaleLowerCase().includes(needle.toLocaleLowerCase()));
    if (!needle) return entry?.items ?? [];
    const found: HistoryMatch[] = debounced === needle && search.data ? search.data.items : local;
    const keys = new Set(found.map((item) => item.key));
    return [...found, ...local.filter((item) => !item.sessionId && !keys.has(item.key))].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entry?.items, needle, debounced, search.data]);
  const searching = Boolean(needle) && (debounced !== needle || search.loading);
  const loading = !needle && (!entry || entry.loading);
  const refresh = () => { if (connected) requestHistory(workspaceId); setRevision((value) => value + 1); };
  const exportItem = async (id: string) => {
    setExporting(id); setExportError(null);
    try { await downloadSession(workspaceId, id); }
    catch (error) { setExportError(error instanceof Error ? error.message : tx("导出失败")); }
    finally { setExporting(null); }
  };
  return <DrawerShell title={tx("历史会话")} subtitle={workspace?.name} actions={<button className="icon-btn" type="button" aria-label={tx("刷新历史会话")} title={tx("刷新")} onClick={refresh}><Refresh /></button>}>
    <div className="history-search-bar">
      <label className="tool-search"><Search /><input data-drawer-focus type="search" maxLength={200} aria-label={tx("搜索历史会话标题或对话内容")} placeholder={tx("搜索标题、对话内容")} value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" className="icon-btn" aria-label={tx("清空搜索")} onClick={() => setQuery('')}><Close size={14} /></button>}</label>
      <span className="tool-note" role="status">{searching ? tx("正在搜索…") : tx("{0} 个会话{1}", [items.length, needle && search.data?.truncated ? tx(" · 还有更多，请缩小搜索范围") : ''])}</span>
    </div>
    <div className="drawer-body history-results">
      {(exportError || (needle && search.error)) && <div className="tool-error" role="alert"><span>{exportError || search.error}</span><button type="button" onClick={() => { setExportError(null); refresh(); }}>{tx("重试")}</button></div>}
      {items.map((item) => <div key={item.key} className="history-result">
        <button type="button" className={`hist a-${item.color}`} title={tx("按住 ⌥ 点击并排打开")} onClick={(event) => { const split = event.altKey; setDrawer(null); requestAnimationFrame(() => openHistoryItem(workspaceId, item, split)); }}>
          <span className="tt">{highlight(item.title, needle)}</span><span className="go">{item.open ? tx("打开") : tx("继续")}</span>
          <span className="meta"><span className="nm session-agent"><AgentIcon id={item.agentId} name={item.agentName} />{item.agentName}</span><span>{item.source === 'cli' ? tx("命令行") : tx("网页")}</span>{item.updatedAt > 0 && <span>{ago(item.updatedAt)}</span>}</span>
          {'snippet' in item && item.snippet && <span className="history-snippet">{highlight(item.snippet, needle)}</span>}
        </button>
        {item.sessionId && <button className="icon-btn history-export" type="button" aria-label={tx("导出会话：{0}", [item.title])} title={tx("导出为 Markdown")} disabled={exporting !== null} onClick={() => void exportItem(item.sessionId!)}>{exporting === item.sessionId ? <span className="tool-spinner" /> : <Download />}</button>}
      </div>)}
      {loading && <p className="tool-note" role="status">{items.length ? tx("正在读取命令行会话…") : tx("正在读取…")}</p>}
      {!loading && !searching && items.length === 0 && <div className="tool-empty"><Search size={26} /><strong>{needle ? tx("没有找到匹配的会话") : tx("还没有历史会话")}</strong>{needle && <p>{tx("试试其他关键词，或搜索 Agent 的回复内容")}</p>}</div>}
      {!connected && <p className="tool-note" role="status">{tx("正在重新连接，连接恢复后会更新历史列表。")}</p>}
    </div>
    <footer className="tool-footer history-footer">{tx("导出已保存的网页记录为 Markdown。未打开过的命令行会话仅搜索标题，打开后可搜索正文和导出。")}</footer>
  </DrawerShell>;
}
