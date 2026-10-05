import http from 'node:http';
import { runnerPaths } from './runtime-config';

export interface RunnerStatus { pid: number; hash: string; busy: boolean; draining: boolean; protocol: number }

/** Operator-only endpoints live on a mode-600 Unix socket, never the public HTTP proxy. */
export function runnerRequest<T = RunnerStatus>(dataDir: string, route = 'status', method = 'GET'): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = http.request({ socketPath: runnerPaths(dataDir).socket, path: `/__runner/${route}`, method }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (data: Buffer) => chunks.push(data));
      response.on('end', () => {
        try {
          if (response.statusCode !== 200) throw new Error(`后台请求失败：${response.statusCode}`);
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as T);
        } catch (error) { reject(error); }
      });
      response.on('error', reject);
    });
    request.setTimeout(2000, () => request.destroy(new Error('后台请求超时')));
    request.on('error', reject);
    request.end();
  });
}
