import { tx } from './i18n';
// 和服务端的 WebSocket 连接：登录后才连；断线自动重连，重连后服务端会重新发一份完整状态。
// 连不上时先问一下登录状态：登录过期（或在别处退出了）就回到登录页，不再重连。
import type { ClientMsg, ServerMsg } from '../../shared/types';
import { applyAuth, fetchAuth } from './auth';
import { applyServerMessage, setState } from './store';

let socket: WebSocket | null = null;
let stopped = false;
let retryDelay = 500;
const outbox: string[] = [];

export function connect(): void {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  stopped = false;
  const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  const ws = new WebSocket(url);
  socket = ws;
  ws.onopen = () => {
    retryDelay = 500;
    setState({ connected: true });
    while (outbox.length) ws.send(outbox.shift()!);
  };
  ws.onmessage = (event) => {
    try {
      applyServerMessage(JSON.parse(String(event.data)) as ServerMsg);
    } catch (error) {
      console.error(tx("处理服务端消息出错"), error);
    }
  };
  ws.onclose = () => {
    if (socket !== ws) return;
    setState({ connected: false });
    if (stopped) return;
    const delay = retryDelay;
    retryDelay = Math.min(retryDelay * 2, 5000);
    window.setTimeout(async () => {
      if (socket !== ws || stopped) return;
      try {
        const auth = await fetchAuth();
        if (!auth.loggedIn) {
          socket = null;
          applyAuth(auth);
          return;
        }
      } catch {
        // 服务还没起来，接着重试
      }
      if (socket === ws && !stopped) {
        socket = null;
        connect();
      }
    }, delay);
  };
}

/** 退出登录时断开，不再重连 */
export function disconnect(): void {
  stopped = true;
  outbox.length = 0;
  const ws = socket;
  socket = null;
  ws?.close();
}

export function send(msg: ClientMsg): void {
  const nonce = () => crypto.randomUUID?.() ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) => n.toString(16).padStart(2, '0')).join('');
  const data = JSON.stringify(msg.type === 'session:prompt' && !msg.requestId ? { ...msg, requestId: nonce() } : msg);
  if (socket && socket.readyState === WebSocket.OPEN) socket.send(data);
  else outbox.push(data);
}
