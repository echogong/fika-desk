import { APP_NAME } from '../../../shared/brand';
import { tx, useLocale } from '../i18n';
// 登录页：首次设置密码（只能用服务器终端里打印的一次性链接打开）、登录、输错提示、锁定倒计时。
// 右边是一张从上往下拍的拿铁照片（web/src/assets/login-photo.webp，AI 生成）：打开页面时灯慢慢亮起来，热气飘过；
// 每敲一个字，杯心荡开一圈涟漪；输错时杯子晃一下；锁定时咖啡凉了（热气没了、颜色发灰）。
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { applyAuth, checkAuth, loginWith, setupPassword, type AuthResponse } from '../auth';
import type { AuthState } from '../store';
import photoUrl from '../assets/login-photo.webp';
import { Eye, EyeOff } from './Icons';
import { Mark } from './Lamp';

const MIN = 12;
/** 忘记密码时在服务器上运行的命令（以后做了安装脚本换成 fika-desk reset-password） */
const RESET = 'npm run reset-password';

export function AuthPage({ auth, onEnterWorkspace }: { auth: AuthState; onEnterWorkspace?: () => void }) {
  useLocale();
  const key = new URLSearchParams(location.search).get('k') ?? '';
  const mode = auth.needsSetup ? (key ? 'setup' : 'waiting') : 'login';
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [showAgain, setShowAgain] = useState(false);
  const [keep, setKeep] = useState(true);
  /** 点了“忘记密码？”：在输入框下面说怎么重置 */
  const [forgot, setForgot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(auth.lockedUntil);
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const returnRef = useRef<HTMLButtonElement>(null);
  const signedIn = auth.loggedIn && !!onEnterWorkspace;
  /** 敲一个字加一，用来重新播放杯心的涟漪 */
  const [ripple, setRipple] = useState(0);
  const locked = lockedUntil > now;

  useEffect(() => setLockedUntil(auth.lockedUntil), [auth.lockedUntil]);

  // 锁定时每秒刷新倒计时，到点自动解锁
  useEffect(() => {
    if (!locked) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [locked]);

  useEffect(() => {
    if (signedIn) returnRef.current?.focus();
    else inputRef.current?.focus();
  }, [mode, signedIn]);

  const handle = (res: AuthResponse) => {
    if (res.ok) {
      // 设置链接用过就没用了，从地址栏去掉
      if (mode === 'setup') history.replaceState(null, '', '/');
      applyAuth({ needsSetup: false, loggedIn: true, lockedFor: 0 });
      onEnterWorkspace?.();
      return;
    }
    switch (res.error) {
      case 'locked':
        setError(null);
        setLockedUntil(Date.now() + (res.retryAfter ?? 900) * 1000);
        setNow(Date.now());
        return;
      case 'wrong-password':
        setError(tx("密码不对。再输错 {0} 次，这个 IP 会被锁定 15 分钟。", [res.remaining]));
        return;
      case 'bad-key':
        setError(tx("这个设置链接不对，或者已经用过了。请到运行 Fika Desk 的电脑上，在后台日志里找最新的链接。"));
        return;
      case 'too-short':
        setError(tx("至少要 {0} 位。", [MIN]));
        return;
      case 'too-long':
        setError(tx("太长了，最多 256 位。"));
        return;
      case 'already-set':
      case 'needs-setup':
        // 密码已经在别处设好了（或者被重置了），重新看一下该显示哪一页
        history.replaceState(null, '', '/');
        void checkAuth();
        return;
      case 'network':
        setError(tx("连不上 Fika Desk，稍后再试。"));
        return;
      default:
        setError(tx("出错了，稍后再试。"));
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || locked) return;
    if (mode === 'setup') {
      if ([...password].length < MIN) return setError(tx("至少要 {0} 位。", [MIN]));
      if (password !== again) return setError(tx("两次输入的密码不一样。"));
    } else if (!password) {
      return setError(tx("先输入密码。"));
    }
    setBusy(true);
    const res = mode === 'setup' ? await setupPassword(key, password) : await loginWith(password, keep);
    setBusy(false);
    handle(res);
  };

  const length = [...password].length;
  const bars = length === 0 ? 0 : length < MIN ? 1 : length < 16 ? 2 : length < 20 ? 3 : 4;
  const hint =
    length < MIN
      ? tx("至少 {0} 位{1}。", [MIN, length ? tx("，还差 {0} 位", [MIN - length]) : ''])
      : length < 20
        ? tx("已达到要求，再长一些更安全。")
        : tx("很好。");
  const left = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  const eye = (on: boolean, toggle: () => void) => (
    <button className="eye" type="button" aria-label={on ? tx("隐藏密码") : tx("显示密码")} title={on ? tx("隐藏密码") : tx("显示密码")} onClick={toggle}>
      {on ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );

  return (
    <main className="auth">
      <div className="auth-art" aria-hidden="true">
        <div className="photo" data-state={locked ? 'cold' : error ? 'spill' : 'warm'}>
          <img src={photoUrl} alt="" />
          {ripple > 0 && <i key={ripple} className="ripple" />}
          <i className="steam s1" />
          <i className="steam s2" />
          <i className="steam s3" />
        </div>
      </div>
      <div className="auth-brand">
        <Mark />
        {APP_NAME}
      </div>
      <p className="auth-meta">v{__APP_VERSION__}</p>
      <div className="auth-wrap">
        <p className="auth-eyebrow">{tx("只属于你自己电脑上的多 Agent 工作台")}</p>
        <h1 className="auth-tag">{tx("一边喝咖啡，")}<br />{tx('看 Agent 做工作。')}</h1>

        {signedIn ? (
          <section className="auth-card auth-signed-in">
            <p className="sub">{tx('已登录，可直接返回工作区。')}</p>
            <button ref={returnRef} className="auth-go" type="button" onClick={onEnterWorkspace}>{tx('返回工作区')}</button>
          </section>
        ) : mode === 'waiting' ? (
          <section className="auth-card">
            <h2 className="auth-step">{tx("还没设置登录密码")}</h2>
            <p className="sub">{tx("第一次使用要先设置密码。为了安全，设置页只能用运行 Fika Desk 的电脑上打印出来的链接打开。")}</p>
            <p className="auth-foot">{tx("在那台电脑的后台日志（数据目录下的 runtime/runner.log）里找“首次使用”那一段，打开里面的链接。")}</p>
          </section>
        ) : (
          <form className="auth-card" onSubmit={submit} noValidate>
            {mode === 'setup' ? <h2 className="auth-step">{tx("设置登录密码")}</h2> : <h2 className="sr-only">{tx("登录")}</h2>}
            <p className="sub">{mode === 'setup' ? tx("第一次使用。这是 Fika Desk 唯一的账户，只有你能用。") : tx("欢迎回来。这个工作台只有你能登录。")}</p>
            {locked && (
              <div className="auth-lock" role="alert">
                <b>{tx("尝试次数太多，已暂时锁定。")}</b>
                <br />{tx("咖啡先凉一凉，还要等")}{' '}
                <span className="t">
                  {Math.floor(left / 60)}{" " + tx("分") + " "}{left % 60}{" " + tx("秒")}</span>{tx("，之后可以再试。")}</div>
            )}
            <div className="f-row">
              <label className="f" htmlFor="pw">
                {mode === 'setup' ? tx("新密码") : tx("密码")}
              </label>
              {mode === 'login' && (
                <button className="f-link" type="button" aria-expanded={forgot} onClick={() => setForgot(!forgot)}>{tx("忘记密码")}</button>
              )}
            </div>
            <div className={`auth-field${error ? ' bad' : ''}`}>
              <input
                id="pw"
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={password}
                autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
                placeholder={mode === 'setup' ? tx("至少 {0} 位", [MIN]) : undefined}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError(null);
                  setRipple((n) => n + 1);
                }}
              />
              {eye(show, () => setShow(!show))}
            </div>
            {error && (
              <p className="auth-msg" role="alert">
                {error}
              </p>
            )}
            {forgot && (
              <p className="auth-forgot">{tx("在运行 Fika Desk 的电脑上，进入 Fika Desk 的目录运行") + " "}<code>{RESET}</code>{tx("，再用后台日志里的新链接重新设置密码。")}</p>
            )}
            {mode === 'setup' && (
              <>
                <div className={`meter${bars < 2 ? ' weak' : ''}`} aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <i key={i} className={i < bars ? 'on' : ''} />
                  ))}
                </div>
                <p className="auth-hint">{hint}</p>
                <label className="f" htmlFor="pw2">{tx("再输一次")}</label>
                <div className="auth-field">
                  <input
                    id="pw2"
                    type={showAgain ? 'text' : 'password'}
                    value={again}
                    autoComplete="new-password"
                    onChange={(event) => {
                      setAgain(event.target.value);
                      setError(null);
                    }}
                  />
                  {eye(showAgain, () => setShowAgain(!showAgain))}
                </div>
              </>
            )}
            {mode === 'login' && (
              <label className="auth-check">
                <input type="checkbox" checked={keep} onChange={(event) => setKeep(event.target.checked)} />{tx("在这个浏览器上保持登录 30 天")}</label>
            )}
            <button className={`auth-go${password ? '' : ' is-empty'}`} type="submit" disabled={busy || locked}>
              {locked ? tx("锁定中") : busy ? tx("请稍候…") : mode === 'setup' ? tx("设置并进入") : tx("登录")}
            </button>
            {mode === 'setup' && (
              <p className="auth-foot">{tx("忘记密码时，在运行 Fika Desk 的电脑上运行") + " "}<code>{RESET}</code>{" " + tx("重置。")}</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
