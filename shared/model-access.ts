/** 模型供应商的接口类型，与 Pi AI 的协议名称一致。 */
export type ModelApi = 'openai-completions' | 'openai-responses' | 'anthropic-messages' | 'google-generative-ai';
export type ModelBilling = 'api' | 'subscription';

export const MODEL_APIS: { id: ModelApi; name: string }[] = [
  { id: 'openai-completions', name: 'OpenAI Chat Completions 兼容' },
  { id: 'openai-responses', name: 'OpenAI Responses 兼容' },
  { id: 'anthropic-messages', name: 'Anthropic Messages 兼容' },
  { id: 'google-generative-ai', name: 'Google Gemini API' },
];

export interface ModelAccessView {
  /** direct 可以在网页填第三方配置；native 使用 Agent 自己的配置和订阅登录。 */
  mode: 'direct' | 'native';
  apis: ModelApi[];
  supportsContextWindow: boolean;
  description: string;
  docsUrl: string;
  /** 服务器核实过的固定登录/模型向导，不能由页面指定执行命令。 */
  setups: { id: string; name: string; description: string }[];
}

export interface ModelProviderInput {
  preset: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  api?: ModelApi;
  billing?: ModelBilling;
  contextWindow?: number;
}
