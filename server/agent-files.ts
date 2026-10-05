// 读 Agent 自己的配置文件：在哪、有没有、当前用哪个模型。只读，从不修改。
// 位置参考 Magpie 整理的对照表；没核实过位置的 Agent（比如 CodeBuddy）先不列，免得显示错的。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface AgentFiles {
  path: string;
  exists: boolean;
  /** 配置里写的模型；没写就是用 Agent 自己的默认 */
  model?: string;
}

type Reader = (text: string) => string | undefined;

const home = () => os.homedir();

const SPECS: Record<string, { file: () => string; read: Reader }> = {
  codex: { file: () => path.join(process.env.CODEX_HOME || path.join(home(), '.codex'), 'config.toml'), read: tomlTopLevel('model') },
  claude: { file: () => path.join(home(), '.claude', 'settings.json'), read: jsonModel },
  gemini: { file: () => path.join(home(), '.gemini', 'settings.json'), read: jsonModel },
  pi: { file: () => path.join(home(), '.pi', 'agent', 'settings.json'), read: piModel },
  hermes: { file: () => path.join(process.env.HERMES_HOME || path.join(home(), '.hermes'), 'config.yaml'), read: yamlModel },
};

export function readAgentFiles(agentId: string): AgentFiles | null {
  const spec = SPECS[agentId];
  if (!spec) return null;
  const file = spec.file();
  const out: AgentFiles = { path: file, exists: false };
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) return out;
    out.exists = true;
    if (stat.size > 1024 * 1024) return out;
    out.model = spec.read(fs.readFileSync(file, 'utf8'))?.trim() || undefined;
  } catch {
    // 没有这个文件，或者读不了
  }
  return out;
}

/** TOML 顶层的一个字符串键（第一个 [段落] 之前的） */
function tomlTopLevel(key: string): Reader {
  return (text) => {
    for (const line of text.split('\n')) {
      if (/^\s*\[/.test(line)) return undefined;
      const m = line.match(new RegExp(`^\\s*${key}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`));
      if (m) return m[1] ?? m[2];
    }
    return undefined;
  };
}

function parseJson(text: string): Record<string, unknown> | undefined {
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

/** "model": "名字"，或者 "model": { "name": "名字" } */
function jsonModel(text: string): string | undefined {
  const model = parseJson(text)?.model;
  if (typeof model === 'string') return model;
  if (model && typeof model === 'object' && typeof (model as { name?: unknown }).name === 'string') {
    return (model as { name: string }).name;
  }
  return undefined;
}

/** Pi：model，或者 defaultProvider/defaultModel */
function piModel(text: string): string | undefined {
  const json = parseJson(text);
  if (!json) return undefined;
  if (typeof json.model === 'string') return json.model;
  if (typeof json.defaultModel === 'string') {
    return typeof json.defaultProvider === 'string' ? `${json.defaultProvider}/${json.defaultModel}` : json.defaultModel;
  }
  return undefined;
}

/** YAML 顶层的 model: 值；也认 model: 下一层的 default / name / model */
function yamlModel(text: string): string | undefined {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^model:\s*(.*)$/);
    if (!m) continue;
    const value = unquote(m[1]);
    if (value) return value;
    for (let j = i + 1; j < lines.length && /^\s+\S/.test(lines[j]); j++) {
      const inner = lines[j].match(/^\s+(?:default|name|model):\s*(.+)$/);
      if (inner) return unquote(inner[1]);
    }
    return undefined;
  }
  return undefined;
}

function unquote(value: string): string {
  return value.replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*)\1$/, '$2');
}
