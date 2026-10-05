// 中文按词换行：用浏览器自带的分词（Intl.Segmenter）在词和词之间放 <wbr>，配合 CSS 的 word-break: keep-all，
// 换行只发生在词和词之间，不会把“没有”拆成“没 / 有”。不能放在行首的标点（，。）」等）前面、
// 不能放在行尾的标点（（「“ 等）后面都不断。浏览器不支持分词时原样返回，照常逐字换行。
import { Fragment, createElement, type ReactNode } from 'react';

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;
const NO_START = '，。、；：？！）」』”’》〉】…—·%,.;:?!)]}';
const NO_END = '（「『“‘《〈【([{';

const segmenter: Intl.Segmenter | null =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('zh', { granularity: 'word' }) : null;

/** 切成可以在之间换行的几段；没有汉字或者不支持分词时只有一段 */
export function breakable(text: string): string[] {
  if (!segmenter || !CJK.test(text)) return [text];
  // 数字和后面的单位（620 毫秒、4.1 秒）之间换成不换行的空格，不拆到两行
  text = text.replace(/(\d) (?=[\u3400-\u9fff])/g, '$1\u00a0');
  const out: string[] = [];
  let cur = '';
  let last = '';
  /** 一对短引号（“记住我”）里面不断：记下右引号在哪 */
  let quoteEnd = -1;
  for (const { segment, index } of segmenter.segment(text)) {
    const prev = cur[cur.length - 1];
    const next = segment[0];
    // 浏览器的词典不全，常把“表单”“调用”切成单字：连着的单字当成一个词，中间不断
    const singles = last.length === 1 && segment.length === 1 && HAN.test(last) && HAN.test(segment);
    last = segment;
    const canBreak =
      cur !== '' &&
      !singles &&
      index > quoteEnd &&
      (CJK.test(prev) || CJK.test(next)) &&
      !/\s/.test(prev) &&
      !/\s/.test(next) &&
      !NO_START.includes(next) &&
      !NO_END.includes(prev);
    if (canBreak) {
      out.push(cur);
      cur = segment;
    } else {
      cur += segment;
    }
    if (segment === '“' || segment === '「') {
      const close = text.indexOf(segment === '“' ? '”' : '」', index + 1);
      quoteEnd = close >= 0 && close - index <= 9 ? close : -1;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** 纯文字：词和词之间插 <wbr> */
export function wordWrap(text: string): ReactNode {
  const parts = breakable(text);
  if (parts.length < 2) return text;
  return parts.map((part, i) => createElement(Fragment, { key: i }, i > 0 && createElement('wbr'), part));
}

/** 一段 HTML（已经清理过的）：只动正文里的文字，代码、链接里的不动 */
export function wordWrapHtml(html: string): string {
  if (!segmenter || typeof document === 'undefined' || !CJK.test(html)) return html;
  const box = document.createElement('template');
  box.innerHTML = html;
  const walker = document.createTreeWalker(box.content, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!(n.parentElement?.closest('code, pre, kbd, a'))) nodes.push(n as Text);
  }
  for (const node of nodes) {
    const parts = breakable(node.data);
    if (parts.length < 2) continue;
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (i > 0) frag.append(document.createElement('wbr'));
      frag.append(part);
    });
    node.replaceWith(frag);
  }
  return box.innerHTML;
}
