import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import type http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { isImageMimeType, MAX_IMAGE_BYTES, type ImageMimeType } from '../shared/images';
import type { ImageAttachment, TimelineItem } from '../shared/types';

export class ImageError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

/** 不信任扩展名和浏览器传来的 MIME，检查图片的实际文件头。 */
export function imageMime(data: Buffer): ImageMimeType {
  if (!data.length) throw new ImageError('图片文件是空的');
  if (data.length > MAX_IMAGE_BYTES) throw new ImageError('每张图片不能超过 10 MB', 413);
  if (data.length >= 33 && data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && data.toString('ascii', 12, 16) === 'IHDR') return 'image/png';
  if (data.length >= 4 && data[0] === 255 && data[1] === 216 && data[2] === 255 && data.at(-2) === 255 && data.at(-1) === 217) return 'image/jpeg';
  if (data.length >= 14 && /^(GIF87a|GIF89a)$/.test(data.toString('ascii', 0, 6)) && data.at(-1) === 59) return 'image/gif';
  if (data.length >= 20 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' && data.readUInt32LE(4) + 8 === data.length) return 'image/webp';
  throw new ImageError('图片格式不正确，请选择 PNG、JPEG、WebP 或 GIF 图片');
}

export class ImageStore {
  private root: string;
  constructor(dataDir: string) { this.root = path.join(dataDir, 'images'); }

  private directory(sessionId: string): string {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(sessionId)) throw new ImageError('没有这个会话', 404);
    return path.join(this.root, sessionId);
  }

  put(sessionId: string, data: Buffer, claimedMime: string, name = '图片'): ImageAttachment {
    const mimeType = imageMime(data);
    if (claimedMime && claimedMime !== 'application/octet-stream' && claimedMime !== mimeType) throw new ImageError('图片内容与格式不符');
    const dir = this.directory(sessionId);
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const id = createHash('sha256').update(data).digest('hex').slice(0, 32);
    const cleanName = name.split(/[/\\]/).at(-1)?.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 150) || '图片';
    const image: ImageAttachment = { id, name: cleanName, mimeType, url: `/api/sessions/${sessionId}/images/${id}` };
    const binary = path.join(dir, id);
    if (!fs.existsSync(binary)) fs.writeFileSync(binary, data, { mode: 0o600, flag: 'wx' });
    const temporary = path.join(dir, `${id}.${randomBytes(4).toString('hex')}.tmp`);
    fs.writeFileSync(temporary, JSON.stringify(image), { mode: 0o600 });
    fs.renameSync(temporary, path.join(dir, `${id}.json`));
    return image;
  }

  read(sessionId: string, id: string): { image: ImageAttachment; data: Buffer } {
    if (!/^[a-f0-9]{32}$/.test(id)) throw new ImageError('找不到图片', 404);
    const dir = this.directory(sessionId);
    try {
      const image = JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf8')) as ImageAttachment;
      const file = path.join(dir, id);
      const stat = fs.statSync(file);
      if (!stat.isFile() || stat.size > MAX_IMAGE_BYTES) throw new ImageError('图片太大', 413);
      const data = fs.readFileSync(file);
      const mimeType = imageMime(data);
      return { image: { ...image, id, mimeType, url: `/api/sessions/${sessionId}/images/${id}` }, data };
    } catch (error) {
      if (error instanceof ImageError) throw error;
      throw new ImageError('找不到图片，可能已被移除', 404);
    }
  }

  /** 聊天中引用的本地图片留一份副本，临时截图被清理后仍可查看。 */
  readLocal(sessionId: string, input: string, cwd: string, roots: string[], references: string[]): { data: Buffer; mimeType: ImageMimeType } {
    const requested = localImagePath(input, cwd);
    const referenced = references.some((source) => {
      try { return localImagePath(source, cwd) === requested; } catch { return false; }
    });
    if (!referenced) return readLocalImage(input, cwd, roots);
    const dir = this.directory(sessionId);
    const key = createHash('sha256').update(requested).digest('hex');
    const mapping = path.join(dir, `local-${key}.json`);
    let local: { data: Buffer; mimeType: ImageMimeType };
    try {
      local = readLocalImage(input, cwd, roots, references);
    } catch (error) {
      if (!(error instanceof ImageError) || error.status !== 404) throw error;
      try {
        const saved = JSON.parse(fs.readFileSync(mapping, 'utf8')) as { id: string };
        const cached = this.read(sessionId, saved.id);
        return { data: cached.data, mimeType: imageMime(cached.data) };
      } catch {
        throw error;
      }
    }
    const image = this.put(sessionId, local.data, local.mimeType, path.basename(requested));
    const temporary = `${mapping}.${randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify({ id: image.id }), { mode: 0o600 });
    fs.renameSync(temporary, mapping);
    return local;
  }

  fromBlock(sessionId: string, content: any): ImageAttachment | null {
    if (content?.type !== 'image' || !isImageMimeType(String(content.mimeType)) || typeof content.data !== 'string') return null;
    const value = content.data.replace(/\s/g, '');
    if (value.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new ImageError('Agent 返回的图片过大或编码不正确');
    return this.put(sessionId, Buffer.from(value, 'base64'), content.mimeType, String(content.name ?? content._meta?.name ?? 'Agent 图片'));
  }
}

export async function readImageBody(req: http.IncomingMessage): Promise<Buffer> {
  if (Number(req.headers['content-length']) > MAX_IMAGE_BYTES) { req.resume(); throw new ImageError('每张图片不能超过 10 MB', 413); }
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_IMAGE_BYTES) throw new ImageError('每张图片不能超过 10 MB', 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function localImagePath(input: string, cwd: string): string {
  let requested = input;
  if (requested === '~' || requested.startsWith('~/')) requested = path.join(os.homedir(), requested.slice(1));
  if (requested.startsWith('file:')) {
    try { requested = fileURLToPath(requested); } catch { throw new ImageError('图片路径不正确'); }
  }
  if (requested.startsWith('sandbox:')) {
    try { requested = decodeURIComponent(requested.slice('sandbox:'.length)); } catch { throw new ImageError('图片路径不正确'); }
  }
  return path.resolve(cwd, requested);
}

/** 只使用 Agent 和工具实际展示的图片引用，不把用户消息当作文件授权。 */
export function localImageReferences(timeline: TimelineItem[]): string[] {
  const sources = new Set<string>();
  for (const item of timeline) {
    const texts = item.kind === 'agent' ? [item.text] : item.kind === 'tool' ? item.content.filter((c) => c.type === 'text').map((c) => c.text) : [];
    for (const text of texts) {
      if (!/\.(png|jpe?g|webp|gif)\b/i.test(text)) continue;
      marked.walkTokens(marked.lexer(text), (token) => {
        if (token.type !== 'image' && token.type !== 'link') return;
        const source = token.href;
        if (!/\.(png|jpe?g|webp|gif)$/i.test(source)) return;
        if (/^(file:|sandbox:|[A-Za-z]:[/\\])/.test(source) || !/^[A-Za-z][\w+.-]*:/.test(source)) sources.add(source);
      });
    }
  }
  return [...sources];
}

export function readLocalImage(input: string, cwd: string, roots: string[], references: string[] = []): { data: Buffer; mimeType: ImageMimeType } {
  const requested = localImagePath(input, cwd);
  let file: string;
  try { file = fs.realpathSync(requested); } catch { throw new ImageError('找不到这张图片', 404); }
  const permitted = [cwd, ...roots].some((root) => {
    try {
      const relative = path.relative(fs.realpathSync(root), file);
      return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
    } catch { return false; }
  });
  const referenced = references.some((source) => {
    try { return fs.realpathSync(localImagePath(source, cwd)) === file; } catch { return false; }
  });
  if (!permitted && !referenced) throw new ImageError('图片不在工作区或聊天引用的文件中', 403);
  const stat = fs.statSync(file);
  if (!stat.isFile()) throw new ImageError('这不是图片文件');
  if (stat.size > MAX_IMAGE_BYTES) throw new ImageError('图片不能超过 10 MB', 413);
  const data = fs.readFileSync(file);
  return { data, mimeType: imageMime(data) };
}

export function sendImage(res: http.ServerResponse, data: Buffer, mimeType: string): void {
  res.writeHead(200, { 'content-type': mimeType, 'content-length': data.length, 'cache-control': 'private, no-store', 'content-security-policy': "default-src 'none'; sandbox" });
  res.end(data);
}
