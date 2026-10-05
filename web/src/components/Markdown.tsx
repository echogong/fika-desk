import { tx, useLocale } from '../i18n';
// Agent 回复里的 Markdown：先转成 HTML，再用 DOMPurify 清理，防止 Agent 输出里夹带脚本。
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { memo, useMemo, useState } from 'react';
import type { ImageAttachment } from '../../../shared/types';
import { ImagePreview } from './ImageGallery';
import { wordWrapHtml } from '../cjk';
import { imagePreviewUrl } from '../../../shared/image-preview';
import { highlightCode } from '../highlight';
import '../code-highlight.css';

marked.setOptions({ gfm: true, breaks: true });

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export const Markdown = memo(function Markdown({ text, streaming, sessionId, project }: { text: string; streaming?: boolean; sessionId?: string; project?: { workspaceId: string; path: string } }) {
  const locale = useLocale();
  const [selected, setSelected] = useState<ImageAttachment | null>(null);
  const html = useMemo(() => {
    const raw = marked.parse(text, { async: false }) as string;
    const template = document.createElement('template');
    template.innerHTML = raw;
    const projectUrl = (source: string, action: 'content' | 'download') => {
      if (!project || !source || source.startsWith('#') || /^[A-Za-z][\w+.-]*:/.test(source) || source.startsWith('//')) return null;
      try {
        const resolved = new URL(source, `https://project.invalid/${project.path}`).pathname.slice(1);
        return `/api/workspaces/${project.workspaceId}/files/${action}?path=${encodeURIComponent(decodeURIComponent(resolved))}`;
      } catch { return null; }
    };
    // Agent 经常把生成的图片写成“下载图片”链接，也给这些链接补上可见的预览。
    for (const link of template.content.querySelectorAll('a[href]')) {
      const source = link.getAttribute('href') ?? '';
      if (!/\.(png|jpe?g|webp|gif)(?:[?#].*)?$/i.test(source) || link.querySelector('img')) continue;
      const img = document.createElement('img');
      img.setAttribute('src', source);
      img.alt = link.textContent || tx("Agent 图片");
      link.appendChild(img);
    }
    for (const img of template.content.querySelectorAll('img')) {
      const source = img.getAttribute('src') ?? '';
      const external = /^(https?:|blob:)/i.test(source) || /^data:image\/(png|jpeg|webp|gif);base64,/i.test(source);
      const stored = /^\/api\/sessions\/[\w-]+\/(images\/[a-f0-9]{32}|image\?)/.test(source);
      const local = /^(file:|sandbox:|[A-Za-z]:[/\\])/.test(source) || !/^[A-Za-z][\w+.-]*:/.test(source);
      if (!external && !stored) {
        const projectSource = projectUrl(source, 'content');
        if (projectSource) img.setAttribute('src', projectSource);
        else if (local && sessionId && source) img.setAttribute('src', `/api/sessions/${sessionId}/image?path=${encodeURIComponent(source)}`);
        else img.removeAttribute('src');
      }
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      const original = img.getAttribute('src');
      if (original) {
        img.setAttribute('data-original-src', original);
        img.setAttribute('src', imagePreviewUrl(original, 'display'));
      }
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', tx("查看图片：{0}", [img.alt || tx("Agent 图片")]));
      if (img.parentElement?.tagName === 'A' && original?.startsWith('/api/sessions/')) img.parentElement.setAttribute('href', original);
    }
    if (project) for (const link of template.content.querySelectorAll('a[href]')) {
      const href = projectUrl(link.getAttribute('href') ?? '', 'download');
      if (href) link.setAttribute('href', href);
    }
    if (!streaming) for (const code of template.content.querySelectorAll('pre > code')) {
      const language = code.className.match(/(?:^|\s)language-([\w+-]+)/)?.[1];
      code.innerHTML = highlightCode(code.textContent ?? '', language);
    }
    // 中文按词换行（见 cjk.ts）
    return wordWrapHtml(DOMPurify.sanitize(template.innerHTML));
  }, [text, streaming, sessionId, project?.workspaceId, project?.path, locale]);
  const open = (target: EventTarget | null) => {
    if (!(target instanceof HTMLImageElement) || !target.getAttribute('src')) return;
    const original = target.getAttribute('data-original-src') || target.src;
    setSelected({ id: original, name: target.alt || tx("Agent 图片"), mimeType: '', url: original });
  };
  return <>
    <div className={`md${streaming ? ' streaming' : ''}`} dangerouslySetInnerHTML={{ __html: html }}
      onClick={(event) => { if (event.target instanceof HTMLImageElement) { event.preventDefault(); open(event.target); } }}
      onKeyDown={(event) => { if (event.target instanceof HTMLImageElement && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); open(event.target); } }}
      onErrorCapture={(event) => {
        if (!(event.target instanceof HTMLImageElement) || event.target.hidden) return;
        const img = event.target;
        const original = img.getAttribute('data-original-src');
        if (original && img.getAttribute('src') !== original) { img.src = original; return; }
        img.hidden = true;
        const fallback = document.createElement('span');
        fallback.className = 'image-unavailable';
        fallback.textContent = tx("{0}：无法加载，请检查图片路径或重新登录。", [img.alt || tx("图片")]);
        img.after(fallback);
      }}
    />
    {selected && <ImagePreview key={selected.url} image={selected} onClose={() => setSelected(null)} />}
  </>;
});
