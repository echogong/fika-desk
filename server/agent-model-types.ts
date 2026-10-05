import type { ModelApi } from '../shared/model-access';
import type { Launch } from './agents';
import type { StoredProvider } from './model-provider';

export interface NativeModelSetup {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
}

/** 仅通过已核实的 CLI 参数/环境或应用数据目录内的文件配置模型。 */
export interface AgentModelDriver {
  apis: ModelApi[];
  supportsContextWindow?: boolean;
  description: string;
  docsUrl: string;
  apply(provider: StoredProvider, launch: Launch, configDir: string): Launch;
  /** ACP 返回的模型 ID 可能带 provider 前缀。 */
  modelId?(provider: StoredProvider): string;
}
