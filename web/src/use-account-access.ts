import { useEffect, useState } from 'react';
import type { AgentInfo, AgentSettingsView } from '../../shared/types';
import { api } from './api';
import { useStore } from './store';

// 多窗口共用一次只读设置请求；Agent 设置变化时服务端会发布新的 agents 数组。
const reads = new WeakMap<AgentInfo[], Promise<AgentSettingsView[]>>();
export function useAccountAccess(agentId: string) {
  const agents = useStore(state => state.agents);
  const connected = useStore(state => state.connected);
  const [loaded, setLoaded] = useState<{ agents: AgentInfo[]; connected: boolean; rows: AgentSettingsView[] } | null>(null);
  useEffect(() => {
    if (!connected || !agents.length) return;
    let active = true;
    let read = reads.get(agents);
    if (!read) {
      read = api<AgentSettingsView[]>('/api/settings/agents').then(rows => Array.isArray(rows) ? rows : []);
      reads.set(agents, read);
    }
    read.then(rows => { if (active) setLoaded({ agents, connected, rows }); }).catch(() => { reads.delete(agents); });
    return () => { active = false; };
  }, [agents, connected]);
  const row = loaded?.agents === agents && loaded.connected === connected ? loaded.rows.find(row => row.id === agentId) : undefined;
  return row?.provider?.billing;
}
