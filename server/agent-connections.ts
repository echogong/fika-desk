// 经官方安装文档、已发布包和 ACP 文档核实的新增接入。
// 这里只提供固定安装计划；不会在打开网页时下载或安装任何 Agent。
import type { AgentPreset, AgentSetup, NpmPackage } from './agents';

type Connection = Pick<AgentPreset, 'launches' | 'requires' | 'env'> & { setup: AgentSetup };

function npm(pkg: string, bin: string, args: string[], extras: NpmPackage[] = []): Connection {
  return { launches: [{ command: bin, args }], setup: { npm: [{ pkg, bin }, ...extras] } };
}

function script(install: string, bin: string, args: string[], update?: string[], requirements = ['curl']): Connection {
  return { launches: [{ command: bin, args }], setup: { script: install, bin, update, requires: requirements } };
}

function uv(pkg: string, bin: string, args: string[], python?: string): Connection {
  return script(`uv tool install --upgrade ${pkg}${python ? ` --python ${python}` : ''}`, bin, args, undefined, ['uv']);
}

export const VERIFIED_CONNECTIONS: Record<string, Connection> = {
  // 国内：使用当前正式产品的包名和命令，不安装旧的同名开源项目。
  'qwen-code': npm('@qwen-code/qwen-code', 'qwen', ['--acp']),
  kimi: npm('@moonshot-ai/kimi-code', 'kimi', ['acp']),
  'minimax-code': script('curl -fsSL https://filecdn.minimax.chat/public/install.sh | bash', 'mcode', ['acp']),
  'mimo-code': npm('@mimo-ai/cli', 'mimo', ['acp']),
  'deepseek-harness': npm('@deepseek-ai/dsh', 'dsh', ['--profile', 'acp']),
  qoder: { ...npm('@qoder-ai/qodercli', 'qoder', ['--acp']), launches: [{ command: 'qoder', args: ['--acp'] }, { command: 'qodercli', args: ['--acp'] }] },
  'qoder-cn': { ...npm('@qodercn-ai/qoderclicn', 'qodercn', ['--acp']), launches: [{ command: 'qodercn', args: ['--acp'] }, { command: 'qoderclicn', args: ['--acp'] }] },
  trae: script('curl -fsSL https://trae.cn/trae-cli/install_v2.sh | sh', 'traecli', ['acp', 'serve']),

  // 原生 npm CLI / 可随一个安装命令安装的 ACP 适配器。
  opencode: npm('opencode-ai', 'opencode', ['acp']),
  cursor: script('curl -fsSL https://cursor.com/install | bash', 'cursor-agent', ['acp'], ['update']),
  'github-copilot': npm('@github/copilot', 'copilot', ['--acp']),
  'grok-build': npm('@xai-official/grok', 'grok', ['agent', 'stdio']),
  'command-code': npm('command-code', 'command-code', ['acp']),
  crush: { ...npm('@charmland/crush', 'crush', [], [{ pkg: 'crush-acp', bin: 'crush-acp' }]), launches: [{ command: 'crush-acp', args: [] }], requires: ['crush'] },
  amp: { ...npm('@ampcode/cli', 'amp', [], [{ pkg: 'amp-acp', bin: 'amp-acp' }]), launches: [{ command: 'amp-acp', args: [] }], requires: ['amp'] },
  auggie: { ...npm('@augmentcode/auggie', 'auggie', ['--acp']), env: { AUGMENT_DISABLE_AUTO_UPDATE: '1' } },
  'factory-droid': { ...npm('droid', 'droid', ['exec', '--output-format', 'acp-daemon']), env: { DROID_DISABLE_AUTO_UPDATE: 'true', FACTORY_DROID_AUTO_UPDATE_ENABLED: 'false' } },
  cline: npm('cline', 'cline', ['--acp']),
  kilo: npm('@kilocode/cli', 'kilo', ['acp']),
  junie: npm('@jetbrains/junie', 'junie', ['--acp=true']),
  autohand: npm('autohand-cli', 'autohand', ['--acp']),
  deepagents: {
    ...npm('deepagents-acp', 'deepagents-acp', []),
    setup: { npm: [{ pkg: 'deepagents-acp', bin: 'deepagents-acp' }], libraries: ['@langchain/openai'] },
  },
  'glm-acp-agent': npm('glm-acp-agent', 'glm-acp-agent', []),
  nova: npm('@compass-ai/nova', 'nova', ['acp']),
  sigit: npm('@getsigit/sigit', 'sigit', ['--acp']),
  dirac: npm('dirac-cli', 'dirac', ['--acp']),
  dimcode: npm('dimcode', 'dimcode', ['acp']),
  'letta-code': { ...npm('@letta-ai/letta-acp', 'letta-acp', [], [{ pkg: '@letta-ai/letta-code', bin: 'letta' }]), requires: ['letta'] },
  nanocoder: npm('@nanocollective/nanocoder', 'nanocoder', ['--acp']),
  muse: {
    ...script('curl -fsSL https://dev.meta.ai/install.sh | MUSE_LOGIN=0 MUSE_NO_MODIFY_PATH=1 bash && npm install -g --prefix "$HOME/.npm-global" @brokkai/muse-acp', 'muse-acp', [], undefined, ['curl', 'npm']),
    requires: ['muse'],
  },

  // 官方脚本和隔离 Python 工具安装。安装脚本同时作为无专门更新命令时的更新入口。
  goose: script('curl -fsSL https://github.com/aaif-goose/goose/releases/download/stable/download_cli.sh | CONFIGURE=false bash', 'goose', ['acp']),
  'mistral-vibe': script('curl -LsSf https://mistral.ai/vibe/install.sh | bash', 'vibe-acp', []),
  kiro: script('curl -fsSL https://cli.kiro.dev/install | bash', 'kiro-cli', ['acp'], ['update', '--non-interactive']),
  omp: script('curl -fsSL https://omp.sh/install | sh', 'omp', ['acp']),
  fx: script('curl -fsSL https://fx.sh/setup.sh | bash', 'fx', ['acp']),
  'cortex-code': script('curl -fsSL https://ai.snowflake.com/static/cc-scripts/install.sh | NON_INTERACTIVE=1 SKIP_PATH_PROMPT=1 sh', 'cortex', ['acp', 'serve']),
  // 下载到临时文件后执行，让官方安装器的登录向导仍能读取网页终端的输入。
  devin: script('task_devin_installer=$(mktemp) && trap \'rm -f "$task_devin_installer"\' EXIT && curl -fsSL https://cli.devin.ai/install.sh -o "$task_devin_installer" && bash "$task_devin_installer"', 'devin', ['acp'], undefined, ['curl', 'mktemp', 'tar', 'gzip']),
  openhands: uv('openhands', 'openhands', ['acp'], '3.12'),
  'open-interpreter': script('curl -fsSL https://www.openinterpreter.com/install | OPEN_INTERPRETER_NONINTERACTIVE=1 sh', 'interpreter', ['acp']),
  gptme: {
    ...script('uv tool install --upgrade gptme-acp --with-executables-from gptme', 'gptme-acp', [], undefined, ['uv']),
    requires: ['gptme'],
  },
  harn: script('curl -fsSL https://harnlang.com/install.sh | HARN_INSTALL_DIR="$HOME/.local/bin" sh', 'harn', ['serve', 'acp']),
  kimchi: script('curl -fsSL https://github.com/getkimchi/kimchi/releases/latest/download/install.sh | bash', 'kimchi', ['--mode', 'acp']),
  // 官方安装器在 /dev/tty 询问许可，用户可以在安装终端里回答；不自动接受。
  poolside: script('curl -fsSL https://downloads.poolside.ai/pool/install.sh | POOL_INSTALL_UPDATE_PATH=0 sh', 'pool', ['acp']),
  'crow-cli': uv('crow-cli', 'crow-cli', ['acp'], '3.14'),
  'fast-agent': {
    ...script('uv tool install --upgrade fast-agent-acp --with-executables-from fast-agent-mcp', 'fast-agent-acp', ['-x'], undefined, ['uv']),
    requires: ['fast-agent'],
  },
  'minion-code': uv('minion-code', 'minion-code', ['acp']),
  stakpak: script('curl -fsSL https://stakpak.dev/install.sh | STAKPAK_NON_INTERACTIVE=1 sh', 'stakpak', ['acp']),
  vtcode: { ...script('curl -fsSL https://raw.githubusercontent.com/vinhnx/VTCode/main/scripts/install.sh | bash', 'vtcode', ['acp']), env: { VT_ACP_ENABLED: '1', VT_ACP_ZED_ENABLED: '1' } },
};
