import type { TimelineItem } from '../shared/types';

function fence(text: string, language = ''): string {
  const longest = Math.max(2, ...Array.from(text.matchAll(/`+/g), (match) => match[0].length));
  const delimiter = '`'.repeat(longest + 1);
  return `${delimiter}${language}\n${text}\n${delimiter}`;
}

export function timelineText(item: TimelineItem): string {
  switch (item.kind) {
    case 'user': case 'agent': case 'thought': return item.text;
    case 'notice': return [item.text, item.detail].filter(Boolean).join('\n');
    case 'tool': return [item.title, item.command, ...item.content.flatMap((content) => content.type === 'text' ? [content.text] : content.type === 'diff' ? [content.path, content.oldText, content.newText] : [])].filter(Boolean).join('\n');
    case 'plan': return item.entries.map((entry) => entry.content).join('\n');
    default: return '';
  }
}

/** 导出完整记录；不删除历史，也不调用 Agent 或外部模型。 */
export function exportSessionMarkdown(record: { title: string; agentName: string; cwd: string; createdAt: number; timeline: TimelineItem[] }): string {
  const lines = [`# ${record.title.replace(/[\r\n]/g, ' ')}`, '', `Agent：${record.agentName}`, `工作区：${record.cwd}`, `创建时间：${new Date(record.createdAt).toISOString()}`, ''];
  for (const item of record.timeline) {
    const time = new Date(item.at).toISOString();
    switch (item.kind) {
      case 'user': case 'agent': case 'thought':
        lines.push(`## ${item.kind === 'user' ? '我' : item.kind === 'thought' ? `${record.agentName} · 思考` : record.agentName} · ${time}`, '', item.text, '');
        if ((item.kind === 'user' || item.kind === 'agent') && item.images?.length) lines.push(...item.images.map((image) => `图片附件：${image.name}`), '');
        break;
      case 'tool':
        lines.push(`### ${item.title.replace(/[\r\n]/g, ' ')} · ${time}`, '', `状态：${item.status}`, '');
        if (item.approval) lines.push(`审批：${item.approval.state}`, '');
        if (item.command) lines.push(fence(item.command, 'sh'), '');
        for (const content of item.content) {
          if (content.type === 'text') lines.push(fence(content.text), '');
          else if (content.type === 'diff') lines.push(`文件：${content.path}`, '', '**修改前**', '', fence(content.oldText ?? ''), '', '**修改后**', '', fence(content.newText), '');
          else if (content.type === 'image') lines.push(`图片：${content.image.name}`, '');
        }
        break;
      case 'plan': lines.push('### 计划', '', ...item.entries.map((entry) => `- [${entry.status === 'completed' ? 'x' : ' '}] ${entry.content}`), ''); break;
      case 'notice': lines.push(`> ${item.text.replace(/\n/g, '\n> ')}`, '', ...(item.detail ? [fence(item.detail), ''] : [])); break;
      case 'turn': lines.push(`---\n\n本轮结束：${item.stopReason} · 用时 ${Math.round(item.durationMs / 1000)} 秒`, ''); break;
    }
  }
  lines.push('> 图片附件仅保留名称；图片文件请在网页中单独下载。', '');
  return lines.join('\n');
}
