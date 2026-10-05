import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { SessionMeta } from '../../../shared/types';
import { sessionTokenUsage, subscriptionUsage } from '../../../shared/account-usage';
import { resetText, tokens } from '../format';
import { tx, useLocale } from '../i18n';
import { useStore } from '../store';
import { useAccountAccess } from '../use-account-access';
import { Close } from './Icons';
import { CoffeeUsage } from './CoffeeUsage';

export function ComposerUsage({ meta }: { meta: SessionMeta }) {
  const locale = useLocale();
  const quota = useStore(state => state.quotas[meta.agentId]);
  const timeline = useStore(state => state.sessions[meta.id]?.timeline);
  const providerBilling = useAccountAccess(meta.agentId);
  // 第三方配置优先，避免把原生账号的订阅额度当成接口供应商的用量。
  const subscription = providerBilling ? providerBilling === 'subscription' : quota?.kind === 'subscription';
  const accountQuota = providerBilling ? undefined : quota;
  const usedPercent = subscriptionUsage(accountQuota);
  const remainingPercent = usedPercent === null ? null : 100 - usedPercent;
  const consumed = sessionTokenUsage(timeline ?? []);
  const details = subscription
    ? remainingPercent === null ? tx('订阅用量暂不可用') : tx('订阅剩余 {0}%', [remainingPercent])
    : consumed.total === null ? tx('Agent 尚未上报 token 消耗')
      : tx('本会话已记录 {0} tokens', [consumed.total.toLocaleString(locale)]);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = (restore = false) => { setOpen(false); if (restore) trigger.current?.focus(); };
  useLayoutEffect(() => {
    if (!open || !trigger.current || !panel.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 24);
    const maxHeight = Math.max(80, window.innerHeight - 32);
    panel.current.style.width = `${width}px`;
    const height = Math.min(panel.current.scrollHeight, maxHeight);
    setPosition({ width, maxHeight, left: Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12)), top: Math.max(12, anchor.top - height - 8) });
  }, [open, details, quota, locale]);
  useLayoutEffect(() => { if (open && position.visibility !== 'hidden') panel.current?.focus(); }, [open, position.visibility]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close();
    };
    const resize = () => close(true);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', resize);
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', resize); };
  }, [open]);
  useEffect(() => { setOpen(false); }, [meta.id]);

  return <>
    <button ref={trigger} type="button" className={`composer-usage-trigger${subscription && remainingPercent !== null && remainingPercent <= 10 ? ' is-low' : ''}`}
      aria-label={tx('查看用量：{0}', [details])} title={details} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined}
      onClick={() => { setPosition({ visibility: 'hidden' }); setOpen(!open); }}
      onKeyDown={event => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); close(true); } }}>
      <CoffeeUsage level={subscription ? remainingPercent : undefined} />
      <span className="composer-control-label">{tx(subscription ? '额度剩' : 'Token 消耗')}</span>
      {subscription ? <span className="composer-control-value">{remainingPercent === null ? '—' : `${remainingPercent}%`}</span>
        : <span className="composer-control-value">{consumed.total === null ? '—' : `${consumed.partial ? '≥' : ''}${tokens(consumed.total)}`}<span className="usage-token-unit"> tokens</span><span className="usage-token-short"> t</span></span>}
    </button>
    {open && createPortal(<div ref={panel} id={panelId} className="composer-settings-panel composer-usage-panel" role="dialog" aria-label={tx('用量详情')} tabIndex={-1} style={position}
      onBlur={event => { const next = event.relatedTarget as Node | null; if (next && !panel.current?.contains(next) && !trigger.current?.contains(next)) close(); }}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); } }}>
      <div className="usage-panel-heading"><strong>{tx(subscription ? '订阅用量' : 'Token 消耗')}</strong><button type="button" aria-label={tx('关闭')} onClick={() => close(true)}><Close size={14} /></button></div>
      <p className="usage-panel-summary">{details}</p>
      {subscription ? <>
        {accountQuota?.plan && <p className="usage-panel-note">{accountQuota.plan}</p>}
        {accountQuota?.kind === 'subscription' && accountQuota.windows.filter(window => Number.isFinite(window.usedPercent) && window.usedPercent >= 0).map((window, index) =>
          <div className="usage-window" key={`${window.label}-${index}`}><span>{tx(window.label)}</span><strong>{tx('剩余 {0}%', [100 - Math.min(100, Math.round(window.usedPercent))])}</strong>{window.resetsAt && <small>{tx('{0} 重置', [resetText(window.resetsAt)])}</small>}</div>)}
        {remainingPercent === null && <p className="usage-panel-note">{tx('供应商尚未提供订阅用量数据。')}</p>}
      </> : <>
        <p className="usage-panel-note">{tx('统计当前会话中 Agent 上报的消耗，包含输入、输出及已报告的缓存 token。')}</p>
        {(consumed.partial || consumed.total === null) && <p className="usage-panel-note">{tx('部分轮次未提供完整统计，显示已记录的消耗；不代表供应商账单。')}</p>}
        {meta.state === 'running' && <p className="usage-panel-note">{tx('当前轮次完成后更新 token 消耗。')}</p>}
      </>}
    </div>, document.body)}
  </>;
}
