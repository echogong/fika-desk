import { z } from 'zod';
import type { ClientMsg } from './types';
import { MAX_IMAGES_PER_MESSAGE } from './images';

const id = z.string().min(1).max(100);
const agentId = z.string().min(1).max(100).regex(/^[a-z0-9-]+$/);
const requestId = z.string().min(1).max(128).optional();
const columns = z.number().int().min(1).max(500);
const rows = z.number().int().min(1).max(200);
const terminalData = z.string().max(256_000);

/** Only our browser protocol is checked here; ACP adapters keep their existing compatibility rules. */
export const clientMessageSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('session:create'), workspaceId: id, agentId, requestId }),
  z.strictObject({ type: z.literal('session:prompt'), id, text: z.string().max(60_000), images: z.array(z.string().regex(/^[a-f0-9]{32}$/)).max(MAX_IMAGES_PER_MESSAGE).optional(), requestId }),
  ...(['session:cancel', 'session:close', 'session:restart'] as const).map((type) => z.strictObject({ type: z.literal(type), id })),
  z.strictObject({ type: z.literal('session:select'), id, selectId: z.string().min(1).max(1024), value: z.string().max(4096) }),
  z.strictObject({ type: z.literal('session:rename'), id, title: z.string().max(200) }),
  z.strictObject({ type: z.literal('approval'), id, requestId: z.string().min(1).max(1024), optionId: z.string().min(1).max(1024) }),
  z.strictObject({ type: z.literal('agents:rescan') }),
  z.strictObject({ type: z.literal('history:list'), workspaceId: id }),
  z.strictObject({ type: z.literal('history:open'), workspaceId: id, key: z.string().min(1).max(4096), requestId }),
  z.strictObject({ type: z.literal('login:start'), agentId, methodId: z.string().min(1).max(1024), apiKey: z.string().max(16_000).optional(), cols: columns.optional(), rows: rows.optional() }),
  z.strictObject({ type: z.literal('install:start'), agentId, action: z.enum(['install', 'update']), cols: columns.optional(), rows: rows.optional() }),
  ...(['login:input', 'install:input'] as const).map((type) => z.strictObject({ type: z.literal(type), agentId, data: terminalData })),
  ...(['login:resize', 'install:resize'] as const).map((type) => z.strictObject({ type: z.literal(type), agentId, cols: columns, rows })),
  ...(['login:cancel', 'install:cancel', 'install:attach', 'quota:refresh'] as const).map((type) => z.strictObject({ type: z.literal(type), agentId })),
]);

export class InputError extends Error {
  readonly status = 400;
}

export function validateInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  const field = issue?.path.join('.') || '请求';
  const detail = issue?.code === 'too_big' ? '超过允许的大小或数量' : issue?.code === 'unrecognized_keys' ? '包含不支持的参数，请刷新页面后重试' : '类型、格式或范围不正确';
  throw new InputError(`${field}：${detail}`);
}

export function validateClientMessage(value: unknown): ClientMsg {
  return validateInput(clientMessageSchema, value);
}

const password = z.string().max(1024);
const directory = z.string().min(1).max(4096);
export const authSetupSchema = z.strictObject({ key: z.string().min(1).max(256), password });
export const authLoginSchema = z.strictObject({ password, keep: z.boolean().optional() });
export const passwordChangeSchema = z.strictObject({ current: password, next: password });
export const emptyBodySchema = z.strictObject({});
export const providerInputSchema = z.strictObject({
  preset: z.string().max(100).optional(), name: z.string().max(200).optional(),
  baseUrl: z.string().max(4096).optional(), model: z.string().max(500).optional(),
  apiKey: z.string().max(16_000).optional(), api: z.enum(['openai-completions', 'openai-responses', 'anthropic-messages', 'google-generative-ai']).optional(),
  billing: z.enum(['subscription', 'api']).optional(),
  contextWindow: z.number().int().min(1024).max(10_000_000).optional(),
});
export const agentSettingsSchema = z.strictObject({ enabled: z.boolean().optional(), provider: providerInputSchema.nullable().optional() });
export const workspaceBodySchemas = {
  'workspaces/roots': z.strictObject({ path: directory }),
  'workspaces/roots/remove': z.strictObject({ path: directory }),
  'workspaces/mkdir': z.strictObject({ parent: directory, name: z.string().min(1).max(255) }),
  'workspaces/add': z.strictObject({ path: directory }),
  'workspaces/remove': z.strictObject({ id }),
  'workspaces/limit': z.strictObject({ limit: z.number().int().min(1).max(20) }),
} as const;
