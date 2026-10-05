// 设计评审用的样例数据：不连服务端，直接把几位 Agent 的会话放进界面，用真实组件渲染，方便截图。
// 只有 `vite build --mode fixture` 才会打包进去（见 main.tsx），网址后加 ?theme=light 看浅色，?panes=1 到 4 开几个窗口。
import { useEffect } from 'react';
import type { AgentInfo, PermissionOptionInfo, SessionMeta, SessionSnapshot, TimelineItem, WorkspaceInfo } from '../../shared/types';
import { App } from './App';
import { AuthPage } from './components/AuthPage';
import { setState } from './store';

const now = Date.now();
const ago = (min: number) => now - min * 60_000;
const HOME = '/home/fika';
const BLOG = `${HOME}/projects/blog`;

const ALLOW: PermissionOptionInfo[] = [
  { optionId: 'reject', name: 'Reject', kind: 'reject_once' },
  { optionId: 'always', name: 'Always allow', kind: 'allow_always' },
  { optionId: 'once', name: 'Allow once', kind: 'allow_once' },
];

const agents: AgentInfo[] = [
  { id: 'codex', name: 'Codex', color: 'codex', commandLine: 'codex-acp', available: true, enabled: true },
  { id: 'pi', name: 'Pi', color: 'pi', commandLine: 'pi-acp', available: true, enabled: true },
  { id: 'hermes', name: 'Hermes', color: 'hermes', commandLine: 'hermes acp', available: true, enabled: true },
  { id: 'codebuddy', name: 'CodeBuddy', color: 'codebuddy', commandLine: 'codebuddy --acp', available: true, enabled: true },
];

const workspaces: WorkspaceInfo[] = [
  { id: 'default', name: '默认', path: HOME, displayPath: '~', isDefault: true },
  { id: 'blog', name: 'blog', path: BLOG, displayPath: '~/projects/blog', branch: 'main' },
  { id: 'ops', name: 'ops-scripts', path: `${HOME}/ops/scripts`, displayPath: '~/ops/scripts', branch: 'main' },
  { id: 'api', name: 'api', path: `${HOME}/projects/api`, displayPath: '~/projects/api', branch: 'refactor/client' },
];

function meta(id: string, agentId: string, workspaceId: string, title: string, state: SessionMeta['state'], updated: number, model: string, used = 52_000): SessionMeta {
  const agent = agents.find((a) => a.id === agentId)!;
  const ws = workspaces.find((w) => w.id === workspaceId)!;
  return {
    id,
    workspaceId,
    agentId,
    agentName: agent.name,
    color: agent.color,
    cwd: ws.path,
    title,
    titleSource: 'summary',
    source: 'web',
    state,
    selects: [
      { id: 'model', name: 'Model', category: 'model', value: model, options: [{ value: model, name: model }] },
      {
        id: 'effort',
        name: 'Reasoning effort',
        category: 'thought_level',
        value: 'high',
        options: [
          { value: 'low', name: 'Low' },
          { value: 'medium', name: 'Medium' },
          { value: 'high', name: 'High' },
        ],
      },
      {
        id: 'mode',
        name: 'Mode',
        category: 'mode',
        value: 'auto',
        options: [
          { value: 'read-only', name: 'Read Only' },
          { value: 'auto', name: 'Auto' },
          { value: 'full-access', name: 'Full Access' },
        ],
      },
    ],
    usage: { used, size: 400_000 },
    queued: 0,
    createdAt: updated - 600_000,
    updatedAt: updated,
  };
}

let n = 0;
const id = () => `f${++n}`;
const user = (at: number, text: string): TimelineItem => ({ id: id(), at, kind: 'user', text });
const said = (at: number, text: string): TimelineItem => ({ id: id(), at, kind: 'agent', text });
const thought = (at: number, text: string): TimelineItem => ({ id: id(), at, kind: 'thought', text });
const read = (at: number, path: string): TimelineItem => ({
  id: id(),
  at,
  kind: 'tool',
  toolCallId: id(),
  title: `Read ${path}`,
  toolKind: 'read',
  category: 'read',
  status: 'completed',
  content: [],
  locations: [{ path }],
});
const edit = (at: number, path: string, oldText: string, newText: string, approved = true): TimelineItem => ({
  id: id(),
  at,
  kind: 'tool',
  toolCallId: id(),
  title: `Edit ${path}`,
  toolKind: 'edit',
  category: 'edit',
  status: 'completed',
  content: [{ type: 'diff', path, oldText, newText }],
  locations: [{ path }],
  approval: approved ? { requestId: id(), state: 'approved', options: ALLOW, chosen: 'once' } : undefined,
});
const run = (at: number, command: string, status: string, output?: string, approval?: 'pending' | 'approved'): TimelineItem => ({
  id: id(),
  at,
  kind: 'tool',
  toolCallId: id(),
  title: command,
  toolKind: 'execute',
  category: 'execute',
  status,
  content: output ? [{ type: 'text', text: output }] : [],
  locations: [],
  command,
  approval: approval ? { requestId: id(), state: approval, options: ALLOW } : undefined,
});
const turn = (at: number, minutes: number): TimelineItem => ({
  id: id(),
  at,
  kind: 'turn',
  stopReason: 'end_turn',
  durationMs: minutes * 60_000,
  usage: { inputTokens: 18_400, outputTokens: 2_300, cachedTokens: 41_000 },
});

