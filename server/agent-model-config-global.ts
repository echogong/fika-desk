import { MODEL_PROVIDER_ID } from './brand-compat';
import path from 'node:path';
import type { ModelApi } from '../shared/model-access';
import type { Launch } from './agents';
import type { AgentModelDriver, NativeModelSetup } from './agent-model-types';
import { writeModelConfig } from './model-config-files';
import type { StoredProvider } from './model-provider';
import { providerModelOptions, providerProfile } from '../shared/providers';

const KEY_ENV = 'FIKA_DESK_MODEL_API_KEY';
const PROVIDER = MODEL_PROVIDER_ID;
const ALL_APIS: ModelApi[] = ['openai-completions', 'openai-responses', 'anthropic-messages', 'google-generative-ai'];

// The saved Anthropic root may be either /proxy or /proxy/v1. AI SDK and
// Crush append /messages; Claude/Copilot append /v1/messages themselves.
function anthropicVersionBase(baseUrl: string): string {
  return /\/v\d+$/.test(baseUrl) ? baseUrl : `${baseUrl}/v1`;
}

function anthropicRoot(baseUrl: string): string {
  return baseUrl.replace(/\/v1$/, '');
}

/** Clone the child environment; never mutate the server or the user's HOME. */
function childEnv(launch: Launch, remove: string[] = []): NodeJS.ProcessEnv {
  const env = { ...launch.env };
  for (const name of remove) delete env[name];
  return env;
}

function withOptions(launch: Launch, values: Record<string, string>, aliases: string[] = []): string[] {
  const names = new Set([...Object.keys(values), ...aliases]);
  const args: string[] = [];
  for (let i = 0; i < launch.args.length; i++) {
    const arg = launch.args[i];
    if (names.has(arg)) { i++; continue; }
    if ([...names].some((name) => arg.startsWith(`${name}=`))) continue;
    args.push(arg);
  }
  for (const [name, value] of Object.entries(values)) args.push(name, value);
  return args;
}

function xdgEnv(dir: string): NodeJS.ProcessEnv {
  return {
    XDG_CONFIG_HOME: path.join(dir, 'xdg-config'),
    XDG_DATA_HOME: path.join(dir, 'xdg-data'),
    XDG_STATE_HOME: path.join(dir, 'xdg-state'),
    XDG_CACHE_HOME: path.join(dir, 'xdg-cache'),
  };
}

function sdkDriver(prefix: 'OPENCODE' | 'KILO', docsUrl: string): AgentModelDriver {
  return {
    apis: ALL_APIS,
    docsUrl,
    description: '通过独立进程配置接入兼容供应商；原生账号和订阅请使用该 Agent 的登录入口。',
    modelId: (provider) => `${PROVIDER}/${provider.model}`,
    apply(provider, launch, configDir) {
      // Stable OpenCode/Kilo use the v1 provider/options/npm schema. Their v2
      // documentation uses different field names and must not be mixed here.
      const npm: Record<ModelApi, string> = {
        'openai-completions': '@ai-sdk/openai-compatible',
        'openai-responses': '@ai-sdk/openai',
        'anthropic-messages': '@ai-sdk/anthropic',
        'google-generative-ai': '@ai-sdk/google',
      };
      const modelId = `${PROVIDER}/${provider.model}`;
      const defaults = providerModelOptions(provider.preset, prefix === 'OPENCODE' ? 'opencode' : 'kilo', provider.model);
      const { contextWindow: _context, maxTokens: _tokens, input: _input, thinkingLevelMap: _thinking, ...sdkDefaults } = defaults;
      const context = provider.contextWindow ?? defaults.contextWindow;
      const config = {
        model: modelId,
        small_model: modelId,
        enabled_providers: [PROVIDER],
        provider: {
          [PROVIDER]: {
            name: provider.name,
            npm: npm[provider.api],
            options: { ...providerProfile(provider.preset, 'opencode')?.options, baseURL: provider.api === 'anthropic-messages' ? anthropicVersionBase(provider.baseUrl) : provider.baseUrl, apiKey: `{env:${KEY_ENV}}` },
            models: {
              [provider.model]: {
                ...sdkDefaults,
                name: defaults.name ?? provider.model,
                ...(context ? { limit: { context, output: Math.min(defaults.maxTokens ?? 16384, context) } } : {}),
              },
            },
          },
        },
      };
      const configFile = writeModelConfig(configDir, `${prefix.toLowerCase()}.json`, config);
      const env = childEnv(launch, [`${prefix}_CONFIG`, `${prefix}_CONFIG_DIR`, `${prefix}_CONFIG_CONTENT`, 'OPENCODE_CONFIG', 'OPENCODE_CONFIG_CONTENT', 'KILO_CONFIG', 'KILO_CONFIG_CONTENT']);
      return {
        ...launch,
        env: {
          ...env,
          ...xdgEnv(configDir),
          [`${prefix}_CONFIG`]: configFile,
          [`${prefix}_CONFIG_DIR`]: configDir,
          [`${prefix}_CONFIG_CONTENT`]: JSON.stringify(config),
          [KEY_ENV]: provider.apiKey,
        },
      };
    },
  };
}

