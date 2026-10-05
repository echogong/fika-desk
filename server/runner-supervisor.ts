import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { acquireLock, atomicJson } from './runner-runtime';
import { runnerPaths, type RunnerConfig } from './runtime-config';
import { runnerRequest } from './runner-control';

const dataDir = process.argv[process.argv.indexOf('--data') + 1];
if (!dataDir) throw new Error('缺少 --data');
const paths = runnerPaths(dataDir);
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
let child: ChildProcess | undefined;
let stopping = false;
let active: RunnerConfig | undefined;

async function stopChild(): Promise<void> {
  const current = child;
  if (!current || current.exitCode !== null || current.signalCode !== null) return;
  current.kill('SIGTERM');
  for (let i = 0; i < 100 && current.exitCode === null && current.signalCode === null; i++) await delay(50);
  if (current.exitCode === null && current.signalCode === null) current.kill('SIGKILL');
  // Unexpected backend exits are reported in the next restored receipt, never retried as prompts.
}

function launch(config: RunnerConfig): void {
  atomicJson(path.join(paths.directory, 'active.json'), config);
  const log = fs.openSync(paths.log, 'a', 0o600);
  try {
    child = spawn(process.execPath, ['--import', path.join(config.release, 'node_modules', 'tsx', 'dist', 'loader.mjs'), path.join(config.release, 'server', 'runner.ts'), path.join(paths.directory, 'active.json')], {
      cwd: config.release, env: { ...config.env, FIKA_DESK_RUNNER_DATA_DIR: config.dataDir }, stdio: ['ignore', log, log],
    });
    child.on('error', (error) => console.error('Agent 后台启动失败：', error.message));
    active = config;
  } finally { fs.closeSync(log); }
}

async function main(): Promise<void> {
  const unlock = await acquireLock(paths.lock);
  const shutdown = () => { stopping = true; };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  let idleSince = 0;
  let failureDelay = 1000;
  let launchedAt = 0;
  try {
    // A detached supervisor crash can leave its child behind; stop that orphan before opening SQLite.
    try {
      const orphan = await runnerRequest(dataDir);
      process.kill(orphan.pid, 'SIGTERM');
      for (let i = 0; i < 80; i++) {
        await delay(50);
        try { await runnerRequest(dataDir); } catch { break; }
      }
    } catch {}
    while (!stopping) {
      const desired = JSON.parse(fs.readFileSync(paths.desired, 'utf8')) as RunnerConfig;
      if (!child || child.exitCode !== null || child.signalCode !== null) {
        // Reap surviving ACP process groups before restarting a crashed backend.
        cleanupAgents();
        if (child) { await delay(failureDelay); failureDelay = Math.min(30_000, failureDelay * 2); }
        if (stopping) break;
        launch(desired); launchedAt = Date.now(); idleSince = 0;
      } else {
        try {
          const status = await runnerRequest(dataDir);
          if (Date.now() - launchedAt > 30_000) failureDelay = 1000;
          const pending = desired.hash !== active?.hash;
          atomicJson(path.join(paths.directory, 'status.json'), { ...status, supervisorPid: process.pid, desiredHash: desired.hash, updatePending: pending });
          if (pending && !status.busy) {
            idleSince ||= Date.now();
            if (Date.now() - idleSince >= 5000) {
              const drained = await runnerRequest(dataDir, 'drain', 'POST');
              if (drained.draining && !drained.busy) { await stopChild(); child = undefined; }
              idleSince = 0;
            }
          } else idleSince = 0;
        } catch { idleSince = 0; }
      }
      await delay(1000);
    }
  } finally {
    await stopChild(); cleanupAgents(); unlock();
    fs.rmSync(paths.socket, { force: true });
  }
}

/** ACP adapters are detached process groups; the backend registers them before execution. */
function cleanupAgents(): void {
  const file = path.join(paths.directory, 'agent-processes.json');
  try {
    const records = JSON.parse(fs.readFileSync(file, 'utf8')) as { pid: number; started: string }[];
    for (const record of records) {
      try {
        const stat = fs.readFileSync(`/proc/${record.pid}/stat`, 'utf8');
        const started = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19];
        if (started === record.started) process.kill(-record.pid, 'SIGKILL');
      } catch {}
    }
    fs.rmSync(file, { force: true });
  } catch {}
}

void main().catch((error) => { console.error(error); process.exit(1); });
