// 历史抽屉按工作区隔离，切换时清空搜索并释放旧请求。
import { useStore } from '../store';
import { HistoryPanel } from './HistoryPanel';

export function HistoryDrawer() {
  const open = useStore((s) => s.drawer === 'history');
  const workspaceId = useStore((s) => s.currentWorkspace);
  if (!open || !workspaceId) return null;
  return <HistoryPanel key={workspaceId} workspaceId={workspaceId} />;
}
