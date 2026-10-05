import { appEnv } from './brand-compat';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { runnerPaths, type RunnerConfig } from './runtime-config';
import { runnerRequest } from './runner-control';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function atomicJson(file: string, value: unknown): void {
  const temporary = `${file}.${randomBytes(6).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value), { mode: 0o600 });
    fs.renameSync(temporary, file);
  } finally { fs.rmSync(temporary, { force: true }); }
}

export function livePid(pid: number): boolean {
  try { if (!Number.isInteger(pid) || pid <= 1) return false; process.kill(pid, 0); return true; } catch { return false; }
}

/** A PID lock prevents two supervisors from ever opening the same database/socket. */
export async function acquireLock(directory: string): Promise<() => void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      fs.mkdirSync(directory, { mode: 0o700 });
      atomicJson(path.join(directory, 'pid'), process.pid);
      return () => fs.rmSync(directory, { recursive: true, force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      try {
        const pid = Number(fs.readFileSync(path.join(directory, 'pid'), 'utf8'));
        if (!livePid(pid)) { fs.rmSync(directory, { recursive: true, force: true }); continue; }
      } catch {
        // Another process may still be writing its PID. Only age-expired locks can be removed.
        try { if (Date.now() - fs.statSync(directory).mtimeMs > 30_000) fs.rmSync(directory, { recursive: true, force: true }); } catch {}
      }
      await delay(200);
    }
  }
  throw new Error('后台目录正在使用，请稍后重试');
}

function sourceFiles(root: string): string[] {
  const list: string[] = ['package.json', 'package-lock.json', 'tsconfig.json'];
  for (const directory of ['server', 'shared']) {
    for (const item of fs.readdirSync(path.join(root, directory), { recursive: true, withFileTypes: true })) {
      if (!item.isFile() || !item.name.endsWith('.ts') || item.name.endsWith('.test.ts')) continue;
      list.push(path.relative(root, path.join(item.parentPath, item.name)));
    }
  }
  for (const item of fs.readdirSync(path.join(root, 'scripts'), { withFileTypes: true })) {
    if (item.isFile() && /\.(mjs|py|sh)$/.test(item.name) && !item.name.startsWith('test-')) list.push(path.join('scripts', item.name));
  }
  return list.sort();
}

/** Immutable source and dependencies remain available when deployments replace the web directory. */
export async function prepareRunner(root: string, config: Omit<RunnerConfig, 'release' | 'hash' | 'env'>): Promise<RunnerConfig> {
  const paths = runnerPaths(config.dataDir);
  fs.mkdirSync(paths.directory, { recursive: true, mode: 0o700 });
  const unlock = await acquireLock(path.join(paths.directory, 'prepare.lock'));
  try {
    const files = sourceFiles(root).map((file) => ({ file, data: fs.readFileSync(path.join(root, file)) }));
    const hash = createHash('sha256');
    for (const { file, data } of files) hash.update(file).update('\0').update(data);
    hash.update(JSON.stringify(config)).update(appEnv('COOKIE_NAME') ?? 'ma_session');
    const environment = Object.entries(process.env).filter(([name]) => /^(FIKA_DESK_|MULTIAGENT_|MOCK_|CODEX_|OPENAI_|ANTHROPIC_|GOOGLE_|GEMINI_|PI_|PATH$|HOME$|HTTPS?_PROXY$|NO_PROXY$)/.test(name)).sort(([a], [b]) => a.localeCompare(b));
    hash.update(JSON.stringify(environment));
    const revision = hash.digest('hex');
    const dependenciesHash = createHash('sha256').update(fs.readFileSync(path.join(root, 'package-lock.json'))).update(process.version).update(process.arch).update(process.platform).digest('hex');
    const dependencies = path.join(paths.directory, 'dependencies', dependenciesHash);
    if (!fs.existsSync(path.join(dependencies, '.complete'))) {
      const temporary = `${dependencies}.${process.pid}.tmp`;
      fs.rmSync(temporary, { recursive: true, force: true });
      fs.mkdirSync(temporary, { recursive: true, mode: 0o700 });
      try {
        fs.cpSync(path.join(root, 'node_modules'), path.join(temporary, 'node_modules'), { recursive: true, verbatimSymlinks: true, mode: fs.constants.COPYFILE_FICLONE });
        fs.writeFileSync(path.join(temporary, '.complete'), '', { mode: 0o600 });
        fs.mkdirSync(path.dirname(dependencies), { recursive: true, mode: 0o700 });
        fs.renameSync(temporary, dependencies);
      } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    }
    const release = path.join(paths.directory, 'releases', revision);
    if (!fs.existsSync(path.join(release, '.complete'))) {
      const temporary = `${release}.${process.pid}.tmp`;
      fs.rmSync(temporary, { recursive: true, force: true });
      fs.mkdirSync(temporary, { recursive: true, mode: 0o700 });
      try {
        for (const { file, data } of files) {
          const output = path.join(temporary, file);
          fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 });
          fs.writeFileSync(output, data, { mode: 0o600 });
        }
        fs.symlinkSync(path.join(dependencies, 'node_modules'), path.join(temporary, 'node_modules'));
        fs.writeFileSync(path.join(temporary, '.complete'), '', { mode: 0o600 });
        fs.renameSync(temporary, release);
      } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    }
    const desired: RunnerConfig = { ...config, hash: revision, release, env: { ...process.env } };
    atomicJson(paths.desired, desired);
    return desired;
  } finally { unlock(); }
}

export function systemdEnvironment(): NodeJS.ProcessEnv {
  const directory = process.env.XDG_RUNTIME_DIR ?? `/run/user/${process.getuid?.() ?? 1000}`;
  return { ...process.env, XDG_RUNTIME_DIR: directory, DBUS_SESSION_BUS_ADDRESS: process.env.DBUS_SESSION_BUS_ADDRESS ?? `unix:path=${directory}/bus` };
}

export async function ensureRunner(config: RunnerConfig): Promise<void> {
  try {
    const status = await runnerRequest(config.dataDir);
    if (status.protocol !== 1) throw new Error('后台协议版本不兼容');
    return;
  } catch (error) { if (error instanceof Error && error.message === '后台协议版本不兼容') throw error; }
  const paths = runnerPaths(config.dataDir);
  const unlock = await acquireLock(path.join(paths.directory, 'start.lock'));
  try {
    try { await runnerRequest(config.dataDir); return; } catch {}
    const cli = path.join(config.release, 'node_modules', 'tsx', 'dist', 'cli.mjs');
    const command = [process.execPath, cli, path.join(config.release, 'server', 'runner-supervisor.ts'), '--data', config.dataDir];
    const detached = appEnv('RUNNER_MODE') === 'detached';
    const available = !detached && spawnSync('systemctl', ['--user', 'show-environment'], { env: systemdEnvironment(), stdio: 'ignore' }).status === 0;
    if (available) {
      const result = spawnSync('systemd-run', ['--user', '--quiet', '--collect', `--unit=${paths.unit}`, '--service-type=exec', '--property=Restart=on-failure', '--property=RestartSec=3', '--property=TimeoutStopSec=15', '--property=UMask=0077', `--working-directory=${config.release}`, ...command], { env: systemdEnvironment(), encoding: 'utf8' });
      // An existing supervisor can still be recovering its child. Let readiness decide.
      if (result.status !== 0 && spawnSync('systemctl', ['--user', 'is-active', '--quiet', paths.unit], { env: systemdEnvironment() }).status !== 0) throw new Error(`独立后台启动失败：${result.stderr.trim()}`);
    } else {
      const cgroup = fs.existsSync('/proc/self/cgroup') ? fs.readFileSync('/proc/self/cgroup', 'utf8') : '';
      if (!detached && /\.service(?:\/|\n|$)/.test(cgroup)) throw new Error('当前服务需要可用的 systemd 用户服务来保护 Agent 任务');
      const log = fs.openSync(paths.log, 'a', 0o600);
      try {
        const child = spawn(command[0], command.slice(1), { cwd: config.release, env: config.env, detached: true, stdio: ['ignore', log, log] });
        child.on('error', (error) => console.error('后台启动失败：', error.message));
        child.unref();
      } finally { fs.closeSync(log); }
    }
    for (let attempt = 0; attempt < 120; attempt++) {
      await delay(250);
      try { const status = await runnerRequest(config.dataDir); if (status.protocol === 1) return; } catch {}
    }
    throw new Error(`后台启动超时，请检查 ${paths.log}`);
  } finally { unlock(); }
}
