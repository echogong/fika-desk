import { appEnv, defaultDataDir } from './brand-compat';
import path from 'node:path';
import { createHash } from 'node:crypto';

export interface RunnerConfig {
  dataDir: string;
  port: number;
  publicUrl: string | null;
  demo: boolean;
  workspaces: string[];
  defaultWorkspace?: string;
  workspaceRoot: string;
  release: string;
  hash: string;
  env: NodeJS.ProcessEnv;
}

export function readConfig(root: string, args = process.argv.slice(2)): Omit<RunnerConfig, 'release' | 'hash' | 'env'> {
  const value = (name: string) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
  const port = Number(value('--port') ?? process.env.PORT ?? 4747);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('监听端口不正确');
  const address = value('--public-url') ?? appEnv('PUBLIC_URL');
  const url = address ? new URL(address) : null;
  if (url && !['https:', 'http:'].includes(url.protocol)) throw new Error('--public-url 不是有效的网址');
  return {
    dataDir: path.resolve(value('--data') ?? appEnv('DATA_DIR') ?? defaultDataDir()),
    port, publicUrl: url?.origin ?? null, demo: args.includes('--dev') || appEnv('DEMO') === '1',
    workspaces: args.flatMap((arg, i) => arg === '--workspace' && args[i + 1] ? [args[i + 1]] : []),
    defaultWorkspace: value('--default-workspace'), workspaceRoot: root,
  };
}

export function runnerPaths(dataDir: string) {
  const directory = path.join(dataDir, 'runtime');
  const socket = path.join(directory, 'runner.sock');
  if (Buffer.byteLength(socket) > 100) throw new Error('数据目录过长，无法创建后台通信 socket；请用 --data 指定较短路径');
  return { directory, socket, desired: path.join(directory, 'desired.json'), log: path.join(directory, 'runner.log'), lock: path.join(directory, 'supervisor.lock'), unit: `fika-desk-runner-${createHash('sha256').update(dataDir).digest('hex').slice(0, 12)}.service` };
}
