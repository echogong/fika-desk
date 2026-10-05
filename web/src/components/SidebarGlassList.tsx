import { useLayoutEffect, useRef, type ReactNode } from 'react';
import './sidebar-glass.css';

/** 每组导航共用一块玻璃底板；切换时移动底板，不移动按钮内容。 */
export function SidebarGlassList({
  activeKey, activeSelector, revision, children, id, hidden,
}: {
  activeKey: string | null | undefined;
  activeSelector: string;
  revision: string;
  children: ReactNode;
  id?: string;
  hidden?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const glass = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const list = host.current;
    const marker = glass.current;
    if (!list || !marker) return;
    let resizeFrame = 0;
    let readyFrame = 0;

    const measure = () => {
      const selected = activeKey ? list.querySelector<HTMLElement>(activeSelector) : null;
      const row = selected?.getBoundingClientRect();
      const bounds = list.getBoundingClientRect();
      if (!row || !row.height || !bounds.width || hidden) {
        cancelAnimationFrame(readyFrame);
        readyFrame = 0;
        delete list.dataset.hasSelection;
        delete marker.dataset.ready;
        return;
      }
      marker.style.setProperty('--selection-y', `${row.top - bounds.top}px`);
      marker.style.setProperty('--selection-height', `${row.height}px`);
      list.dataset.hasSelection = '';
      // 首次显示直接对齐，后续 CSS 过渡会从正在显示的位置继续移动。
      if (!marker.hasAttribute('data-ready') && !readyFrame) {
        marker.getBoundingClientRect();
        readyFrame = requestAnimationFrame(() => {
          marker.dataset.ready = '';
          readyFrame = 0;
        });
      }
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(list);
    const selected = list.querySelector(activeSelector);
    if (selected) observer.observe(selected);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(resizeFrame);
      cancelAnimationFrame(readyFrame);
    };
  }, [activeKey, activeSelector, revision, hidden]);

  return (
    <div ref={host} id={id} hidden={hidden} className="sidebar-glass-list">
      <span ref={glass} className="sidebar-glass-selection" aria-hidden="true" />
      {children}
    </div>
  );
}