const LOGIN_OLD = `export async function onSubmit(form) {
  const ok = await verify(form);
  if (!ok) return;
  router.push('/home');
}`;
const LOGIN_NEW = `export async function onSubmit(form) {
  const ok = await verify(form);
  if (!ok) {
    toast.error('密码错误，请重试');
    return;
  }
  router.push('/home');
}`;
const HOME_OLD = `import Chart from 'chart-lib';

export function Feed({ items }) {
  return items.map((item) => <img src={item.cover} />);
}`;
const HOME_NEW = `const Chart = lazy(() => import('chart-lib'));

export function Feed({ items }) {
  return items.map((item) => (
    <img src={item.cover} loading="lazy" />
  ));
}`;

const sessions: SessionSnapshot[] = [
  {
    meta: meta('codex-1', 'codex', 'blog', '修复登录页没有错误提示', 'waiting', ago(1), 'gpt-5.5'),
    timeline: [
      user(ago(24), '这个 blog 项目是用什么搭的？'),
      read(ago(23.8), `${BLOG}/package.json`),
      said(ago(23), 'Vite 加 React，路由用 React Router，样式是 CSS Modules。\n\n测试用 Vitest，`npm test` 就能跑。'),
      turn(ago(23), 1),
      user(ago(15), '先把 blog 项目跑起来，我要看登录页'),
      run(ago(14.8), 'npm install', 'completed', 'added 412 packages in 9s'),
      run(ago(14.5), 'npm run dev', 'completed', 'VITE v8.3.1  ready in 412 ms\n➜  Local: http://localhost:5173/'),
      said(ago(14), '跑起来了，打开 `localhost:5173/login` 就是登录页，改了代码会自己刷新。'),
      turn(ago(14), 1),
      user(ago(6), '输错密码时登录页没有任何提示，修一下'),
      thought(ago(6) + 8_000, '先看登录表单的提交逻辑，再确认提示组件有没有被调用。'),
      read(ago(5.8), `${BLOG}/src/login.ts`),
      read(ago(5.7), `${BLOG}/src/components/Toast.tsx`),
      read(ago(5.6), `${BLOG}/tests/login.test.ts`),
      said(ago(5), '找到原因了：`login.ts` 校验失败后直接返回，没有调用 `toast.error`。我把提示补上。'),
      edit(ago(4), `${BLOG}/src/login.ts`, LOGIN_OLD, LOGIN_NEW),
      said(ago(2), '改好了，跑一下登录相关的测试确认。'),
      run(ago(1), 'npm test -- login', 'pending', undefined, 'pending'),
    ],
  },
  {
    meta: meta('pi-1', 'pi', 'blog', '首页加载太慢', 'running', ago(0.2), 'deepseek-v4-pro', 131_000),
    timeline: [
      user(ago(25), '首页的图片都放在哪？'),
      read(ago(24.8), `${BLOG}/src/pages/home.tsx`),
      said(ago(24), '都在 `public/covers/` 下面，一共 48 张，最大的 1.2 MB。\n\n首页一打开就加载前 12 张，都没压缩。'),
      turn(ago(24), 1),
      user(ago(16), '先量一下首页现在多快'),
      run(ago(15.8), 'npx lighthouse http://localhost:5173 --only-categories=performance', 'completed', 'Performance: 41\nLargest Contentful Paint: 4.1 s\nTotal Blocking Time: 620 ms'),
      said(ago(15), '性能分 41，最大内容绘制要 4.1 秒，主线程被阻塞了 620 毫秒。慢主要慢在首屏。'),
      turn(ago(15), 1),
      user(ago(9), '首页打开要 4 秒，帮我找找原因'),
      thought(ago(9) + 6_000, '先看首屏都加载了什么，再看打包结果里哪个依赖最大。'),
      read(ago(8.9), `${BLOG}/src/pages/home.tsx`),
      read(ago(8.9), `${BLOG}/src/components/Chart.tsx`),
      read(ago(8.8), `${BLOG}/vite.config.ts`),
      read(ago(8.8), `${BLOG}/package.json`),
      said(ago(7.5), '首屏同时加载了 12 张大图，图表库（380 KB）也被打进了首页的包里。把图表改成按需加载、图片加上懒加载，首屏应该能降到 2 秒以内。要我改吗？'),
      turn(ago(7.5), 1.5),
      user(ago(3), '改吧，改完重新打包看看'),
      edit(ago(2.5), `${BLOG}/src/pages/home.tsx`, HOME_OLD, HOME_NEW),
      edit(ago(2), `${BLOG}/src/components/Cover.tsx`, '<img src={src} alt={alt} />', '<img src={src} alt={alt} loading="lazy" decoding="async" />'),
      said(ago(1), '两处都改好了，重新打包看看首页的包小了多少。'),
      run(ago(0.5), 'npm run build', 'in_progress', 'vite v8.3.1 building for production...\n✓ 412 modules transformed.'),
    ],
  },
  {
    meta: meta('cb-1', 'codebuddy', 'blog', '补齐登录流程的测试', 'idle', ago(32), 'glm-5.1', 88_000),
    timeline: [
      user(ago(62), '帮我看看测试目录是怎么组织的'),
      read(ago(61.8), `${BLOG}/tests`),
      said(ago(61), '测试都在 `tests/` 下面，一个页面一个文件：`login.test.ts`、`home.test.ts`、`post.test.ts`。\n\n公用的模拟数据在 `tests/fixtures/`。'),
      turn(ago(61), 1),
      user(ago(55), '这个项目的测试怎么跑？'),
      read(ago(54.8), `${BLOG}/package.json`),
      said(ago(54), '用 Vitest。`npm test` 跑全部，加 `--watch` 改了代码会自动重跑。'),
      turn(ago(54), 1),
      user(ago(48), '看看登录流程现在有哪些测试'),
      read(ago(47.8), `${BLOG}/tests/login.test.ts`),
      said(ago(47), '只有 1 个，测的是登录成功。密码错误的提示、“记住我”、登录后跳转都没有测到。'),
      turn(ago(47), 1),
      user(ago(40), '登录流程的测试太少了，把失败提示、记住我、跳转这几种情况都补上'),
      read(ago(39), `${BLOG}/tests/login.test.ts`),
      edit(ago(36), `${BLOG}/tests/login.test.ts`, "it('登录成功', ok);", "it('登录成功', ok);\nit('密码错误时显示提示', showsError);\nit('记住我', remembers);"),
      run(ago(34), 'npx vitest run tests/login.test.ts', 'completed', '✓ tests/login.test.ts (9 tests) 412ms'),
      said(ago(33), '补了 9 个测试，全部通过：\n\n- 密码错误时显示提示（3 个）\n- 勾选“记住我”后关掉再打开还在登录状态（2 个）\n- 登录后跳回原来的页面（4 个）\n\n跳转那几个依赖 `router.push` 的模拟，以后改路由要记得一起改。'),
      turn(ago(32), 8),
    ],
  },
  {
    meta: meta('hermes-1', 'hermes', 'blog', '写部署说明', 'idle', ago(180), 'hermes-4-405b'),
    timeline: [user(ago(190), '根据现在的项目结构写一份部署说明'), said(ago(181), '部署说明写好了，放在 README 的“部署”一节。'), turn(ago(180), 9)],
  },
  {
    meta: meta('pi-2', 'pi', 'ops', '写 /data 的每日备份脚本', 'waiting', ago(3), 'deepseek-v4-pro'),
    timeline: [
      user(ago(9), '写一个脚本：每天凌晨 3 点把 /data 打包上传到对象存储，只保留最近 7 份'),
      said(ago(4), '脚本写好了，接下来把它加进定时任务。'),
      run(ago(3), 'crontab /tmp/backup.cron', 'pending', undefined, 'pending'),
    ],
  },
  {
    meta: meta('cb-2', 'codebuddy', 'api', '重构接口请求层', 'running', ago(0.5), 'glm-5.1'),
    timeline: [user(ago(12), '把所有 fetch 调用统一换成 client.ts 里的封装，加上超时和重试'), read(ago(11), `${HOME}/projects/api/src/client.ts`)],
  },
];

