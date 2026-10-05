import { useId } from 'react';

/** 订阅剩余额度以杯中液面表示；API 没有容量上限，只使用普通咖啡杯标记。 */
export function CoffeeUsage({ level }: { level?: number | null }) {
  const clipId = useId();
  const amount = typeof level === 'number' && Number.isFinite(level) ? Math.max(0, Math.min(100, level)) : null;
  const height = amount === null ? 0 : 7.4 * amount / 100;
  return <svg className="coffee-usage" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" data-level={amount ?? undefined}>
    <defs><clipPath id={clipId}><path d="M5.3 10.3h11.4v3.9a3.5 3.5 0 0 1-3.5 3.5H8.8a3.5 3.5 0 0 1-3.5-3.5z" /></clipPath></defs>
    {amount !== null ? <rect className="coffee-usage-fill" clipPath={`url(#${clipId})`} x="5.3" y={17.7 - height} width="11.4" height={height} fill="currentColor" fillOpacity="0.65" stroke="none" />
      : <path d="M7 12h8" strokeDasharray={level === null ? '1 2' : undefined} />}
    <path d="M17.5 10.3h1.2a2.6 2.6 0 0 1 0 5.2h-1.2" />
    <path d="M4.5 9.5h13v4.7a4.3 4.3 0 0 1-4.3 4.3H8.8a4.3 4.3 0 0 1-4.3-4.3z" />
    <path d="M3.5 20.5h15" />
  </svg>;
}
