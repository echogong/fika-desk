import { tx, useLocale } from '../i18n';
// 输入框底栏：Agent 配置、Context 占比，以及独立的订阅用量 / API token 消耗。
// 宽窗口显示当前分支及选项文字，窄窗口保留图标；路径在上下文提示里显示。
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { ImageAttachment, SessionMeta, WorkspaceInfo } from '../../../shared/types';
import { IMAGE_MIME_TYPES, isImageMimeType, MAX_IMAGE_BYTES, MAX_IMAGES_PER_MESSAGE, MAX_MESSAGE_IMAGE_BYTES } from '../../../shared/images';
import { checkAuth } from '../auth';
import { tildify } from '../format';
import { getState, onComposerFocus, takeComposerFocus, useStore } from '../store';
import { useComposerResize } from '../use-composer-resize';
import { send } from '../ws';
import { ArrowUp, ImagePlus, Stop } from './Icons';
import { ComposerSettings } from './ComposerSettings';
import { ComposerBranch } from './ComposerBranch';
import { ComposerUsage } from './ComposerUsage';
import { ImageGallery } from './ImageGallery';

/** 没发出去的草稿：切换窗口、切换工作区后还在 */
interface DraftImage { id: string; file: File; url: string; uploaded?: ImageAttachment }
interface Draft { text: string; images: DraftImage[] }
const drafts = new Map<string, Draft>();

