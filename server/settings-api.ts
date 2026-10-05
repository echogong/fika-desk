// 设置页的接口（都要先登录；改东西的请求在 index.ts 里已经核对过来源）。
//   Agent：列出、改设置、测试连接、重新扫描
//   工作区：允许的目录范围、打开文件夹（浏览、新建）、移除、同时运行上限
//   安全：修改密码、登录设备、审计日志
//   关于：版本、数据目录、协议日志
import type http from 'node:http';
import type { AgentSettingsPatch } from './agent-settings';
import type { Auth, Login } from './auth';
import { readJson, sendJson } from './http';
import type { Hub } from './hub';
import { tildify, WorkspaceError, type WorkspaceManager } from './workspaces';
import type { AboutView, WorkspaceSettingsView } from '../shared/types';
import { validateInput, agentSettingsSchema, passwordChangeSchema, providerInputSchema, workspaceBodySchemas } from '../shared/validation';

export interface SettingsContext {
  hub: Hub;
  auth: Auth;
  dataDir: string;
  version: string;
  startedAt: number;
  workspaces: WorkspaceManager;
}

/** 处理 /api/settings/…，处理了返回 true */
export async function handleSettingsApi(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  ctx: SettingsContext,
  login: Login,
  ip: string,
): Promise<boolean> {
  const { hub, auth } = ctx;
  const route = url.pathname.slice('/api/settings/'.length);
  const get = req.method === 'GET';
  const post = req.method === 'POST';

  // ───── Agent
  if (get && route === 'agents/catalog') {
    sendJson(res, 200, hub.agentCatalogViews());
    return true;
  }
  if (get && route === 'agents') {
    sendJson(res, 200, hub.agentSettingsViews());
    return true;
  }
  if (post && route === 'agents/rescan') {
    hub.rescanAndBroadcast();
    sendJson(res, 200, hub.agentSettingsViews());
    return true;
  }
  // 检查更新（只查用 npm 装的 Agent）；force=1 时重新查
  if (get && route === 'agents/updates') {
    sendJson(res, 200, await hub.checkUpdates(url.searchParams.get('force') === '1'));
    return true;
  }
  // 账号用量（目前只有 Codex）；force=1 时重新读
  const quotaRoute = route.match(/^agents\/([a-z0-9-]+)\/quota$/);
  if (get && quotaRoute) {
    sendJson(res, 200, { quota: await hub.quotaOf(quotaRoute[1], url.searchParams.get('force') === '1') });
    return true;
  }
  // 测第三方模型供应商（不调模型、不花钱）
  const providerTest = route.match(/^agents\/([a-z0-9-]+)\/provider-test$/);
  if (post && providerTest) {
    try {
      const result = await hub.testProvider(providerTest[1], validateInput(providerInputSchema, await readJson(req)));
      if (!result) sendJson(res, 404, { error: '这个 Agent 不能在这里换模型供应商' });
      else sendJson(res, 200, result);
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : '设置不对' });
    }
    return true;
  }
  const agentRoute = route.match(/^agents\/([a-z0-9-]+)(\/test)?$/);
  if (post && agentRoute) {
    const agentId = agentRoute[1];
    if (agentRoute[2]) {
      const pending = hub.testAgent(agentId);
      if (!pending) sendJson(res, 404, { error: '没有这个 Agent' });
      else sendJson(res, 200, await pending);
      return true;
    }
    const raw = await readJson(req);
    if (['mode', 'model', 'setEnv', 'removeEnv'].some((key) => Object.hasOwn(raw, key))) {
      sendJson(res, 400, { error: '这项 Agent 设置已移除，请刷新页面后重试' });
      return true;
    }
    const body = validateInput(agentSettingsSchema, raw);
    const patch: AgentSettingsPatch = {};
    if (typeof body.enabled === 'boolean') patch.enabled = body.enabled;
    if (body.provider === null || (body.provider && typeof body.provider === 'object')) patch.provider = body.provider as AgentSettingsPatch['provider'];
    try {
      const view = hub.updateAgentSettings(agentId, patch);
      if (!view) {
        sendJson(res, 404, { error: '没有这个 Agent' });
        return true;
      }
      // 只记改了哪几项，不记供应商密钥
      auth.audit('agent-settings', ip, {
        agent: view.name,
        changed: Object.keys(patch),
      });
      sendJson(res, 200, view);
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : '设置不对' });
    }
    return true;
  }

  // ───── 工作区
  if (route === 'workspaces' || route.startsWith('workspaces/')) {
    try {
      return await handleWorkspaces(req, res, url, ctx, route, ip);
    } catch (error) {
      if (!(error instanceof WorkspaceError)) throw error;
      sendJson(res, 400, { error: error.message });
      return true;
    }
  }

  // ───── 安全
  if (get && route === 'security') {
    sendJson(res, 200, { logins: auth.listLogins(login.id), audit: auth.listAudit(50) });
    return true;
  }
  if (get && route === 'audit') {
    const before = Number(url.searchParams.get('before')) || undefined;
    sendJson(res, 200, { audit: auth.listAudit(50, before) });
    return true;
  }
  if (post && route === 'password') {
    const body = validateInput(passwordChangeSchema, await readJson(req));
    const result = await auth.changePassword(login.id, body.current, body.next, ip);
    if (!result.ok) {
      sendJson(res, result.status, { error: result.error, remaining: result.remaining, retryAfter: result.retryAfter });
      return true;
    }
    hub.dropLogin(...result.dropped);
    sendJson(res, 200, { ok: true, loggedOut: result.dropped.length });
    return true;
  }
  if (post && route === 'logins/logout-others') {
    const dropped = auth.logoutOthers(login.id, ip);
    hub.dropLogin(...dropped);
    sendJson(res, 200, { ok: true, loggedOut: dropped.length });
    return true;
  }
  const loginRoute = route.match(/^logins\/([0-9a-f]{16})\/logout$/);
  if (post && loginRoute) {
    const id = auth.logoutDevice(loginRoute[1], ip);
    if (id) hub.dropLogin(id);
    sendJson(res, id ? 200 : 404, id ? { ok: true } : { error: '没有这台设备' });
    return true;
  }

  // ───── 关于
  if (get && route === 'about') {
    const about: AboutView = {
      version: ctx.version,
      dataDir: ctx.dataDir,
      startedAt: ctx.startedAt,
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
      workspaces: ctx.workspaces.list().map((w) => ({ name: w.name, path: w.displayPath })),
    };
    sendJson(res, 200, about);
    return true;
  }
  if (get && route === 'protocol-log') {
    const logs = hub.sessionList().map((s) => ({ ...s, protocol: hub.protocolLog(s.id) }));
    const name = `fika-desk-protocol-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    sendJson(res, 200, { exportedAt: new Date().toISOString(), version: ctx.version, sessions: logs }, {
      'content-disposition': `attachment; filename="${name}"`,
    });
    return true;
  }
  return false;
}

async function handleWorkspaces(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: URL,
  ctx: SettingsContext,
  route: string,
  ip: string,
): Promise<boolean> {
  const { hub, auth, workspaces: wsm } = ctx;
  const view = (): WorkspaceSettingsView => ({
    roots: wsm.roots().map((p) => ({ path: p, displayPath: tildify(p) })),
    workspaces: wsm.list().map((w) => ({ ...w, live: hub.liveIn(w.path) })),
    limit: wsm.limit(),
    running: hub.liveCount(),
  });

  if (req.method === 'GET') {
    if (route === 'workspaces') {
      sendJson(res, 200, view());
      return true;
    }
    if (route === 'workspaces/browse') {
      sendJson(res, 200, wsm.browse(url.searchParams.get('path') ?? undefined));
      return true;
    }
    return false;
  }
  if (req.method !== 'POST') return false;
  const schema = workspaceBodySchemas[route as keyof typeof workspaceBodySchemas];
  if (!schema) return false;
  const body: Record<string, unknown> = validateInput(schema, await readJson(req));

  switch (route) {
    case 'workspaces/roots': {
      const dir = wsm.addRoot(String(body.path ?? ''));
      auth.audit('workspace-root-added', ip, { path: tildify(dir) });
      break;
    }
    case 'workspaces/roots/remove': {
      const dir = String(body.path ?? '');
      wsm.removeRoot(dir);
      auth.audit('workspace-root-removed', ip, { path: tildify(dir) });
      break;
    }
    case 'workspaces/mkdir': {
      const dir = wsm.mkdir(String(body.parent ?? ''), String(body.name ?? ''));
      auth.audit('folder-created', ip, { path: tildify(dir) });
      sendJson(res, 200, { path: dir });
      return true;
    }
    case 'workspaces/add': {
      const workspace = wsm.add(String(body.path ?? ''));
      auth.audit('workspace-added', ip, { path: workspace.displayPath });
      hub.workspacesChanged();
      sendJson(res, 200, { workspace, settings: view() });
      return true;
    }
    case 'workspaces/remove': {
      const target = wsm.get(String(body.id ?? ''));
      const live = target ? hub.liveIn(target.path) : 0;
      if (live) throw new WorkspaceError(`这个工作区里还有 ${live} 个 Agent 在运行，先结束它们再移除。`);
      const removed = wsm.remove(String(body.id ?? ''));
      auth.audit('workspace-removed', ip, { path: removed.displayPath });
      hub.workspacesChanged();
      break;
    }
    case 'workspaces/limit': {
      const limit = wsm.setLimit(Number(body.limit));
      auth.audit('workspace-limit', ip, { limit });
      break;
    }
    default:
      return false;
  }
  sendJson(res, 200, view());
  return true;
}
