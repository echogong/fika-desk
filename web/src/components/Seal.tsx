// 审批标记：一个简单的勾。你批准的是绿色的勾，旧版本自动放行的记录是灰色的勾，
// 拒绝的是灰色的叉，等你批准的是一颗琥珀色的点。（以前是按过的键帽，看起来像能点的复选框，2026-10-02 换掉）
import type { ReactElement } from 'react';

export type SealKind = 'approve' | 'auto' | 'reject' | 'pending';

const MARK: Record<SealKind, ReactElement> = {
  approve: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  auto: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  reject: <path d="M7 7l10 10M17 7L7 17" />,
  pending: <circle cx="12" cy="12" r="4.5" />,
};

export function Seal({ kind, label, stamping }: { kind: SealKind; label: string; stamping?: boolean }) {
  return (
    <span className={`seal ${kind}${stamping ? ' stamp' : ''}`} role="img" title={label} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {MARK[kind]}
      </svg>
    </span>
  );
}
