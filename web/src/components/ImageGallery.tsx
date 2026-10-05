import { tx, useLocale } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ImageAttachment } from '../../../shared/types';
import { Close } from './Icons';
import '../image-display.css';
import { imagePreviewUrl } from '../../../shared/image-preview';

export function ImagePreview({ image, onClose }: { image: ImageAttachment; onClose: () => void }) {
  useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const el = dialog.current;
    el?.showModal();
    return () => { el?.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return createPortal(
    <dialog className="image-preview" ref={dialog} aria-label={tx("图片预览：{0}", [image.name])} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="image-preview-content">
        <header>
          <span>{image.name}</span>
          <a href={image.url} download={image.name} target="_blank" rel="noopener noreferrer">{tx("下载原图")}</a>
          <button className="icon-btn" type="button" autoFocus aria-label={tx("关闭图片预览")} onClick={onClose}><Close /></button>
        </header>
        {failed ? <p role="status">{tx("图片无法加载，请检查文件是否还在，或重新登录后再试。")}</p> : <img src={image.url} alt={image.name} onError={() => setFailed(true)} />}
      </div>
    </dialog>, document.body,
  );
}

function ImageCard({ image, onOpen, onRemove }: { image: ImageAttachment; onOpen: () => void; onRemove?: () => void }) {
  useLocale();
  const [failed, setFailed] = useState(false);
  return (
    <div className="image-card">
      <button className="image-thumbnail" type="button" aria-label={tx("查看图片：{0}", [image.name])} title={image.name} onClick={onOpen}>
        {failed ? <span>{tx("图片无法加载")}</span> : <img src={imagePreviewUrl(image.url, 'thumbnail')} alt={image.name} loading="lazy" decoding="async" onError={(event) => {
          if (event.currentTarget.getAttribute('src') !== image.url) event.currentTarget.src = image.url;
          else setFailed(true);
        }} />}
        <span className="image-name">{image.name}</span>
      </button>
      {onRemove && <button className="image-remove" type="button" aria-label={tx("移除图片：{0}", [image.name])} onClick={onRemove}><Close size={14} /></button>}
    </div>
  );
}

export function ImageGallery({ images, onRemove, draft = false }: { images?: ImageAttachment[]; onRemove?: (id: string) => void; draft?: boolean }) {
  useLocale();
  const [selected, setSelected] = useState<ImageAttachment | null>(null);
  if (!images?.length) return null;
  return (
    <>
      <div className={`image-gallery${draft ? ' image-gallery-draft' : ''}`} aria-label={draft ? tx("待发送的图片") : tx("消息图片")}>
        {images.map((image, index) => <ImageCard key={`${image.id}-${index}`} image={image} onOpen={() => setSelected(image)} onRemove={onRemove ? () => onRemove(image.id) : undefined} />)}
      </div>
      {selected && <ImagePreview key={selected.url} image={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
