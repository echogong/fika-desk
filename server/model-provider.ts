import { MODEL_PROVIDER_ID } from './brand-compat';
// 统一第三方模型设置与协议检查；各 Agent 的原生配置由 agent-model-config 驱动转换。
// Codex 使用适配器提供的 CODEX_CONFIG、MODEL_PROVIDER、DEFAULT_AUTH_REQUEST，
// 不修改它原有的配置文件或 ChatGPT 登录信息。
import { MODEL_PROVIDERS, providerContext } from '../shared/providers';
import { MODEL_APIS, type ModelApi, type ModelBilling } from '../shared/model-access';
import type { ModelProviderView, ProviderTestResult } from '../shared/types';

/** 存在服务器上的供应商设置（和其他设置一样存在数据库里，Key 不给页面） */
export interface StoredProvider {
  preset: string;
  name: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  api: ModelApi;
  billing: ModelBilling;
  contextWindow?: number;
}

const PROVIDER_ID = MODEL_PROVIDER_ID;
const KEY_ENV = 'FIKA_DESK_MODEL_API_KEY';
const TIMEOUT = 15_000;

/** 让 codex-acp 用第三方供应商的环境变量。own 是已有的 CODEX_CONFIG，有的话合在一起 */
export function codexProviderEnv(p: StoredProvider, own?: string): Record<string, string> {
  let base: Record<string, any> = {};
  try {
    const parsed = own ? JSON.parse(own) : null;
    if (parsed && typeof parsed === 'object') base = parsed;
  } catch {
    // 自己填的不是 JSON：不管它
  }
  const preset = MODEL_PROVIDERS.find((x) => x.id === p.preset);
  const contextWindow = p.contextWindow ?? (preset ? providerContext(preset, p.model, 'codex') : undefined);
  const config = {
    ...base,
    model: p.model,
    ...(contextWindow ? { model_context_window: contextWindow } : {}),
    model_providers: {
      ...(base.model_providers && typeof base.model_providers === 'object' ? base.model_providers : {}),
      [PROVIDER_ID]: { name: p.name, base_url: p.baseUrl, env_key: KEY_ENV, wire_api: 'responses', ...(preset?.queryParams ? { query_params: preset.queryParams } : {}) },
    },
  };
  return {
    CODEX_CONFIG: JSON.stringify(config),
    MODEL_PROVIDER: PROVIDER_ID,
    [KEY_ENV]: p.apiKey,
    DEFAULT_AUTH_REQUEST: JSON.stringify({
      methodId: 'gateway',
      _meta: { gateway: { baseUrl: p.baseUrl, headers: { Authorization: `Bearer ${p.apiKey}` }, providerName: p.name } },
    }),
  };
}

export function providerForView(p: StoredProvider): ModelProviderView {
  return { preset: p.preset, name: p.name, baseUrl: p.baseUrl, model: p.model, api: p.api, billing: p.billing,
    contextWindow: p.contextWindow, keyTail: p.apiKey.length > 8 ? p.apiKey.slice(-4) : '' };
}

/** 旧版本仅有 Codex 配置；迁移时保留其地址、模型和 Key，明确补上 Responses 协议。 */
export function normalizeProvider(value: unknown): StoredProvider | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  if (typeof p.baseUrl !== 'string' || typeof p.model !== 'string' || typeof p.apiKey !== 'string') return null;
  const api = MODEL_APIS.some((x) => x.id === p.api) ? p.api as ModelApi : 'openai-responses';
  return {
    preset: typeof p.preset === 'string' ? p.preset : 'custom',
    name: typeof p.name === 'string' ? p.name : '第三方模型',
    baseUrl: p.baseUrl, model: p.model, apiKey: p.apiKey, api,
    billing: p.billing === 'subscription' ? 'subscription' : p.billing === 'api' ? 'api'
      : MODEL_PROVIDERS.find((preset) => preset.id === p.preset)?.billing ?? 'api',
    contextWindow: typeof p.contextWindow === 'number' ? p.contextWindow : undefined,
  };
}

