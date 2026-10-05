import { tx } from './i18n';
import { useEffect, useState } from 'react';
import { api } from './api';

/** 面板可见时自动刷新；请求按 URL 隔离，切文件或工作区后旧结果不能覆盖新内容。 */
export function useProjectRead<T>(url: string | null, revision = 0, poll = 0) {
  const [state, setState] = useState<{ url: string | null; data: T | null; error: string | null; loading: boolean }>({ url: null, data: null, error: null, loading: false });
  useEffect(() => {
    if (!url) return;
    let active = true;
    let pending: AbortController | null = null;
    setState((old) => ({ url, data: old.url === url ? old.data : null, error: null, loading: true }));
    const read = async () => {
      if (!active || pending || document.hidden) return;
      const controller = new AbortController();
      pending = controller;
      try {
        const data = await api<T>(url, undefined, { signal: controller.signal });
        if (active) setState({ url, data, error: null, loading: false });
      } catch (error) {
        if (active && !controller.signal.aborted) setState((old) => ({ url, data: old.url === url ? old.data : null, error: error instanceof Error ? error.message : tx("读取失败"), loading: false }));
      } finally { if (pending === controller) pending = null; }
    };
    void read();
    const onVisible = () => { if (!document.hidden) void read(); };
    document.addEventListener('visibilitychange', onVisible);
    const timer = poll ? window.setInterval(() => void read(), poll) : undefined;
    return () => { active = false; pending?.abort(); if (timer) clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [url, revision, poll]);
  return url && state.url === url ? state : { url, data: null, error: null, loading: Boolean(url) };
}
