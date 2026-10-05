// 已从默认目录精简的 Agent 仅供恢复已有网页会话，不参与设置、安装或新建会话。
import { VERIFIED_CONNECTIONS } from './agent-connections';
import type { AgentPreset } from './agents';

const ARCHIVED_AGENT_NAMES: Readonly<Record<string, string>> = Object.freeze({
  fx: 'fx',
  muse: 'Muse Code',
  nanocoder: 'Nanocoder',
  autohand: 'Autohand Code',
  'cortex-code': 'Cortex Code',
  'crow-cli': 'crow-cli',
  dimcode: 'DimCode',
  dirac: 'Dirac',
  'glm-acp-agent': 'GLM Agent',
  harn: 'Harn',
  kimchi: 'Kimchi',
  'minion-code': 'Minion Code',
  nova: 'Nova',
  poolside: 'Poolside',
  sigit: 'siGit Code',
  stakpak: 'Stakpak',
  vtcode: 'VT Code',
  'fast-agent': 'fast-agent',
  devin: 'Devin CLI',
  'command-code': 'Command Code',
  gptme: 'gptme',
  'amp': 'Amp',
  'goose': 'Goose',
  'mistral-vibe': 'Mistral Vibe',
  'factory-droid': 'Factory Droid',
  'kiro': 'Kiro CLI',
  'junie': 'Junie CLI',
  'crush': 'Crush',
  'letta-code': 'Letta Code',
});

/** 历史兼容：保留原名称与 ACP 入口，不能用于创建新的 Agent 会话。 */
export function historicalPreset(agentId: string): AgentPreset | undefined {
  if (!Object.hasOwn(ARCHIVED_AGENT_NAMES, agentId)) return undefined;
  const connection = VERIFIED_CONNECTIONS[agentId];
  return connection ? {
    id: agentId,
    name: ARCHIVED_AGENT_NAMES[agentId],
    color: 'catalog',
    loginHint: '请先在服务器终端使用该 Agent 的原生命令重新登录，再点“重新启动”。',
    ...connection,
  } : undefined;
}
