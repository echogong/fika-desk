// Agent 清单：参考 Magpie、ACP Registry 与项目安装/接入文档，2026-10-03 核对。
// 默认目录精选常用或有鲜明特色的项目，均有固定一键安装计划与 stdio ACP 网页会话入口。
// 精简项的旧会话兼容入口保存在 server/archived-agents.ts，不在新建或设置中展示。
export interface AgentCatalogEntry {
  id: string;
  name: string;
  publisher: string;
  region: 'china' | 'global';
  commands: string[];
  website: string;
  note?: string;
}

export interface AgentCatalogView extends AgentCatalogEntry {
  integrated: boolean;
  /** 只检查可执行文件是否存在，不运行 CLI，也不据此断言能连接模型。 */
  detectedCommand?: string;
}

function entry(
  id: string, name: string, publisher: string, region: AgentCatalogEntry['region'],
  commands: string[], website: string, note?: string,
): AgentCatalogEntry {
  return { id, name, publisher, region, commands, website, note };
}

export const AGENT_CATALOG: AgentCatalogEntry[] = [
  entry("codex", "Codex", "OpenAI", "global", ["codex","codex-acp"], "https://github.com/openai/codex", "项目自带 CLI 与 ACP 接入程序，随应用一起安装；可登录 ChatGPT 或配置模型供应商。"),
  entry("pi", "Pi", "Pi / 开源社区", "global", ["pi-acp","pi"], "https://pi.dev", "安装命令同时安装 Pi 与 ACP 适配器；通过 Pi 自己的设置向导配置模型。"),
  entry("hermes", "Hermes", "Nous Research", "global", ["hermes"], "https://hermes-agent.nousresearch.com"),
  entry("codebuddy", "CodeBuddy", "腾讯", "china", ["codebuddy"], "https://www.codebuddy.cn/cli/"),
  entry("claude", "Claude Code", "Anthropic", "global", ["claude-agent-acp","claude"], "https://code.claude.com/docs/en/overview", "安装命令同时安装 Claude Code 与 ACP 适配器；需登录账号或配置兼容供应商。"),
  entry("gemini", "Gemini CLI", "Google", "global", ["gemini"], "https://geminicli.com"),
  entry("qwen-code", "Qwen Code", "阿里 · 通义千问", "china", ["qwen"], "https://qwenlm.github.io/qwen-code-docs/en/users/features/acp/"),
  entry("kimi", "Kimi Code CLI", "月之暗面", "china", ["kimi"], "https://moonshotai.github.io/kimi-code/en/guides/getting-started.html", "使用当前 Kimi Code 的 Node.js CLI；安装后登录 Kimi 账号。"),
  entry("minimax-code", "MiniMax Code", "MiniMax", "china", ["mcode"], "https://agent.minimax.io", "使用 MiniMax 官方安装器；通过 mcode acp 接入，安装后需账号或 API Key。"),
  entry("mimo-code", "MiMo Code", "小米", "china", ["mimo"], "https://mimo.xiaomi.com/mimocode/start", "官方 CLI 支持 mimo acp，安装后配置 MiMo 账号或 API Key。"),
  entry("deepseek-harness", "DeepSeek Harness", "DeepSeek", "china", ["dsh"], "https://github.com/deepseek-ai/deepseek-harness", "开发者预览版；使用已发布的 dsh 与 --profile acp，需配置模型。"),
  entry("qoder", "Qoder CLI", "Qoder", "china", ["qoder","qodercli"], "https://docs.qoder.com/cli/overview", "Qoder 国际版，支持 --acp；需要账号或访问令牌。"),
  entry("qoder-cn", "Qoder CN CLI", "Qoder", "china", ["qodercn","qoderclicn"], "https://docs.qoder.cn/cli/acp", "Qoder 国内版，支持 --acp；需要账号或访问令牌。"),
  entry("trae", "TRAE Code CLI", "TRAE · 字节跳动", "china", ["traecli"], "https://docs.trae.cn/cli_agent-client-protocol", "使用 TRAE Code 2.0 的官方 CLI，通过 traecli acp serve 接入；需登录或配置访问令牌。"),
  entry("opencode", "OpenCode", "Anomaly", "global", ["opencode"], "https://opencode.ai/docs/acp/", "开源编程 Agent，原生支持 opencode acp；可配置多家模型供应商。"),
  entry("cursor", "Cursor CLI", "Cursor", "global", ["cursor-agent"], "https://cursor.com/docs/cli/overview", "使用官方安装器提供的 cursor-agent acp；需登录 Cursor。避免把其他产品的同名 agent 命令误认为 Cursor。"),
  entry("github-copilot", "GitHub Copilot CLI", "GitHub", "global", ["copilot"], "https://github.com/features/copilot/cli/"),
  entry("auggie", "Auggie CLI", "Augment Code", "global", ["auggie"], "https://www.augmentcode.com/", "原生支持 --acp；安装后登录 Augment 账号。"),
  entry("cline", "Cline CLI", "Cline", "global", ["cline"], "https://cline.bot/cli", "原生支持 --acp；安装后完成 Cline 的模型供应商配置。"),
  entry("kilo", "Kilo Code", "Kilo Code", "global", ["kilo"], "https://kilo.ai/", "原生支持 kilo acp；安装后登录或配置模型供应商。"),
  entry("grok-build", "Grok Build", "xAI", "global", ["grok"], "https://docs.x.ai/build/cli/reference", "使用 xAI 官方包 @xai-official/grok，通过 grok agent stdio 接入 ACP；需登录或 API Key。"),
  entry("omp", "Oh My Pi", "Stencil Labs / Can Bölük", "global", ["omp"], "https://github.com/can1357/oh-my-pi", "使用官方原生二进制安装器，无需先安装 Bun；支持 omp acp，需配置模型。"),
  entry("openhands", "OpenHands CLI", "OpenHands", "global", ["openhands"], "https://github.com/OpenHands/OpenHands-CLI", "通过 uv 安装并管理 Python 3.12；原生支持 openhands acp，需先完成 OpenHands 的模型设置。"),
  entry("open-interpreter", "Open Interpreter", "Open Interpreter", "global", ["interpreter"], "https://github.com/openinterpreter/openinterpreter/blob/main/docs/quickstart.md", "使用官方安装器，跳过初始向导；原生支持 interpreter acp，需配置模型。"),
  entry("deepagents", "DeepAgents ACP", "LangChain", "global", ["deepagents-acp"], "https://github.com/langchain-ai/deepagentsjs/blob/main/libs/acp/README.md", "使用 LangChain 已发布的 JavaScript ACP 包，安装后配置模型供应商。"),
];