export const GLOBAL_MODEL_DRIVERS: Record<string, AgentModelDriver> = {
  opencode: sdkDriver('OPENCODE', 'https://opencode.ai/docs/providers/'),
  kilo: sdkDriver('KILO', 'https://kilo.ai/docs/code-with-ai/platforms/cli'),
  // Grok Build documents a separate TOML schema from Codex. GROK_HOME
  // isolates config and auth without replacing the user's HOME.
  // https://docs.x.ai/build/settings/reference
  'grok-build': {
    apis: ['openai-completions', 'openai-responses', 'anthropic-messages'],
    docsUrl: 'https://docs.x.ai/build/settings/reference',
    description: '使用独立 Grok 配置接入第三方 Chat、Responses 或 Anthropic API；原生 xAI 登录继续使用原有配置。',
    modelId: () => PROVIDER,
    apply(provider, launch, configDir) {
      const backend = {
        'openai-completions': 'chat_completions',
        'openai-responses': 'responses',
        'anthropic-messages': 'messages',
      }[provider.api as Exclude<ModelApi, 'google-generative-ai'>];
      if (!backend) throw new Error('Grok Build 不支持所选接口类型');
      writeModelConfig(configDir, 'config.toml', [
        '[models]', `default = ${JSON.stringify(PROVIDER)}`, '',
        `[model.${JSON.stringify(PROVIDER)}]`,
        `name = ${JSON.stringify(provider.name)}`,
        `model = ${JSON.stringify(provider.model)}`,
        `base_url = ${JSON.stringify(provider.baseUrl)}`,
        `env_key = ${JSON.stringify(KEY_ENV)}`,
        `api_backend = ${JSON.stringify(backend)}`,
        `context_window = ${provider.contextWindow ?? 500000}`, '',
      ].join('\n'));
      const env = childEnv(launch, ['GROK_HOME', 'GROK_DEFAULT_MODEL', 'GROK_MODEL', 'GROK_MODELS_BASE_URL', 'GROK_MODELS_LIST_URL', 'GROK_XAI_API_BASE_URL', 'XAI_API_KEY']);
      return { ...launch, args: withOptions(launch, { '--model': PROVIDER }, ['-m']), env: { ...env, GROK_HOME: configDir, [KEY_ENV]: provider.apiKey } };
    },
  },
  claude: {
    apis: ['anthropic-messages'],
    supportsContextWindow: false,
    docsUrl: 'https://code.claude.com/docs/en/llm-gateway-connect',
    description: '使用 Anthropic Messages 兼容网关；供应商 Key 的计费与 Claude 原厂订阅分别管理。',
    modelId: (provider) => provider.model,
    apply(provider, launch, configDir) {
      const env = childEnv(launch, [
        'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY', 'ANTHROPIC_CUSTOM_HEADERS', 'CLAUDE_CODE_OAUTH_TOKEN',
        'CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR', 'CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR',
        'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_FOUNDRY',
        'ANTHROPIC_BEDROCK_BASE_URL', 'ANTHROPIC_VERTEX_BASE_URL',
        'ANTHROPIC_FOUNDRY_BASE_URL', 'ANTHROPIC_SMALL_FAST_MODEL',
      ]);
      return {
        ...launch,
        env: {
          ...env,
          CLAUDE_CONFIG_DIR: configDir,
          ANTHROPIC_BASE_URL: anthropicRoot(provider.baseUrl),
          [providerProfile(provider.preset, 'claude')?.credential === 'bearer' ? 'ANTHROPIC_AUTH_TOKEN' : 'ANTHROPIC_API_KEY']: provider.apiKey,
          ANTHROPIC_MODEL: provider.model,
          ANTHROPIC_DEFAULT_OPUS_MODEL: provider.model,
          ANTHROPIC_DEFAULT_SONNET_MODEL: provider.model,
          ANTHROPIC_DEFAULT_HAIKU_MODEL: provider.model,
          ANTHROPIC_DEFAULT_FABLE_MODEL: provider.model,
        },
      };
    },
  },
  gemini: {
    apis: ['google-generative-ai'],
    supportsContextWindow: false,
    docsUrl: 'https://geminicli.com/docs/get-started/authentication/',
    description: '供应商必须实现 Gemini generateContent 协议；Google 账号和 Gemini API Key 使用不同的计费方式。',
    modelId: (provider) => provider.model,
    apply(provider, launch, configDir) {
      // GEMINI_CLI_HOME is Gemini's own home override, not a replacement of HOME.
      writeModelConfig(path.join(configDir, '.gemini'), 'settings.json', {
        security: { auth: { selectedType: 'gateway' } },
        model: { name: provider.model },
      });
      const env = childEnv(launch, [
        'GOOGLE_GENAI_USE_GCA', 'GOOGLE_GENAI_USE_VERTEXAI', 'GOOGLE_VERTEX_BASE_URL',
        'GEMINI_CLI_USE_COMPUTE_ADC', 'CLOUD_SHELL', 'GOOGLE_API_KEY',
        'GEMINI_CLI_CUSTOM_HEADERS', 'GEMINI_API_KEY_AUTH_MECHANISM', 'GOOGLE_GENAI_API_VERSION',
      ]);
      return {
        ...launch,
        args: withOptions(launch, { '--model': provider.model }, ['-m']),
        env: {
          ...env,
          GEMINI_CLI_HOME: configDir,
          // Google GenAI appends its version to baseUrl. The shared form and
          // interface probe use a versioned URL; split it for this SDK.
          GOOGLE_GEMINI_BASE_URL: provider.baseUrl.replace(/\/v\d+(?:alpha|beta)?$/, ''),
          GOOGLE_GENAI_API_VERSION: provider.baseUrl.match(/\/(v\d+(?:alpha|beta)?)$/)?.[1] ?? 'v1beta',
          GEMINI_API_KEY: provider.apiKey,
          GEMINI_MODEL: provider.model,
        },
      };
    },
  },
  'github-copilot': {
    apis: ['openai-completions', 'openai-responses', 'anthropic-messages'],
    docsUrl: 'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-byok-models',
    description: 'Copilot CLI 支持本地 BYOK；模型需支持流式输出和工具调用，自带 Key 时无需 Copilot 订阅。',
    modelId: (provider) => provider.model,
    apply(provider, launch) {
      const env = childEnv(launch, [
        'COPILOT_PROVIDER_BEARER_TOKEN', 'COPILOT_PROVIDER_AZURE_API_VERSION',
        'COPILOT_PROVIDER_MODEL_ID', 'COPILOT_PROVIDER_WIRE_MODEL',
        'COPILOT_PROVIDER_MAX_PROMPT_TOKENS', 'COPILOT_PROVIDER_MAX_OUTPUT_TOKENS',
        'COPILOT_PROVIDER_WIRE_API',
      ]);
      return {
        ...launch,
        args: withOptions(launch, { '--model': provider.model }, ['-m']),
        env: {
          ...env,
          COPILOT_PROVIDER_BASE_URL: provider.api === 'anthropic-messages' ? anthropicRoot(provider.baseUrl) : provider.baseUrl,
          COPILOT_PROVIDER_TYPE: provider.api === 'anthropic-messages' ? 'anthropic' : 'openai',
          COPILOT_PROVIDER_API_KEY: provider.apiKey,
          COPILOT_MODEL: provider.model,
          COPILOT_PROVIDER_WIRE_MODEL: provider.model,
          ...(provider.api !== 'anthropic-messages' ? { COPILOT_PROVIDER_WIRE_API: provider.api === 'openai-responses' ? 'responses' : 'completions' } : {}),
          ...(provider.contextWindow ? { COPILOT_PROVIDER_MAX_PROMPT_TOKENS: String(provider.contextWindow) } : {}),
          COPILOT_OFFLINE: 'true',
        },
      };
    },
  },
  goose: {
    apis: ['openai-completions'],
    supportsContextWindow: false,
    docsUrl: 'https://block.github.io/goose/docs/guides/environment-variables/',
    description: '通过 Goose 原生 OpenAI 兼容供应商接入；其他供应商和原生账号可在 Goose 配置向导中设置。',
    modelId: (provider) => provider.model,
    apply(provider, launch, configDir) {
      const env = childEnv(launch, ['OPENAI_HOST', 'OPENAI_BASE_PATH', 'OPENAI_CUSTOM_HEADERS', 'OPENAI_ORGANIZATION', 'OPENAI_PROJECT', 'GOOSE_PROVIDER__TYPE', 'GOOSE_PROVIDER__HOST', 'GOOSE_PROVIDER__API_KEY']);
      return {
        ...launch,
        env: {
          ...env,
          GOOSE_PATH_ROOT: configDir,
          GOOSE_PROVIDER: 'openai',
          GOOSE_MODEL: provider.model,
          OPENAI_BASE_URL: provider.baseUrl,
          OPENAI_API_KEY: provider.apiKey,
        },
      };
    },
  },
  deepagents: {
    apis: ['openai-responses'],
    supportsContextWindow: false,
    docsUrl: 'https://github.com/langchain-ai/deepagentsjs/blob/main/libs/acp/README.md',
    description: '通过 Responses 兼容接口接入模型；服务需要支持工具调用，账号订阅按供应商自己的规则使用。',
    // DeepAgents ACP does not advertise model selection metadata. The CLI
    // selects LangChain's OpenAI provider with a prefix, which is stripped
    // before the actual wire request is made.
    modelId: (provider) => provider.model,
    apply(provider, launch) {
      // LangChain's AgentNode explicitly sets useResponsesApi for an
      // "openai:" model. Using the prefix also selects arbitrary model IDs,
      // instead of inferring a provider from the model's name. This route was
      // verified against deepagents-acp 0.1.33 with a loopback Responses mock.
      const env = childEnv(launch, [
        'OPENAI_API_BASE', 'OPENAI_ORGANIZATION', 'OPENAI_PROJECT',
        'LANGSMITH_GATEWAY', 'LANGSMITH_GATEWAY_API_KEY', 'LANGSMITH_API_KEY',
        'LANGCHAIN_API_KEY', 'LANGSMITH_TRACING', 'LANGCHAIN_TRACING_V2',
      ]);
      return {
        ...launch,
        args: withOptions(launch, { '--model': `openai:${provider.model}` }, ['-m']),
        env: {
          ...env,
          OPENAI_BASE_URL: provider.baseUrl,
          OPENAI_API_KEY: provider.apiKey,
          LANGSMITH_TRACING: 'false',
          LANGCHAIN_TRACING_V2: 'false',
        },
      };
    },
  },
  cline: {
    apis: ['openai-completions', 'openai-responses'],
    docsUrl: 'https://docs.cline.bot/cline-cli/configuration',
    description: '使用 Cline 的独立本地供应商配置；其他供应商、Cline 账号和 ChatGPT 订阅可使用原生认证向导。',
    modelId: (provider) => provider.model,
    apply(provider, launch, configDir) {
      const id = provider.api === 'openai-responses' ? 'openai-native' : 'openai';
      // Cline does not expand env references in provider-settings.json. Its
      // official storage schema accepts a literal apiKey; this file is private
      // (0600), and the key is never placed in process argv.
      const providerFile = writeModelConfig(configDir, 'providers.json', {
        version: 1,
        lastUsedProvider: id,
        modes: {},
        providers: {
          [id]: {
            tokenSource: 'manual',
            updatedAt: new Date().toISOString(),
            settings: {
              provider: id,
              model: provider.model,
              apiKey: provider.apiKey,
              baseUrl: provider.baseUrl,
              protocol: provider.api === 'openai-responses' ? 'openai-responses' : 'openai-chat',
              client: provider.api === 'openai-responses' ? 'openai' : 'openai-compatible',
              ...(provider.contextWindow ? { contextWindow: provider.contextWindow } : {}),
            },
          },
        },
      });
      const env = childEnv(launch, ['CLINE_PROVIDER_SETTINGS_PATH', 'CLINE_DATA_DIR', 'CLINE_DIR', 'CLINE_HUB_ADDRESS', 'CLINE_SESSION_DATA_DIR']);
      return {
        ...launch,
        args: withOptions(launch, { '--provider': id, '--model': provider.model, '--config': configDir, '--data-dir': path.join(configDir, 'data') }, ['-P', '-m']),
        env: {
          ...env,
          CLINE_PROVIDER_SETTINGS_PATH: providerFile,
          CLINE_DATA_DIR: path.join(configDir, 'data'),
          CLINE_DIR: configDir,
          OPENAI_API_KEY: provider.apiKey,
        },
      };
    },
  },
  crush: {
    apis: ['openai-completions', 'anthropic-messages'],
    docsUrl: 'https://github.com/charmbracelet/crush#custom-providers',
    description: '接入 OpenAI Chat Completions 或 Anthropic Messages 兼容服务；其他供应商和账号请使用 Crush 原生设置。',
    modelId: (provider) => `${PROVIDER}/${provider.model}`,
    apply(provider, launch, configDir) {
      const adapterDir = path.join(configDir, 'adapter');
      const crushDir = path.join(adapterDir, 'crush');
      // crush-acp 0.5.0 reads APPDATA/crush/crush.json and stores sessions under
      // APPDATA/.crush-acp. APPDATA is set only in this child. HOME is untouched.
      writeModelConfig(crushDir, 'crush.json', {
        providers: {
          [PROVIDER]: {
            id: PROVIDER,
            name: provider.name,
            type: provider.api === 'anthropic-messages' ? 'anthropic' : 'openai-compat',
            base_url: provider.api === 'anthropic-messages' ? anthropicVersionBase(provider.baseUrl) : provider.baseUrl,
            api_key: `$${KEY_ENV}`,
            models: [{ id: provider.model, name: provider.model, context_window: provider.contextWindow ?? 128000, default_max_tokens: 16384 }],
          },
        },
        models: {
          large: { provider: PROVIDER, model: provider.model, max_tokens: 16384 },
          small: { provider: PROVIDER, model: provider.model, max_tokens: 16384 },
        },
      });
      return {
        ...launch,
        env: {
          ...childEnv(launch),
          APPDATA: adapterDir,
          CRUSH_GLOBAL_CONFIG: crushDir,
          CRUSH_GLOBAL_DATA: path.join(configDir, 'global-data'),
          [KEY_ENV]: provider.apiKey,
        },
      };
    },
  },
  junie: {
    apis: ALL_APIS,
    docsUrl: 'https://junie.jetbrains.com/docs/custom-llm-models.html',
    description: '使用 Junie 自定义模型配置，支持四种 API 协议；BYOK 无需 JetBrains AI 订阅。',
    modelId: () => `custom:${PROVIDER}`,
    apply(provider, launch, configDir) {
      const apiType: Record<ModelApi, string> = {
        'openai-completions': 'OpenAICompletion',
        'openai-responses': 'OpenAIResponses',
        'anthropic-messages': 'Anthropic',
        'google-generative-ai': 'Google',
      };
      const suffix: Record<ModelApi, string> = {
        'openai-completions': '/chat/completions',
        'openai-responses': '/responses',
        'anthropic-messages': /\/v\d+$/.test(provider.baseUrl) ? '/messages' : '/v1/messages',
        'google-generative-ai': `/models/${encodeURIComponent(provider.model)}:streamGenerateContent?alt=sse`,
      };
      const modelsDir = path.join(configDir, 'models');
      writeModelConfig(modelsDir, `${PROVIDER}.json`, {
        id: provider.model,
        displayName: provider.model,
        providerName: provider.name,
        baseUrl: `${provider.baseUrl}${suffix[provider.api]}`,
        apiType: apiType[provider.api],
        // Google's public API uses x-goog-api-key rather than an API key as a
        // Bearer token. Junie accepts env refs in custom headers as well.
        ...(provider.api === 'google-generative-ai'
          ? { extraHeaders: { 'x-goog-api-key': '${' + KEY_ENV + '}' } }
          : { apiKey: '${' + KEY_ENV + '}' }),
        ...(provider.contextWindow ? { maxContextLength: provider.contextWindow } : {}),
      });
      return {
        ...launch,
        args: withOptions(launch, { '--model': `custom:${PROVIDER}`, '--model-location': modelsDir, '--model-default-locations': 'false', '--config-default-locations': 'false' }),
        env: {
          ...childEnv(launch, ['JUNIE_CONFIG_LOCATION', 'JUNIE_MODEL_LOCATIONS', 'JUNIE_LLM_PROVIDER']),
          JUNIE_HOME: configDir,
          JUNIE_MODEL: `custom:${PROVIDER}`,
          [KEY_ENV]: provider.apiKey,
        },
      };
    },
  },
};

