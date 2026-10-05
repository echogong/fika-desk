import { tx, useLocale } from '../i18n';
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { SessionMeta } from '../../../shared/types';
import { optionLabel, selectLabel } from '../format';
import { send } from '../ws';
import { Cpu, Gear, Monitor, Shield, Spark } from './Icons';
import { Select } from './Select';

/** 模型、思考固定在底栏，宽窗口显示当前值；其他 ACP 选项统一放在设置面板。 */
export function ComposerSettings({ meta }: { meta: SessionMeta }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' });
  const controlsRef = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const pinned = meta.selects.filter(select => select.category === 'model' || select.category === 'thought_level');
  const advanced = meta.selects.filter(select => select.category !== 'model' && select.category !== 'thought_level');
  const close = (restore = false) => {
    setOpen(false);
    if (restore) trigger.current?.focus();
  };
  useEffect(() => {
    if (open && advanced.length === 0) {
      setOpen(false);
      controlsRef.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
    }
  }, [open, advanced.length]);
  useLayoutEffect(() => {
    if (!open || !trigger.current || !panel.current) return;
    const anchor = trigger.current.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - 24);
    panel.current.style.width = `${width}px`;
    const above = anchor.top - 12;
    const below = window.innerHeight - anchor.bottom - 12;
    const up = above >= below;
    const maxHeight = Math.max(80, (up ? above : below) - 8);
    const height = Math.min(panel.current.scrollHeight, maxHeight);
    setPosition({ width, maxHeight, left: Math.max(12, Math.min(anchor.left, window.innerWidth - width - 12)), top: Math.max(12, up ? anchor.top - height - 8 : anchor.bottom + 8) });
  }, [open]);
  useLayoutEffect(() => {
    if (open && position.visibility !== 'hidden') panel.current?.querySelector<HTMLElement>('[role="combobox"]')?.focus();
  }, [open, position]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      // 选择器的 listbox 也在顶层，点选时保留设置面板。
      if (!panel.current?.contains(target) && !trigger.current?.contains(target) && !target.closest('.select-menu')) close();
    };
    const resize = () => {
      close();
      // 等宽度测量完成，焦点回到当前仍然可见的控件。
      requestAnimationFrame(() => requestAnimationFrame(() => {
        (trigger.current ?? controlsRef.current?.querySelector<HTMLElement>('[role="combobox"]'))?.focus();
      }));
    };
    const scroll = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!panel.current?.contains(target) && !target.closest?.('.select-menu')) close();
    };
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [open]);

  const field = (select: SessionMeta['selects'][number], inline: boolean) => (
    <Select key={select.id} compact={inline} iconOnly={inline} className={`opt-${select.category ?? 'other'}`}
      label={selectLabel(select.category, select.name)} value={select.value}
      options={select.options.map(option => ({ ...option, name: optionLabel(select.category, option.name) }))}
      icon={select.category === 'thought_level' ? <Spark size={16} /> : select.category === 'mode' ? <Shield size={14} /> : select.category === 'model' ? <Cpu size={16} /> : <Monitor size={14} />}
      onChange={value => send({ type: 'session:select', id: meta.id, selectId: select.id, value })} />
  );

  return (
    <>
      <div ref={controlsRef} className="composer-controls">
        {pinned.length > 0 && <div className="composer-pinned">{pinned.map(select => field(select, true))}</div>}
        <button ref={trigger} type="button" className="composer-settings-trigger" disabled={advanced.length === 0} aria-label={tx("聊天设置")} title={advanced.map(select => `${selectLabel(select.category, select.name)}：${optionLabel(select.category, select.options.find(option => option.value === select.value)?.name ?? select.value)}`).join('\n')} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined} onClick={() => { if (!open) setPosition({ visibility: 'hidden' }); setOpen(!open); }}><Gear size={16} /><span className="composer-control-label">{tx("设置")}</span></button>
      </div>
      {open && advanced.length > 0 && createPortal(
        <div ref={panel} id={panelId} className="composer-settings-panel" role="dialog" aria-label={tx("聊天设置")} style={position}
          onBlur={(event) => { const next = event.relatedTarget as HTMLElement | null; if (next && !panel.current?.contains(next) && !trigger.current?.contains(next) && !next.closest('.select-menu')) close(); }}
          onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); } }}>
          <p className="composer-settings-title">{tx("聊天设置")}</p>
          {advanced.map(select => <div className="composer-setting" key={select.id}><span>{selectLabel(select.category, select.name)}</span>{field(select, false)}</div>)}
        </div>, document.body,
      )}
    </>
  );
}