const params = new URLSearchParams(location.search);
const theme = params.get('theme') === 'light' ? 'light' : 'dark';
/** ?view=login 看登录页，?view=empty 看没有窗口时的空状态 */
const view = params.get('view');
/** ?panes=1 到 4：开几个窗口（默认 3 个：等你、工作中、做完） */
const paneCount = Math.min(4, Math.max(1, Number(params.get('panes')) || 3));

/** 渲染之前先把样例数据放进状态里 */
export function loadFixture(): void {
  setState({
    auth: { checked: true, needsSetup: false, loggedIn: true, lockedUntil: 0 },
    connected: true,
    ready: true,
    home: HOME,
    agents,
    workspaces,
    sessions: Object.fromEntries(sessions.map((s) => [s.meta.id, s])),
    currentWorkspace: 'blog',
    layouts: { blog: { panes: view === 'empty' ? [] : ['codex-1', 'pi-1', 'cb-1', 'hermes-1'].slice(0, paneCount), focus: 'codex-1', maxed: null, closed: [] } },
    quotas: { codex: { at: now, kind: 'subscription', plan: 'Plus', windows: [{ label: '5 小时', usedPercent: 34, resetsAt: now + 7_200_000 }] } },
    theme,
  });
}

export function Fixture() {
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, []);
  if (view === 'login') return <AuthPage auth={{ checked: true, needsSetup: false, loggedIn: false, lockedUntil: 0 }} />;
  return <App />;
}
