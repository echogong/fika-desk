import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { realpath } from 'node:fs/promises';
import type http from 'node:http';
import type { WorkspaceInfo } from '../shared/types';
import { PROTECTED_BRANCHES, type BranchList, type CreateBranchResult, type DeleteBranchResult, type SwitchBranchResult } from '../shared/branches';
import type { WorkspaceManager } from './workspaces';
import { readJson, sendJson } from './http';

const execute = promisify(execFile);
const operations = new Map<string, Promise<unknown>>();
export class BranchError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const result = await execute('git', ['--no-pager', '-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=/dev/null', ...args], {
      cwd, timeout: 5000, maxBuffer: 1024 * 1024, encoding: 'utf8',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
    return result.stdout.trim();
  } catch (error) {
    const detail = String((error as { stderr?: string }).stderr ?? '');
    if (/not a git repository|not a work tree/i.test(detail)) throw new BranchError('这个项目还未启用 Git，无法管理分支');
    if (/index\.lock|another git process|cannot lock ref/i.test(detail)) throw new BranchError('Git 正在处理其他操作，请稍后重试', 409);
    if (/would be overwritten|would lose untracked/i.test(detail)) throw new BranchError('切换会覆盖当前改动，已取消。请先提交改动再切换。', 409);
    if (/not fully merged/i.test(detail)) throw new BranchError('这个分支还有未合并的提交，已保留。请先合并后再删除。', 409);
    if (/already (?:checked out|used by worktree)|used by worktree|cannot delete branch .*checked out/i.test(detail)) throw new BranchError('这个分支正在另一个工作区使用，请先在那里处理。', 409);
    throw error;
  }
}

export function validateBranchRequest(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BranchError('新建分支请求格式不正确');
  const body = value as Record<string, unknown>;
  if (Object.keys(body).length !== 1 || typeof body.requestId !== 'string' || !/^\d{13}-[a-f0-9]{20}$/.test(body.requestId)) {
    throw new BranchError('新建分支请求格式不正确，请刷新后重试');
  }
  return body.requestId;
}

async function inRepository<T>(cwd: string, action: (root: string) => Promise<T>): Promise<T> {
  const root = await realpath(await git(cwd, ['rev-parse', '--show-toplevel']));
  const previous = operations.get(root) ?? Promise.resolve();
  const operation = previous.catch(() => undefined).then(() => action(root));
  operations.set(root, operation);
  try { return await operation; }
  catch (error) {
    if (error instanceof BranchError) throw error;
    throw new BranchError('Git 操作失败，当前文件已保留。请检查 Git 状态后重试。', 409);
  } finally { if (operations.get(root) === operation) operations.delete(root); }
}

async function currentBranch(root: string): Promise<string> {
  const ref = await git(root, ['symbolic-ref', '--quiet', 'HEAD']).catch(() => '');
  return ref.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : '';
}

export function validateSwitchRequest(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BranchError('切换分支请求格式不正确');
  const body = value as Record<string, unknown>;
  if (Object.keys(body).length !== 1 || typeof body.switchTo !== 'string' || !body.switchTo || body.switchTo.length > 512) {
    throw new BranchError('请选择要切换的分支');
  }
  return body.switchTo;
}

export function validateDeleteRequest(value: unknown): string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BranchError('删除分支请求格式不正确');
  const body = value as Record<string, unknown>;
  if (Object.keys(body).length !== 1 || typeof body.deleteBranch !== 'string' || !body.deleteBranch || body.deleteBranch.length > 512) {
    throw new BranchError('请选择要删除的分支');
  }
  return body.deleteBranch;
}

async function requireLocalBranch(root: string, branch: string): Promise<void> {
  // 用完整引用校验，避免 @{-1} 等简写被 Git 解释为其他分支。
  if (branch.startsWith('-')) throw new BranchError('分支名称无效');
  try { await git(root, ['check-ref-format', `refs/heads/${branch}`]); }
  catch { throw new BranchError('分支名称无效'); }
  try { await git(root, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]); }
  catch (error) {
    if ((error as { code?: number }).code === 1) throw new BranchError('这个本地分支不存在，请刷新分支列表', 404);
    throw error;
  }
}

export function listProjectBranches(cwd: string): Promise<BranchList> {
  return inRepository(cwd, async (root) => {
    const refs = await git(root, ['for-each-ref', '--sort=-committerdate', '--format=%(refname)', 'refs/heads/']);
    return { branches: refs.split('\n').filter(Boolean).map(ref => ref.slice('refs/heads/'.length)), currentBranch: await currentBranch(root) };
  });
}

