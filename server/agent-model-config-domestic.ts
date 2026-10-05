import { MODEL_PROVIDER_ID } from './brand-compat';
import type { ModelApi } from '../shared/model-access';
import type { Launch } from './agents';
import type { AgentModelDriver, NativeModelSetup } from './agent-model-types';
import type { StoredProvider } from './model-provider';
import { writeModelConfig } from './model-config-files';
import { providerModelOptions } from '../shared/providers';

const KEY_ENV = 'FIKA_DESK_MODEL_API_KEY';
const PROVIDER_ID = MODEL_PROVIDER_ID;
const COMMON_APIS: ModelApi[] = ['openai-completions', 'openai-responses', 'anthropic-messages'];

function envLaunch(launch: Launch, provider: StoredProvider, env: NodeJS.ProcessEnv): Launch {
  return { ...launch, env: { ...launch.env, [KEY_ENV]: provider.apiKey, ...env } };
}

/** JSON strings are also valid TOML basic strings and quoted keys. */
const quoted = (value: string): string => JSON.stringify(value);

export const DOMESTIC_MODEL_DRIVERS: Record<string, AgentModelDriver> = {
  // Current Pi 1.0.0 supports ${NAME} interpolation. A bare NAME is a literal key.
  // pi-acp spawns `pi --mode rpc` without forwarding --provider or --model.
  // https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md
  // https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/configuration.md
  pi: {
    apis: [...COMMON_APIS, 'google-generative-ai'],
    description: '通过独立 Pi 配置目录接入兼容 API；官方订阅继续使用 Pi 自己的登录。',
    docsUrl: 'https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/models.md',
    apply(provider, launch, configDir) {
      const defaults = providerModelOptions(provider.preset, 'pi', provider.model);
      writeModelConfig(configDir, 'models.json', {
        providers: {
          [PROVIDER_ID]: {
            baseUrl: provider.baseUrl,
            api: provider.api,
            apiKey: '${' + KEY_ENV + '}',
            models: [{ ...defaults, id: provider.model, ...(provider.contextWindow ? {
              contextWindow: provider.contextWindow,
              ...(defaults.maxTokens ? { maxTokens: Math.min(defaults.maxTokens, provider.contextWindow) } : {}),
            } : {}) }],
          },
        },
      });
      writeModelConfig(configDir, 'settings.json', {
        defaultProvider: PROVIDER_ID,
        defaultModel: provider.model,
      });
      return envLaunch(launch, provider, { PI_CODING_AGENT_DIR: configDir });
    },
    modelId: (provider) => `${PROVIDER_ID}/${provider.model}`,
  },
  // Named providers explicitly support all three transports; OPENAI_BASE_URL alone
  // only redirects the built-in openai-api provider and is not a custom-driver API.
  // https://hermes-agent.nousresearch.com/docs/integrations/providers#named-custom-providers
  hermes: {
    apis: [...COMMON_APIS],
    description: '在独立 Hermes 目录配置第三方模型，支持 Chat、Responses 和 Anthropic 接口。',
    docsUrl: 'https://hermes-agent.nousresearch.com/docs/integrations/providers',
    apply(provider, launch, configDir) {
      const transport = {
        'openai-completions': 'chat_completions',
        'openai-responses': 'codex_responses',
        'anthropic-messages': 'anthropic_messages',
      }[provider.api as Exclude<ModelApi, 'google-generative-ai'>];
      if (!transport) throw new Error('Hermes 的此配置方式不支持该接口类型');
      writeModelConfig(configDir, 'config.yaml', {
        model: {
          provider: `custom:${PROVIDER_ID}`,
          default: provider.model,
          base_url: provider.baseUrl,
          api_mode: transport,
        },
        providers: {
          [PROVIDER_ID]: {
            api: provider.baseUrl,
            key_env: KEY_ENV,
            transport,
            default_model: provider.model,
            discover_models: false,
            models: { [provider.model]: provider.contextWindow ? { context_length: provider.contextWindow } : {} },
          },
        },
      });
      return envLaunch(launch, provider, { HERMES_HOME: configDir });
    },
  },
  // QWEN_HOME is the global configuration root in current Storage.getGlobalQwenDir().
  // Responses is selected by per-model wireApi, not by an `api` setting.
  // https://github.com/QwenLM/qwen-code/blob/main/packages/core/src/config/storage.ts
  // https://qwenlm.github.io/qwen-code-docs/en/users/configuration/model-providers/
  'qwen-code': {
    apis: [...COMMON_APIS, 'google-generative-ai'],
    description: '使用独立 Qwen 配置接入 OpenAI、Anthropic 或 Gemini 兼容模型。',
    docsUrl: 'https://qwenlm.github.io/qwen-code-docs/en/users/configuration/model-providers/',
    apply(provider, launch, configDir) {
      const protocol = provider.api === 'anthropic-messages' ? 'anthropic'
        : provider.api === 'google-generative-ai' ? 'gemini' : 'openai';
      writeModelConfig(configDir, 'settings.json', {
        modelProviders: {
          [protocol]: [{
            id: provider.model,
            name: provider.model,
            baseUrl: provider.baseUrl,
            envKey: KEY_ENV,
            ...(protocol === 'openai' ? { wireApi: provider.api === 'openai-responses' ? 'responses' : 'chat-completions' } : {}),
            ...(provider.contextWindow ? { generationConfig: { contextWindowSize: provider.contextWindow } } : {}),
          }],
        },
        security: { auth: { selectedType: protocol } },
        model: { name: provider.model },
      });
      return envLaunch(launch, provider, { QWEN_HOME: configDir, QWEN_RUNTIME_DIR: `${configDir}/runtime` });
    },
  },
  // Custom models.json routes use a FULL Chat Completions URL. The separate
  // CODEBUDDY_BASE_URL path supports native Anthropic-compatible third parties.
  // https://www.codebuddy.cn/docs/cli/models
  // https://www.codebuddy.cn/docs/cli/env-vars
  codebuddy: {
    apis: ['openai-completions', 'anthropic-messages'],
    description: '支持第三方 Chat Completions 和 Anthropic 模型；配置与原 CodeBuddy 账号隔离。',
    docsUrl: 'https://www.codebuddy.cn/docs/cli/models',
    apply(provider, launch, configDir) {
      if (provider.api === 'openai-completions') {
        const root = provider.baseUrl.replace(/\/+$/, '');
        writeModelConfig(configDir, 'models.json', {
          models: [{
            id: provider.model,
            name: provider.model,
            vendor: provider.name,
            url: root.endsWith('/chat/completions') ? root : `${root}/chat/completions`,
            apiKey: '${' + KEY_ENV + '}',
            supportsToolCall: true,
            ...(provider.contextWindow ? { maxInputTokens: provider.contextWindow } : {}),
          }],
          availableModels: [provider.model],
        });
      }
      return envLaunch(launch, provider, {
        CODEBUDDY_CONFIG_DIR: configDir,
        CODEBUDDY_AUTH_TOKEN: undefined,
        CODEBUDDY_BASE_URL: provider.api === 'anthropic-messages' ? provider.baseUrl : undefined,
        CODEBUDDY_API_KEY: provider.api === 'anthropic-messages' ? provider.apiKey : undefined,
        CODEBUDDY_MODEL: provider.model,
        CODEBUDDY_SMALL_FAST_MODEL: provider.model,
        CODEBUDDY_BIG_SLOW_MODEL: provider.model,
        CODEBUDDY_CODE_SUBAGENT_MODEL: provider.model,
      });
    },
  },
  // Kimi's ordinary shell OPENAI_API_KEY is NOT a credential fallback.
  // KIMI_MODEL_* accepts only kimi/anthropic/openai, so TOML covers Responses too.
  // The ACP model id is the TOML alias, not its provider's wire model name.
  // Verified against @moonshot-ai/kimi-code 2.1.1 AgentProfile.getModel() and
  // packages/acp-server/src/model-catalog.ts in the official published bundle.
  // https://moonshotai.github.io/kimi-code/en/configuration/providers.html
  // https://moonshotai.github.io/kimi-code/en/configuration/env-vars.html
  kimi: {
    apis: [...COMMON_APIS, 'google-generative-ai'],
    description: '在独立 Kimi Code 目录配置第三方 API；凭据只通过声明的环境变量读取。',
    docsUrl: 'https://moonshotai.github.io/kimi-code/en/configuration/providers.html',
    apply(provider, launch, configDir) {
      const type = {
        'openai-completions': 'openai',
        'openai-responses': 'openai_responses',
        'anthropic-messages': 'anthropic',
        'google-generative-ai': 'google-genai',
      }[provider.api];
      writeModelConfig(configDir, 'config.toml', [
        `default_model = ${quoted(PROVIDER_ID)}`,
        '',
        `[providers.${PROVIDER_ID}]`,
        `type = ${quoted(type)}`,
        `base_url = ${quoted(provider.baseUrl)}`,
        `api_key_env = ${quoted(KEY_ENV)}`,
        '',
        `[models.${PROVIDER_ID}]`,
        `provider = ${quoted(PROVIDER_ID)}`,
        `model = ${quoted(provider.model)}`,
        `max_context_size = ${provider.contextWindow ?? 262144}`,
        'capabilities = ["tool_use"]',
        '',
      ].join('\n'));
      return envLaunch(launch, provider, {
        KIMI_CODE_HOME: configDir,
        // NAME gates the other three in both current engines. Clear all four
        // explicitly so inherited temporary-provider credentials stay out.
        KIMI_MODEL_NAME: undefined,
        KIMI_MODEL_API_KEY: undefined,
        KIMI_MODEL_BASE_URL: undefined,
        KIMI_MODEL_PROVIDER_TYPE: undefined,
        // This global header overlay can replace the generated Authorization.
        KIMI_CODE_CUSTOM_HEADERS: undefined,
      });
    },
    modelId: () => PROVIDER_ID,
  },
  // custom_provider is the supported BYOK tree. apiKey-env in `provider add`
  // stores the resolved key, not a reference; this driver likewise confines the
  // necessary plaintext key to a private 0600 file. JSON is valid YAML.
  // ACP has no --model option; select defaultModel in the isolated config.
  // https://github.com/MiniMax-AI/minimax-code/blob/main/docs/examples.md
  // https://github.com/MiniMax-AI/minimax-code/blob/main/packages/config/src/config.ts
  'minimax-code': {
    apis: [...COMMON_APIS],
    description: '支持三种兼容接口；MiniMax 要求的 API Key 只存于应用私有配置文件。',
    docsUrl: 'https://github.com/MiniMax-AI/minimax-code/blob/main/docs/examples.md',
    apply(provider, launch, configDir) {
      const model = `custom_provider:${PROVIDER_ID}/${provider.model}`;
      const defaults = providerModelOptions(provider.preset, 'minimax-code', provider.model);
      const { contextWindow: _context, maxTokens: _tokens, input: _input, thinkingLevelMap: _thinking, ...modelDefaults } = defaults;
      const context = provider.contextWindow ?? defaults.contextWindow;
      writeModelConfig(configDir, 'config.yaml', {
        custom_provider: {
          [PROVIDER_ID]: {
            name: provider.name,
            kind: 'custom',
            api: provider.api,
            options: { baseURL: provider.baseUrl, apiKey: provider.apiKey },
            // Keep MCode's documented 16K default output budget when only the
            // user-declared context limit is supplied. ModelLimit requires both.
            models: { [provider.model]: { ...modelDefaults, ...(context ? {
              limit: { context, output: Math.min(context, defaults.maxTokens ?? 16384) },
            } : {}) } },
          },
        },
        defaultModel: model,
        defaultLightModel: model,
      });
      return envLaunch(launch, provider, { MINIMAX_DATA_DIR: configDir, MAVIS_DATA_DIR: configDir });
    },
    modelId: (provider) => `custom_provider:${PROVIDER_ID}/${provider.model}`,
  },
  // Custom SDK providers and explicit credentials are supported even when the
  // default mimo-only mode disables automatic provider environment discovery.
  // The publicly verified SDK examples cover Chat and Anthropic; do not infer
  // custom Responses routing from the OpenCode ancestry alone.
  // AI SDK's Anthropic custom baseURL is the versioned prefix; unlike the
  // Anthropic SDK used by Pi, Kimi and MCode, it appends only `/messages`.
  // https://github.com/vercel/ai/blob/main/packages/anthropic/src/anthropic-provider.ts
  // https://mimo.xiaomi.com/mimocode/models-provider
  // https://mimo.xiaomi.com/mimocode/config-files
  // https://mimo.xiaomi.com/mimocode/env-vars
  'mimo-code': {
    apis: ['openai-completions', 'anthropic-messages'],
    description: '通过独立 MiMo 配置接入第三方 Chat 或 Anthropic 模型。',
    docsUrl: 'https://mimo.xiaomi.com/mimocode/models-provider',
    apply(provider, launch, configDir) {
      const root = provider.baseUrl.replace(/\/+$/, '');
      const baseURL = provider.api === 'anthropic-messages' && !/\/v\d+$/.test(root) ? `${root}/v1` : root;
      const config = {
        model: `${PROVIDER_ID}/${provider.model}`,
        small_model: `${PROVIDER_ID}/${provider.model}`,
        provider: {
          [PROVIDER_ID]: {
            npm: provider.api === 'anthropic-messages' ? '@ai-sdk/anthropic' : '@ai-sdk/openai-compatible',
            name: provider.name,
            options: { baseURL, apiKey: `{env:${KEY_ENV}}` },
            // The public schema requires context AND output if limit exists.
            // This is our output budget, not a claim about the vendor's maximum.
            models: { [provider.model]: { name: provider.model, ...(provider.contextWindow ? {
              limit: { context: provider.contextWindow, output: Math.min(provider.contextWindow, 16384) },
            } : {}) } },
          },
        },
      };
      return envLaunch(launch, provider, {
        MIMOCODE_HOME: configDir,
        MIMOCODE_CONFIG_CONTENT: JSON.stringify(config),
      });
    },
    modelId: (provider) => `${PROVIDER_ID}/${provider.model}`,
  },
  // The shipped base bundle already mounts dormant dsh-llm-pi-ai. An overlay
  // activates only our route and selects it for ACP and default subagent work.
  // https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-pi-ai/README.md
  // https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/acp-app/cordis.patch.yml
  'deepseek-harness': {
    apis: [...COMMON_APIS],
    description: '使用独立 Harness profile 与内置 Pi AI 适配器接入第三方兼容 API。',
    docsUrl: 'https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/llm/llm-pi-ai/README.md',
    apply(provider, launch, configDir) {
      const patch = writeModelConfig(configDir, 'model.patch.yml', [
        { id: 'llm-pi-ai', config: { providers: { [PROVIDER_ID]: {
          apiKeyEnv: KEY_ENV,
          api: provider.api,
          baseURL: provider.baseUrl,
          models: [{ id: provider.model, ...(provider.contextWindow ? { contextWindow: provider.contextWindow } : {}) }],
        } } } },
        { id: 'acp', config: { provider: PROVIDER_ID, model: provider.model } },
        { id: 'agent-default-model', config: { provider: PROVIDER_ID, model: provider.model } },
      ]);
      const result = envLaunch(launch, provider, { DSH_HOME: configDir });
      return { ...result, args: [...result.args, '--patch', patch] };
    },
  },
};

