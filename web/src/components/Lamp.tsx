// Agent 状态灯：运行绿、等待黄、错误红，完成未读常亮，读完灰色。
// 名字沿用以前的 Dot / lampOf，样子在 styles.css 的“状态记号”一节。
import type { SessionState } from '../../../shared/types';

export type LampState = 'run' | 'wait' | 'idle' | 'err' | 'ok';

/** 会话状态对应哪种记号 */
export function lampOf(state: SessionState, unreadCompletion = false): LampState {
  switch (state) {
    case 'running':
    case 'starting':
      return 'run';
    case 'waiting':
      return 'wait';
    case 'error':
    case 'exited':
      return 'err';
    case 'idle':
      return unreadCompletion ? 'ok' : 'idle';
    default:
      return 'idle';
  }
}

/** 汇总数字可使用静态灯，实际 Agent 保留动态。旁边的文字提供状态含义。 */
export function Dot({ state, animated = true }: { state: LampState; animated?: boolean }) {
  return <span className="ldot" data-s={state} data-static={!animated || undefined} aria-hidden="true" />;
}

/** 标志：从上往下看的一杯拿铁，杯里一颗拉花的心（和登录页那杯是同一颗心） */
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 26 20" aria-hidden="true">
      <path className="hdl" d="M18 6.8h2.2a3.2 3.2 0 0 1 0 6.4H18" />
      <circle className="rim" cx="10" cy="10" r="9.4" />
      <path className="art" d="M10 15.4c-1.6-1.4-5-3.2-5.1-5.9-.1-1.9 1.2-3.1 2.7-3 1.1.1 2 .8 2.4 1.9.4-1.1 1.3-1.8 2.4-1.9 1.5-.1 2.8 1.1 2.7 3-.1 2.7-3.5 4.5-5.1 5.9z" />
    </svg>
  );
}

/** Agent 名字：中性的加粗字（以前放在 Agent 颜色的色块上） */
export function Chip({ color, name, size }: { color: string; name: string; size?: 'sm' | 'lg' }) {
  return <span className={`chip a-${color}${size ? ` ${size}` : ''}`}>{name}</span>;
}
