import path from 'node:path';
import { createHash } from 'node:crypto';
import { AGENT_CATALOG } from '../shared/agent-catalog';
import type { ModelAccessView } from '../shared/model-access';
import type { Launch } from './agents';
import { codexProviderEnv, type StoredProvider } from './model-provider';
import type { AgentModelDriver, NativeModelSetup } from './agent-model-types';
import { DOMESTIC_MODEL_DRIVERS, DOMESTIC_MODEL_SETUPS } from './agent-model-config-domestic';
import { GLOBAL_MODEL_DRIVERS, GLOBAL_MODEL_SETUPS } from './agent-model-config-global';
import { HARN_MODEL_DRIVERS } from './agent-model-config-harn';
import { providerProfile } from '../shared/providers';

const DRIVERS: Record<string, AgentModelDriver> = {
  ...DOMESTIC_MODEL_DRIVERS,
  ...GLOBAL_MODEL_DRIVERS,
  ...HARN_MODEL_DRIVERS,
  codex: {
    apis: ['openai-responses'],
    description: '第三方 API 或订阅套餐需要提供 Responses 兼容接口。ChatGPT 订阅请通过 Codex 自己的登录方式接入。',
    docsUrl: 'https://github.com/agentclientprotocol/codex-acp#custom-model-providers',
    apply: (p, launch) => ({ ...launch, env: { ...launch.env, ...codexProviderEnv(p, launch.env.CODEX_CONFIG) } }),
    modelId: (p) => p.model,
  },
};
const SETUPS: Record<string, NativeModelSetup[]> = { ...DOMESTIC_MODEL_SETUPS, ...GLOBAL_MODEL_SETUPS };

export function modelDriver(agentId: string): AgentModelDriver | undefined {
  return DRIVERS[agentId];
}

export function modelSetup(agentId: string, methodId: string): NativeModelSetup | undefined {
  return SETUPS[agentId]?.find((method) => method.id === methodId);
}

/** 每一项都有真实的接入说明；没有驱动时不接受会被忽略的网页配置。 */
export function modelAccessFor(agentId: string): ModelAccessView {
  const driver = modelDriver(agentId);
  const entry = AGENT_CATALOG.find((a) => a.id === agentId);
  return {
    mode: driver ? 'direct' : 'native',
    apis: driver?.apis ?? [],
    supportsContextWindow: driver ? driver.supportsContextWindow !== false : false,
    description: driver?.description ?? '模型和订阅请通过 Agent 原生设置或账号登录接入，支持的供应商与套餐以官方文档为准。',
    docsUrl: driver?.docsUrl ?? entry?.website ?? '',
    setups: (SETUPS[agentId] ?? []).map(({ id, name, description }) => ({ id, name, description })),
  };
}

/** 配置按版本隔离，已启动进程的环境和配置不会随新保存的设置变化。 */
export class AgentModelConfigs {
  constructor(private dataDir: string) {}

  apply(agentId: string, p: StoredProvider, launch: Launch): Launch {
    const driver = modelDriver(agentId);
    if (!driver || !driver.apis.includes(p.api)) throw new Error('这个 Agent 暂不支持此网页模型配置');
    const revision = createHash('sha256').update(JSON.stringify([p, providerProfile(p.preset, agentId)])).digest('hex').slice(0, 24);
    const configDir = path.join(this.dataDir, 'model-configs', agentId, revision);
    return { ...driver.apply(p, launch, configDir), modelId: driver.modelId?.(p) ?? p.model };
  }
}
