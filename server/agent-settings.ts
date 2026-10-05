// 每个 Agent 的设置：启用、模型供应商，以及最近一次测试连接的结果。
// 都存在我们自己的数据库里（文件权限 600），不改 Agent 自己的配置文件。
import type { DatabaseSync, StatementSync } from 'node:sqlite';
import { checkProvider, normalizeProvider, type StoredProvider } from './model-provider';
import type { ProbeResult } from '../shared/types';

export interface AgentSettings {
  enabled: boolean;
  /** 兼容已有的启动配置（代理、可执行文件路径等），不再通过设置页或 API 编辑 */
  env: Record<string, string>;
  /** 第三方 API / Coding Plan 配置；null = 使用 Agent 自己的配置与订阅账号 */
  provider: StoredProvider | null;
}

export interface AgentSettingsPatch {
  enabled?: boolean;
  /** 同一地址、协议、套餐和预设可留空复用 Key；null = 改回 Agent 自己的配置。 */
  provider?: { preset?: unknown; baseUrl?: unknown; model?: unknown; apiKey?: unknown;
    api?: unknown; billing?: unknown; contextWindow?: unknown } | null;
}

export class AgentSettingsStore {
  private stmt: Record<'get' | 'set' | 'delete', StatementSync>;

  constructor(db: DatabaseSync) {
    this.stmt = {
      get: db.prepare(`SELECT value FROM settings WHERE key = ?`),
      set: db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`),
      delete: db.prepare('DELETE FROM settings WHERE key = ?'),
    };
  }

  get(agentId: string): AgentSettings {
    const saved = this.read<Partial<AgentSettings>>(`agent.${agentId}`) ?? {};
    return {
      enabled: saved.enabled !== false,
      env: saved.env && typeof saved.env === 'object' ? { ...saved.env } : {},
      provider: normalizeProvider(saved.provider),
    };
  }

  /** 改设置；格式不对的抛出错误（界面上显示） */
  update(agentId: string, patch: AgentSettingsPatch): AgentSettings {
    const next = this.get(agentId);
    if (patch.enabled !== undefined) next.enabled = Boolean(patch.enabled);
    if (patch.provider !== undefined) {
      next.provider = patch.provider ? checkProvider(patch.provider, next.provider ?? undefined, undefined, agentId) : null;
    }
    this.stmt.set.run(`agent.${agentId}`, JSON.stringify(next));
    if (patch.provider !== undefined) this.stmt.delete.run(`probe.${agentId}`);
    return next;
  }

  getProbe(agentId: string): ProbeResult | undefined {
    return this.read<ProbeResult>(`probe.${agentId}`) ?? undefined;
  }

  setProbe(agentId: string, probe: ProbeResult): void {
    this.stmt.set.run(`probe.${agentId}`, JSON.stringify(probe));
  }

  private read<T>(key: string): T | null {
    const row = this.stmt.get.get(key) as { value: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return null;
    }
  }
}