function setup(command: string, args: string[], name: string, description: string, id = 'model-setup'): NativeModelSetup {
  return { id, command, args, name, description };
}

/** Fixed, reviewable commands. Account tokens remain managed by each CLI. */
export const GLOBAL_MODEL_SETUPS: Record<string, NativeModelSetup[]> = {
  opencode: [setup('opencode', [], '原生模型设置', '启动 OpenCode，在 /connect 中连接供应商或订阅，再用 /models 选模型。'), setup('opencode', ['auth', 'login'], '原生账号登录', '选择 OpenCode 支持的原生账号或供应商。', 'account-login')],
  kilo: [setup('kilo', [], '原生模型设置', '在 Kilo 的原生设置中连接供应商并选择模型。')],
  claude: [setup('claude-agent-acp', ['--cli', 'auth', 'login'], 'Claude 账号登录', '使用适配器自带的 Claude CLI 完成原厂账号认证；供应商 Key 与订阅独立计费。', 'account-login')],
  gemini: [setup('gemini', [], 'Gemini 原生设置', '在 Gemini CLI 中选择 Google 账号、API Key 或 Vertex AI，并设置模型。')],
  'github-copilot': [setup('copilot', ['login'], 'GitHub 账号登录', '登录 GitHub Copilot 原厂账号；网页 BYOK 配置使用供应商自己的 Key。', 'account-login')],
  goose: [setup('goose', ['configure'], 'Goose 配置向导', '选择供应商、模型和认证方式；账号支持范围以 Goose 原生向导为准。')],
  cline: [setup('cline', ['auth'], 'Cline 认证与模型设置', '选择 Cline、ChatGPT 订阅、OCA 或供应商 API Key。'), setup('cline', ['auth', 'openai-codex'], 'ChatGPT 订阅登录', '通过 Cline 原生 OAuth 接入 ChatGPT 订阅，不向其他 Agent 转发账号令牌。', 'account-login')],
  crush: [setup('crush', [], 'Crush 原生模型设置', '在 Crush 原生界面中配置供应商或它支持的账号订阅。')],
  junie: [setup('junie', [], 'Junie 原生设置', '使用 /account 连接 JetBrains 账号或供应商，使用 /model 选择模型。')],
  cursor: [setup('cursor-agent', ['login'], 'Cursor 账号登录', '登录 Cursor CLI 账号；Cursor API Key 是平台认证信息。', 'account-login')],
  amp: [setup('amp', [], 'Amp 原生模型设置', '在 Amp 中按 Ctrl+S 打开设置，通过 Model Routing 配置 API Key、网关或订阅。'), setup('amp', ['login'], 'Amp 账号登录', '通过 Amp 原生登录管理账号，订阅接入使用 Model Routing。', 'account-login'), setup('amp', ['config', 'model-providers', 'add-chatgpt-subscription'], 'Amp 连接 ChatGPT 订阅', '运行 Amp 官方 ChatGPT 订阅登录流程，再在模式设置中选择该订阅支持的模型。', 'account-login-chatgpt')],
  'factory-droid': [setup('droid', [], 'Droid 原生模型设置', '在 /settings 中选择模型；Droid 支持 settings.json 的 customModels 自带 Key 配置。')],
  kiro: [setup('kiro-cli', ['login'], 'Kiro 账号登录', '使用 Kiro 原生账号认证；模型可在 Kiro CLI 内选择。', 'account-login')],
  muse: [setup('muse', [], 'Muse 原生账号与模型', '按 Muse CLI 的认证提示连接 Meta 账号或 Meta API，再选择它支持的模型。')],
  devin: [setup('devin', ['auth', 'login', '--force-manual-token-flow'], 'Devin 远程账号登录', '使用官方手动令牌登录流程，适用于网页终端和远程服务器。', 'account-login')],
  openhands: [setup('openhands', [], 'OpenHands 原生模型设置', '在 OpenHands 配置向导中设置供应商 API Key、模型和服务地址。'), setup('openhands', ['login'], 'OpenHands 原生账号登录', '登录 OpenHands 原厂服务账号。', 'account-login')],
  'letta-code': [setup('letta', ['--backend', 'local'], 'Letta 本地模型设置', '使用 Letta 本地后端的原生 connect 向导连接模型供应商。'), setup('letta', ['login'], 'Letta 账号登录', 'LETTA_API_KEY 是 Letta 服务认证信息，不是任意模型供应商的 API Key。', 'account-login')],
  'open-interpreter': [setup('interpreter', [], 'Open Interpreter 原生设置', '使用当前 Open Interpreter CLI 的供应商与账号配置。')],
  gptme: [setup('gptme', [], 'gptme 原生模型设置', '使用 gptme 原生配置和模型选择；其 ACP 入口读取同一份 gptme 配置。')],
  auggie: [setup('auggie', ['login'], 'Augment 账号登录', '登录 Augment 账号，再在 Auggie 中选择账号可用的模型。', 'account-login')],
  'mistral-vibe': [setup('vibe', ['--setup'], 'Vibe 认证设置', '通过 Mistral Vibe 官方向导连接 Mistral 账号或 API Key；其他供应商配置以原生文档为准。')],
  'grok-build': [setup('grok', [], 'Grok 原生模型设置', '在 Grok 原生界面中选择模型；自带 Key 与服务地址使用它的供应商配置。'), setup('grok', ['login', '--device-auth'], 'Grok 远程账号登录', '使用 Grok 官方设备码登录，可在自己的浏览器中打开终端提供的链接。', 'account-login')],
  omp: [setup('omp', ['setup'], 'OMP 模型设置向导', '选择默认模型；供应商 API Key 和账号订阅由 OMP 原生配置管理。')],
  'command-code': [setup('command-code', [], 'Command Code 原生设置', '使用 /connect 连接 API Key 或它支持的订阅，再通过 /model 选择模型。'), setup('command-code', ['login'], 'Command Code 账号登录', '运行 Command Code 官方账号登录流程。', 'account-login')],
  fx: [setup('fx', ['setup'], 'fx 模型接入向导', '设置 Vercel AI Gateway Key，再在 fx 中选择供应商和模型。'), setup('fx', ['login'], 'fx Vercel 账号登录', '连接 Vercel AI Gateway 账号。', 'account-login'), setup('fx', ['login', 'codex'], 'fx 连接 ChatGPT 订阅', '通过 fx 官方 Codex 登录流程连接 ChatGPT 订阅。', 'account-login-chatgpt')],
  nanocoder: [setup('nanocoder', [], 'Nanocoder 原生设置', '使用 /settings providers 配置供应商，使用 /model 选择模型；账号登录使用它支持的原生命令。')],
  autohand: [setup('autohand', ['--setup'], 'Autohand 模型设置向导', '在 Autohand 向导中选择供应商、API Key 和模型。')],
  'cortex-code': [setup('cortex', [], 'Snowflake 连接设置', '首次启动会引导配置 Snowflake 账号连接；模型通过 Snowflake 服务使用。')],
  'crow-cli': [setup('crow-cli', ['init'], 'Crow 模型设置向导', '交互选择供应商与模型，并保存 Crow 自己的认证配置。')],
  dirac: [setup('dirac', ['auth'], 'Dirac 供应商认证', '通过 Dirac 官方交互向导配置供应商与认证信息。')],
  'fast-agent': [setup('fast-agent', ['go'], 'fast-agent 原生模型设置', '打开交互终端；未配置模型时会提示选择模型。'), setup('fast-agent', ['auth', 'provider', 'login', 'codex'], 'fast-agent 连接 ChatGPT 订阅', '使用 fast-agent 官方 Codex OAuth 登录，不向其他 Agent 转发订阅令牌。', 'account-login')],
  'glm-acp-agent': [setup('glm-acp-agent', ['--setup'], 'GLM Coding Plan 认证设置', '设置 Z.AI GLM Coding Plan Key；此适配器面向 Coding Plan 的模型服务。')],
  nova: [setup('nova', ['setup'], 'Nova 模型设置向导', '运行 Nova 官方 API Key 与偏好设置向导。')],
  poolside: [setup('pool', [], 'Pool 原生模型设置', '在 Pool 中选择模型；支持其原生配置中的 OpenAI 兼容服务和本地模型。'), setup('pool', ['login'], 'Pool 账号与供应商登录', '通过 Pool 原生登录向导连接它支持的账号或 OpenRouter。', 'account-login')],
  sigit: [setup('sigit', [], 'Sigit 本地模型终端', '启动 Sigit 原生终端；首次启动会下载约 1–2 GB 的默认本地模型，Windows 暂不支持此终端界面。')],
  stakpak: [setup('stakpak', [], 'Stakpak 原生模型设置', '按 Stakpak 启动提示配置账号或供应商 Key，再选择模型。')],
  vtcode: [setup('vtcode', [], 'VT Code 原生模型设置', '启动 VT Code 终端，在其原生配置中选择供应商、模型和认证方式。')],
  kimchi: [setup('kimchi', ['setup'], 'Kimchi 认证设置向导', '通过 Kimchi 官方交互向导配置 API Key。')],
  dimcode: [setup('dimcode', [], 'DimCode 原生模型设置', '使用 /connect 连接供应商或订阅，使用 /models 选择模型。'), setup('dimcode', ['auth', 'login'], 'DimCode 原生账号登录', '选择 DimCode 支持的账号或供应商完成登录。', 'account-login')],
  'minion-code': [setup('minion-code', [], 'Minion 原生模型终端', '先按官方文档在 ~/.minion/config.yaml 配置供应商和 Key，再在终端使用 /model 选择已配置的模型。')],
};
