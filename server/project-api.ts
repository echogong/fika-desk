import type http from 'node:http';
import type { Hub } from './hub';
import type { WorkspaceManager } from './workspaces';
import { sendJson } from './http';
import { ProjectError, projectDirectory, projectPreview, projectDownload, projectMime } from './project-files';
import { projectChanges, projectDiff } from './project-git';
import type { ImagePreviews } from './image-previews';

export async function handleProjectApi(req: http.IncomingMessage, res: http.ServerResponse, url: URL, workspaces: WorkspaceManager, hub: Hub, previews?: ImagePreviews): Promise<boolean> {
  const match = url.pathname.match(/^\/api\/workspaces\/([A-Za-z0-9_-]+)\/(files(?:\/(?:content|download))?|changes(?:\/diff)?|history\/search|history\/([A-Za-z0-9_-]+)\/export)$/);
  if (!match) return false;
  try {
    if (req.method !== 'GET') throw new ProjectError('这个面板只支持读取', 405);
    const [, workspaceId, action, sessionId] = match;
    const workspace = workspaces.get(workspaceId);
    if (!workspace) throw new ProjectError('工作区不存在，请重新选择', 404);
    const input = url.searchParams.get('path') ?? '';
    if (input.length > 4096) throw new ProjectError('文件路径过长');
    if (action === 'files') {
      const result = url.searchParams.get('preview') === '1' ? await projectPreview(workspace.path, input) : await projectDirectory(workspace.path, input);
      sendJson(res, 200, result);
    } else if (action === 'files/content' || action === 'files/download') {
      let data = await projectDownload(workspace.path, input);
      let mime = projectMime(input);
      if (action === 'files/content' && /^image\/(png|jpeg|webp|gif)$/.test(mime) && previews) {
        const result = await previews.render(data, mime, url.searchParams.get('size'));
        data = result.data; mime = result.mimeType;
      }
      const inline = action === 'files/content' && mime !== 'application/octet-stream';
      const name = input.split('/').at(-1) ?? '文件';
      // PDF 仅允许同源嵌入；HTML/SVG 等可执行内容始终以附件下载。
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'self'");
      res.writeHead(200, {
        'content-type': inline ? mime : 'application/octet-stream', 'cache-control': 'no-store',
        'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(name)}`,
        'content-length': data.length,
      });
      res.end(data);
    } else if (action === 'changes') {
      sendJson(res, 200, await projectChanges(workspace.path));
    } else if (action === 'changes/diff') {
      sendJson(res, 200, await projectDiff(workspace.path, input, url.searchParams.get('staged') === '1'));
    } else if (action === 'history/search') {
      const query = url.searchParams.get('q') ?? '';
      if (query.length > 200) throw new ProjectError('搜索内容最多 200 个字符');
      sendJson(res, 200, hub.searchHistory(workspaceId, query));
    } else {
      const exported = hub.exportHistory(workspaceId, sessionId);
      if (!exported) throw new ProjectError('这个工作区里没有该会话记录', 404);
      res.writeHead(200, {
        'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'no-store',
        'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(exported.name)}`,
      });
      res.end(exported.markdown);
    }
  } catch (error) {
    sendJson(res, error instanceof ProjectError ? error.status : 400, { error: error instanceof ProjectError ? error.message : '读取失败，请刷新重试' });
  }
  return true;
}
