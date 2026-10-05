import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import markdown from 'highlight.js/lib/languages/markdown';

for (const [name, definition] of Object.entries({ javascript, typescript, json, bash, python, css, xml, yaml, sql, go, rust, markdown })) hljs.registerLanguage(name, definition);
const aliases: Record<string, string> = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', mjs: 'javascript', cjs: 'javascript', py: 'python', sh: 'bash', shell: 'bash', html: 'xml', svg: 'xml', yml: 'yaml', md: 'markdown', rs: 'rust' };
export function fileLanguage(file: string): string { return file.split('.').at(-1)?.toLowerCase() ?? ''; }
export function escapeCode(text: string): string { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

/** Explicit languages and a size cap keep streamed or large responses responsive. */
export function highlightCode(text: string, language = ''): string {
  const normalized = aliases[language.toLowerCase()] ?? language.toLowerCase();
  if (text.length > 100_000 || !hljs.getLanguage(normalized)) return escapeCode(text);
  try { return hljs.highlight(text, { language: normalized, ignoreIllegals: true }).value; }
  catch { return escapeCode(text); }
}

/** Balance spans per line so multiline comments retain their color and line numbers. */
export function highlightLines(text: string, language: string): string[] {
  const result: string[] = [];
  const stack: string[] = [];
  let line = '';
  for (const token of highlightCode(text, language).match(/<\/?span\b[^>]*>|\n|[^<\n]+|</g) ?? []) {
    if (token === '\n') { result.push(line + '</span>'.repeat(stack.length)); line = stack.join(''); }
    else {
      if (token.startsWith('<span')) stack.push(token);
      else if (token === '</span>') stack.pop();
      line += token;
    }
  }
  result.push(line + '</span>'.repeat(stack.length));
  return result;
}
