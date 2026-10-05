// 模型接入预设：一个预设对应一个明确的接口和计费产品。
// 新增地址、协议和模型参考 @earendil-works/pi-ai 1.0.1 已发布目录（2026-10-03），
// 保留已有 Codex Responses 预设的 id，避免改变已保存的配置；不引入 SDK 运行时依赖。
import type { ModelApi, ModelBilling } from './model-access';
import { PRESET_PROVIDERS } from './provider-presets';

/** Public, source-owned compatibility metadata; never contains account keys. */
export interface ProviderModelOptions {
  name?: string;
  contextWindow?: number;
  maxTokens?: number;
  reasoning?: boolean;
  input?: string[];
  modalities?: { input: string[]; output: string[] };
  compat?: Record<string, unknown>;
  thinkingLevelMap?: Record<string, string | null>;
  options?: Record<string, unknown>;
  variants?: Record<string, unknown>;
}

export interface ProviderProfile {
  models: string[];
  modelOptions?: Record<string, ProviderModelOptions>;
  options?: { setCacheKey?: boolean };
  credential?: 'api-key' | 'bearer';
}

export interface ProviderPreset {
  id: string;
  name: string;
  baseUrl: string;
  /** 建议的模型，第一个是默认 */
  models: string[];
  api: ModelApi;
  /** subscription 在这里表示使用编程套餐 Key；账号 OAuth 由 Agent 原生登录处理。 */
  billing: ModelBilling;
  /** 上下文窗口（token）：Codex 不认识第三方模型，告诉它窗口多大，压缩对话时才准 */
  contextWindow?: number;
  help?: string;
  docsUrl?: string;
  websiteUrl?: string;
  endpointCandidates?: string[];
  profiles?: Record<string, ProviderProfile>;
  modelContexts?: Record<string, number>;
  /** Static non-secret query parameters, supported only by the named drivers. */
  queryParams?: Record<string, string>;
  agents?: string[];
}

