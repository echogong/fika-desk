// 内置的 Agent 对照表：检测本机装了哪些 Agent，以及怎么用 ACP 启动它们。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AgentInfo } from '../shared/types';
import { AGENT_CATALOG } from '../shared/agent-catalog';
import { VERIFIED_CONNECTIONS } from './agent-connections';

export interface AgentPreset {
  id: string;
  name: string;
  color: string;
  /** 认证失败时的操作提示，历史兼容预设不再有设置页入口。 */
  loginHint?: string;
  /** 启动方式按顺序尝试：第一个能在 PATH 里找到命令的就用它 */
  launches: { command: string; args: string[] }[];
  /** 必须能找到的命令，比如 pi-acp 需要本机装了 pi */
  requires?: string[];
  /** 手动安装的说明（网页上装不了时显示） */
  install?: string;
  /** 网页上一键安装、更新（见 agent-install.ts） */
  setup?: AgentSetup;
  env?: Record<string, string>;
  /** 历史会话里列出它在命令行里的会话（通过 ACP 的 session/list，已实测过的才开） */
  listHistory?: boolean;
  /** 能查订阅用量：codex = 问 Codex 自己的账户接口 */
  quota?: 'codex';
  /** 怎么换成第三方模型：codex 在设置页里填供应商（见 model-provider.ts）· wizard 在 Agent 自己的设置向导里选 */
  providers?: 'codex' | 'wizard';
  demoOnly?: boolean;
}

/** npm 包和它提供的命令 */
export interface NpmPackage {
  pkg: string;
  bin: string;
}

/**
 * 网页上怎么装、怎么更新：
 * - npm：用 npm 装这些包，第一个是主程序
 * - script：固定的官方脚本或 uv 安装命令，用 bash 运行；更新使用原生更新命令或重新运行安装计划
 * - bundled：项目自带，跟着 Fika Desk 一起安装和更新；override 是改用另装版本的环境变量
 */
export type AgentSetup =
  | { npm: NpmPackage[]; libraries?: string[] }
  | { script: string; bin: string; update?: string[]; requires?: string[] }
  | { bundled: NpmPackage[]; override?: string };

export interface Launch {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  /** 第三方配置期望使用的 ACP 模型 ID；不包含凭据。 */
  modelId?: string;
  /** Verified extension parameters required by an Agent's ACP session creation. */
  sessionParams?: Record<string, unknown>;
  /** Some adapters accept configured model IDs absent from their initial picker. */
  allowUnlistedModel?: boolean;
}

export function presets(root: string): AgentPreset[] {
  const builtIn: AgentPreset[] = [
    {
      id: 'codex',
      name: 'Codex',
      color: 'codex',
      launches: [{ command: 'codex-acp', args: [] }],
      install: '在项目目录运行 npm install，并先用 codex login 登录',
      setup: {
        bundled: [
          { pkg: '@agentclientprotocol/codex-acp', bin: 'codex-acp' },
          { pkg: '@openai/codex', bin: 'codex' },
        ],
        override: 'CODEX_PATH',
      },
      // 服务器上没有浏览器：不显示“在本机打开浏览器登录 ChatGPT”，改用验证码登录或 API Key
      env: { NO_BROWSER: '1' },
      quota: 'codex',
      providers: 'codex',
      listHistory: true,
    },
    {
      id: 'pi',
      name: 'Pi',
      color: 'pi',
      launches: [
        { command: 'pi-acp', args: [] },
        { command: 'npx', args: ['-y', 'pi-acp@0.0.34'] },
      ],
      requires: ['pi'],
      providers: 'wizard',
      install: 'npm install -g @earendil-works/pi-coding-agent pi-acp',
      setup: {
        npm: [
          { pkg: '@earendil-works/pi-coding-agent', bin: 'pi' },
          { pkg: 'pi-acp', bin: 'pi-acp' },
        ],
      },
    },
    {
      id: 'hermes',
      name: 'Hermes',
      color: 'hermes',
      launches: [{ command: 'hermes', args: ['acp'] }],
      providers: 'wizard',
      install: 'curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash',
      // --skip-setup：装完不进它的设置向导（那个在网页的“登录”里做）
      setup: { script: 'curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --skip-setup', bin: 'hermes', update: ['update'], requires: ['curl', 'git'] },
    },
    {
      id: 'codebuddy',
      name: 'CodeBuddy',
      color: 'codebuddy',
      launches: [{ command: 'codebuddy', args: ['--acp'] }],
      install: 'npm install -g @tencent-ai/codebuddy-code',
      setup: { npm: [{ pkg: '@tencent-ai/codebuddy-code', bin: 'codebuddy' }] },
    },
    {
      id: 'claude',
      name: 'Claude Code',
      color: 'claude',
      launches: [
        { command: 'claude-agent-acp', args: [] },
        { command: 'npx', args: ['-y', '@agentclientprotocol/claude-agent-acp@0.81.2'] },
      ],
      requires: ['claude'],
      install: 'npm install -g @anthropic-ai/claude-code @agentclientprotocol/claude-agent-acp',
      setup: {
        npm: [
          { pkg: '@anthropic-ai/claude-code', bin: 'claude' },
          { pkg: '@agentclientprotocol/claude-agent-acp', bin: 'claude-agent-acp' },
        ],
      },
    },
    {
      id: 'gemini',
      name: 'Gemini CLI',
      color: 'gemini',
      launches: [{ command: 'gemini', args: ['--acp'] }],
      install: 'npm install -g @google/gemini-cli',
      setup: { npm: [{ pkg: '@google/gemini-cli', bin: 'gemini' }] },
    },
    {
      id: 'demo',
      name: '演示 Agent',
      color: 'demo',
      launches: [{ command: process.execPath, args: [path.join(root, 'scripts', 'mock-agent.mjs')] }],
      listHistory: true,
      demoOnly: true,
    },
  ];
  const additional = AGENT_CATALOG.flatMap((entry): AgentPreset[] => {
    const connection = VERIFIED_CONNECTIONS[entry.id];
    if (!connection) return [];
    return [{ id: entry.id, name: entry.name, color: 'catalog', ...connection }];
  });
  return [...builtIn.filter((p) => !p.demoOnly), ...additional, ...builtIn.filter((p) => p.demoOnly)];
}

