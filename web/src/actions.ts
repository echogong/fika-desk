// 页面上的操作：既要发消息给服务端、又要改页面状态的，放在这里。
import type { HistoryItem } from '../../shared/types';
import { logoutRequest } from './auth';
import { expectSession, getState, openSessionById, setDrawer, setState } from './store';
import { disconnect, send } from './ws';

/** 退出登录：断开实时连接，清掉页面上的数据，回到登录页 */
export async function logout(): Promise<void> {
  await logoutRequest();
  disconnect();
  setState({
    auth: { checked: true, needsSetup: false, loggedIn: false, lockedUntil: 0 },
    ready: false,
    connected: false,
    sessions: {},
    history: {},
    drawer: null,
    agentMenu: false,
  });
}

/** 启动 Agent，建好后新开一个窗口 */
export function startAgent(workspaceId: string, agentId: string): void {
  send({ type: 'session:create', workspaceId, agentId, requestId: expectSession(true) });
}

/** 重新读取历史会话。上次的列表先留着显示，标成“正在读取”，新的到了再换掉 */
export function requestHistory(workspaceId: string): void {
  setState((s) => ({
    history: { ...s.history, [workspaceId]: { items: s.history[workspaceId]?.items ?? [], loading: true } },
  }));
  send({ type: 'history:list', workspaceId });
}

/** 打开历史会话：已经在左侧的直接切过去，其他的让服务端恢复出来。split：并排打开 */
export function openHistoryItem(workspaceId: string, item: HistoryItem, split: boolean): void {
  setDrawer(null);
  if (item.sessionId && getState().sessions[item.sessionId]) {
    openSessionById(item.sessionId, split);
    return;
  }
  send({ type: 'history:open', workspaceId, key: item.key, requestId: expectSession(split) });
}
