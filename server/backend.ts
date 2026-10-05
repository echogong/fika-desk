import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { AgentSettingsStore } from './agent-settings';
import { Auth, type AuthResult } from './auth';
import { openDatabase, SessionStore } from './db';
import { clearCookie, clientIp, COOKIE, loginCookie, parseCookies, readJson, securityHeaders, sendJson } from './http';
import { Hub } from './hub';
import { handleSettingsApi, type SettingsContext } from './settings-api';
import { handleBranchApi } from './project-branches';
import { handleProjectApi } from './project-api';
import { WorkspaceManager } from './workspaces';
import { ImageError, ImageStore, localImageReferences, readImageBody, sendImage } from './images';

import { authSetupSchema, authLoginSchema, emptyBodySchema, validateInput, InputError } from '../shared/validation';
import { ImagePreviews } from './image-previews';
import { runnerPaths, type RunnerConfig } from './runtime-config';

export async function startBackend(config: RunnerConfig): Promise<void> {
  const root = config.release;
  const { dataDir, port, demo } = config;
  const host = '127.0.0.1';
  const publicUrl = config.publicUrl ? new URL(config.publicUrl) : null;
  const db = openDatabase(dataDir);
  // 工作区：默认工作区和启动参数指定的是固定的；其余在网页的“设置 → 工作区”里添加
  const workspaces = new WorkspaceManager(db, config.workspaceRoot, config.workspaces, demo, config.defaultWorkspace);

  const localBase = `http://${host}:${port}`;
  const auth = new Auth(db, (key) => {
    const base = publicUrl ? publicUrl.origin : localBase;
    console.log('\n首次使用：打开下面的链接设置登录密码（只能用一次，执行后台重启后会换一个新的）');
    console.log(`  ${base}/setup?k=${key}`);
    if (!publicUrl) console.log(`部署到服务器后，把 ${localBase} 换成你的域名，或者启动时加上 --public-url https://你的域名`);
    console.log('');
  });
  const store = new SessionStore(db);
  const agentSettings = new AgentSettingsStore(db);
  const images = new ImageStore(dataDir);
  const previews = new ImagePreviews(path.join(dataDir, 'images', 'previews'));
  let draining = false;
  const hub = new Hub(root, workspaces, demo, store, (kind, ip, detail) => auth.audit(kind, ip, detail), agentSettings, images, dataDir);
  const settingsContext: SettingsContext = {
    hub,
    auth,
    dataDir,
    version: String(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version ?? ''),
    startedAt: Date.now(),
    workspaces,
  };

  // 只接受这些地址的请求（防止 DNS rebinding）和这些来源的写操作、实时连接（防止跨站请求）
  const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`, ...(publicUrl ? [publicUrl.host] : [])]);
  const allowedOrigins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`, ...(publicUrl ? [publicUrl.origin] : [])]);

  /** 经 HTTPS 访问时 Cookie 加上 Secure */
  function secure(req: http.IncomingMessage): boolean {
    return req.headers['x-forwarded-proto'] === 'https' || publicUrl?.protocol === 'https:';
  }

  async function handleApi(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<void> {
    const ip = clientIp(req);
    const token = parseCookies(req.headers.cookie)[COOKIE];

    if (url.pathname === '/api/auth/state' && req.method === 'GET') {
      const needsSetup = auth.needsSetup();
      if (needsSetup) auth.ensureSetupKey();
      const login = needsSetup ? null : auth.check(token);
      // 保持登录的，每次打开页面顺便把 Cookie 的有效期往后延
      const headers: Record<string, string> = login?.keep && token ? { 'set-cookie': loginCookie(token, true, secure(req)) } : {};
      sendJson(res, 200, { needsSetup, loggedIn: Boolean(login), lockedFor: auth.lockedFor(ip) }, headers);
      return;
    }

    if (url.pathname.startsWith('/api/auth/') && req.method === 'POST') {
      if (!allowedOrigins.has(String(req.headers.origin ?? ''))) {
        sendJson(res, 403, { error: 'bad-origin' });
        return;
      }
      const body = await readJson(req);
      const agent = String(req.headers['user-agent'] ?? '');
      let result: AuthResult;
      if (url.pathname === '/api/auth/setup') {
        const input = validateInput(authSetupSchema, body);
        result = await auth.setup(input.key, input.password, ip, agent);
      } else if (url.pathname === '/api/auth/login') {
        const input = validateInput(authLoginSchema, body);
        result = await auth.login(input.password, input.keep !== false, ip, agent);
      } else if (url.pathname === '/api/auth/logout') {
        validateInput(emptyBodySchema, body);
        const id = auth.logout(token, ip);
        if (id) hub.dropLogin(id);
        sendJson(res, 200, { ok: true }, { 'set-cookie': clearCookie(secure(req)) });
        return;
      } else {
        sendJson(res, 404, { error: 'not-found' });
        return;
      }
      if (!result.ok) {
        sendJson(res, result.status, { error: result.error, remaining: result.remaining, retryAfter: result.retryAfter });
        return;
      }
      sendJson(res, 200, { ok: true }, { 'set-cookie': loginCookie(result.token, result.keep, secure(req)) });
      return;
    }

    // 其余接口都要先登录；改东西的请求还要核对来源
    const login = auth.check(token);
    if (!login) {
      sendJson(res, 401, { error: 'login-required' });
      return;
    }
    if (req.method !== 'GET' && !allowedOrigins.has(String(req.headers.origin ?? ''))) {
      sendJson(res, 403, { error: 'bad-origin' });
      return;
    }
    if (draining && req.method !== 'GET') { sendJson(res, 503, { error: '后台正在更新，请稍后重试' }); return; }
    const imageRoute = url.pathname.match(/^\/api\/sessions\/([A-Za-z0-9_-]+)\/(images(?:\/([a-f0-9]{32}))?|image)$/);
    if (imageRoute) {
      const [, sessionId, action, imageId] = imageRoute;
      try {
        if (req.method === 'GET' && imageId) {
          const saved = images.read(sessionId, imageId);
          const preview = await previews.render(saved.data, saved.image.mimeType, url.searchParams.get('size'));
          sendImage(res, preview.data, preview.mimeType);
          return;
        }
        const session = hub.sessionSnapshot(sessionId);
        if (!session) throw new ImageError('没有这个会话', 404);
        if (req.method === 'POST' && action === 'images') {
          const data = await readImageBody(req);
          await previews.validateUpload(data);
          const image = images.put(sessionId, data, String(req.headers['content-type'] ?? '').split(';')[0], url.searchParams.get('name') ?? '图片');
          sendJson(res, 200, { image });
          return;
        }
        if (req.method === 'GET' && action === 'image') {
          const input = url.searchParams.get('path');
          if (!input) throw new ImageError('缺少图片路径');
          const local = images.readLocal(sessionId, input, session.meta.cwd, workspaces.roots(), localImageReferences(session.timeline));
          const preview = await previews.render(local.data, local.mimeType, url.searchParams.get('size'));
          sendImage(res, preview.data, preview.mimeType);
          return;
        }
        throw new ImageError('不支持这个图片操作', 405);
      } catch (error) {
        sendJson(res, error instanceof ImageError ? error.status : 400, { error: error instanceof Error ? error.message : '图片处理失败' });
        return;
      }
    }
    if (url.pathname.startsWith('/api/settings/') && (await handleSettingsApi(req, res, url, settingsContext, login, ip))) {
      return;
    }
    if (await handleBranchApi(req, res, url, workspaces, (workspace, result) => {
      hub.workspacesChanged();
      if (result.created) auth.audit('workspace-branch-created', ip, { workspace: workspace.displayPath, branch: result.branch });
      else if ('switched' in result && result.switched) auth.audit('workspace-branch-switched', ip, { workspace: workspace.displayPath, branch: result.branch });
      else if ('deleted' in result && result.deleted) auth.audit('workspace-branch-deleted', ip, { workspace: workspace.displayPath, branch: result.branch });
    })) return;
    if (await handleProjectApi(req, res, url, workspaces, hub, previews)) return;
    sendJson(res, 404, { error: 'not-found' });
  }


  const socket = runnerPaths(dataDir).socket;
  const status = () => ({ pid: process.pid, hash: config.hash, busy: hub.isBusy(), draining, protocol: 1 });
  const server = http.createServer((req, res) => {
    securityHeaders(res);
    const url = new URL(req.url ?? '/', 'http://runner');
    if (url.pathname === '/__runner/status' && req.method === 'GET') { sendJson(res, 200, status()); return; }
    if (url.pathname === '/__runner/reset-password' && req.method === 'POST') {
      auth.resetPassword(); hub.dropAllLogins(); auth.ensureSetupKey(); sendJson(res, 200, { ok: true }); return;
    }
    if (url.pathname === '/__runner/drain' && req.method === 'POST') {
      draining = hub.beginUpdate(); sendJson(res, 200, status()); return;
    }
    if (!allowedHosts.has(String(req.headers.host))) { res.writeHead(403).end('Forbidden'); return; }
    if (!url.pathname.startsWith('/api/')) { sendJson(res, 404, { error: 'not-found' }); return; }
    handleApi(req, res, url).catch((error) => {
      if (!res.headersSent) sendJson(res, error instanceof InputError ? error.status : 400, { error: error instanceof InputError ? error.message : '请求处理失败' });
    });
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 4 * 1024 * 1024 });
  server.on('upgrade', (req, socket, head) => {
    const pathname = new URL(req.url ?? '/', 'http://x').pathname;
    if (pathname !== '/ws') { socket.destroy(); return; }
    const origin = String(req.headers.origin ?? '');
    if (!allowedHosts.has(String(req.headers.host)) || !allowedOrigins.has(origin)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    const login = auth.check(parseCookies(req.headers.cookie)[COOKIE]);
    if (!login) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    const ip = clientIp(req);
    wss.handleUpgrade(req, socket, head, (ws) => hub.attach(ws, { loginId: login.id, ip }));
  });


  await fs.promises.rm(socket, { force: true });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(socket, () => { fs.chmodSync(socket, 0o600); resolve(); });
  });
  console.log(`Agent 后台已启动（PID ${process.pid}，版本 ${config.hash.slice(0, 12)}）`);
  auth.ensureSetupKey();
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    for (const ws of wss.clients) ws.terminate();
    hub.disposeAll();
    db.close();
    server.close();
    // Allow the ACP process-group cleanup timer to run before leaving.
    setTimeout(() => process.exit(0), 3000);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
