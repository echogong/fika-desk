import { APP_NAME } from '../shared/brand';
// Web frontend proxy. Agent execution, authentication and SQLite live in an independent runner.
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Duplex } from 'node:stream';
import { readConfig, runnerPaths } from './runtime-config';
import { prepareRunner, ensureRunner, systemdEnvironment } from './runner-runtime';
import { runnerRequest } from './runner-control';
import { spawnSync } from 'node:child_process';
import { securityHeaders, sendJson } from './http';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const config = readConfig(root, args);
const dev = args.includes('--dev');
const paths = runnerPaths(config.dataDir);
const host = '127.0.0.1';
const allowedHosts = new Set([`127.0.0.1:${config.port}`, `localhost:${config.port}`, ...(config.publicUrl ? [new URL(config.publicUrl).host] : [])]);

async function main(): Promise<void> {
  if (args[0] === 'runner-status') { console.log(JSON.stringify(await runnerRequest(config.dataDir), null, 2)); return; }
  if (args[0] === 'stop-runner') {
    const result = spawnSync('systemctl', ['--user', 'stop', paths.unit], { env: systemdEnvironment(), stdio: 'inherit' });
    if (result.status !== 0 && fs.existsSync(path.join(paths.lock, 'pid'))) process.kill(Number(fs.readFileSync(path.join(paths.lock, 'pid'), 'utf8')), 'SIGTERM');
    return;
  }
  if (args[0] === 'reset-password') {
    let running = false;
    try { await runnerRequest(config.dataDir); running = true; } catch {}
    if (running) await runnerRequest(config.dataDir, 'reset-password', 'POST');
    else {
      const [{ openDatabase }, { Auth }] = await Promise.all([import('./db'), import('./auth')]);
      const db = openDatabase(config.dataDir);
      new Auth(db, () => {}).resetPassword(); db.close();
    }
    console.log('密码已清除，所有设备都已退出登录；刷新网页后请在后台日志中获取新的设置链接。');
    return;
  }
  const desired = await prepareRunner(root, config);
  await ensureRunner(desired);
  const tunnels = new Set<Duplex>();
  const requests = new Set<http.ClientRequest>();
  let handleWeb: (req: http.IncomingMessage, res: http.ServerResponse) => void;
  const server = http.createServer((req, res) => {
    securityHeaders(res);
    if (!allowedHosts.has(String(req.headers.host))) { res.writeHead(403).end('Forbidden'); return; }
    let url: URL;
    try { url = new URL(req.url ?? '/', 'http://web'); } catch { res.writeHead(400).end(); return; }
    if (url.pathname.startsWith('/api/')) {
      const upstream = http.request({ socketPath: paths.socket, path: req.url, method: req.method, headers: req.headers }, (response) => {
        res.writeHead(response.statusCode ?? 502, response.headers);
        response.pipe(res);
        response.on('error', () => res.destroy());
      });
      requests.add(upstream);
      upstream.on('close', () => requests.delete(upstream));
      upstream.on('error', () => {
        if (!res.headersSent) sendJson(res, 503, { error: '后台正在重新连接，请稍后重试' });
        else res.destroy();
      });
      req.on('aborted', () => upstream.destroy());
      res.on('close', () => { if (!res.writableFinished) upstream.destroy(); });
      req.pipe(upstream);
      return;
    }
    try { handleWeb(req, res); } catch { if (!res.headersSent) res.writeHead(400).end('Bad request'); }
  });
  let closeVite: (() => Promise<void>) | undefined;
  if (dev) {
    const { createServer } = await import('vite');
    const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true, ws: { server } }, appType: 'spa' });
    handleWeb = (req, res) => vite.middlewares(req, res, () => { res.writeHead(404).end('Not found'); });
    closeVite = () => vite.close();
  } else {
    const dist = path.join(root, 'dist');
    if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('还没有构建网页，请先运行 npm run build');
    handleWeb = (req, res) => serveStatic(dist, req, res);
  }
  server.on('upgrade', (req, socket, head) => {
    if (new URL(req.url ?? '/', 'http://web').pathname !== '/ws') return;
    if (!allowedHosts.has(String(req.headers.host))) { socket.destroy(); return; }
    const upstream = net.createConnection({ path: paths.socket });
    tunnels.add(socket); tunnels.add(upstream);
    socket.on('error', () => upstream.destroy());
    upstream.on('error', () => socket.destroy());
    socket.on('close', () => { tunnels.delete(socket); upstream.destroy(); });
    upstream.on('close', () => { tunnels.delete(upstream); socket.destroy(); });
    upstream.on('connect', () => {
      const headers: string[] = [];
      for (let i = 0; i < req.rawHeaders.length; i += 2) headers.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
      upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${headers.join('\r\n')}\r\n\r\n`);
      if (head.length) upstream.write(head);
      socket.pipe(upstream).pipe(socket);
    });
  });
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(config.port, host, resolve); });
  console.log(`${APP_NAME} 已启动：http://${host}:${config.port}${config.publicUrl ? `（对外：${config.publicUrl}）` : ''}`);
  console.log(`Agent 后台独立运行；日志：${paths.log}`);
  let checking = false;
  const monitor = setInterval(() => {
    if (checking) return;
    checking = true;
    void ensureRunner(desired).catch((error) => console.error(error.message)).finally(() => { checking = false; });
  }, 5000);
  monitor.unref();
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true; clearInterval(monitor);
    for (const request of requests) request.destroy();
    for (const tunnel of tunnels) tunnel.destroy();
    server.close(); server.closeAllConnections();
    void closeVite?.();
    // The independent runner owns all Agent processes and keeps running.
    setTimeout(() => process.exit(0), 300).unref();
  };
  process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function serveStatic(dist: string, req: http.IncomingMessage, res: http.ServerResponse): void {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  let file = path.join(dist, pathname);
  if (!file.startsWith(dist + path.sep) && file !== dist) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html');
  res.writeHead(200, {
    'content-type': MIME[path.extname(file)] ?? 'application/octet-stream',
    'cache-control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  fs.createReadStream(file).pipe(res);
}

void main().catch((error) => { console.error(error); process.exit(1); });
