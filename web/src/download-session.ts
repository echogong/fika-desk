import { tx } from './i18n';
import { checkAuth } from './auth';

export async function downloadSession(workspaceId: string, sessionId: string): Promise<void> {
  const response = await fetch(`/api/workspaces/${workspaceId}/history/${sessionId}/export`, { credentials: 'same-origin', cache: 'no-store' });
  if (response.status === 401) void checkAuth();
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error ?? tx("导出失败，请重试"));
  }
  const blob = await response.blob();
  const raw = response.headers.get('content-disposition')?.match(/filename\*=UTF-8''(.+)/i)?.[1];
  let name = tx("会话.md");
  try { if (raw) name = decodeURIComponent(raw); } catch { /* 使用默认文件名 */ }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
