// ACP 用的 JSON-RPC 2.0：每条消息一行 JSON，走 Agent 子进程的标准输入输出。
// 没用官方 SDK 的连接层，是为了对各家 Agent 不太规范的消息更宽容，也方便记录协议日志。
import type { Readable, Writable } from 'node:stream';

export type RpcId = number | string;

export class RpcError extends Error {
  constructor(
    message: string,
    public code: number,
    public data?: unknown,
  ) {
    super(message);
  }
}

export interface RpcHandlers {
  onRequest(method: string, params: any): Promise<unknown>;
  onNotification(method: string, params: any): void;
}

interface Pending {
  method: string;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timer?: NodeJS.Timeout;
}

export class JsonRpcConnection {
  private nextId = 1;
  private pending = new Map<RpcId, Pending>();
  private buffer = '';
  private closed = false;

  constructor(
    input: Readable,
    private output: Writable,
    private handlers: RpcHandlers,
    private log: (direction: 'in' | 'out', message: unknown) => void = () => {},
  ) {
    input.setEncoding('utf8');
    input.on('data', (chunk: string) => this.onData(chunk));
    input.on('end', () => this.close(new Error('Agent 关闭了输出')));
    input.on('error', (error) => this.close(error));
    output.on('error', (error) => this.close(error));
  }

  get isClosed(): boolean {
    return this.closed;
  }

  request<T = any>(method: string, params: unknown, timeoutMs?: number): Promise<T> {
    if (this.closed) return Promise.reject(new Error('和 Agent 的连接已经断开'));
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      const entry: Pending = { method, resolve, reject };
      if (timeoutMs) {
        entry.timer = setTimeout(() => {
          this.pending.delete(id);
          reject(new Error(`${method} 等了 ${Math.round(timeoutMs / 1000)} 秒没有回应`));
        }, timeoutMs);
      }
      this.pending.set(id, entry);
      this.send({ jsonrpc: '2.0', id, method, params });
    });
  }

  notify(method: string, params: unknown): void {
    if (!this.closed) this.send({ jsonrpc: '2.0', method, params });
  }

  close(reason: Error): void {
    if (this.closed) return;
    this.closed = true;
    for (const entry of this.pending.values()) {
      if (entry.timer) clearTimeout(entry.timer);
      entry.reject(reason);
    }
    this.pending.clear();
  }

  private onData(chunk: string): void {
    this.buffer += chunk;
    let newline: number;
    while ((newline = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, newline).trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (!line) continue;
      let message: any;
      try {
        message = JSON.parse(line);
      } catch {
        // 有的 Agent 会把日志打到标准输出上，跳过这些不是 JSON 的行
        this.log('in', { nonJson: line.slice(0, 500) });
        continue;
      }
      this.log('in', message);
      this.dispatch(message);
    }
  }

  private dispatch(message: any): void {
    if (!message || typeof message !== 'object') return;
    if (typeof message.method === 'string') {
      const hasId = message.id !== undefined && message.id !== null;
      if (hasId) {
        const id = message.id as RpcId;
        this.handlers.onRequest(message.method, message.params).then(
          (result) => this.send({ jsonrpc: '2.0', id, result: result ?? null }),
          (error) => this.send({ jsonrpc: '2.0', id, error: toRpcError(error) }),
        );
      } else {
        try {
          this.handlers.onNotification(message.method, message.params);
        } catch (error) {
          this.log('in', { handlerError: String(error) });
        }
      }
      return;
    }
    if (message.id !== undefined) {
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      if (entry.timer) clearTimeout(entry.timer);
      if (message.error) {
        const e = message.error;
        entry.reject(new RpcError(String(e.message ?? '未知错误'), Number(e.code ?? -32603), e.data));
      } else {
        entry.resolve(message.result);
      }
    }
  }

  private send(message: unknown): void {
    if (this.closed) return;
    this.log('out', message);
    try {
      this.output.write(JSON.stringify(message) + '\n');
    } catch (error) {
      this.close(error as Error);
    }
  }
}

function toRpcError(error: unknown): { code: number; message: string; data?: unknown } {
  if (error instanceof RpcError) return { code: error.code, message: error.message, data: error.data };
  return { code: -32603, message: error instanceof Error ? error.message : String(error) };
}
