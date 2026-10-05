import { MODEL_PROVIDER_ID } from './brand-compat';
import type { AgentModelDriver } from './agent-model-types';
import { writeModelConfig } from './model-config-files';

const PROVIDER_ID = MODEL_PROVIDER_ID;
const KEY_ENV = 'FIKA_DESK_MODEL_API_KEY';
const quoted = (value: string): string => JSON.stringify(value);

/**
 * Harn's documented custom HTTP provider uses Chat Completions. Do not infer
 * Responses or Anthropic dialect support merely from its built-in providers.
 * https://github.com/burin-labs/harn/blob/main/docs/src/llm/providers.md
 * https://github.com/burin-labs/harn/blob/main/docs/src/configuration.md
 * Native ACP consumes HARN_LLM_* and accepts registered `provider:model` pins:
 * https://github.com/burin-labs/harn/blob/main/crates/harn-serve/src/adapters/acp/schema.rs
 * https://github.com/burin-labs/harn/blob/main/crates/harn-serve/src/adapters/acp/modes.rs
 */
export const HARN_MODEL_DRIVERS: Record<string, AgentModelDriver> = {
  harn: {
    apis: ['openai-completions'],
    description: '可在网页接入支持工具调用的 Chat Completions 模型与编程套餐。',
    docsUrl: 'https://github.com/burin-labs/harn/blob/main/docs/src/provider-setup.md',
    apply(provider, launch, configDir) {
      const providers = writeModelConfig(configDir, 'providers.toml', [
        `default_provider = ${quoted(PROVIDER_ID)}`,
        '',
        `[providers.${PROVIDER_ID}]`,
        `base_url = ${quoted(provider.baseUrl.replace(/\/+$/, ''))}`,
        'chat_endpoint = "/chat/completions"',
        'auth_style = "bearer"',
        `auth_env = ${quoted(KEY_ENV)}`,
        '',
        `[aliases.${PROVIDER_ID}]`,
        `id = ${quoted(provider.model)}`,
        `provider = ${quoted(PROVIDER_ID)}`,
        'tool_format = "native"',
        '',
        `[models.${quoted(provider.model)}]`,
        `name = ${quoted(provider.model)}`,
        `provider = ${quoted(PROVIDER_ID)}`,
        `context_window = ${provider.contextWindow ?? 262144}`,
        `wire_model = ${quoted(provider.model)}`,
        'api_dialect = "openai_chat"',
        '',
      ].join('\n'));
      const runtime = writeModelConfig(configDir, 'config.toml', 'schema_version = 1\n');
      return {
        ...launch,
        allowUnlistedModel: true,
        env: {
          ...launch.env,
          [KEY_ENV]: provider.apiKey,
          XDG_CONFIG_HOME: `${configDir}/xdg`,
          XDG_CACHE_HOME: `${configDir}/xdg-cache`,
          XDG_DATA_HOME: `${configDir}/xdg-data`,
          HARN_CACHE_DIR: `${configDir}/cache`,
          HARN_PROVIDERS_CONFIG: providers,
          HARN_HOST_PROVIDERS_CONFIG: undefined,
          HARN_CONFIG_USER: runtime,
          HARN_CONFIG_INSTALL_DEFAULTS: runtime,
          HARN_CONFIG_MANAGED: undefined,
          HARN_CONFIG_JSON: undefined,
          HARN_CONFIG_REMOTE_DEFAULTS_URL: undefined,
          HARN_CONFIG_TRUST_REMOTE: undefined,
          HARN_LLM_PROVIDER: PROVIDER_ID,
          HARN_LLM_MODEL: provider.model,
          HARN_DEFAULT_PROVIDER: PROVIDER_ID,
          HARN_DEFAULT_MODEL: provider.model,
          HARN_STATE_DIR: `${configDir}/state`,
          HARN_SESSION_STORE_ROOT: `${configDir}/sessions`,
        },
      };
    },
    modelId: (provider) => `${PROVIDER_ID}:${provider.model}`,
  },
};