const EXISTING_PROVIDERS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    api: 'openai-responses', billing: 'api',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-flash', 'deepseek-v4-pro'],
    contextWindow: 1_048_576,
  },
  {
    id: 'kimi',
    name: 'Kimi（月之暗面）',
    api: 'openai-responses', billing: 'api',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['kimi-k3'],
    contextWindow: 1_048_576,
    help: '这是国内平台（platform.moonshot.cn）的地址。Key 是在国际平台建的，地址改成 https://api.moonshot.ai/v1。',
  },
  {
    id: 'zhipu',
    name: '智谱 GLM（编程套餐）',
    api: 'openai-responses', billing: 'subscription',
    baseUrl: 'https://open.bigmodel.cn/api/v1',
    models: ['glm-5.3', 'glm-5-turbo'],
    help: '这个地址是 GLM 编程套餐专用的。',
  },
  {
    id: 'bailian',
    name: '阿里云百炼',
    api: 'openai-responses', billing: 'api',
    baseUrl: 'https://<业务空间 ID>.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
    models: ['qwen3.8-max', 'qwen3.7-max'],
    help: '把地址里的 <业务空间 ID> 换成百炼控制台里你的业务空间 ID。用 Token Plan 的，地址是 https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1。',
  },
  {
    id: 'zai-coding-cn', name: '智谱 GLM Coding Plan（国内）',
    api: 'openai-completions', billing: 'subscription',
    baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
    models: ['glm-5.3', 'glm-5.3-flash', 'glm-5.3-highspeed'], contextWindow: 1_000_000,
    help: '使用国内 GLM Coding Plan 的套餐 Key，普通 API 与套餐 Key 的使用范围不同。',
    docsUrl: 'https://docs.bigmodel.cn/cn/coding-plan/overview',
  },
  {
    id: 'zai', name: 'Z.AI Coding Plan（国际）',
    api: 'openai-completions', billing: 'subscription',
    baseUrl: 'https://api.z.ai/api/coding/paas/v4',
    models: ['glm-5.3', 'glm-5.3-flash', 'glm-5-turbo'], contextWindow: 1_000_000,
    help: '使用 Z.AI 国际平台的 Coding Plan Key。',
    docsUrl: 'https://docs.z.ai/devpack/overview',
  },
  {
    id: 'kimi-coding', name: 'Kimi Coding Plan',
    api: 'anthropic-messages', billing: 'subscription',
    baseUrl: 'https://api.kimi.com/coding',
    models: ['k3', 'kimi-for-coding', 'k3-256k'], contextWindow: 1_048_576,
    help: '填 Kimi Code 的套餐 Key。Moonshot 开放平台的普通 API Key 对应另一个接口。账号登录请使用 Agent 原生登录。',
    docsUrl: 'https://www.kimi.com/code/docs/en/kimi-code/models.html',
  },
  {
    id: 'minimax-cn', name: 'MiniMax Coding Plan（国内）',
    api: 'anthropic-messages', billing: 'subscription',
    baseUrl: 'https://api.minimaxi.com/anthropic',
    models: ['MiniMax-M3', 'MiniMax-M2.7', 'MiniMax-M2.7-highspeed'], contextWindow: 1_000_000,
    help: '使用国内 MiniMax Coding Plan 的 Key，套餐和普通 API 计费分别管理。',
    docsUrl: 'https://platform.minimaxi.com/subscribe/coding-plan',
  },
  {
    id: 'kimi-coding-chat', name: 'Kimi Coding Plan（Chat API）',
    api: 'openai-completions', billing: 'subscription',
    baseUrl: 'https://api.kimi.com/coding/v1',
    models: ['k3', 'k3-256k', 'kimi-for-coding', 'kimi-for-coding-highspeed'], contextWindow: 1_048_576,
    help: '使用 Kimi Code 套餐 Key；模型、上下文长度和高速模式以你的套餐权限为准。',
    docsUrl: 'https://www.kimi.com/code/docs/en/kimi-code/models.html',
  },
  {
    id: 'minimax', name: 'MiniMax Coding Plan（国际）',
    api: 'anthropic-messages', billing: 'subscription',
    baseUrl: 'https://api.minimax.io/anthropic',
    models: ['MiniMax-M3', 'MiniMax-M2.7', 'MiniMax-M2.7-highspeed'], contextWindow: 1_000_000,
    help: '使用国际 MiniMax Coding Plan 的 Key。',
    docsUrl: 'https://platform.minimax.io/docs/coding-plan/intro',
  },
  {
    id: 'qwen-token-plan-cn', name: '阿里云百炼 Token Plan（国内）',
    api: 'openai-completions', billing: 'subscription',
    baseUrl: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
    models: ['qwen3.8-max', 'qwen3.8-flash', 'qwen3.7-max'], contextWindow: 1_000_000,
    help: '使用 Token Plan 的套餐 Key；普通百炼 API Key 不能替代套餐 Key。',
    docsUrl: 'https://help.aliyun.com/zh/model-studio/',
  },
  {
    id: 'xiaomi-token-plan-cn', name: 'MiMo Token Plan（国内）',
    api: 'openai-completions', billing: 'subscription',
    baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
    models: ['mimo-v2.6-pro', 'mimo-v2.6-flash', 'mimo-v2.5-pro'], contextWindow: 1_048_576,
    help: '使用 MiMo 国内 Token Plan 的套餐 Key。',
    docsUrl: 'https://mimo.mi.com/docs/zh-CN/tokenplan',
  },
  {
    id: 'deepseek-chat', name: 'DeepSeek（Chat API）',
    api: 'openai-completions', billing: 'api',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-flash', 'deepseek-v4-pro'], contextWindow: 1_000_000,
    docsUrl: 'https://api-docs.deepseek.com/',
  },
  {
    id: 'moonshotai-cn', name: 'Moonshot API（国内）',
    api: 'openai-completions', billing: 'api',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: ['kimi-k3', 'kimi-k2.7-code', 'kimi-k2.6'], contextWindow: 1_048_576,
    help: '使用 Moonshot 国内开放平台的 API Key，按 API 用量计费。',
    docsUrl: 'https://platform.moonshot.cn/docs/overview',
  },
  {
    id: 'moonshotai', name: 'Moonshot API（国际）',
    api: 'openai-completions', billing: 'api',
    baseUrl: 'https://api.moonshot.ai/v1',
    models: ['kimi-k3', 'kimi-k2.7-code', 'kimi-k2.6'], contextWindow: 1_048_576,
    docsUrl: 'https://platform.moonshot.ai/docs/overview',
  },
  {
    id: 'openrouter', name: 'OpenRouter',
    api: 'openai-completions', billing: 'api',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openai/gpt-6.1-sol', 'google/gemini-3.8-flash', 'deepseek/deepseek-v4.1-flash'],
    help: '模型可用范围以你的 OpenRouter 账号为准，模型列表仅作参考。',
    docsUrl: 'https://openrouter.ai/docs/quickstart',
  },
  {
    id: 'openai', name: 'OpenAI API',
    api: 'openai-responses', billing: 'api',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-6.1-sol', 'gpt-6-sol', 'gpt-6-luna'], contextWindow: 272_000,
    help: '这里填写 OpenAI API Key。ChatGPT 订阅账号请使用 Agent 原生登录。',
    docsUrl: 'https://platform.openai.com/docs/api-reference/responses',
  },
  {
    id: 'anthropic', name: 'Anthropic API',
    api: 'anthropic-messages', billing: 'api',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-sonnet-5', 'claude-opus-5', 'claude-haiku-4-5'], contextWindow: 1_000_000,
    help: '这里填写 Anthropic API Key。Claude 订阅账号由 Agent 原生登录处理。',
    docsUrl: 'https://platform.claude.com/docs/en/api/overview',
  },
  {
    id: 'google', name: 'Google Gemini API',
    api: 'google-generative-ai', billing: 'api',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-2.5-flash'], contextWindow: 1_048_576,
    help: '这里填写 Gemini API Key。Google 账号登录请使用 Agent 原生登录。',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
  },
  {
    id: 'custom',
    name: '其他兼容接口',
    api: 'openai-responses', billing: 'api',
    baseUrl: '',
    models: [],
    help: '按供应商文档选择接口类型、地址和模型。只有这个 Agent 支持的接口才可以选择。',
  },
];

