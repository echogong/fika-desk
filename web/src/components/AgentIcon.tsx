import codex from '../assets/agents/codex.svg';
import pi from '../assets/agents/pi.svg';
import hermes from '../assets/agents/hermes.svg';
import codebuddy from '../assets/agents/codebuddy.svg';

// 本地透明 SVG；第三方图标的许可证见 assets/agents/catalog/THIRD_PARTY_LICENSES.txt。
const catalog = import.meta.glob<string>('../assets/agents/catalog/*.svg', { eager: true, query: '?url&no-inline', import: 'default' });
const marks: Partial<Record<string, string>> = {
  ...Object.fromEntries(Object.entries(catalog).map(([path, url]) => [path.split('/').at(-1)!.replace('.svg', ''), url])),
  codex, pi, hermes, codebuddy,
};
marks['qoder-cn'] = marks.qoder;

export function AgentIcon({ id, name }: { id: string; name: string }) {
  const src = marks[id];
  return (
    <span className="agent-icon" data-agent={id} aria-hidden="true">
      {src
        ? <img src={src} alt="" draggable={false} />
        : <span className="agent-icon-monogram">{Array.from(name)[0]?.toUpperCase() ?? 'A'}</span>}
    </span>
  );
}
