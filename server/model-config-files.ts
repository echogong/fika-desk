import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

/** 文件只存在应用私有数据目录；不修改 CLI 的原有配置和 OAuth 登录信息。 */
export function writeModelConfig(dir: string, name: string, value: unknown): string {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, name);
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n';
  try {
    if (fs.readFileSync(file, 'utf8') === text) return file;
  } catch { /* 首次写入 */ }
  const temporary = `${file}.${randomBytes(8).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporary, text, { mode: 0o600, flag: 'wx' });
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
  return file;
}
