#!/usr/bin/env node
// 演示 Agent：说标准的 ACP 协议，但不联网、不改文件、不花额度。
// 用来在没有真实 Agent 的情况下把界面的每个环节都跑一遍（开发模式下出现在“启动 Agent”里）。
// 会话存在临时目录里，可以演示“历史会话”：列出、回放、接着聊。
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { Readable, Writable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';

const sessions = new Map();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// MOCK_AGENT_NO_HISTORY=1 时假装不支持恢复会话，用来测试那种情况下的提示
const HISTORY = process.env.MOCK_AGENT_NO_HISTORY !== '1';
const STORE = process.env.MOCK_AGENT_STORE ?? path.join(os.tmpdir(), 'fika-desk-mock-agent');

// MOCK_AGENT_LOGIN=1 时要先登录才能新建会话，用来测试设置页的“登录”：填 Key、验证码登录、设置向导，以及自己打开网页登录（学 CodeBuddy 的微信登录）
const NEED_LOGIN = process.env.MOCK_AGENT_LOGIN === '1';
const LOGIN_FILE = path.join(STORE, 'login.json');
const loggedIn = () => fs.existsSync(LOGIN_FILE);
function saveLogin(method) {
  fs.mkdirSync(STORE, { recursive: true });
  fs.writeFileSync(LOGIN_FILE, JSON.stringify({ method, at: new Date().toISOString() }));
}
const authMethods = NEED_LOGIN
  ? [
      { id: 'api-key', name: 'API Key', description: 'Use a demo API key', _meta: { 'api-key': {} } },
      { id: 'demo-device-code', name: 'Demo account (device code)', description: 'Open a page and enter a one-time code' },
      { id: 'demo-setup', name: 'Launch setup', description: 'Configure the demo agent in a terminal', type: 'terminal', args: ['--setup'], env: { MOCK_SETUP_GREETING: '欢迎' } },
      // 学 CodeBuddy 的微信登录：自己“打开浏览器”（运行 $BROWSER 网址），然后一直等你在网页上登录好
      { id: 'demo-wechat', name: 'Login with WeChat', description: null },
    ]
  : [];

/** 演示“设置向导”：在终端里问一个 Key，存起来就算登录好了（真实的 Agent 在这里选供应商、填 Key 或登录账号） */
function runSetup() {
  const out = process.stdout;
  console.log(`\x1b[1m演示 Agent 设置向导\x1b[0m ${process.env.MOCK_SETUP_GREETING ?? ''}`);
  console.log(`终端大小：${out.columns} × ${out.rows}`);
  out.on('resize', () => console.log(`\n终端大小变成了：${out.columns} × ${out.rows}`));
  // 有的向导要打开网页登录：服务器上没有浏览器，Fika Desk 会把网址显示在终端上面
  if (process.env.BROWSER) execFile(process.env.BROWSER, ['https://example.com/oauth?client=demo&step=1'], () => {});
  const rl = readline.createInterface({ input: process.stdin, output: out });
  rl.question('填一个演示用的 API Key（直接回车表示放弃）：', (answer) => {
    rl.close();
    if (!answer.trim()) {
      console.log('没填，退出。');
      process.exit(1);
    }
    saveLogin('setup');
    console.log('已保存，设置完成。');
    // Key 末尾带 ! 时以退出码 2 退出：模拟有的 Agent 登录好了也不是正常退出
    setTimeout(() => process.exit(answer.trim().endsWith('!') ? 2 : 0), 200);
  });
}

function save(s) {
  if (!HISTORY || !s.updates.length) return;
  try {
    fs.mkdirSync(STORE, { recursive: true });
    const record = { sessionId: s.id, cwd: s.cwd, title: s.title, updatedAt: new Date().toISOString(), updates: s.updates };
    fs.writeFileSync(path.join(STORE, `${s.id}.json`), JSON.stringify(record));
  } catch {
    // 存不了就只是没有历史，不影响演示
  }
}

function readSaved(id) {
  try {
    return JSON.parse(fs.readFileSync(path.join(STORE, `${path.basename(id)}.json`), 'utf8'));
  } catch {
    return null;
  }
}

function listSaved(cwd) {
  let files = [];
  try {
    files = fs.readdirSync(STORE).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  return files
    .map((f) => readSaved(f.slice(0, -5)))
    .filter((r) => r && (!cwd || r.cwd === cwd))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** 从保存的记录恢复会话，之后可以接着聊 */
function restore(record, cwd) {
  const turns = record.updates.filter((u) => u.sessionUpdate === 'user_message_chunk').length;
  const s = { id: record.sessionId, cwd, model: 'demo-fast', effort: 'medium', mode: 'ask', cancelled: false, turns, title: record.title, updates: record.updates };
  sessions.set(s.id, s);
  return s;
}

const configOptions = (s) => [
  {
    id: 'model',
    name: 'Model',
    category: 'model',
    type: 'select',
    currentValue: s.model,
    options: [
      { value: 'demo-fast', name: 'demo-fast' },
      { value: 'demo-smart', name: 'demo-smart' },
    ],
  },
  {
    id: 'reasoning_effort',
    name: 'Reasoning effort',
    category: 'thought_level',
    type: 'select',
    currentValue: s.effort,
    options: [
      { value: 'low', name: 'Low' },
      { value: 'medium', name: 'Medium' },
      { value: 'high', name: 'High' },
    ],
  },
  // 演示 Agent 自己的权限模式：每次都问 / 改文件不问（跑命令还问）/ 什么都不问。什么时候问由它自己决定
  {
    id: 'mode',
    name: 'Approval mode',
    category: 'mode',
    type: 'select',
    currentValue: s.mode,
    options: [
      { value: 'ask', name: 'Ask every time', description: 'Ask before editing files or running commands' },
      { value: 'auto-edit', name: 'Auto edit', description: 'Edit files without asking, ask before running commands' },
      { value: 'full', name: 'Full access', description: 'Never ask' },
    ],
  },
];

const permissionOptions = [
  { optionId: 'allow', name: 'Allow', kind: 'allow_once' },
  { optionId: 'always', name: 'Always allow', kind: 'allow_always' },
  { optionId: 'deny', name: 'Deny', kind: 'reject_once' },
];

const app = acp
  .agent({ name: 'mock-agent' })
  .onRequest('initialize', async ({ params }) => {
    // MOCK_AGENT_OLD_SDK=1：学旧版协议库（比如 pi-acp 用的 0.26），auth.terminal 只认 true/false，写成对象就整个握手报参数不对
    const terminal = params?.clientCapabilities?.auth?.terminal;
    if (process.env.MOCK_AGENT_OLD_SDK === '1' && terminal != null && typeof terminal !== 'boolean') {
      throw acp.RequestError.invalidParams({ clientCapabilities: { auth: 'terminal: expected boolean, received object' } });
    }
    return {
      protocolVersion: acp.PROTOCOL_VERSION,
      agentCapabilities: {
        loadSession: HISTORY,
        sessionCapabilities: HISTORY ? { list: {}, resume: {} } : {},
        promptCapabilities: { image: false, audio: false, embeddedContext: false },
      },
      agentInfo: { name: 'mock-agent', title: '演示 Agent', version: '0.1.0' },
      authMethods,
    };
  })
  .onRequest('authenticate', async ({ params, client }) => {
    if (params.methodId === 'api-key') {
      const key = String(params._meta?.['api-key']?.apiKey ?? '');
      if (!key.startsWith('sk-')) throw acp.RequestError.invalidParams(undefined, 'API Key 要以 sk- 开头');
      saveLogin('api-key');
      return {};
    }
    if (params.methodId === 'demo-device-code') {
      const res = await client.request('elicitation/create', {
        mode: 'url',
        url: 'https://example.com/device',
        message: 'Sign in and enter this code: DEMO-4821',
        elicitationId: 'demo-login',
      });
      if (res?.action !== 'accept') throw acp.RequestError.invalidRequest(undefined, '取消了');
      // 假装你在别的设备上输完了验证码
      await sleep(Number(process.env.MOCK_DEVICE_WAIT_MS ?? 1500));
      saveLogin('device-code');
      await client.notify('elicitation/complete', { elicitationId: 'demo-login' });
      return {};
    }
    if (params.methodId === 'demo-wechat') {
      const browser = process.env.BROWSER;
      const url = 'https://example.com/login?state=demo-4821&platform=cli';
      // 没有 BROWSER（服务器上没有浏览器）就打不开，只能一直等：这正是要解决的“点了没反应”
      if (browser) await new Promise((resolve) => execFile(browser, [url], { timeout: 10_000 }, () => resolve()));
      // 假装你在手机上扫码登录好了
      await sleep(browser ? Number(process.env.MOCK_BROWSER_WAIT_MS ?? 2000) : 60_000);
      if (!browser) throw acp.RequestError.authRequired(undefined, '等太久了');
      saveLogin('wechat');
      return {};
    }
    throw acp.RequestError.invalidParams(undefined, '不支持这种登录方式');
  })
  .onRequest('session/new', async ({ params }) => {
    if (NEED_LOGIN && !loggedIn()) throw acp.RequestError.authRequired(undefined, '演示 Agent 还没登录');
    const sessionId = randomUUID();
    const s = { id: sessionId, cwd: params.cwd, model: 'demo-fast', effort: 'medium', mode: 'ask', cancelled: false, turns: 0, title: '', updates: [] };
    sessions.set(sessionId, s);
    return { sessionId, configOptions: configOptions(s) };
  })
  .onRequest('session/list', async ({ params }) => ({
    sessions: listSaved(params.cwd).map((r) => ({ sessionId: r.sessionId, cwd: r.cwd, title: r.title || null, updatedAt: r.updatedAt })),
  }))
  .onRequest('session/load', async ({ params, client }) => {
    const record = readSaved(params.sessionId);
    if (!record) throw new Error('找不到这个会话');
    // 把之前的对话原样回放一遍
    for (const update of record.updates) await client.notify('session/update', { sessionId: record.sessionId, update });
    return { configOptions: configOptions(restore(record, params.cwd)) };
  })
  .onRequest('session/resume', async ({ params }) => {
    const record = readSaved(params.sessionId);
    if (!record) throw new Error('找不到这个会话');
    return { configOptions: configOptions(restore(record, params.cwd)) };
  })
  .onRequest('session/set_config_option', async ({ params }) => {
    const s = sessions.get(params.sessionId);
    if (params.configId === 'model') s.model = params.value;
    if (params.configId === 'reasoning_effort') s.effort = params.value;
    if (params.configId === 'mode') s.mode = params.value;
    return { configOptions: configOptions(s) };
  })
  .onNotification('session/cancel', async ({ params }) => {
    const s = sessions.get(params.sessionId);
    if (s) s.cancelled = true;
  })
  .onRequest('session/prompt', async ({ params, client }) => {
    const s = sessions.get(params.sessionId);
    s.cancelled = false;
    s.turns += 1;
    const text = params.prompt.map((b) => (b.type === 'text' ? b.text : '')).join('');
    // 发出去的每条更新都记下来，回放历史时原样再发一遍
    const send = (update) => {
      if (update.sessionUpdate === 'session_info_update') s.title = update.title;
      s.updates.push(update);
      return client.notify('session/update', { sessionId: params.sessionId, update });
    };
    s.updates.push({ sessionUpdate: 'user_message_chunk', content: { type: 'text', text } });
    if (!s.title) s.title = text.slice(0, 24);
    const stream = async (kind, sentence) => {
      for (const piece of chunks(sentence)) {
        if (s.cancelled) return false;
        await send({ sessionUpdate: kind, content: { type: 'text', text: piece } });
        await sleep(35);
      }
      return true;
    };
    const ask = async (toolCall) => {
      // 按自己的权限模式决定问不问
      if (s.mode === 'full' || (s.mode === 'auto-edit' && toolCall.kind === 'edit')) return true;
      const res = await client.request('session/request_permission', {
        sessionId: params.sessionId,
        toolCall,
        options: permissionOptions,
      });
      return res.outcome?.outcome === 'selected' && res.outcome.optionId !== 'deny';
    };
    const done = (stopReason) => {
      save(s);
      return {
        stopReason,
        usage: { inputTokens: 5200 + s.turns * 800, outputTokens: 410, totalTokens: 5610 + s.turns * 800 },
      };
    };

    const wantsFix = /修|bug|fix|测试|test/i.test(text);
    if (!wantsFix) {
      if (!(await stream('agent_thought_chunk', '用户在打招呼或者问问题，简单回答就好。'))) return done('cancelled');
      const ok = await stream(
        'agent_message_chunk',
        `你好！我是**演示 Agent**，不会真的改文件，只用来试界面。\n\n你刚才说的是：\n\n> ${text.slice(0, 200)}\n\n试试对我说“**修一下价格计算的 bug**”，可以看到读文件、改代码、跑测试和审批的完整流程。`,
      );
      await send({ sessionUpdate: 'usage_update', used: 8000 + s.turns * 3000, size: 200000 });
      return done(ok ? 'end_turn' : 'cancelled');
    }

    if (!(await stream('agent_thought_chunk', '先看看价格计算的实现和测试，再决定怎么改。'))) return done('cancelled');
    await send({ sessionUpdate: 'session_info_update', title: '修复价格折扣计算' });
    await send({
      sessionUpdate: 'plan',
      entries: [
        { content: '读代码和测试，找出原因', priority: 'high', status: 'in_progress' },
        { content: '修改 finalPrice', priority: 'high', status: 'pending' },
        { content: '运行测试确认', priority: 'medium', status: 'pending' },
      ],
    });

    for (const [id, title, kind, path] of [
      [`read-a-${s.turns}`, '读取 src/price.js', 'read', 'src/price.js'],
      [`read-b-${s.turns}`, '读取 test.js', 'read', 'test.js'],
      [`search-${s.turns}`, '搜索 finalPrice', 'search', null],
    ]) {
      if (s.cancelled) return done('cancelled');
      await send({
        sessionUpdate: 'tool_call',
        toolCallId: id,
        title,
        kind,
        status: 'in_progress',
        locations: path ? [{ path: `${s.cwd}/${path}` }] : [],
      });
      await sleep(250);
      await send({ sessionUpdate: 'tool_call_update', toolCallId: id, status: 'completed' });
    }

    if (!(await stream('agent_message_chunk', '找到原因了：`finalPrice` 直接用价格乘以折扣比例，应该乘以 `1 - discount`。我来改一下。')))
      return done('cancelled');

    const edit = {
      toolCallId: `edit-${s.turns}`,
      title: '修改 src/price.js',
      kind: 'edit',
      status: 'pending',
      locations: [{ path: `${s.cwd}/src/price.js`, line: 4 }],
      content: [
        {
          type: 'diff',
          path: `${s.cwd}/src/price.js`,
          oldText:
            "// 计算打折后的价格。discount 是折扣比例，比如 0.2 表示减 20%。\nexport function finalPrice(price, discount) {\n  if (discount < 0 || discount > 1) throw new Error('折扣必须在 0 到 1 之间');\n  return price * discount;\n}\n",
          newText:
            "// 计算打折后的价格。discount 是折扣比例，比如 0.2 表示减 20%。\nexport function finalPrice(price, discount) {\n  if (discount < 0 || discount > 1) throw new Error('折扣必须在 0 到 1 之间');\n  return Math.round(price * (1 - discount) * 100) / 100;\n}\n",
        },
      ],
    };
    await send({ sessionUpdate: 'tool_call', ...edit });
    if (!(await ask(edit))) {
      await send({ sessionUpdate: 'tool_call_update', toolCallId: edit.toolCallId, status: 'failed' });
      if (s.cancelled) return done('cancelled');
      await stream('agent_message_chunk', '好的，先不改。需要我换一种改法吗？');
      return done('end_turn');
    }
    await send({ sessionUpdate: 'tool_call_update', toolCallId: edit.toolCallId, status: 'completed' });
    await send({
      sessionUpdate: 'plan',
      entries: [
        { content: '读代码和测试，找出原因', priority: 'high', status: 'completed' },
        { content: '修改 finalPrice', priority: 'high', status: 'completed' },
        { content: '运行测试确认', priority: 'medium', status: 'in_progress' },
      ],
    });

    if (!(await stream('agent_message_chunk', '改好了，运行测试确认一下。'))) return done('cancelled');
    const run = {
      toolCallId: `exec-${s.turns}`,
      title: 'node test.js',
      kind: 'execute',
      status: 'pending',
      rawInput: { command: ['bash', '-lc', 'node test.js'] },
    };
    await send({ sessionUpdate: 'tool_call', ...run });
    if (!(await ask(run))) {
      await send({ sessionUpdate: 'tool_call_update', toolCallId: run.toolCallId, status: 'failed' });
      if (s.cancelled) return done('cancelled');
      await stream('agent_message_chunk', '好的，不运行测试。你可以自己运行 `node test.js` 确认。');
      return done('end_turn');
    }
    await send({ sessionUpdate: 'tool_call_update', toolCallId: run.toolCallId, status: 'in_progress' });
    await sleep(700);
    await send({
      sessionUpdate: 'tool_call_update',
      toolCallId: run.toolCallId,
      status: 'completed',
      content: [{ type: 'content', content: { type: 'text', text: '全部测试通过\n' } }],
    });
    await send({
      sessionUpdate: 'plan',
      entries: [
        { content: '读代码和测试，找出原因', priority: 'high', status: 'completed' },
        { content: '修改 finalPrice', priority: 'high', status: 'completed' },
        { content: '运行测试确认', priority: 'medium', status: 'completed' },
      ],
    });
    const ok = await stream('agent_message_chunk', '测试通过了。现在 `finalPrice(100, 0.2)` 会返回 **80**。\n\n（这是演示，实际文件没有被修改。）');
    await send({ sessionUpdate: 'usage_update', used: 24000 + s.turns * 3000, size: 200000 });
    return done(ok ? 'end_turn' : 'cancelled');
  });

function chunks(text) {
  const out = [];
  for (let i = 0; i < text.length; i += 3) out.push(text.slice(i, i + 3));
  return out;
}

if (process.argv.includes('--setup')) runSetup();
else app.connect(acp.ndJsonStream(Writable.toWeb(process.stdout), Readable.toWeb(process.stdin)));
