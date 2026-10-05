import type { AgentQuota, TimelineItem } from './types';

const count = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** PromptResponse.usage 是每轮消耗；Context usage_update 是当前上下文，两者不可相加。 */
export function sessionTokenUsage(timeline: readonly TimelineItem[]) {
  let total = 0, reported = 0, turns = 0, estimated = false;
  const seen = new Set<string>();
  for (const item of timeline) {
    if (item.kind !== 'turn' || seen.has(item.id)) continue;
    seen.add(item.id);
    turns++;
    const usage = item.usage;
    if (!usage) continue;
    if (count(usage.totalTokens)) {
      total += usage.totalTokens;
      reported++;
    } else if (count(usage.inputTokens) && count(usage.outputTokens)) {
      // 老适配器只有分项：记录其已知输入、输出和缓存读量，不能称为完整账单。
      total += usage.inputTokens + usage.outputTokens + (count(usage.cachedTokens) ? usage.cachedTokens : 0);
      reported++;
      estimated = true;
    }
  }
  return { total: reported ? Math.floor(total) : null, partial: estimated || reported < turns, reported, turns };
}

/** 多个订阅窗口取消耗最高的一个；详细面板展示全部窗口。 */
export function subscriptionUsage(quota: AgentQuota | undefined) {
  if (quota?.kind !== 'subscription') return null;
  const windows = quota.windows.filter(window => count(window.usedPercent));
  if (!windows.length) return null;
  return Math.min(100, Math.round(Math.max(...windows.map(window => window.usedPercent))));
}
