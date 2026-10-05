import { tx, useLocale } from '../../i18n';
// 设置页 · 安全：修改密码、登录设备（可逐个或全部退出）、审计日志（登录和每次审批）。
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { AuditView, LoginView } from '../../../../shared/types';
import { logout } from '../../actions';
import { api, ApiError } from '../../api';
import { ago } from '../../format';
import { showToast } from '../../store';
import { Seal } from '../Seal';
import { Chevron } from '../Icons';
import './security-settings.css';
import './password-disclosure.css';

const MIN = 12;
const AUDIT_LIMIT = 10;

interface SecurityData {
  logins: LoginView[];
  audit: AuditView[];
}

export function SecurityTab() {
  useLocale();
  const [data, setData] = useState<SecurityData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auditPages, setAuditPages] = useState<AuditView[][]>([]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditMore, setAuditMore] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const auditVersion = useRef(0);
  const auditLocked = useRef(false);
  const auditHeading = useRef<HTMLHeadingElement>(null);
  const auditId = useId();
  const auditRows = auditPages[auditPage] ?? [];

  const load = async () => {
    const version = ++auditVersion.current;
    auditLocked.current = true;
    setAuditLoading(true);
    try {
      const saved = await api<SecurityData>('/api/settings/security');
      if (version !== auditVersion.current) return;
      const rows = saved.audit.slice(0, AUDIT_LIMIT);
      setData({ ...saved, audit: rows });
      setAuditPages([rows]); setAuditPage(0); setAuditMore(saved.audit.length > AUDIT_LIMIT);
      setError(null); setAuditError(null);
    } catch (e) {
      if (version === auditVersion.current) setError((e as Error).message);
    } finally {
      if (version === auditVersion.current) { auditLocked.current = false; setAuditLoading(false); }
    }
  };

  useEffect(() => {
    void load();
    return () => { auditVersion.current++; };
  }, []);

  const focusAudit = () => {
    auditHeading.current?.focus({ preventScroll: true });
    auditHeading.current?.scrollIntoView({ block: 'start' });
  };

  const viewOlder = async () => {
    if (auditLocked.current || !auditRows.length) return;
    if (auditPage < auditPages.length - 1) {
      setAuditPage(page => Math.min(page + 1, auditPages.length - 1)); focusAudit(); return;
    }
    if (!auditMore) return;
    const version = auditVersion.current;
    auditLocked.current = true; setAuditLoading(true); setAuditError(null);
    try {
      const saved = await api<{ audit: AuditView[] }>(`/api/settings/audit?before=${auditRows.at(-1)!.id}`);
      if (version !== auditVersion.current) return;
      const rows = saved.audit.slice(0, AUDIT_LIMIT);
      setAuditMore(saved.audit.length > AUDIT_LIMIT);
      if (rows.length) {
        setAuditPages(pages => [...pages, rows]); setAuditPage(auditPage + 1); focusAudit();
      }
    } catch (e) {
      if (version === auditVersion.current) setAuditError((e as Error).message);
    } finally {
      if (version === auditVersion.current) { auditLocked.current = false; setAuditLoading(false); }
    }
  };

  const logoutDevice = async (login: LoginView) => {
    try {
      await api(`/api/settings/logins/${login.id}/logout`, {});
      showToast(tx("已退出 {0}", [login.device]));
      void load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const logoutOthers = async () => {
    if (!window.confirm(tx("退出其他所有设备？它们都要重新输入密码才能登录。"))) return;
    try {
      const res = await api<{ loggedOut: number }>('/api/settings/logins/logout-others', {});
      showToast(res.loggedOut ? tx("已退出其他 {0} 台设备", [res.loggedOut]) : tx("没有其他设备"));
      void load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <>
      <header className="shead">
        <div className="txt">
          <h2>{tx("安全")}</h2>
          <p>{tx("这个网页能让 Agent 在运行 Fika Desk 的电脑上执行命令，登录信息请只留在自己的设备上。")}</p>
        </div>
      </header>

      <PasswordForm onDone={() => void load()} />

      <h3>{tx("登录设备")}</h3>
      {error && <p className="serr">{error}</p>}
      {data && (
        <>
          <table className="stable security-logins-table">
            <thead>
              <tr>
                <th>{tx("设备")}</th>
                <th>{tx("最近活动")}</th>
                <th>IP</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.logins.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.device}
                    {l.current && <span className="cur">{tx("这台设备")}</span>}
                    {!l.keep && <span className="note">{tx("不保持登录")}</span>}
                  </td>
                  <td className="t">{l.current ? tx("现在") : ago(l.seenAt)}</td>
                  <td className="ip">{l.ip || '—'}</td>
                  <td className="act">
                    <button className="btn btn-sm security-coffee-button security-logout-button" type="button" onClick={() => (l.current ? void logout() : void logoutDevice(l))}>{tx("退出")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.logins.length > 1 && (
            <button className="btn btn-sm security-coffee-button spaced" type="button" onClick={logoutOthers}>{tx("退出其他所有设备")}</button>
          )}

          <div className="security-audit-heading"><h3 ref={auditHeading} tabIndex={-1}>{tx("审计日志")}</h3><span className="help">{tx("每页 {0} 条", [AUDIT_LIMIT])}</span></div>
          <table id={auditId} className="stable security-audit-table" aria-busy={auditLoading}>
            <thead>
              <tr>
                <th>{tx("时间")}</th>
                <th>{tx("事件")}</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((a) => {
                const { text, bad } = describe(a);
                return (
                  <tr key={a.id}>
                    <td className="t">{ago(a.at)}</td>
                    <td className={bad ? 'bad' : undefined}>{text}</td>
                    <td className="ip">{a.ip || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {auditError && <p className="serr" role="alert">{auditError}</p>}
          {auditRows.length > 0 && (
            <div className="security-audit-pagination">
              <button className="btn btn-sm security-coffee-button" type="button" aria-controls={auditId} disabled={auditLoading || auditPage === 0}
                onClick={() => { setAuditPage(page => Math.max(0, page - 1)); setAuditError(null); focusAudit(); }}><span className="security-page-button-label">{tx("上一页")}</span></button>
              <span className="help" role="status">{auditLoading ? tx("加载中…") : tx("第 {0} 页", [auditPage + 1])}</span>
              <button className="btn btn-sm security-coffee-button" type="button" aria-controls={auditId} aria-busy={auditLoading}
                disabled={auditLoading || (auditPage === auditPages.length - 1 && !auditMore)} onClick={() => void viewOlder()}>
                <span className="security-page-button-label">{tx("下一页")}</span>
              </button>
            </div>
          )}

        </>
      )}
    </>
  );
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  useLocale();
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<'current' | 'next' | 'again' | null>(null);
  const [busy, setBusy] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const currentInput = useRef<HTMLInputElement>(null);
  const nextInput = useRef<HTMLInputElement>(null);
  const againInput = useRef<HTMLInputElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const restoreFocus = useRef(false);
  const pending = useRef(false);

  useEffect(() => {
    if (editing) currentInput.current?.focus();
    else if (restoreFocus.current) {
      restoreFocus.current = false;
      trigger.current?.focus();
    }
  }, [editing]);

  useEffect(() => {
    if (!error) return;
    const field = errorField === 'current' ? currentInput : errorField === 'next' ? nextInput : errorField === 'again' ? againInput : errorMessage;
    field.current?.focus();
  }, [error, errorField]);

  const close = () => {
    setCurrent('');
    setNext('');
    setAgain('');
    setError(null);
    setErrorField(null);
    restoreFocus.current = true;
    setEditing(false);
  };

  const fail = (text: string, field: 'current' | 'next' | 'again') => {
    setError(text);
    setErrorField(field);
    ({ current: currentInput, next: nextInput, again: againInput })[field].current?.focus();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending.current) return;
    setError(null);
    setErrorField(null);
    if (!current) return fail(tx("先输入当前密码。"), 'current');
    if ([...next].length < MIN) return fail(tx("新密码至少要 {0} 位。", [MIN]), 'next');
    if (next !== again) return fail(tx("两次输入的新密码不一样。"), 'again');
    pending.current = true;
    setBusy(true);
    try {
      const res = await api<{ loggedOut: number }>('/api/settings/password', { current, next });
      showToast(res.loggedOut ? tx("密码已修改，其他 {0} 台设备已退出登录", [res.loggedOut]) : tx("密码已修改"));
      close();
      onDone();
    } catch (e) {
      const data = e instanceof ApiError ? e.data : {};
      const code = e instanceof Error ? e.message : '';
      setErrorField(code === 'wrong-password' ? 'current' : code === 'too-short' ? 'next' : null);
      setError(
        code === 'wrong-password'
          ? tx("当前密码不对。再输错 {0} 次，这个 IP 会被锁定 15 分钟。", [data.remaining])
          : code === 'locked'
            ? tx("尝试次数太多，已暂时锁定，{0} 分钟后再试。", [Math.ceil(Number(data.retryAfter ?? 900) / 60)])
            : code === 'too-short'
              ? tx("新密码至少要 {0} 位。", [MIN])
              : code || tx("出错了，稍后再试"),
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="security-password-section" aria-label={tx("修改密码")}>
      <button ref={trigger} className="btn btn-line security-password-trigger" type="button" aria-expanded={editing} aria-controls={`${id}-panel`} disabled={busy} onClick={() => editing ? close() : setEditing(true)}>
        {tx("修改密码")}<Chevron size={14} />
      </button>
      <div id={`${id}-panel`} hidden={!editing}>
        {editing && <form className="pw security-password" aria-label={tx("修改密码")} aria-busy={busy} onSubmit={submit} onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              if (!pending.current) close();
            }
          }}>
          <label className="security-password-field" htmlFor={`${id}-current`}>
            <span>{tx("当前密码")}</span>
            <input ref={currentInput} id={`${id}-current`} className="inp" type="password" placeholder={tx("请输入当前密码")} autoComplete="current-password" aria-invalid={errorField === 'current'} aria-describedby={errorField === 'current' ? `${id}-error` : undefined} disabled={busy} value={current} onChange={(e) => setCurrent(e.target.value)} />
          </label>
          <label className="security-password-field" htmlFor={`${id}-next`}>
            <span>{tx("新密码")}</span>
            <input ref={nextInput} id={`${id}-next`} className="inp" type="password" placeholder={tx("新密码，至少 {0} 位", [MIN])} autoComplete="new-password" aria-invalid={errorField === 'next'} aria-describedby={errorField === 'next' ? `${id}-error` : undefined} disabled={busy} value={next} onChange={(e) => setNext(e.target.value)} />
          </label>
          <label className="security-password-field" htmlFor={`${id}-again`}>
            <span>{tx("确认新密码")}</span>
            <input ref={againInput} id={`${id}-again`} className="inp" type="password" placeholder={tx("再输一次新密码")} autoComplete="new-password" aria-invalid={errorField === 'again'} aria-describedby={errorField === 'again' ? `${id}-error` : undefined} disabled={busy} value={again} onChange={(e) => setAgain(e.target.value)} />
          </label>
          {error && <p ref={errorMessage} id={`${id}-error`} className="serr" role="alert" tabIndex={-1}>{error}</p>}
          <div className="security-password-actions">
            <button className="btn btn-ink" type="submit" disabled={busy}>
              {busy ? tx("请稍候…") : tx("确认")}
            </button>
            <button className="btn btn-line" type="button" disabled={busy} onClick={close}>{tx("取消")}</button>
          </div>
          <p className="help security-password-description">{tx("改好后其他设备都要重新登录，这台设备保持登录。")}</p>
        </form>}
      </div>
    </section>
  );
}

/** 审计日志的一行怎么说 */
function describe(a: AuditView): { text: ReactNode; bad?: boolean } {
  const d = a.detail ?? {};
  switch (a.kind) {
    case 'setup':
      return { text: tx("设置了登录密码") };
    case 'login':
      return { text: d.keep === false ? tx("登录成功（不保持登录）") : tx("登录成功") };
    case 'login-failed':
      return { text: tx("密码错误"), bad: true };
    case 'setup-failed':
      return { text: tx("设置链接不对"), bad: true };
    case 'password-change-failed':
      return { text: tx("修改密码时当前密码输错"), bad: true };
    case 'locked':
      return { text: tx("连续输错 5 次，这个 IP 已锁定 {0} 分钟", [d.minutes ?? 15]), bad: true };
    case 'logout':
      return { text: tx("退出登录") };
    case 'logout-device':
      return { text: tx("退出了一台设备（{0}）", [d.device ?? tx("未知设备")]) };
    case 'logout-others':
      return { text: tx("退出了其他 {0} 台设备", [d.count ?? 0]) };
    case 'password-changed':
      return { text: Number(d.loggedOut) ? tx("修改了密码，其他 {0} 台设备已退出", [d.loggedOut]) : tx("修改了密码") };
    case 'reset-password':
      return { text: tx("在服务器上重置了密码") };
    case 'agent-login':
      return { text: tx("登录了 {0}{1}", [d.agent ?? 'Agent', loginWay(d.method)]) };
    case 'agent-login-failed':
      return { text: tx("{0} 登录没成功{1}", [d.agent ?? 'Agent', loginWay(d.method)]), bad: true };
    case 'agent-install':
      return {
        text: (
          <>
            {d.action === 'update' ? tx("更新") : tx("安装")}{tx("了") + " "}{String(d.agent ?? 'Agent')} <code>{String(d.command ?? '')}</code>
          </>
        ),
      };
    case 'agent-install-failed':
      return {
        text: (
          <>
            {d.action === 'update' ? tx("更新") : tx("安装")} {String(d.agent ?? 'Agent')}
            {d.cancelled ? tx("时中断了") : tx("没成功{0}", [d.exitCode !== undefined ? tx("（退出码 {0}）", [d.exitCode]) : ''])} <code>{String(d.command ?? '')}</code>
          </>
        ),
        bad: true,
      };
    case 'agent-settings': {
      const changed = Array.isArray(d.changed) ? (d.changed as string[]).map(settingName).join('、') : '';
      return { text: tx("修改了 {0} 的设置{1}", [d.agent ?? 'Agent', changed ? `：${changed}` : '']) };
    }
    case 'approval': {
      const decision = String(d.decision ?? '');
      const reject = decision === 'reject' || decision.startsWith('reject');
      const verb =
        ({ approve: tx("批准"), 'approve-session': tx("本会话都批准"), reject: tx("拒绝"), allow_once: tx("允许这一次"), allow_always: tx("以后都允许"), reject_once: tx("拒绝"), reject_always: tx("以后都拒绝") } as Record<string, string>)[decision] ??
        String(d.choice ?? decision);
      return {
        text: (
          <>
            <Seal kind={reject ? 'reject' : 'approve'} label={reject ? tx("拒绝") : tx("批准")} />
            {verb} <code>{String(d.action ?? '')}</code>（{String(d.agent ?? '')}，{String(d.session ?? '')}）
          </>
        ),
      };
    }
    default:
      return { text: a.kind };
  }
}

function settingName(key: string): string {
  return ({ enabled: tx("启用"), mode: tx("默认权限模式"), level: tx("默认审批档位"), model: tx("默认模型"), provider: tx("模型供应商") } as Record<string, string>)[key] ?? key;
}

/** Agent 登录用的是哪种方式 */
function loginWay(method: unknown): string {
  const name = ({ 'api-key': tx("填 API Key"), 'device-code': tx("验证码登录"), terminal: tx("设置向导") } as Record<string, string>)[String(method)];
  return name ? `（${name}）` : '';
}