export function Composer({ meta, workspace, home }: { meta: SessionMeta; workspace?: WorkspaceInfo; home: string }) {
  useLocale();
  const [draft, setDraft] = useState<Draft>(() => drafts.get(meta.id) ?? { text: '', images: [] });
  const draftRef = useRef(draft);
  const { text, images } = draft;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const uploadLock = useRef(false);
  const uploadAbort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const connected = useStore((s) => s.connected);
  const canStop = meta.state === 'running' || meta.state === 'waiting';
  const { formRef, textareaRef: ref, resizing, handleProps } = useComposerResize(text);
  const textareaId = useId();

  useEffect(() => () => {
    uploadAbort.current?.abort();
    if (!getState().sessions[meta.id]) {
      for (const image of drafts.get(meta.id)?.images ?? []) URL.revokeObjectURL(image.url);
      drafts.delete(meta.id);
    }
  }, [meta.id]);

  // 新开窗口或从左侧切过来时，光标放进输入框；只是点一下窗口不抢焦点，免得打断选中文字
  useEffect(() => {
    if (takeComposerFocus(meta.id)) ref.current?.focus();
    return onComposerFocus((id) => {
      if (id === meta.id && takeComposerFocus(id)) ref.current?.focus();
    });
  }, [meta.id]);

  const changeDraft = (value: Draft) => {
    draftRef.current = value;
    setDraft(value);
    if (value.text || value.images.length) drafts.set(meta.id, value);
    else drafts.delete(meta.id);
  };
  const update = (value: string) => changeDraft({ ...draftRef.current, text: value });

  const addImages = (files: File[]) => {
    if (uploadLock.current) return;
    setError('');
    const pending = [...draftRef.current.images];
    const problems: string[] = [];
    for (const file of files) {
      if (!isImageMimeType(file.type)) { problems.push(tx("{0}：请选择 PNG、JPEG、WebP 或 GIF 图片", [file.name])); continue; }
      if (file.size > MAX_IMAGE_BYTES) { problems.push(tx("{0}：每张图片不能超过 10 MB", [file.name])); continue; }
      if (pending.length >= MAX_IMAGES_PER_MESSAGE) { problems.push(tx("每条消息最多添加 4 张图片")); break; }
      if (pending.reduce((sum, image) => sum + image.file.size, file.size) > MAX_MESSAGE_IMAGE_BYTES) { problems.push(tx("图片总大小不能超过 20 MB")); continue; }
      pending.push({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`, file, url: URL.createObjectURL(file) });
    }
    changeDraft({ ...draftRef.current, images: pending });
    if (problems.length) setError([...new Set(problems)].join('；'));
    ref.current?.focus();
  };

  const removeImage = (id: string) => {
    if (uploadLock.current) return;
    const found = draftRef.current.images.find((image) => image.id === id);
    if (found) URL.revokeObjectURL(found.url);
    changeDraft({ ...draftRef.current, images: draftRef.current.images.filter((image) => image.id !== id) });
    setError('');
  };

  const submit = async () => {
    const current = draftRef.current;
    const value = current.text.trim();
    if (uploadLock.current || (!value && !current.images.length)) return;
    if (!getState().connected) { setError(tx("连接已断开，草稿已保留。重新连接后再发送。")); return; }
    if (current.images.length && meta.supportsImages === false) { setError(tx("{0} 不支持图片输入，请换一个支持图片的 Agent。", [meta.agentName])); return; }
    uploadLock.current = true;
    const controller = new AbortController();
    uploadAbort.current = controller;
    setUploading(true);
    setError('');
    try {
      for (const pending of current.images) {
        if (pending.uploaded) continue;
        const response = await fetch(`/api/sessions/${meta.id}/images?name=${encodeURIComponent(pending.file.name)}`, {
          method: 'POST', headers: { 'content-type': pending.file.type }, body: pending.file,
          credentials: 'same-origin', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)]),
        });
        if (response.status === 401) { void checkAuth(); throw new Error(tx("登录已过期，请重新登录")); }
        const data = await response.json();
        if (!response.ok || !data.image?.id) throw new Error(data.error ?? tx("图片上传失败"));
        pending.uploaded = data.image;
      }
      if (!getState().connected) throw new Error(tx("连接已断开，草稿已保留。重新连接后再发送。"));
      send({ type: 'session:prompt', id: meta.id, text: value, ...(current.images.length ? { images: current.images.map((image) => image.uploaded!.id) } : {}) });
      for (const image of current.images) URL.revokeObjectURL(image.url);
      changeDraft({ text: '', images: [] });
      ref.current?.focus();
    } catch (error) {
      setError(error instanceof Error && error.name !== 'TypeError' ? error.message : tx("图片上传失败，草稿已保留，请重试。"));
    } finally { uploadLock.current = false; uploadAbort.current = null; setUploading(false); }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 中文输入法选字时按回车不发送
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      void submit();
    }
  };

  const context = meta.usage && Number.isFinite(meta.usage.size) && meta.usage.size > 0 && Number.isFinite(meta.usage.used) && meta.usage.used >= 0 ? meta.usage : null;
  const usage = context ? Math.min(100, Math.round((context.used / context.size) * 100)) : null;

  return (
    <>
      <form
        ref={formRef}
        className={`composer${dragging ? ' is-dragging' : ''}${resizing ? ' is-resizing' : ''}`}
        aria-busy={uploading}
        onDragEnter={(event) => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); dragDepth.current++; setDragging(true); } }}
        onDragOver={(event) => { if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } }}
        onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); dragDepth.current = 0; setDragging(false); addImages(Array.from(event.dataTransfer.files)); }}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <button className="composer-resize" type="button" aria-controls={textareaId} {...handleProps}><span aria-hidden="true" /></button>
        <ImageGallery draft images={images.map((image) => ({ id: image.id, name: image.file.name, mimeType: image.file.type, url: image.url }))} onRemove={uploading ? undefined : removeImage} />
        <input ref={fileInput} type="file" accept={IMAGE_MIME_TYPES.join(',')} multiple hidden aria-label={tx("选择图片")} onChange={(event) => { addImages(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
        <textarea
          id={textareaId}
          ref={ref}
          rows={1}
          value={text}
          readOnly={uploading}
          placeholder={meta.state === 'waiting' ? tx("不想批准的话，告诉 {0} 换个做法", [meta.agentName]) : tx("给 {0} 发消息", [meta.agentName])}
          aria-label={tx("消息")}
          onChange={(event) => update(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={(event) => {
            const files = Array.from(event.clipboardData.items).filter((item) => item.kind === 'file').map((item) => item.getAsFile()).filter((file): file is File => file !== null);
            if (files.length) { event.preventDefault(); addImages(files); }
          }}
        />
        {error && <p className="composer-feedback" role="alert">{error}</p>}
        {(uploading || meta.queued > 0) && (
          <div className="composer-notices">
            {uploading && <span role="status" aria-live="polite">{tx("上传中…")}</span>}
            {meta.queued > 0 && <span className="queued">{tx('排队 {0} 条', [meta.queued])}</span>}
          </div>
        )}
        {/* 设置这一行放在输入框里面，发送键在它的最右边 */}
        <div className="status">
          <div className="composer-toolbar">
            <div className="composer-actions">
              <button className="composer-attach composer-attach-compact" type="button" aria-label={tx("添加图片")} title={tx("添加图片（可粘贴或拖入图片，最多 4 张）")} disabled={uploading || images.length >= MAX_IMAGES_PER_MESSAGE} onClick={() => fileInput.current?.click()}><ImagePlus /><span className="composer-control-label">{tx("图片")}</span></button>
              <ComposerBranch workspace={workspace} disabled={!connected || uploading} />
            </div>
            <ComposerSettings meta={meta} />
          </div>
          <div className="composer-submit">
            <span
              className="ctx"
              role="group"
              aria-label={usage === null ? tx('上下文用量暂不可用') : tx('上下文已用 {0}%', [usage])}
              title={`${usage === null ? tx('Agent 尚未上报上下文用量') : tx('上下文已用 {0}%', [usage])}\n${workspace?.displayPath ?? tildify(meta.cwd, home)}${workspace?.branch ? `（${workspace.branch}）` : ''}`}
            >
              <svg className="ring" viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="6" />
                <circle cx="8" cy="8" r="6" pathLength="100" strokeDasharray={`${usage ?? 0} 100`} transform="rotate(-90 8 8)" />
              </svg>
              <span className="ctx-l">{tx("上下文")}</span><span className="composer-control-value">{usage === null ? '—' : `${usage}%`}</span>
            </span>
            <ComposerUsage meta={meta} />
            <button className={`send${canStop ? ' is-stop' : ''}`} type={canStop ? 'button' : 'submit'}
              aria-label={tx(canStop ? '停止' : '发送')} title={tx(canStop ? '停止这一轮' : '发送')}
              disabled={!connected || (!canStop && (uploading || (!text.trim() && !images.length)))}
              onClick={canStop ? () => send({ type: 'session:cancel', id: meta.id }) : undefined}>
              {canStop ? <Stop size={18} /> : <ArrowUp size={18} />}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
