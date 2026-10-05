import { tx, useLocale } from '../i18n';
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { SelectOption } from '../../../shared/types';
import { Chevron } from './Icons';

/** 页面内统一的选择控件：菜单沿用主题，键盘焦点留在触发按钮上。 */
export function Select({ id, label, value, options, onChange, disabled = false, compact = false, iconOnly = false, className = '', icon }: {
  id?: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
  icon?: ReactNode;
}) {
  useLocale();
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const search = useRef({ text: '', at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const [scrollVersion, setScrollVersion] = useState(0);
  const selected = options.findIndex(option => option.value === value);
  const current = options[selected];
  const inactive = disabled || options.length === 0;

  const show = (index = Math.max(0, selected)) => {
    if (inactive) return;
    setActive(index);
    setPosition({ visibility: 'hidden' });
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    if (option.value !== value) onChange(option.value);
    setOpen(false);
    trigger.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open || !trigger.current || !menu.current) return;
    const rect = trigger.current.getBoundingClientRect();
    if (rect.bottom < 12 || rect.top > window.innerHeight - 12) { setOpen(false); return; }
    const width = Math.min(Math.max(rect.width, 250), window.innerWidth - 24);
    menu.current.style.width = `${width}px`;
    const above = rect.top - 12;
    const below = window.innerHeight - rect.bottom - 12;
    const up = compact ? above >= below : below < menu.current.scrollHeight && above > below;
    const maxHeight = Math.max(60, Math.min(320, (up ? above : below) - 8));
    const height = Math.min(menu.current.scrollHeight, maxHeight);
    setPosition({ width, maxHeight, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), top: Math.max(12, up ? rect.top - height - 8 : rect.bottom + 8) });
  }, [open, compact, options.length, scrollVersion]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!trigger.current?.contains(event.target as Node) && !menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const close = () => setOpen(false);
    // A focus/click can finish scrolling the settings pane after the menu
    // opens. Follow its trigger instead of dismissing the new selection.
    const scroll = (event: Event) => { if (!menu.current?.contains(event.target as Node)) setScrollVersion((value) => value + 1); };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [open]);

  useEffect(() => {
    const container = menu.current;
    const option = container?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!open || !container || !option) return;
    // Scroll only this portal's list. scrollIntoView also moves the settings
    // page, whose scroll listener dismisses the menu before a click lands.
    const bounds = container.getBoundingClientRect();
    const item = option.getBoundingClientRect();
    if (item.top < bounds.top) container.scrollTop -= bounds.top - item.top;
    else if (item.bottom > bounds.bottom) container.scrollTop += item.bottom - bounds.bottom;
  }, [open, active]);
  useEffect(() => { if (inactive) setOpen(false); }, [inactive]);

  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (inactive || event.metaKey || event.ctrlKey) return;
    if (event.key === 'Escape' && open) {
      event.preventDefault(); event.stopPropagation(); setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) show();
      else setActive(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const index = event.key === 'Home' ? 0 : options.length - 1;
      if (open) setActive(index); else show(index);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(active); else show();
    } else if (event.key.length === 1 && !event.altKey) {
      const now = Date.now();
      search.current = { text: (now - search.current.at < 700 ? search.current.text : '') + event.key.toLocaleLowerCase(), at: now };
      const index = options.findIndex(option => option.name.toLocaleLowerCase().startsWith(search.current.text));
      if (index >= 0) { event.preventDefault(); if (open) setActive(index); else show(index); }
    }
  };

  return (
    <span className={`select-control${compact ? ' is-compact' : ''}${iconOnly ? ' is-icon-only' : ''} ${className}`}>
      <button ref={trigger} id={id} type="button" className="select-trigger" role="combobox" aria-label={iconOnly ? `${label}：${current?.name ?? (value || tx('暂无选项'))}` : label}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? menuId : undefined}
        aria-activedescendant={open ? `${menuId}-${active}` : undefined} disabled={inactive}
        title={`${label}：${current?.name ?? value}`} onKeyDown={onKey}
        onBlur={event => { if (!menu.current?.contains(event.relatedTarget as Node)) setOpen(false); }}
        onClick={() => open ? setOpen(false) : show()}>
        {icon}<span className="select-value">{current?.name ?? (value || tx("暂无选项"))}</span><Chevron size={12} />
      </button>
      {open && createPortal(
        <div ref={menu} id={menuId} className="select-menu" role="listbox" aria-label={label} style={position}>
          <div className="select-menu-label" aria-hidden="true">{label}</div>
          {options.map((option, index) => (
            <div key={option.value} id={`${menuId}-${index}`} className={`select-option${index === active ? ' is-active' : ''}`}
              role="option" aria-selected={option.value === value} data-index={index}
              onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={() => choose(index)}>
              <div className="select-option-copy"><span>{option.name}</span>{option.description && <small>{option.description}</small>}</div>
              {option.value === value && <svg className="select-check" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
          ))}
        </div>, document.body,
      )}
    </span>
  );
}
