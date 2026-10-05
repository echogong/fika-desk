import { tx, useLocale } from '../i18n';
// 文件改动的红绿对比。只显示改动附近 3 行，超过 60 行时先折叠。左边是改完以后的行号（删掉的行不编号），代码有几种低饱和的语法色。
import { structuredPatch } from 'diff';
import { memo, useMemo, useState, type ReactNode } from 'react';
import { relPath } from '../format';
import { Chevron, Pencil } from './Icons';

interface Line {
  kind: ' ' | '+' | '-' | '@';
  text: string;
  no?: number;
}

/** 很轻的语法着色：关键字、字符串、注释、数字，够扫一眼就行 */
const TOKEN = /(\/\/.*$|\/\*.*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|if|else|import|from|export|default|async|await|new|class|extends|for|while|of|in|try|catch|throw|typeof|interface|type|def|self|None|True|False)\b|\b(true|false|null|undefined|\d+(?:\.\d+)?)\b/g;

function paint(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const cls = m[1] ? 'tk-c' : m[2] ? 'tk-s' : m[3] ? 'tk-k' : 'tk-n';
    out.push(
      <span key={at} className={cls}>
        {m[0]}
      </span>,
    );
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const DiffView = memo(function DiffView({
  path,
  oldText,
  newText,
  cwd,
  aside,
  defaultOpen,
}: {
  path: string;
  oldText: string | null;
  newText: string;
  cwd: string;
  /** 标题行右边放的东西（审批标记） */
  aside?: ReactNode;
  /** 一开始展开：等你批准的改动展开，做完的改动收成一行，点一下再看 */
  defaultOpen?: boolean;
}) {
  useLocale();
  const [open, setOpen] = useState(defaultOpen ?? true);
  const [expanded, setExpanded] = useState(false);
  const { lines, added, removed } = useMemo(() => {
    const patch = structuredPatch(path, path, oldText ?? '', newText, '', '', { context: 3 });
    const out: Line[] = [];
    let a = 0;
    let r = 0;
    patch.hunks.forEach((hunk, index) => {
      if (index > 0) out.push({ kind: '@', text: '…' });
      let newNo = hunk.newStart;
      for (const line of hunk.lines) {
        const kind = line[0] as Line['kind'];
        if (kind === '+') {
          a++;
          out.push({ kind, text: line.slice(1), no: newNo++ });
        } else if (kind === '-') {
          r++;
          out.push({ kind, text: line.slice(1) });
        } else if (kind === ' ') {
          out.push({ kind, text: line.slice(1), no: newNo++ });
        }
      }
    });
    return { lines: out, added: a, removed: r };
  }, [path, oldText, newText]);

  const isNew = oldText === null || oldText === '';
  const limit = 60;
  const shown = expanded ? lines : lines.slice(0, limit);

  return (
    <figure className={`diff${open ? '' : ' is-closed'}`}>
      <figcaption>
        <button className="diff-tog" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Pencil />
          {isNew ? tx("新建") : tx("修改")} <code>{relPath(path, cwd)}</code>
          {added > 0 && <span className="n-add">+{added}</span>}
          {removed > 0 && <span className="n-del">−{removed}</span>}
          <Chevron size={13} />
        </button>
        {aside && <span className="aside">{aside}</span>}
      </figcaption>
      {open && (
      <div className="diff-body">
        {shown.map((line, i) => (
          <div key={i} className={`dl ${line.kind === '+' ? 'add' : line.kind === '-' ? 'del' : line.kind === '@' ? 'gap' : ''}`}>
            <span className="dn">{line.no ?? ''}</span>
            <span className="dk">{line.kind === '+' ? '+' : line.kind === '-' ? '−' : ''}</span>
            <span>{line.kind === '@' ? line.text : line.text ? paint(line.text) : ' '}</span>
          </div>
        ))}
      </div>
      )}
      {open && lines.length > limit && (
        <button className="diff-more" type="button" onClick={() => setExpanded(!expanded)}>
          {expanded ? tx("收起") : tx("还有 {0} 行，展开", [lines.length - limit])}
        </button>
      )}
    </figure>
  );
});
