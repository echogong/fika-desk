import { tx } from './i18n';
import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';

/** 只调整 typing 区，dock 仍锚在窗口底部，功能栏不跟着拖动。 */
export function useComposerResize(text: string) {
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const manualHeight = useRef<number | null>(null);
  const bounds = useRef({ min: 32, max: 180 });
  const gesture = useRef<{ id: number; y: number; height: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [height, setHeight] = useState(32);
  const [resizing, setResizing] = useState(false);

  const measure = useCallback(() => {
    const textarea = textareaRef.current;
    const form = formRef.current;
    const pane = form?.closest<HTMLElement>('.pane');
    const dock = form?.closest<HTMLElement>('.dock');
    if (!textarea || !pane || !dock || !textarea.clientWidth || !pane.clientHeight) return;
    const style = getComputedStyle(textarea);
    const min = Math.max(32, Math.ceil(parseFloat(style.lineHeight) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)));
    const header = pane.querySelector<HTMLElement>('.phead')?.offsetHeight ?? 0;
    const chrome = dock.getBoundingClientRect().height - textarea.getBoundingClientRect().height;
    // 分屏、图片预览和错误提示都占用同一窗口空间；给对话至少留 96px。
    const max = Math.max(min, Math.floor(Math.min(360, pane.clientHeight - header - chrome - 96)));
    bounds.current = { min, max };
    let next = manualHeight.current;
    if (next === null) {
      const scrollTop = textarea.scrollTop;
      textarea.style.height = '0px';
      next = Math.min(textarea.scrollHeight, 180, max);
      textarea.style.height = `${Math.max(min, next)}px`;
      textarea.scrollTop = scrollTop;
    } else {
      next = Math.max(min, Math.min(next, max));
      textarea.style.height = `${next}px`;
    }
    setHeight(Math.max(min, next));
  }, []);

  useLayoutEffect(measure, [text, measure]);
  useLayoutEffect(() => {
    const form = formRef.current;
    const pane = form?.closest<HTMLElement>('.pane');
    const dock = form?.closest<HTMLElement>('.dock');
    if (!form || !pane || !dock) return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    [form, pane, dock].forEach(el => observer.observe(el));
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [measure]);

  const resize = (value: number) => {
    manualHeight.current = Math.max(bounds.current.min, Math.min(value, bounds.current.max));
    measure();
  };
  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    if (gesture.current?.id !== event.pointerId) return;
    suppressClick.current = event.type === 'pointerup' && gesture.current.moved;
    gesture.current = null;
    setResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return {
    formRef, textareaRef, resizing,
    handleProps: {
      'aria-label': tx("调整输入区高度，当前 {0} 像素", [Math.round(height)]),
      title: tx("上下拖动调整高度；点击展开或收起；方向键微调，Esc 恢复自动高度"),
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        if (!event.isPrimary || event.button !== 0) return;
        measure();
        suppressClick.current = false;
        gesture.current = { id: event.pointerId, y: event.clientY, height: textareaRef.current?.getBoundingClientRect().height ?? height, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.focus({ preventScroll: true });
      },
      onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
        const drag = gesture.current;
        if (!drag || drag.id !== event.pointerId) return;
        const delta = drag.y - event.clientY;
        if (!drag.moved && Math.abs(delta) < 4) return;
        drag.moved = true;
        setResizing(true);
        resize(drag.height + delta);
      },
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        const dragged = suppressClick.current;
        suppressClick.current = false;
        if (dragged && event.detail !== 0) return;
        const expanded = Math.min(180, bounds.current.max);
        resize(height >= expanded - 1 ? bounds.current.min : expanded);
      },
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        if (!['ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape'].includes(event.key)) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'Escape') { manualHeight.current = null; measure(); return; }
        resize(event.key === 'Home' ? bounds.current.min : event.key === 'End' ? bounds.current.max : height + (event.key === 'ArrowUp' ? 24 : -24));
      },
    },
  };
}
