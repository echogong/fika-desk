import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import sharp from 'sharp';
import type { ImagePreviewSize } from '../shared/image-preview';

const PIXEL_LIMIT = 40_000_000;
const sizes = { thumbnail: 400, display: 1200 } as const;

export class ImagePreviews {
  private pending = new Map<string, Promise<Buffer>>();
  constructor(private directory: string) {}

  async validateUpload(data: Buffer): Promise<void> {
    try { await sharp(data, { limitInputPixels: PIXEL_LIMIT }).resize(1, 1, { fit: 'inside' }).toBuffer(); }
    catch { throw new Error('图片无法解码或分辨率超过 4000 万像素，请换一张图片'); }
  }

  async render(data: Buffer, mimeType: string, size: string | null): Promise<{ data: Buffer; mimeType: string }> {
    if (size === null) return { data, mimeType };
    if (size !== 'thumbnail' && size !== 'display') throw new Error('图片预览尺寸不正确');
    // Keep animation and original bytes intact. Decoding failures retain legacy image access.
    try {
      const metadata = await sharp(data, { limitInputPixels: PIXEL_LIMIT }).metadata();
      if ((metadata.pages ?? 1) > 1) return { data, mimeType };
      const key = createHash('sha256').update('webp-v1-' + size).update(data).digest('hex');
      let task = this.pending.get(key);
      if (!task) {
        task = this.cached(key, data, size);
        this.pending.set(key, task);
        void task.finally(() => this.pending.delete(key)).catch(() => {});
      }
      return { data: await task, mimeType: 'image/webp' };
    } catch { return { data, mimeType }; }
  }

  private async cached(key: string, data: Buffer, size: ImagePreviewSize): Promise<Buffer> {
    const file = path.join(this.directory, `${key}.webp`);
    try { return await fs.readFile(file); } catch {}
    const result = await sharp(data, { limitInputPixels: PIXEL_LIMIT }).rotate()
      .resize({ width: sizes[size], height: sizes[size], fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    const temporary = `${file}.${randomBytes(4).toString('hex')}.tmp`;
    try {
      await fs.writeFile(temporary, result, { mode: 0o600 });
      await fs.rename(temporary, file);
    } finally { await fs.rm(temporary, { force: true }); }
    return result;
  }
}