/**
 * 服务可能不是从登录终端启动的，PATH 里补上常见的安装位置和项目自己的 node_modules/.bin。
 * 网页上装的 Agent 在 ~/.npm-global，排在系统目录前面：系统里有旧版本、网页上更新出新版本时，用新的这份
 */
export function searchPath(root: string): string {
  const home = os.homedir();
  const first = [path.join(root, 'node_modules', '.bin'), path.join(home, '.npm-global', 'bin')];
  const extra = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    path.join(home, '.local', 'bin'),
    path.join(home, '.bun', 'bin'),
    path.join(home, '.hermes', 'bin'),
    path.join(home, '.cursor', 'bin'),
    path.join(home, '.mimocode', 'bin'),
    path.join(home, '.minimax-code', 'bin'),
    path.join(home, '.kimi-code', 'bin'),
    path.join(home, '.qoder', 'bin'),
    path.join(home, '.qoder-cn', 'bin'),
    path.join(home, '.local', 'share', 'openinterpreter', 'bin'),
    // 运行这个服务的 node 所在的目录：npm 和用 npm 装的 Agent 都靠 PATH 找 node
    path.dirname(process.execPath),
  ];
  const current = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
  return [...first, ...current, ...extra]
    .filter((dir, i, all) => all.indexOf(dir) === i)
    .join(path.delimiter);
}

export function which(bin: string, pathValue: string): string | null {
  if (path.isAbsolute(bin)) return isExecutable(bin) ? bin : null;
  for (const dir of pathValue.split(path.delimiter)) {
    const candidate = path.join(dir, bin);
    if (isExecutable(candidate)) return candidate;
  }
  return null;
}

function isExecutable(file: string): boolean {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) return false;
    fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** 找到启动方式；extraEnv 是兼容已有设置的启动环境和模型供应商配置 */
export function resolveLaunch(preset: AgentPreset, pathValue: string, extraEnv: Record<string, string> = {}): Launch | null {
  for (const requirement of preset.requires ?? []) {
    if (!which(requirement, pathValue)) return null;
  }
  for (const launch of preset.launches) {
    const found = which(launch.command, pathValue);
    if (found) {
      return { command: found, args: launch.args, env: { ...process.env, ...preset.env, ...extraEnv, PATH: pathValue } };
    }
  }
  return null;
}

export function describeAgents(
  list: AgentPreset[],
  pathValue: string,
  demo: boolean,
  enabled: (agentId: string) => boolean = () => true,
): AgentInfo[] {
  return list
    .filter((preset) => demo || !preset.demoOnly)
    .map((preset) => {
      const launch = resolveLaunch(preset, pathValue);
      const missingRequirement = (preset.requires ?? []).find((bin) => !which(bin, pathValue));
      const primary = preset.launches[0];
      return {
        id: preset.id,
        name: preset.name,
        color: preset.color,
        commandLine: launch
          ? [path.basename(launch.command), ...launch.args].join(' ')
          : [primary.command, ...primary.args].join(' '),
        available: Boolean(launch),
        enabled: enabled(preset.id),
        missing: launch
          ? undefined
          : `没找到 ${missingRequirement ?? preset.launches.map((l) => l.command).join(' 或 ')} 命令`,
        install: preset.install,
      };
    });
}