function tui(command: string, description: string, name = '配置模型与订阅'): NativeModelSetup {
  return { id: 'model-setup', name, description, command, args: [] };
}

export const DOMESTIC_MODEL_SETUPS: Record<string, NativeModelSetup[]> = {
  pi: [tui('pi', '进入 Pi 后使用 /login 登录支持的订阅，再通过 /model 选择模型。')],
  hermes: [{ id: 'model-setup', name: '配置模型与订阅', description: '选择官方订阅登录、API Key 或自定义 endpoint。', command: 'hermes', args: ['model'] }],
  codebuddy: [tui('codebuddy', '进入 CodeBuddy 后使用 /login 登录，或使用 /model 管理模型。')],
  'qwen-code': [tui('qwen', '进入后使用 /auth 配置百炼 Coding Plan、Token Plan 或第三方 API，再使用 /model 选择模型。')],
  kimi: [tui('kimi', '进入后使用 /login 登录 Kimi Code 订阅，或 /provider 管理第三方模型。')],
  'minimax-code': [
    { id: 'account-login-cn', name: '登录 MiniMax 国内账号', description: '使用国内 MiniMax 账号和 Token Plan。', command: 'mcode', args: ['login'] },
    { id: 'account-login-global', name: '登录 MiniMax 国际账号', description: '使用国际 MiniMax 账号和 Token Plan。', command: 'mcode', args: ['login', '--region', 'global'] },
    tui('mcode', '进入后使用 /model 或 /provider 选择官方订阅与第三方模型。'),
  ],
  'mimo-code': [tui('mimo', '进入后使用 /connect 连接供应商，再使用 /models 选择模型。')],
  // Qoder BYOK is an Individual-plan, account-catalog-driven interactive feature.
  // Its docs explicitly forbid manually configuring BYOK in settings.json.
  // https://docs.qoder.com/cli/custom-models
  // https://docs.qoder.cn/cli/custom-models
  qoder: [tui('qoder', '使用 /login 登录，再用 /model → Custom 添加 BYOK；需 Individual 计划，模型以账号目录为准。')],
  'qoder-cn': [tui('qodercn', '使用 /login 登录，再用 /model → Custom 添加 BYOK；需 Individual 计划，模型以账号目录为准。')],
  // Current TRAE 2.0 docs only publish native PAT/organization-host configuration;
  // old trae_cli.yaml custom-model examples are not a verified 2.0 driver.
  // https://docs.trae.cn/cli_config-file
  // https://docs.trae.cn/cli_environment-variables
  trae: [tui('traecli', '使用 /login 登录 TRAE 账号，通过 /model 选择账号可用模型。')],
};
