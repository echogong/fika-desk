import { useEffect, type RefObject } from 'react';
import { markSessionRead } from './store';

/** 只有当前窗口的回复末尾在前台可见，才确认完成已读。切换、遮挡、翻历史都会取消计时。 */
export function useCompletionRead(id: string, turnId: string | null, enabled: boolean, tailRef: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    const tail = tailRef.current;
    if (!enabled || !turnId || !tail) return;
    const pane = tail.closest('.pane');
    let visible = false;
    let timer: number | undefined;
    const clear = () => {
      window.clearTimeout(timer);
      timer = undefined;
    };
    const readable = () => {
      const viewport = window.visualViewport;
      const rect = tail.getBoundingClientRect();
      const aboveKeyboard = !viewport || (rect.top >= viewport.offsetTop && rect.bottom <= viewport.offsetTop + viewport.height);
      return visible && aboveKeyboard && document.visibilityState === 'visible' && document.hasFocus()
        && !tail.closest('[inert], [hidden]') && !document.querySelector('dialog[open]')
        && !pane?.querySelector('[aria-haspopup][aria-expanded="true"]');
    };
    const refresh = () => {
      clear();
      if (readable()) {
        // 短暂停留后确认，避免快速切换会话就把完成提醒清掉。
        timer = window.setTimeout(() => {
          if (readable()) markSessionRead(id, turnId);
        }, 1500);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      refresh();
    }, { threshold: [0, 0.5] });
    observer.observe(tail);
    // 移动端导航打开时主内容会被设为 inert，关闭后重新开始阅读计时。
    const work = tail.closest('.work');
    const mutation = new MutationObserver(refresh);
    if (work) mutation.observe(work, { attributes: true, attributeFilter: ['inert', 'hidden'] });
    if (pane) mutation.observe(pane, { attributes: true, subtree: true, attributeFilter: ['aria-expanded'] });
    // 图片预览是 body 下的原生 dialog；showModal 的隐式 inert 不会出现在 DOM 属性中。
    const dialogs = new MutationObserver((records) => {
      if (records.some((record) => record.type === 'attributes' || [...record.addedNodes, ...record.removedNodes].some((node) => node instanceof HTMLDialogElement))) refresh();
    });
    dialogs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    window.visualViewport?.addEventListener('resize', refresh);
    window.visualViewport?.addEventListener('scroll', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('blur', refresh);
    return () => {
      clear();
      observer.disconnect();
      mutation.disconnect();
      dialogs.disconnect();
      window.visualViewport?.removeEventListener('resize', refresh);
      window.visualViewport?.removeEventListener('scroll', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('blur', refresh);
    };
  }, [id, turnId, enabled, tailRef]);
}
