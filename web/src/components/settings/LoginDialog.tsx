import { tx, useLocale, localizedLabels } from '../../i18n';
// Agent 登录窗口（设置 → Agent → 登录）：列出 Agent 自己提供的登录方式，选一种照着做。
// 填 API Key、验证码登录在这里直接完成；设置向导在窗口里开一个终端，显示 Agent 自己的设置界面。
import { lazy, Suspense, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { AgentSettingsView, AuthMethodView, LoginState, ProbeResult } from '../../../../shared/types';
import { onLiveMessage } from '../../live';
import { send } from '../../ws';
import { Close } from '../Icons';

const TerminalView = lazy(() => import('./TerminalView'));

const PROVIDERS: Record<string, string> = { openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google' };

/** Agent 自己打开网页登录的方式，常见的给个中文名（CodeBuddy 报的是英文） */
const AGENT_METHODS: Record<string, string> = localizedLabels({
  'Login with WeChat': '微信登录',
  'Login with Google/Github': 'Google / GitHub 登录',
  'Login with iOA': 'iOA 登录',
  'Login with Enterprise Domain': '企业域名登录',
});

/** 登录方式的中文名和说明（Agent 报的是英文） */
function explain(m: AuthMethodView, settings: AgentSettingsView): { title: string; text: string } {
  const setup = settings.modelAccess?.setups.find((item) => item.id === m.id);
  if (setup) return { title: tx(setup.name), text: tx(setup.description) };
  const agent = settings.name;
  switch (m.kind) {
    case 'api-key': {
      const provider = m.provider ? (PROVIDERS[m.provider] ?? m.provider) : '';
      return { title: 'API Key', text: tx("填{0} API Key，由 {1} 自己保存。", [provider ? tx(" {0} 的", [provider]) : tx("一个"), agent]) };
    }
    case 'device-code':
      return { title: tx("验证码登录"), text: tx("给你一个网址和一串验证码，在手机或电脑上打开网址、输入验证码就登录好了。用会员账号登录选这个。") };
    case 'terminal':
      return { title: tx("设置向导"), text: tx("打开 {0} 自己的设置界面，在里面选模型供应商、填 Key 或登录账号，用键盘操作。", [agent]) };
    default:
      return {
        title: AGENT_METHODS[m.name] ?? m.name,
        text: tx("{0} 会给一个登录网址，在手机或电脑上打开，按页面提示登录（比如微信扫码）。{1}", [agent, m.description ? `（${m.description}）` : '']),
      };
  }
}

/** 测试连接卡在哪一步、为什么 */
function failedStep(probe: ProbeResult): string {
  const step = probe.steps.find((s) => !s.ok);
  return step?.error ?? tx("没有走完");
}

/** 从提示里找出验证码，比如 “enter this code: 7G0O-U6KUZ” */
function codeIn(message: string): string | null {
  return message.match(/\b([A-Z0-9]{3,}(?:-[A-Z0-9]{3,})+)\b/)?.[1] ?? null;
}

export function LoginDialog({
  agent,
  initialMethod,
  onClose,
  onDone,
}: {
  agent: AgentSettingsView;
  /** 直接选好这种登录方式（比如从“模型供应商”打开设置向导） */
  initialMethod?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  useLocale();
  // 原生向导来自服务器核实的固定方法，不依赖先做 ACP 握手，也不让页面提供命令。
  const methods = [...new Map([
    ...(agent.probe?.authMethods ?? []),
    ...(agent.modelAccess?.setups ?? []).map((setup): AuthMethodView => ({ ...setup, kind: 'terminal' })),
  ].map((m) => [m.id, m])).values()];
  const [method, setMethod] = useState<AuthMethodView | null>(
    methods.find((m) => m.id === initialMethod) ?? (methods.length === 1 ? methods[0] : null),
  );
  const [state, setState] = useState<LoginState | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  /** 设置向导要点一下才打开（打开就会在服务器上起进程） */
  const [wizard, setWizard] = useState(false);
  // 登录结束、或者设置向导退出时，记下当时的测试结果；设置页重新测出新结果后，以新结果判断登录成没成。
  // 有的 Agent 登录好了，设置向导也不是正常退出，所以不能只看退出码
  const [endedWith, setEndedWith] = useState<{ probe: ProbeResult | undefined } | null>(null);
  const retested = endedWith && agent.probe !== endedWith.probe ? agent.probe : null;

  useEffect(
    () =>
      onLiveMessage((msg) => {
        if (msg.type === 'login' && msg.agentId === agent.id) setState(msg.state);
      }),
    [agent.id],
  );
  useEffect(() => {
    if (state?.phase === 'done' || (state?.phase === 'failed' && state.exitCode !== undefined)) {
      setEndedWith({ probe: agent.probe });
      onDone();
    }
    // 取消了：回到这种登录方式的起点
    if (state?.phase === 'cancelled') setState(null);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  // 关窗口时还在登录：结束它
  useEffect(() => () => send({ type: 'login:cancel', agentId: agent.id }), [agent.id]);

  const busy = state?.phase === 'starting' || state?.phase === 'url' || state?.phase === 'terminal';
  const inTerminal = method?.kind === 'terminal' && wizard && (state === null || busy);

  const start = (extra: { apiKey?: string } = {}) => {
    if (!method) return;
    setState({ phase: 'starting' });
    send({ type: 'login:start', agentId: agent.id, methodId: method.id, ...extra });
  };
  const pick = (m: AuthMethodView | null) => {
    setMethod(m);
    setState(null);
    setWizard(false);
    setEndedWith(null);
  };
  const retry = () => {
    setState(null);
    setEndedWith(null);
  };
  const close = () => {
    if (busy) send({ type: 'login:cancel', agentId: agent.id });
    onClose();
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
    } catch {
      // 复制不了就手动选
    }
  };
  const submitKey = (event: FormEvent) => {
    event.preventDefault();
    if (apiKey.trim()) start({ apiKey: apiKey.trim() });
  };

  const success = Boolean(retested?.ok);
  let body: ReactNode;
  if (endedWith) {
    const wizardExited = state?.phase === 'failed';
    body = !retested ? (
      <p className="lwait">{wizardExited ? tx("向导退出了，正在测试连接，看看登录好了没有…") : tx("登录好了，正在测试连接…")}</p>
    ) : retested.ok ? (
      <p className="lok">{tx("✓ 登录好了，测试连接也通过了。")}</p>
    ) : (
      <div className="lpanel">
        <p className="serr">
          {wizardExited ? tx("向导退出了，测试连接还是没通过") : tx("登录这一步做完了，但测试连接还没通过")}：{failedStep(retested)}
        </p>
        <div className="lbtns">
          <button className="btn btn-ink" type="button" onClick={retry}>{tx("再试一次")}</button>
          {methods.length > 1 && (
            <button className="btn btn-quiet" type="button" onClick={() => pick(null)}>{tx("换一种方式")}</button>
          )}
        </div>
      </div>
    );
  } else if (state?.phase === 'failed') {
    body = (
      <div className="lpanel">
        <p className="serr">{state.error}</p>
        <div className="lbtns">
          <button className="btn btn-ink" type="button" onClick={retry}>{tx("再试一次")}</button>
          {methods.length > 1 && (
            <button className="btn btn-quiet" type="button" onClick={() => pick(null)}>{tx("换一种方式")}</button>
          )}
        </div>
      </div>
    );
  } else if (!method) {
    body = (
      <div className="lmethods">
        {methods.map((m) => {
          const e = explain(m, agent);
          return (
            <button key={m.id} className="lmethod" type="button" onClick={() => pick(m)}>
              <span className="t">{e.title}</span>
              <span className="d">{e.text}</span>
            </button>
          );
        })}
      </div>
    );
  } else if (method.kind === 'terminal') {
    body = wizard ? (
      <div className="lpanel">
        {state?.phase === 'terminal' && state.url && (
          <div className="lopen">
            <span>{tx("向导想打开这个网址，服务器上没有浏览器，请在你的手机或电脑上打开：")}</span>
            <a href={state.url} target="_blank" rel="noopener noreferrer">
              {state.url}
            </a>
            <button className="btn btn-line btn-sm" type="button" onClick={() => void copy(state.url!)}>
              {copied === state.url ? tx("已复制") : tx("复制网址")}
            </button>
          </div>
        )}
        <Suspense fallback={<div className="term-box">{tx("正在打开…")}</div>}>
          <TerminalView
            channel="login"
            agentId={agent.id}
            onStart={(cols, rows) => send({ type: 'login:start', agentId: agent.id, methodId: method.id, cols, rows })}
          />
        </Suspense>
        <p className="help">{tx("用键盘操作：方向键选择，回车确认。向导走完会自己退出，这里会显示结果。")}</p>
      </div>
    ) : (
      <div className="lpanel">
        <p className="ltext">{explain(method, agent).text}</p>
        <div className="lbtns">
          <button className="btn btn-ink" type="button" onClick={() => setWizard(true)}>{tx("打开设置向导")}</button>
        </div>
      </div>
    );
  } else if (state?.phase === 'url') {
    const code = codeIn(state.message);
    body = (
      <div className="lcode">
        <span className="step">{tx("1. 在手机或电脑上打开")}</span>
        <a href={state.url} target="_blank" rel="noopener noreferrer">
          {state.url}
        </a>
        <span className="step">{code ? tx("2. 登录后输入验证码") : `2. ${state.message}`}</span>
        {code && <span className="code">{code}</span>}
        <div className="lbtns">
          {code && (
            <button className="btn btn-line btn-sm" type="button" onClick={() => void copy(code)}>
              {copied === code ? tx("已复制") : tx("复制验证码")}
            </button>
          )}
          <button className="btn btn-line btn-sm" type="button" onClick={() => void copy(state.url)}>
            {copied === state.url ? tx("已复制") : tx("复制网址")}
          </button>
        </div>
        <p className="lwait">{code ? tx("登录完成后这里会自动更新。验证码一般 15 分钟内有效。") : tx("网址几分钟内有效；过期了就取消，再登录一次。")}</p>
      </div>
    );
  } else if (state?.phase === 'starting') {
    body = (
      <p className="lwait">
        {method.kind === 'device-code' ? tx("正在要验证码…") : method.kind === 'agent' ? tx("正在等 {0} 给出登录网址…", [agent.name]) : tx("正在登录…")}
      </p>
    );
  } else if (method.kind === 'api-key') {
    body = (
      <div className="lpanel">
        <p className="ltext">{explain(method, agent).text}</p>
        <form className="lkey" onSubmit={submitKey}>
          <input
            className="inp mono"
            type="password"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder={tx("粘贴 API Key")}
            aria-label="API Key"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <button className="btn btn-ink" type="submit" disabled={!apiKey.trim()}>{tx("登录")}</button>
        </form>
      </div>
    );
  } else {
    body = (
      <div className="lpanel">
        <p className="ltext">{explain(method, agent).text}</p>
        <div className="lbtns">
          <button className="btn btn-ink" type="button" onClick={() => start()}>
            {method.kind === 'device-code' ? tx("获取验证码") : tx("开始登录")}
          </button>
        </div>
      </div>
    );
  }

  const title = method ? explain(method, agent).title : null;
  return createPortal(
    <div className="dialog-backdrop">
      <div
        className={`dialog login-dialog${inTerminal ? ' wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={tx("登录 {0}", [agent.name])}
        // 窗口里的按键不触发全局快捷键；设置向导里 Esc 留给向导用
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Escape' && !inTerminal) close();
        }}
      >
        <header className="dialog-head">
          <h2>{tx("登录") + " "}{agent.name}</h2>
          <button className="icon-btn" type="button" aria-label={tx("关闭")} onClick={close}>
            <Close />
          </button>
        </header>
        <p className="dialog-sub">
          {title ? (
            <>
              {methods.length > 1 && !busy && !endedWith && (
                <button className="linkish" type="button" onClick={() => pick(null)}>{tx("‹ 换一种方式")}</button>
              )}
              {title}
            </>
          ) : (
            tx("选一种 {0} 自己提供的登录方式。登录信息存在服务器上 {1} 自己的配置里。", [agent.name, agent.name])
          )}
        </p>
        {body}
        <footer className="dialog-foot">
          <span className="picked" />
          <button className={`btn ${success ? 'btn-ink' : 'btn-quiet'}`} type="button" onClick={close}>
            {success ? tx("完成") : busy ? tx("取消") : tx("关闭")}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