/** 检查页面填写的协议和凭据范围；地址或协议改变时不把原 Key 发给新的服务。 */
export function checkProvider(input: Record<string, unknown>, saved?: StoredProvider, allowedApis?: ModelApi[], agentId?: string): StoredProvider {
  const preset = MODEL_PROVIDERS.find((x) => x.id === input.preset);
  if (!preset) throw new Error('请选择一个有效的模型供应商');
  if (agentId && preset.agents && !preset.agents.includes(agentId)) throw new Error('这个 Agent 不支持该供应商的专用配置');
  const api = input.api ?? preset.api;
  if (!MODEL_APIS.some((x) => x.id === api)) throw new Error('请选择有效的接口协议');
  if (allowedApis && !allowedApis.includes(api as ModelApi)) throw new Error('这个 Agent 不支持所选接口协议');
  if (preset.id !== 'custom' && api !== preset.api) throw new Error('所选供应商与接口协议不匹配，请选择对应预设或自定义接口');
  const billing = input.billing ?? preset.billing;
  if (billing !== 'api' && billing !== 'subscription') throw new Error('请选择 API 或订阅套餐接入');
  if (preset.id !== 'custom' && billing !== preset.billing) throw new Error('所选供应商与套餐类型不匹配');
  const baseUrl = String(input.baseUrl ?? '').trim().replace(/\/+$/, '');
  if (/[<>]|\$\{|\{\{/.test(baseUrl)) throw new Error('地址里还有模板占位符，请换成你自己的实际地址');
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error('接口地址不对，要以 https:// 开头');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('接口地址要以 https:// 开头');
  if (url.username || url.password || url.hash || url.search) throw new Error('接口地址请填写 API 根路径，不要包含账号、密码或查询参数');
  if (baseUrl.length > 500) throw new Error('接口地址太长了');
  const model = String(input.model ?? '').trim();
  if (!model) throw new Error('填一个模型名');
  if (model.length > 200 || /[\x00-\x1f\x7f]/.test(model)) throw new Error('模型名过长或包含控制字符');
  const sameCredential = saved && saved.preset === preset.id && saved.baseUrl === baseUrl && saved.api === api && saved.billing === billing;
  const apiKey = String(input.apiKey ?? '').trim() || (sameCredential ? saved.apiKey : '') || '';
  if (!apiKey) throw new Error('填 API Key');
  if (apiKey.length > 4096) throw new Error('API Key 太长了');
  if (/\s/.test(apiKey)) throw new Error('API Key 不能包含空格或换行');
  const contextWindow = input.contextWindow === undefined || input.contextWindow === null || input.contextWindow === ''
    ? providerContext(preset, model, agentId) : Number(input.contextWindow);
  if (contextWindow !== undefined && (!Number.isSafeInteger(contextWindow) || contextWindow < 1024 || contextWindow > 10_000_000)) {
    throw new Error('上下文长度请输入 1024 到 10000000 之间的整数');
  }
  return { preset: preset.id, name: preset.id === 'custom' ? url.host : preset.name,
    baseUrl, model, apiKey, api: api as ModelApi, billing, contextWindow };
}

/**
 * 只读取模型列表并提交缺少必填项的协议校验请求，不发送聊天内容。
 * 可达、鉴权和模型可用性分别显示；404、429、5xx 和非 JSON 页面不能作为协议可用的证据。
 */
export async function testProvider(p: StoredProvider): Promise<ProviderTestResult> {
  const steps: ProviderTestResult['steps'] = [];
  const add = (level: 'ok' | 'warning' | 'error', text: string) => steps.push({ ok: level === 'ok', level, text });
  const headers: Record<string, string> = p.api === 'anthropic-messages'
    ? { 'x-api-key': p.apiKey, authorization: `Bearer ${p.apiKey}`, 'anthropic-version': '2023-06-01' }
    : p.api === 'google-generative-ai' ? { 'x-goog-api-key': p.apiKey }
    : { authorization: `Bearer ${p.apiKey}` };
  let models: string[] | undefined;
  const endpoint = (value: string) => {
    const url = new URL(value);
    for (const [name, value] of Object.entries(MODEL_PROVIDERS.find((preset) => preset.id === p.preset)?.queryParams ?? {})) url.searchParams.set(name, value);
    return url.toString();
  };
  const modelUrl = p.api === 'anthropic-messages' && !/\/v\d+$/.test(p.baseUrl)
    ? `${p.baseUrl}/v1/models` : `${p.baseUrl}/models`;
  try {
    const res = await fetch(endpoint(modelUrl), { headers, redirect: 'error', signal: AbortSignal.timeout(TIMEOUT) });
    if (res.status === 401 || res.status === 403) {
      add('error', `模型列表鉴权失败（${res.status}），检查密钥、套餐和接入地区`);
      return { steps };
    }
    if (res.status === 429 || res.status >= 500) {
      add('error', `供应商暂时无法提供服务（${res.status}），稍后重试`);
      return { steps };
    }
    if (res.ok) {
      const body: any = await res.json().catch(() => null);
      const list = Array.isArray(body?.data) ? body.data : Array.isArray(body?.models) ? body.models : null;
      models = list ? list.map((m: any) => String(m?.id ?? m?.name ?? '').replace(/^models\//, '')).filter(Boolean).slice(0, 1000) : undefined;
      if (models) {
        add('ok', `已读取模型列表（${models.length} 个），尚未验证实际对话或订阅额度`);
        if (models.length && !models.includes(p.model)) add('warning', `列表中未找到 ${p.model}；部分套餐使用专用模型名，请对照供应商文档`);
      } else add('warning', '接口可达，但响应不是模型列表，无法据此确认密钥和模型');
    } else add('warning', `模型列表未开放（${res.status}），继续检查所选接口协议`);
  } catch (error) {
    add('error', `模型列表连接失败：${reason(error)}`);
    return { steps };
  }

  const protocolPath = p.api === 'openai-responses' ? '/responses'
    : p.api === 'openai-completions' ? '/chat/completions'
    : p.api === 'anthropic-messages' ? (/\/v\d+$/.test(p.baseUrl) ? '/messages' : '/v1/messages')
    : `/models/${encodeURIComponent(p.model)}:generateContent`;
  try {
    const res = await fetch(endpoint(p.baseUrl + protocolPath), {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
      body: '{}', redirect: 'error', signal: AbortSignal.timeout(TIMEOUT),
    });
    const body: any = await res.json().catch(() => null);
    if (res.status === 401 || res.status === 403) {
      add('error', `所选接口鉴权失败（${res.status}），检查密钥是否属于此套餐`);
    } else if (res.status === 404 || res.status === 405) {
      add('error', `此地址未提供所选接口（${res.status}），请检查协议与 API 根路径`);
    } else if (res.status === 429 || res.status >= 500) {
      add('error', `所选接口暂时不可用（${res.status}），不能确认接入成功`);
    } else if ((res.status === 400 || res.status === 422) && body?.error && typeof body.error === 'object') {
      // 只承认供应商返回的结构化参数校验。它不证明特定模型权限或订阅剩余额度。
      const message = String(body.error.message ?? '').toLowerCase();
      const code = String(body.error.code ?? body.error.type ?? body.error.status ?? '').toLowerCase();
      if (/key|auth|credential|token|subscription|quota|credit|billing|permission|region|location/.test(message + ' ' + code)) {
        add('error', '接口返回了鉴权、套餐或额度错误，请检查供应商配置');
      } else if (/required|missing|invalid.argument|invalid.request|validation|model|messages|input|contents|max.tokens/.test(message + ' ' + code)) {
        add('ok', '所选协议返回了参数校验；模型权限与订阅额度仍需通过 Agent 连接和实际使用确认');
      } else add('warning', '接口返回了错误，但不足以确认所选协议与模型可用');
    } else {
      add('warning', `接口有响应（${res.status}），未得到明确协议校验证据；请再测试 Agent 连接`);
    }
  } catch (error) {
    add('error', `接口连接失败：${reason(error)}`);
  }
  return { steps, models };
}

function reason(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'TimeoutError') return '请求超时';
    const code = (error as any).cause?.code;
    if (code === 'ENOTFOUND') return '找不到域名';
    if (code === 'ECONNREFUSED') return '连接被拒绝';
    // 不回传上游响应或包含请求头/凭据的调试信息。
    return '网络或接口连接异常';
  }
  return '连接异常';
}
