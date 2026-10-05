import { appEnv } from './brand-compat';
import fs from 'node:fs';
import path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import { atomicJson } from './runner-runtime';

/** Linux start time protects against accidentally signalling a reused process ID. */
export function trackAgent(proc: ChildProcess): void {
  const directory = appEnv('RUNNER_DATA_DIR');
  if (!directory || !proc.pid || process.platform !== 'linux') return;
  const file = path.join(directory, 'runtime', 'agent-processes.json');
  try {
    const stat = fs.readFileSync(`/proc/${proc.pid}/stat`, 'utf8');
    const started = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19];
    let records: { pid: number; started: string }[] = [];
    try { records = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
    records = records.filter((record) => fs.existsSync(`/proc/${record.pid}`));
    records.push({ pid: proc.pid, started });
    atomicJson(file, records);
  } catch (error) {
    proc.kill('SIGTERM');
    throw new Error('无法保存 Agent 进程信息，暂不启动任务', { cause: error });
  }
}