const scope = (p: ProviderPreset) => `${p.api}\n${p.billing}\n${p.baseUrl.replace(/\/+$/, '')}\n${JSON.stringify(p.queryParams ?? {})}`;
const existingScopes = new Set(EXISTING_PROVIDERS.map(scope));
// Keep saved IDs and existing defaults; enrich matching routes with client
// metadata instead of showing the same endpoint twice.
export const MODEL_PROVIDERS: ProviderPreset[] = [
  ...EXISTING_PROVIDERS.filter((p) => p.id !== 'custom').map((p) => {
    const imported = PRESET_PROVIDERS.find((item) => scope(item) === scope(p));
    return imported ? { ...imported, ...p, profiles: imported.profiles, modelContexts: imported.modelContexts } : p;
  }),
  ...PRESET_PROVIDERS.filter((p) => !existingScopes.has(scope(p))),
  EXISTING_PROVIDERS.find((p) => p.id === 'custom')!,
];

export function providerModels(preset: ProviderPreset, agentId: string): string[] {
  return preset.profiles?.[agentId]?.models.length ? preset.profiles[agentId].models : preset.models;
}

export function providerModelOptions(presetId: string, agentId: string, model: string): ProviderModelOptions {
  return MODEL_PROVIDERS.find((p) => p.id === presetId)?.profiles?.[agentId]?.modelOptions?.[model] ?? {};
}

export function providerContext(preset: ProviderPreset, model: string, agentId?: string): number | undefined {
  return (agentId ? preset.profiles?.[agentId]?.modelOptions?.[model]?.contextWindow : undefined)
    ?? preset.modelContexts?.[model] ?? preset.contextWindow;
}

export function providerProfile(presetId: string, agentId: string): ProviderProfile | undefined {
  return MODEL_PROVIDERS.find((p) => p.id === presetId)?.profiles?.[agentId];
}

/** 兼容旧调用方；可用接口仍由 Agent 的 modelAccess.apis 决定。 */
export const CODEX_PROVIDERS = MODEL_PROVIDERS.filter((p) => p.api === 'openai-responses');
