import { tx, useLocale } from '../../i18n';
// 安装、更新 Agent 的窗口（设置 → Agent）：先给你看要在服务器上运行的命令，点了才运行。
// 运行时在终端里显示输出，要回答问题可以直接打字。关掉窗口不会停：在后台接着做，做完会提示；再打开能接着看。
// 做完后服务器重新检测、测一次连接，这里告诉你能不能用了。
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { AgentSettingsView, ProbeResult } from '../../../../shared/types';
import { onLiveMessage, watchInstall } from '../../live';
import { showToast, useStore } from '../../store';
import { send } from '../../ws';
import { Close } from '../Icons';

const TerminalView = lazy(() => import('./TerminalView'));

/** 测试连接卡在哪一步、为什么 */
function failedStep(probe: ProbeResult): string {
  return probe.steps.find((s) => !s.ok)?.error ?? tx("没有走完");
}

export function InstallDialog({
  agent,
  action,
  onClose,
  onLogin,
}: {
  agent: AgentSettingsView;
  /** install、update：要做的事；view：看正在做的、或者上一次的 */
  action: 'install' | 'update' | 'view';
  onClose: () => void;
  /** 装好了但还没登录：去登录 */
  onLogin: () => void;
}) {
  useLocale();
  const installs = useStore((s) => s.installs);
  const run = installs[agent.id];
  const other = Object.entries(installs).find(([id, r]) => id !== agent.id && r.state.phase === 'running')?.[1];
  // 打开时它正在做（或者点的是“查看”）：直接接上去看；否则先给你看命令
  const watchAtOpen = action === 'view' || run?.state.phase === 'running';
  const [watching, setWatching] = useState(watchAtOpen);
  /** 点“开始”之前的那一次：要看的是新开始的这一次 */
  const [before, setBefore] = useState<number | undefined>(watchAtOpen ? undefined : run?.id);
  /** 自己点了“开始”（否则是接上去看） */
  const [fresh, setFresh] = useState(false);
  /** 第几次开终端；再试一次时换一个新的 */
  const [attempt, setAttempt] = useState(0);
  const [refused, setRefused] = useState<string | null>(null);
  const shown = watching && run && run.id !== before ? run : null;
  const kind = shown?.action ?? (action === 'view' ? (run?.action ?? 'update') : action);
  const verb = kind === 'install' ? tx("安装") : tx("更新");
  const done = kind === 'install' ? tx("装好了") : tx("更新好了");
  // 命令在打开时定下来：做完后重新检测，设置里的命令会变（没装 → 装好了）
  const [command] = useState(() => (kind === 'install' ? agent.setup?.installCommand : agent.setup?.updateCommand) ?? '');
  const state = shown?.state ?? null;
  const running = watching && !refused && (state === null || state.phase === 'running');

  // 开着窗口时做完了，结果在窗口里显示，不另外弹提示
  useEffect(() => watchInstall(agent.id), [agent.id]);
  useEffect(
    () =>
      onLiveMessage((msg) => {
        if (msg.type === 'install:busy' && msg.agentId === agent.id) setRefused(msg.error);
      }),
    [agent.id],
  );
  // 在窗口里看着它做完的：记下当时的测试结果，等服务器测完连接、设置页读到新结果，再说能不能用
  const [doneAt, setDoneAt] = useState<{ probe: ProbeResult | undefined } | null>(null);
  const lastPhase = useRef(state?.phase);
  useEffect(() => {
    if (lastPhase.current === 'running' && state?.phase === 'done') setDoneAt({ probe: agent.probe });
    lastPhase.current = state?.phase;
  }, [state?.phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const retested = state?.phase === 'done' ? (doneAt ? (agent.probe !== doneAt.probe ? agent.probe : undefined) : agent.probe) : undefined;

  const start = () => {
    setBefore(run?.id);
    setRefused(null);
    setDoneAt(null);
    setFresh(true);
    setWatching(true);
    setAttempt((n) => n + 1);
  };
  const close = () => {
    if (running) showToast(tx("{0} 在后台接着{1}，做完了会提示你", [agent.name, verb]));
    onClose();
  };

  let status: ReactNode = null;
  if (refused) {
    status = <p className="serr">{refused}</p>;
  } else if (running) {
    status = <p className="lwait">{tx("正在")}{verb}{tx("… 输出显示在上面；要回答问题，点一下终端直接打字。关掉窗口也会在后台接着")}{verb}{tx("，做完了会提示你。")}</p>;
  } else if (state?.phase === 'done') {
    status = !retested ? (
      <p className="lwait">{done}{tx("，正在测试连接…")}</p>
    ) : retested.ok ? (
      <p className="lok">✓ {done}{tx("，测试连接也通过了，可以用了。")}</p>
    ) : retested.needsLogin ? (
      <div className="lpanel">
        <p className="ltext">✓ {done}{tx("。还要登录才能用。")}</p>
        {Boolean(retested.authMethods?.length) && (
          <div className="lbtns">
            <button className="btn btn-ink" type="button" onClick={onLogin}>{tx("去登录")}</button>
          </div>
        )}
      </div>
    ) : (
      <p className="serr">
        {done}{tx("，但测试连接没通过：")}{failedStep(retested)}
      </p>
    );
  } else if (state?.phase === 'failed' || state?.phase === 'cancelled') {
    status = (
      <div className="lpanel">
        <p className="serr">
          {state.phase === 'cancelled'
            ? tx("已中断。")
            : tx("{0}没成功：{1}{2}", [verb, state.error, state.exitCode !== undefined ? tx("。看上面的输出找原因") : ''])}
        </p>
        <div className="lbtns">
          <button className="btn btn-ink" type="button" disabled={Boolean(other)} onClick={start}>{tx("再试一次")}</button>
        </div>
      </div>
    );
  }

  const success = state?.phase === 'done' && Boolean(retested?.ok);
  return createPortal(
    <div className="dialog-backdrop">
      <div
        className={`dialog install-dialog${watching ? ' wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={`${verb} ${agent.name}`}
        // 窗口里的按键不触发全局快捷键；终端里的 Esc 留给终端
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Escape' && !watching) close();
        }}
      >
        <header className="dialog-head">
          <h2>
            {verb} {agent.name}
          </h2>
          <button className="icon-btn" type="button" aria-label={tx("关闭")} onClick={close}>
            <Close />
          </button>
        </header>
        {!watching ? (
          <div className="lpanel">
            <p className="ltext">{tx("会在服务器上运行以下")}{verb}{tx("命令：")}</p>
            <code className="cmdline">{command}</code>
            <p className="help">
              {kind === 'install'
                ? tx("按终端上的提示操作。装好后自动测试连接；部分 Agent 还需要登录或配置模型供应商。")
                : tx("开着的会话不受影响，新开的会话才用新版本。")}{tx("关掉窗口不会停，会在后台接着做。")}</p>
            {other && <p className="serr">{tx("正在")}{other.action === 'install' ? tx("安装") : tx("更新")} {other.name}{tx("，一次只做一件，等它做完再开始。")}</p>}
            <div className="lbtns">
              <button className="btn btn-ink" type="button" disabled={Boolean(other)} onClick={start}>{tx("开始")}{verb}
              </button>
            </div>
          </div>
        ) : (
          <div className="lpanel">
            {shown && <code className="cmdline">{shown.command}</code>}
            <Suspense fallback={<div className="term-box">{tx("正在打开…")}</div>}>
              <TerminalView
                key={attempt}
                channel="install"
                agentId={agent.id}
                onStart={(cols, rows) => {
                  if (fresh) {
                    send({ type: 'install:start', agentId: agent.id, action: kind, cols, rows });
                  } else {
                    send({ type: 'install:attach', agentId: agent.id });
                    send({ type: 'install:resize', agentId: agent.id, cols, rows });
                  }
                }}
              />
            </Suspense>
            {status}
          </div>
        )}
        <footer className="dialog-foot">
          <span className="picked" />
          {running ? (
            <>
              <button className="btn btn-quiet" type="button" onClick={() => send({ type: 'install:cancel', agentId: agent.id })}>{tx("中断")}</button>
              <button className="btn btn-line" type="button" onClick={close}>{tx("在后台继续")}</button>
            </>
          ) : (
            <button className={`btn ${success ? 'btn-ink' : 'btn-quiet'}`} type="button" onClick={close}>
              {success ? tx("完成") : watching ? tx("关闭") : tx("取消")}
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
