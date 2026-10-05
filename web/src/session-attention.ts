import type { SessionSnapshot, SessionState, TurnItem, UserItem } from '../../shared/types';

/** 按实际执行时间取最后一轮结果；排队消息开始执行时会更新时间。 */
function latestResultOf(session: SessionSnapshot): TurnItem | UserItem | undefined {
  let latest: TurnItem | UserItem | undefined;
  for (const item of session.timeline) {
    if (item.kind !== 'turn' && item.kind !== 'user') continue;
    // 同一毫秒按服务端追加顺序判断。
    if (!latest || item.at >= latest.at) latest = item;
  }
  return latest;
}

/** 进程仍可继续接收消息时，一轮请求失败也要保留红色错误状态。 */
export function displayStateOf(session: SessionSnapshot): SessionState {
  if (session.meta.state !== 'idle') return session.meta.state;
  const latest = latestResultOf(session);
  const failed = latest?.kind === 'turn' && latest.stopReason === 'error'
    || latest?.kind === 'user' && latest.delivery === 'failed';
  return failed ? 'error' : 'idle';
}

/** 当前空闲会话最后成功结束的一轮。新消息和非正常结束都不能沿用上一轮的完成灯。 */
export function completionOf(session: SessionSnapshot | null | undefined): string | null {
  // 服务端先把上一轮切回 idle，再启动排队消息；这段间隙还不能显示完成。
  if (!session || session.meta.state !== 'idle' || session.meta.queued > 0) return null;
  const latest = latestResultOf(session);
  return latest?.kind === 'turn' && latest.stopReason === 'end_turn' ? latest.id : null;
}

export function hasUnreadCompletion(session: SessionSnapshot | null | undefined, seenTurnId?: string | null): boolean {
  const completedTurn = completionOf(session);
  return completedTurn !== null && completedTurn !== seenTurnId;
}