export function switchProjectBranch(cwd: string, branch: string): Promise<SwitchBranchResult> {
  validateSwitchRequest({ switchTo: branch });
  return inRepository(cwd, async (root) => {
    await requireLocalBranch(root, branch);
    const previous = await currentBranch(root);
    if (previous !== branch) await git(root, ['switch', '--no-guess', '--no-overwrite-ignore', branch]);
    return { branch, currentBranch: await currentBranch(root), created: false, switched: previous !== branch };
  });
}

/** 仅删除已合入当前 HEAD 的闲置本地分支，保留工作区、主分支及其他 worktree 使用的分支。 */
export function deleteProjectBranch(cwd: string, branch: string): Promise<DeleteBranchResult> {
  validateDeleteRequest({ deleteBranch: branch });
  return inRepository(cwd, async (root) => {
    await requireLocalBranch(root, branch);
    if (PROTECTED_BRANCHES.includes(branch)) throw new BranchError(`${branch} 是主分支，不能在这里删除。`, 409);
    const current = await currentBranch(root);
    if (current === branch) throw new BranchError('不能删除当前分支，请先切换到其他分支。', 409);
    // Git -d 会参考 upstream；额外检查 HEAD，防止仅合入远端上游的提交被意外移除。
    try { await git(root, ['merge-base', '--is-ancestor', `refs/heads/${branch}`, 'HEAD']); }
    catch (error) {
      if ((error as { code?: number }).code === 1) throw new BranchError('这个分支还有未合并的提交，已保留。请先合并后再删除。', 409);
      throw error;
    }
    await git(root, ['branch', '-d', '--', branch]);
    return { branch, currentBranch: current, created: false, deleted: true };
  });
}

/** 创建同一 HEAD 的新分支并切换，保留 staged、unstaged 与未跟踪文件。重复请求只返回原来的分支。 */
export function createProjectBranch(cwd: string, requestId: string): Promise<CreateBranchResult> {
  validateBranchRequest({ requestId });
  return inRepository(cwd, async (root) => {
    try { await git(root, ['rev-parse', '--verify', 'HEAD']); }
    catch (error) {
      if (error instanceof BranchError) throw error;
      throw new BranchError('项目还没有第一次 Git 提交，请先提交当前代码再新建分支');
    }
    const [millis, entropy] = requestId.split('-');
    const date = new Date(Number(millis)).toISOString();
    const branch = `work/${date.slice(0, 10).replaceAll('-', '')}-${date.slice(11, 19).replaceAll(':', '')}-${entropy}`;
    let exists = false;
    try { await git(root, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]); exists = true; }
    catch (error) { if ((error as { code?: number }).code !== 1) throw error; }
    if (!exists) await git(root, ['switch', '--no-guess', '-c', branch, 'HEAD']);
    return { branch, currentBranch: await currentBranch(root), created: !exists };
  });
}

export async function handleBranchApi(
  req: http.IncomingMessage, res: http.ServerResponse, url: URL, workspaces: WorkspaceManager,
  changed?: (workspace: WorkspaceInfo, result: CreateBranchResult | SwitchBranchResult | DeleteBranchResult) => void,
): Promise<boolean> {
  const match = url.pathname.match(/^\/api\/workspaces\/([A-Za-z0-9_-]+)\/branches$/);
  if (!match) return false;
  try {
    if (req.method !== 'GET' && req.method !== 'POST') throw new BranchError('不支持这个分支操作', 405);
    const workspace = workspaces.get(match[1]);
    if (!workspace) throw new BranchError('工作区不存在，请重新选择', 404);
    if (req.method === 'GET') {
      sendJson(res, 200, await listProjectBranches(workspace.path));
      return true;
    }
    let body: unknown;
    try { body = await readJson(req, 2048); } catch { throw new BranchError('新建分支请求格式不正确'); }
    const result = body && typeof body === 'object' && 'deleteBranch' in body
      ? await deleteProjectBranch(workspace.path, validateDeleteRequest(body))
      : body && typeof body === 'object' && 'switchTo' in body
        ? await switchProjectBranch(workspace.path, validateSwitchRequest(body))
        : await createProjectBranch(workspace.path, validateBranchRequest(body));
    changed?.(workspace, result);
    sendJson(res, 200, { ...result, workspaces: workspaces.list() });
  } catch (error) {
    sendJson(res, error instanceof BranchError ? error.status : 400, { error: error instanceof BranchError ? error.message : '分支操作失败，请重试' });
  }
  return true;
}
