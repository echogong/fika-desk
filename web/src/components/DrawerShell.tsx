import { tx, useLocale } from '../i18n';
import { useEffect, useRef, type ReactNode } from 'react';
import { setDrawer } from '../store';
import { Close } from './Icons';

/** 抽屉共用关闭、焦点循环和焦点恢复；打开时主界面仍显示实时进度。 */
export function DrawerShell({ title, subtitle, wide = false, actions, children }: {
  title: string; subtitle?: string; wide?: boolean; actions?: ReactNode; children: ReactNode;
}) {
  useLocale();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = ref.current;
    const backgrounds = Array.from(document.querySelectorAll<HTMLElement>('.app > .side, .app > .work, .app > .settings, .app > .mobile-menu'));
    const original = backgrounds.map((element) => element.inert);
    backgrounds.forEach((element) => { element.inert = true; });
    (drawer?.querySelector<HTMLElement>('[data-drawer-focus]') ?? drawer?.querySelector<HTMLElement>('button, input, a[href]'))?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setDrawer(null); return; }
      if (event.key !== 'Tab' || !drawer) return;
      const controls = Array.from(drawer.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], textarea, select, iframe, audio[controls], [tabindex="0"]'))
        .filter((element) => !element.hidden && element.getClientRects().length > 0 && !element.closest('[hidden]'));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      backgrounds.forEach((element, i) => { element.inert = original[i]; });
      if (drawer?.contains(document.activeElement) || document.activeElement === document.body) {
        const target = previous?.isConnected && previous.getClientRects().length > 0 ? previous : document.querySelector<HTMLElement>('.app > .mobile-menu');
        target?.focus();
      }
    };
  }, []);
  return <div className="tool-overlay">
    <button className="tool-scrim" aria-label={tx("收起面板")} type="button" tabIndex={-1} onClick={() => setDrawer(null)} />
    <aside ref={ref} className={`drawer tool-drawer${wide ? ' tool-drawer-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="drawer-head tool-drawer-head">
        <div className="tool-heading"><h2>{title}</h2>{subtitle && <span>{subtitle}</span>}</div>
        {actions}
        <button className="icon-btn" type="button" aria-label={tx("收起{0}", [title])} onClick={() => setDrawer(null)}><Close /></button>
      </header>
      {children}
    </aside>
  </div>;
}
