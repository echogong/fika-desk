// 项目文件只读入口：路径始终限定在选中的工作区内，链接也不能越界。
import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import type { ProjectDirectory, ProjectPreview, PreviewKind } from '../shared/project';

export class ProjectError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

const MAX_ENTRIES = 500;
export const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const PRIVATE_DIRECTORIES = new Set(['.git', '.ssh', '.aws', '.codex', '.claude', '.pi', '.hermes', '.codebuddy', '.cc-switch']);
const HIDDEN_DIRECTORIES = new Set(['node_modules', 'dist', '.next', '.cache', '.npm', '__pycache__', '.venv']);

export function privateProjectPath(input: string): boolean {
  return input.split(/[\\/]/).some((part) => {
    const name = part.toLowerCase();
    return PRIVATE_DIRECTORIES.has(name) || (name.startsWith('.fika-desk') || name.startsWith('.multiagent-web')) ||
      (/^\.env(?:\.|$)/.test(name) && !/\.(example|sample|template)$/.test(name)) ||
      /\.(pem|key|p12|pfx)$/.test(name) ||
      ['.npmrc', '.netrc', '.git-credentials', 'credentials.json', 'credentials', 'id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa'].includes(name);
  });
}

function inside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function projectRelative(input: string): string {
  if (input.includes('\0') || input.includes('\\') || path.isAbsolute(input)) throw new ProjectError('请选择工作区内的文件', 403);
  const normalized = path.posix.normalize(input || '.');
  if (normalized === '..' || normalized.startsWith('../') || privateProjectPath(normalized)) throw new ProjectError('这个路径不能通过文件面板访问', 403);
  return normalized === '.' ? '' : normalized;
}

export async function projectPath(rootInput: string, input: string): Promise<{ root: string; full: string; relative: string }> {
  const relative = projectRelative(input);
  try {
    const root = await fsp.realpath(rootInput);
    if (privateProjectPath(root)) throw new ProjectError('这个目录不能通过文件面板访问', 403);
    const full = await fsp.realpath(path.resolve(root, relative));
    if (!inside(root, full) || privateProjectPath(path.relative(root, full))) throw new ProjectError('这个链接指向工作区以外或受保护的文件', 403);
    return { root, full, relative };
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    throw new ProjectError('文件不存在或没有读取权限', 404);
  }
}

export async function projectDirectory(root: string, input = ''): Promise<ProjectDirectory> {
  const resolved = await projectPath(root, input);
  if (!(await fsp.stat(resolved.full)).isDirectory()) throw new ProjectError('这个路径不是文件夹');
  const list = await fsp.readdir(resolved.full, { withFileTypes: true });
  const sorted = list.filter((entry) => !privateProjectPath(entry.name) && !HIDDEN_DIRECTORIES.has(entry.name));
  sorted.sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name, 'zh-Hans-CN', { numeric: true }));
  const entries: ProjectDirectory['entries'] = [];
  // 不对整个目录做 stat，避免依赖目录或超大文件夹阻塞接口。
  for (const item of sorted.slice(0, MAX_ENTRIES)) {
    const relative = path.posix.join(resolved.relative, item.name);
    try {
      const target = await projectPath(root, relative);
      const stat = await fsp.stat(target.full);
      if (!stat.isDirectory() && !stat.isFile()) continue;
      entries.push({ name: item.name, path: relative, directory: stat.isDirectory(), ...(stat.isFile() ? { size: stat.size } : {}) });
    } catch { /* 越界、失效或无权限的链接不出现在文件列表里。 */ }
  }
  entries.sort((a, b) => Number(b.directory) - Number(a.directory) || a.name.localeCompare(b.name, 'zh-Hans-CN', { numeric: true }));
  return { path: resolved.relative, entries, truncated: sorted.length > MAX_ENTRIES };
}

const MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.flac': 'audio/flac',
};

export function projectMime(input: string): string { return MIME[path.extname(input).toLowerCase()] ?? 'application/octet-stream'; }

/** O_NONBLOCK 避免特殊文件挂住读取；打开后的描述符再检查一次，防止路径被替换。 */
async function openProjectFile(root: string, input: string) {
  const resolved = await projectPath(root, input);
  const handle = await fsp.open(resolved.full, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new ProjectError('只能预览普通文件');
    if (process.platform === 'linux') {
      const opened = await fsp.realpath(`/proc/self/fd/${handle.fd}`);
      if (!inside(resolved.root, opened) || privateProjectPath(path.relative(resolved.root, opened))) throw new ProjectError('文件路径发生变化，请重试', 403);
    }
    return { handle, stat, ...resolved };
  } catch (error) { await handle.close(); throw error; }
}

async function boundedRead(handle: Awaited<ReturnType<typeof fsp.open>>, limit: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  while (size <= limit) {
    const chunk = Buffer.alloc(Math.min(65536, limit + 1 - size));
    const { bytesRead } = await handle.read(chunk, 0, chunk.length, size);
    if (!bytesRead) break;
    chunks.push(chunk.subarray(0, bytesRead));
    size += bytesRead;
  }
  if (size > limit) throw new ProjectError('文件较大，请下载后查看', 413);
  return Buffer.concat(chunks, size);
}

export async function projectPreview(root: string, input: string): Promise<ProjectPreview> {
  const file = await openProjectFile(root, input);
  try {
    const mime = projectMime(input);
    const kind: PreviewKind = mime.startsWith('image/') ? 'image' : mime.startsWith('audio/') ? 'audio' : mime === 'application/pdf' ? 'pdf' : 'text';
    const preview: ProjectPreview = { path: file.relative, name: path.basename(input), size: file.stat.size, modifiedAt: file.stat.mtimeMs, kind };
    if (kind !== 'text') return preview;
    if (file.stat.size > MAX_TEXT_BYTES) return { ...preview, kind: 'unsupported' };
    const data = await boundedRead(file.handle, MAX_TEXT_BYTES);
    if (data.subarray(0, 8192).includes(0)) return { ...preview, kind: 'unsupported' };
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(data);
      return { ...preview, kind: /\.(md|markdown)$/i.test(input) ? 'markdown' : 'text', text };
    } catch { return { ...preview, kind: 'unsupported' }; }
  } finally { await file.handle.close(); }
}

export async function projectDownload(root: string, input: string): Promise<Buffer> {
  const file = await openProjectFile(root, input);
  try {
    if (file.stat.size > MAX_DOWNLOAD_BYTES) throw new ProjectError('网页下载上限为 20 MB，请在服务器上读取这个文件', 413);
    return await boundedRead(file.handle, MAX_DOWNLOAD_BYTES);
  } finally { await file.handle.close(); }
}
