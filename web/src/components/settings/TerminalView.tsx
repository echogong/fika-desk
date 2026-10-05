// 设置页里的终端：登录用的设置向导、安装和更新 Agent 都用它。xterm.js 显示服务器上命令的输出，键盘输入原样发回去。
// 单独一个文件、要用时才加载，平时打开页面不用下载终端的代码。
import '@xterm/xterm/css/xterm.css';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { useEffect, useRef } from 'react';
import { onLiveMessage } from '../../live';
import { send } from '../../ws';

export default function TerminalView({
  channel,
  agentId,
  onStart,
}: {
  /** login 设置向导 · install 安装、更新 */
  channel: 'login' | 'install';
  agentId: string;
  /** 终端准备好、知道了大小：让服务器开始运行命令，或者接上正在运行的 */
  onStart: (cols: number, rows: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const start = useRef(onStart);
  start.current = onStart;

  useEffect(() => {
    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, 'Noto Sans Mono CJK SC', monospace",
      fontSize: 13,
      lineHeight: 1.15,
      cursorBlink: true,
      scrollback: 5000,
      theme: { background: '#151a18', foreground: '#e4e9e5', cursor: '#e4e9e5', selectionBackground: '#3b4a43' },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(box.current!);
    fit.fit();
    // 安装、更新在服务器上跑，窗口可以关了再开：先等服务器把到现在为止的输出补上（replay），之后的接着写，不会重复
    let synced = channel !== 'install';
    const off = onLiveMessage((msg) => {
      if (msg.agentId !== agentId) return;
      if (channel === 'login' && msg.type === 'login:output') term.write(msg.data);
      if (channel === 'install' && msg.type === 'install:output') {
        if (msg.replay) {
          term.reset();
          term.write(msg.data);
          synced = true;
        } else if (synced) {
          term.write(msg.data);
        }
      }
    });
    const input = term.onData((data) =>
      send(channel === 'login' ? { type: 'login:input', agentId, data } : { type: 'install:input', agentId, data }),
    );
    const resize = term.onResize(({ cols, rows }) =>
      send(channel === 'login' ? { type: 'login:resize', agentId, cols, rows } : { type: 'install:resize', agentId, cols, rows }),
    );
    const observer = new ResizeObserver(() => {
      try {
        fit.fit();
      } catch {
        // 窗口正在关
      }
    });
    observer.observe(box.current!);
    start.current(term.cols, term.rows);
    term.focus();
    return () => {
      observer.disconnect();
      off();
      input.dispose();
      resize.dispose();
      term.dispose();
    };
  }, [channel, agentId]);

  return <div className="term-box" ref={box} />;
}
