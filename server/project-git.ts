import { execFile } from 'node:child_process';
import { promises as fsp } from 'node:fs';
import { promisify } from 'node:util';
import path from 'node:path';
import { createPatch } from 'diff';
import type { ProjectChanges, ProjectDiff, ProjectChange } from '../shared/project';
import { privateProjectPath, projectRelative, projectPreview, ProjectError } from './project-files';

const execute = promisify(execFile);
async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const result = await execute('git', ['--no-pager', '-c', 'core.fsmonitor=false', '-c', 'core.quotePath=false', ...args], {
      cwd, timeout: 5000, maxBuffer: 2 * 1024 * 1024, encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', GIT_TERMINAL_PROMPT: '0' },
    });
    return result.stdout;
  } catch (error) {
    const message = String((error as { stderr?: string }).stderr ?? '');
    if (/not a git repository/i.test(message)) throw new ProjectError('这个工作区还不是 Git 仓库', 404);
    throw new ProjectError('Git 信息暂时读不到，或改动内容过大。请刷新重试。', 400);
  }
}

export async function projectChanges(cwd: string): Promise<ProjectChanges> {
  if (privateProjectPath(cwd)) throw new ProjectError('这个目录不能通过改动面板访问', 403);
  // Git reports canonical paths; compare against the same base, including subdirectory workspaces.
  cwd = await fsp.realpath(cwd);
  if (privateProjectPath(cwd)) throw new ProjectError('这个目录不能通过改动面板访问', 403);
  let root: string;
  try { root = (await git(cwd, ['rev-parse', '--show-toplevel'])).trim(); }
  catch (error) {
    if (error instanceof ProjectError && error.status === 404) return { repository: false, entries: [], truncated: false };
    throw error;
  }
  const output = await git(cwd, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', '.']);
  const records = output.split('\0');
  const entries: ProjectChange[] = [];
  const relative = (name: string): string | null => {
    try {
      const result = projectRelative(path.relative(cwd, path.resolve(root, name)).split(path.sep).join('/'));
      return result && !privateProjectPath(result) ? result : null;
    } catch { return null; }
  };
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!record) continue;
    const index = record[0];
    const working = record[1];
    const name = relative(record.slice(3));
    const rename = /[RC]/.test(index + working);
    const oldPath = rename ? relative(records[++i] ?? '') : undefined;
    if (!name || (rename && !oldPath)) continue;
    entries.push({ path: name, ...(oldPath ? { oldPath } : {}), index, working });
  }
  let branch: string | undefined;
  try { branch = (await git(cwd, ['symbolic-ref', '--quiet', '--short', 'HEAD'])).trim() || undefined; } catch { /* detached HEAD */ }
  return { repository: true, branch, entries: entries.slice(0, 500), truncated: entries.length > 500 };
}

export async function projectDiff(cwd: string, input: string, staged: boolean): Promise<ProjectDiff> {
  const relative = projectRelative(input);
  if (!relative) throw new ProjectError('请选择一个改动文件');
  const changes = await projectChanges(cwd);
  const entry = changes.entries.find((item) => item.path === relative);
  if (!entry) throw new ProjectError('这个文件没有可查看的 Git 改动，请刷新列表', 404);
  if (entry.index === '?' && !staged) {
    const preview = await projectPreview(cwd, relative);
    return { path: relative, binary: preview.text === undefined, patch: preview.text === undefined ? '' : createPatch(relative, '', preview.text, '', '', { context: 3 }) };
  }
  // Git 原生 unified diff 保留重命名、删除、冲突和 staged/unstaged 的真实差异。
  const patch = await git(cwd, ['diff', '--no-ext-diff', '--no-textconv', '--no-color', ...(staged ? ['--cached'] : []), '--', relative, ...(entry.oldPath ? [entry.oldPath] : [])]);
  return { path: relative, patch, binary: /^(Binary files |GIT binary patch)/m.test(patch) };
}
