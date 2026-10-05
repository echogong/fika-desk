import { tx, useLocale, localizedLabels } from '../../i18n';
// 设置页 · Agent：检测状态、一键安装和更新、当前模型（读 Agent 自己的配置，只读）、测试连接（分步显示耗时），
// 以及启用开关和模型供应商设置。供应商改了只影响之后新开的会话。
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AgentSettingsView, AgentUpdateCheck, InstallRunView, ProbeResult } from '../../../../shared/types';
import type { AgentCatalogView } from '../../../../shared/agent-catalog';
import type { ModelProviderInput } from '../../../../shared/model-access';
import { api } from '../../api';
import { ago, resetText } from '../../format';
import { onLiveMessage } from '../../live';
import { setState, showToast, useStore } from '../../store';
import { Chevron, Close, Download, Refresh, Search } from '../Icons';
import { Dot, type LampState } from '../Lamp';
import { AgentIcon } from '../AgentIcon';
import './agent-directory.css';
import { InstallDialog } from './InstallDialog';
import { LoginDialog } from './LoginDialog';
import { ProviderRow } from './ProviderRow';

type Patch = {
  enabled?: boolean;
  provider?: ModelProviderInput | null;
};

const errorText = (e: unknown) => (e instanceof Error ? e.message : tx("出错了，稍后再试"));

export function AgentTab() {
  useLocale();
  const [agents, setAgents] = useState<AgentSettingsView[] | null>(null);
  const [catalog, setCatalog] = useState<AgentCatalogView[] | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'china' | 'global' | 'installed'>('all');
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  /** 检查更新：打开时查一次（服务器 6 小时内查过就直接给结果），点“检查更新”重新查 */
  const [updates, setUpdates] = useState<Record<string, AgentUpdateCheck> | null>(null);
  const [checking, setChecking] = useState(false);
  // 从“启动 Agent”菜单点“安装 Agent…”过来的：展开那个 Agent
  const focus = useStore((s) => s.settingsFocus);
  const list = useRef<HTMLUListElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  /** 列表读到之后要滚到的 Agent */
  const scrollTo = useRef<string | null>(null);

  const reload = () =>
    Promise.all([
      api<AgentSettingsView[]>('/api/settings/agents'),
      api<AgentCatalogView[]>('/api/settings/agents/catalog'),
    ]).then(
      ([views, entries]) => {
        setAgents(views);
        setCatalog(entries);
        setError(null);
        // 初次打开全部收起；后台刷新只保留用户已经展开的那一项。
        setOpen((current) => current && views.some((a) => a.id === current) ? current : null);
      },
      (e) => setError(errorText(e)),
    );
  const checkUpdates = async (force: boolean) => {
    setChecking(true);
    try {
      setUpdates(await api<Record<string, AgentUpdateCheck>>(`/api/settings/agents/updates${force ? '?force=1' : ''}`));
      if (force) showToast(tx("检查完了"));
    } catch (e) {
      if (force) setError(errorText(e));
    }
    setChecking(false);
  };

  useEffect(() => {
    void reload();
    void checkUpdates(false);
  }, []);
  // 在后台装好、更新完：版本变了，重新读，再查一次新版本（之前查到的不算数了）
  const installs = useStore((s) => s.installs);
  const seen = useRef<Record<string, string>>({});
  useEffect(() => {
    const ended: string[] = [];
    for (const [id, run] of Object.entries(installs)) {
      const key = `${run.id}:${run.state.phase}`;
      if (seen.current[id] !== undefined && seen.current[id] !== key && run.state.phase !== 'running') ended.push(id);
      seen.current[id] = key;
    }
    if (!ended.length) return;
    setUpdates((u) => (u ? Object.fromEntries(Object.entries(u).filter(([id]) => !ended.includes(id))) : u));
    void reload().then(() => checkUpdates(false));
  }, [installs]); // eslint-disable-line react-hooks/exhaustive-deps
  // 装好后服务器测完了连接：读新的测试结果
  useEffect(
    () =>
      onLiveMessage((msg) => {
        if (msg.type === 'agent:tested') void reload();
      }),
    [],
  );
  useEffect(() => {
    if (!focus) return;
    setQuery('');
    setFilter('all');
    setMoreExpanded(true);
    setOpen(focus);
    scrollTo.current = focus;
    setState({ settingsFocus: null });
  }, [focus]);
  useEffect(() => {
    const id = scrollTo.current;
    const row = id ? list.current?.querySelector(`[data-agent="${id}"]`) : null;
    if (!row || row.hasAttribute('hidden')) return;
    scrollTo.current = null;
    row.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [agents, open, moreExpanded]);

  const replace = (view: AgentSettingsView) => setAgents((list) => list?.map((a) => (a.id === view.id ? view : a)) ?? null);

  const rescan = async () => {
    setScanning(true);
    setError(null);
    try {
      setAgents(await api<AgentSettingsView[]>('/api/settings/agents/rescan', {}));
      setCatalog(await api<AgentCatalogView[]>('/api/settings/agents/catalog'));
      showToast(tx("扫描完成"));
    } catch (e) {
      setError(errorText(e));
    }
    setScanning(false);
  };

  const byId = new Map(agents?.map((a) => [a.id, a]));
  // 只显示已经有安装计划和网页会话预设的审核条目。
  const entries = (catalog ?? []).filter((entry) => byId.has(entry.id));
  const installed = (id: string) => {
    const status = byId.get(id)?.status;
    return status === 'ok' || status === 'disabled';
  };
  const needle = query.trim().toLocaleLowerCase();
  const visible = entries.filter((entry) =>
    (filter === 'all' || (filter === 'installed' ? installed(entry.id) : entry.region === filter)) &&
    (!needle || [entry.name, entry.publisher, tx(entry.publisher), entry.id, entry.note, tx(entry.note ?? ''), ...entry.commands].join(' ').toLocaleLowerCase().includes(needle)),
  ).sort((a, b) => Number(installed(b.id)) - Number(installed(a.id)));
  const installedCount = entries.filter((entry) => installed(entry.id)).length;
  const connectedCount = entries.filter((entry) => byId.get(entry.id)?.status === 'ok' && byId.get(entry.id)?.probe?.ok).length;
  const installedVisible = visible.filter((entry) => installed(entry.id)).length;
  const moreAgentRowIds = visible.filter((entry) => !installed(entry.id)).map((entry) => `agent-row-${entry.id}`).join(' ');
  const filters = [
    ['all', tx("全部"), entries.length],
    ['installed', tx("已安装"), installedCount],
    ['china', tx("国内"), entries.filter((entry) => entry.region === 'china').length],
    ['global', tx("国外 / 开源"), entries.filter((entry) => entry.region === 'global').length],
  ] as const;

  return (
    <section className="agent-manager" aria-label={tx("Agent 管理")}>
      <header className="shead agent-directory-heading">
        <div className="txt">
          <h2>{tx("Agent 管理")}</h2>
          <p>{tx("管理本机的 Agent，连接常用的模型。")}</p>
        </div>
        <div className="acts">
          <button className="btn btn-quiet" type="button" onClick={() => void checkUpdates(true)} disabled={checking}>
            <Download size={14} />{checking ? tx("正在检查…") : tx("检查更新")}
          </button>
          <button className="btn btn-line" type="button" onClick={rescan} disabled={scanning}>
            <Refresh size={14} />{scanning ? tx("正在扫描…") : tx("扫描本机")}
          </button>
        </div>
      </header>
      {error && <p className="serr">{error}</p>}
      {(!agents || !catalog) && !error && <p className="help">{tx("正在读取…")}</p>}
      {agents && catalog && (
        <>
          <div className="agent-directory-overview">
            <span className="agent-ready-count"><Dot state={connectedCount ? 'ok' : 'idle'} animated={false} /><strong>{connectedCount}</strong>{" " + tx("已连接")}</span>
            <span>{installedCount}{" " + tx("个已安装") + " "}<span aria-hidden="true">/</span> {entries.length}{" " + tx("个 Agent")}</span>
            <span className="agent-directory-hint">{tx("安装后，登录或配置模型，再测试连接")}</span>
          </div>
          <div className="agent-directory-tools">
            <div className="agent-filters" role="group" aria-label={tx("Agent 分类")}>
              {filters.map(([id, label, count]) => (
                <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>
                  {label} <span>{count}</span>
                </button>
              ))}
            </div>
            <label className="agent-search-field">
              <Search size={15} />
              <input ref={searchInput} type="search" aria-label={tx("搜索 Agent")} placeholder={tx("搜索名称或厂商")} value={query} onChange={(event) => { setQuery(event.target.value); setMoreExpanded(Boolean(event.target.value.trim())); }} />
              {query && <button type="button" aria-label={tx("清空 Agent 搜索")} onClick={() => { setQuery(''); setMoreExpanded(false); searchInput.current?.focus(); }}><Close size={14} /></button>}
            </label>
            <span className="sr-only" role="status">{tx('找到了 {0} 个 Agent', [visible.length])}</span>
          </div>
          <ul className="alist agent-directory" ref={list}>
            {visible.map((entry, index) => {
              const a = byId.get(entry.id)!;
              const onToggle = () => setOpen((current) => current === entry.id ? null : entry.id);
              return (
                <Fragment key={a.id}>
                  {(index === 0 || installed(entry.id) !== installed(visible[index - 1].id)) && (
                    <li className="agent-directory-group">
                      <h3>{installed(entry.id) ? tx("本机已安装") : (
                        <button className="agent-group-toggle" type="button" aria-expanded={moreExpanded} aria-controls={moreAgentRowIds} onClick={() => setMoreExpanded((current) => !current)}>
                          <Chevron size={14} />{tx("更多 Agent")}<span className="agent-group-count">{visible.length - installedVisible}</span>
                        </button>
                      )}</h3>
                      {installed(entry.id) && <span>{installedVisible}</span>}
                    </li>
                  )}
                <AgentRow
                  agent={a} catalog={entry}
                  hidden={!installed(entry.id) && !moreExpanded}
                  update={updates?.[a.id] ?? a.update} checking={checking || updates === null}
                  open={open === a.id} onToggle={onToggle} onChange={replace}
                />
                </Fragment>
              );
            })}
          </ul>
          {!visible.length && (
            <div className="agent-no-results" role="status">
              <p>{tx("没有找到匹配的 Agent，试试其他名称或分类。")}</p>
              <button className="btn btn-line" type="button" onClick={() => { setQuery(''); setFilter('all'); setMoreExpanded(false); }}>{tx("显示全部")}</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function AgentRow({
  agent: a,
  catalog,
  hidden,
  update,
  checking,
  open,
  onToggle,
  onChange,
}: {
  agent: AgentSettingsView;
  catalog: AgentCatalogView;
  update: AgentUpdateCheck | undefined;
  checking: boolean;
  hidden: boolean;
  open: boolean;
  onToggle: () => void;
  onChange: (view: AgentSettingsView) => void;
}) {
  useLocale();
  const run = useStore((s) => s.installs[a.id]);
  /** 正在装别的 Agent：一次只做一件 */
  const busy = useStore((s) => Object.entries(s.installs).some(([id, r]) => id !== a.id && r.state.phase === 'running'));
  const [dialog, setDialog] = useState<'install' | 'update' | 'view' | null>(null);
  /** 装好了点“去登录”：展开这一行，打开登录窗口 */
  const [loginNonce, setLoginNonce] = useState(0);
  const hasUpdate = Boolean(update?.outdated.length);
  const runningHere = run?.state.phase === 'running';
  const connection: { label: string; tone: string; lamp: LampState } = runningHere
    ? { label: run.action === 'install' ? tx("安装中") : tx("更新中"), tone: 'working', lamp: 'run' }
    : a.status === 'disabled' ? { label: tx("已停用"), tone: 'muted', lamp: 'idle' }
    : a.status === 'missing' ? { label: tx("未安装"), tone: 'muted', lamp: 'idle' }
    : a.status === 'config-only' ? { label: tx("待安装"), tone: 'pending', lamp: 'wait' }
    : a.probe?.ok ? { label: tx("已连接"), tone: 'ready', lamp: 'ok' }
    : a.probe?.needsLogin ? { label: tx("待登录"), tone: 'pending', lamp: 'wait' }
    : a.probe ? { label: tx("连接异常"), tone: 'error', lamp: 'err' }
    : { label: tx("待测试"), tone: 'pending', lamp: 'idle' };
  const version = a.probe?.version?.match(/(?:^|\s)v?(\d+\.\d+(?:\.\d+)?(?:[-+][\w.-]+)?)(?:\s|$)/)?.[1];
  // 这一行右边直接放的按钮：正在做就“查看”，有新版本就“更新”，没装就“安装”
  const action: { label: string; open: 'install' | 'update' | 'view'; title?: string } | null = runningHere
    ? { label: tx("查看"), open: 'view' }
    : hasUpdate && a.setup?.updateCommand
      ? { label: tx("更新"), open: 'update', title: update!.outdated.map((o) => `${o.name} ${o.from} → ${o.to}`).join('、') }
      : (a.status === 'missing' || a.status === 'config-only') && a.setup?.installCommand
        ? { label: tx("安装"), open: 'install' }
        : null;
  return (
    <li id={`agent-row-${a.id}`} hidden={hidden} className={`arow agent-card a-${a.color}${open ? ' open' : ''}${action ? ' has-action' : ''}`} data-agent={a.id}>
      <div className="arow-top">
        <button type="button" className="arow-head" aria-label={tx("{0} {1} 设置", [open ? tx("收起") : tx("展开"), a.name])} aria-expanded={open} aria-controls={`agent-detail-${a.id}`} onClick={onToggle}>
          <span className="who">
            <span className="agent-card-name"><AgentIcon id={a.id} name={a.name} /><strong>{a.name}</strong>{hasUpdate && !runningHere && <span className="agent-update-note">{tx("可更新")}</span>}</span>
            <span className="agent-card-meta"><span>{tx(catalog.publisher)}</span>{version && <span className="agent-card-version">v{version}</span>}</span>
          </span>
          <span className={`agent-connection is-${connection.tone}`}>
            <Dot state={connection.lamp} animated={Boolean(runningHere)} />{connection.label}
          </span>
          <span className="agent-card-chevron"><Chevron size={14} /></span>
        </button>
        {action && (
          <button
            className="btn btn-sm btn-line agent-card-action"
            type="button"
            title={action.title}
            aria-label={`${action.label} ${a.name}`}
            disabled={action.open !== 'view' && busy}
            onClick={() => setDialog(action.open)}
          >
            {action.label}
          </button>
        )}
      </div>
      {open && (
        <div id={`agent-detail-${a.id}`} role="region" aria-label={tx("{0} 设置", [a.name])}><AgentDetail agent={a} catalog={catalog} update={update} checking={checking} run={run} busy={busy} loginNonce={loginNonce} onChange={onChange} onRun={setDialog} /></div>
      )}
      {dialog && (
        <InstallDialog
          agent={a}
          action={dialog}
          onClose={() => setDialog(null)}
          onLogin={() => {
            setDialog(null);
            if (!open) onToggle();
            setLoginNonce((n) => n + 1);
          }}
        />
      )}
    </li>
  );
}

function AgentDetail({
  agent: a,
  catalog,
  update,
  checking,
  run,
  busy: installBusy,
  loginNonce,
  onChange,
  onRun,
}: {
  agent: AgentSettingsView;
  catalog: AgentCatalogView;
  update: AgentUpdateCheck | undefined;
  checking: boolean;
  /** 这个 Agent 最近一次安装、更新 */
  run: InstallRunView | undefined;
  /** 正在装别的 Agent */
  busy: boolean;
  /** 变了就打开登录窗口（装好后点了“去登录”） */
  loginNonce: number;
  onChange: (view: AgentSettingsView) => void;
  onRun: (action: 'install' | 'update' | 'view') => void;
}) {
  useLocale();
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [probeDetailsOpen, setProbeDetailsOpen] = useState(!a.probe?.ok);
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  /** 打开登录窗口时直接选好哪种方式（从“模型供应商”点“打开设置向导”） */
  const [loginMethod, setLoginMethod] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!loginNonce) return;
    setLoginMethod(undefined);
    setLoggingIn(true);
  }, [loginNonce]);

  const save = async (patch: Patch, done: string): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      onChange(await api<AgentSettingsView>(`/api/settings/agents/${a.id}`, patch));
      showToast(done);
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setProbeDetailsOpen(true);
    setTesting(true);
    setError(null);
    try {
      onChange(await api<AgentSettingsView>(`/api/settings/agents/${a.id}/test`, {}));
    } catch (e) {
      setError(errorText(e));
    }
    setTesting(false);
  };

  // 登录状态看最近一次测试连接；登录方式是 Agent 握手时报的。
  // 更新前测的旧结果里没有 authMethods 这一项，要重新测一次才知道怎么登录
  const methods = a.probe?.authMethods ?? [];
  const stale = Boolean(a.probe) && a.probe?.authMethods === undefined;
  const checked: { text: string; tone: string; help: string } = !a.probe
    ? { text: tx("还不知道"), tone: '', help: tx("点下面的“测试连接”，就知道它登录没有、支持哪些登录方式。") }
    : stale
      ? { text: tx("要重新测试"), tone: '', help: tx("下面是更新前的测试结果，那时还不记登录方式。点“测试连接”再测一次。") }
      : a.probe.ok
        ? { text: tx("已登录"), tone: 'ok', help: methods.length ? tx("想换账号、换 Key 或换模型供应商，点“重新登录”。") : '' }
        : a.probe.needsLogin
          ? {
              text: tx("还没登录"),
              tone: 'bad',
              help: methods.length
                ? tx("点“登录”，用它自己提供的方式登录。")
                : tx("它没有提供网页上的登录方式，请在服务器终端里登录或配置模型供应商。"),
            }
          : methods.length
            ? { text: tx("没连上"), tone: 'bad', help: tx("先看下面测试连接卡在哪一步。也可以点“登录”，在里面把它配置好再测。") }
            : { text: tx("没连上"), tone: 'bad', help: tx("它没能启动起来，所以还不知道怎么登录。先看下面测试连接卡在哪一步，处理好再测一次。") };
  // 第三方接口和 Agent 原生订阅登录是两种配置；切换原生账号前先恢复原有配置。
  const login =
    a.provider
      ? { text: a.probe?.ok ? tx("Agent 连接已通过") : tx("使用接口 Key"), tone: a.probe?.ok ? 'ok' : '', help: tx("当前使用 {0} 的接口配置。要使用原生订阅账号，先在“模型接入”中恢复 Agent 原有配置。", [a.provider.name]) }
      : checked;

  return (
    <div className="detail">
      {a.statusText && a.status !== 'ok' && <p className="help agent-detail-note">{a.statusText}</p>}
      <div className="frow agent-capabilities-row">
        <span className="k">{tx("连接能力")}</span>
        <div>
          {a.probe?.ok && a.probe.caps ? <div className="agent-capabilities">{([
            [tx("历史会话"), a.probe.caps.history], [tx("接着聊"), a.probe.caps.resume], [tx("切换模型"), a.probe.caps.models], [tx("图片"), a.probe.caps.images],
          ] as const).map(([label, supported]) => <span key={label} className={supported ? 'supported' : ''}><span aria-hidden="true">{supported ? '✓' : '—'}</span> {label}<span className="sr-only">{supported ? tx("，支持") : tx("，不支持")}</span></span>)}</div> : <p className="help">{tx("测试连接后，显示这个 Agent 支持的能力。")}</p>}
        </div>
      </div>
      {a.status !== 'missing' && <section className="agent-detail-section agent-account-section" aria-label={tx("账号与用量")}>
        <h4 className="agent-section-title">{tx("账号与用量")}</h4>
        <div className="frow">
          <span className="k">{tx("登录")}</span>
          <div>
            <div className="login-line">
              <span className={`lstate ${login.tone}`}>{login.text}</span>
              {methods.length > 0 && login === checked && (
                <button
                  className="btn btn-line btn-sm"
                  type="button"
                  onClick={() => {
                    setLoginMethod(undefined);
                    setLoggingIn(true);
                  }}
                >
                  {a.probe?.ok ? tx("重新登录") : tx("登录")}
                </button>
              )}
            </div>
            {login.help && <p className="help">{login.help}</p>}
          </div>
        </div>
        {a.quota && a.status === 'ok' && <QuotaRow agentId={a.id} />}
      </section>}

      <section className="agent-detail-section agent-model-section" aria-label={tx("模型接入")}>
        <h4 className="agent-section-title">{tx("模型接入")}</h4>
        <ProviderRow
          agent={a}
          busy={busy}
          save={save}
          saveError={error}
          onSaved={() => { if (a.status !== 'missing' && a.status !== 'config-only') void test(); }}
          onNative={(methodId) => {
            setLoginMethod(methodId);
            setLoggingIn(true);
          }}
        />
        {loggingIn && <LoginDialog agent={a} initialMethod={loginMethod} onClose={() => setLoggingIn(false)} onDone={() => void test()} />}

        {a.configFile && !a.provider && (
          <div className="frow">
            <span className="k">{tx("当前模型")}</span>
            <div className="agent-current-model">
              <div className="cur-model">{!a.configFile.exists ? tx("没有配置文件") : (a.configFile.model ?? tx("Agent 自己的默认"))}</div>
              <details className="agent-config-source agent-inline-details">
                <summary>{tx("配置来源")}<Chevron size={12} /></summary>
                <p className="help">{tx("读自") + " "}<code>{a.configFile.path}</code>{tx("（只读，不会改它）。Agent 只在启动时读配置：改了模型，开着的会话不变，新开的会话才生效。")}</p>
              </details>
            </div>
          </div>
        )}
      </section>

      <details className="agent-runtime-details" open={a.status === 'missing' || a.status === 'config-only' || run?.state.phase === 'running' || run?.state.phase === 'failed' || Boolean(update?.outdated.length)}>
        <summary><span>{tx("运行信息")}</span><span className="agent-runtime-version">{a.setup?.versions.map((v) => `${v.name} ${v.version}`).join(' · ')}</span><Chevron size={14} /></summary>
        <div className="agent-runtime-content">
          <SetupRow agent={a} update={update} checking={checking} run={run} busy={installBusy} onRun={onRun} />
          <div className="frow">
            <span className="k">{tx("启动命令")}</span>
            <div><code className="cmdline">{a.command}</code></div>
          </div>
          {(catalog.note || catalog.website) && <div className="frow">
            <span className="k">{tx("项目资料")}</span>
            <div>
              {catalog.note && <p className="help">{tx(catalog.note)}</p>}
              {catalog.website && <a className="btn btn-line btn-sm" href={catalog.website} target="_blank" rel="noopener noreferrer">{tx("官网与文档 ↗")}</a>}
            </div>
          </div>}
        </div>
      </details>

      <div className="frow agent-enable-row">
        <span className="k">{tx("启用")}</span>
        <div className="agent-enable-content">
          <p className="help">{tx("停用后不出现在“启动 Agent”菜单和历史会话里，开着的会话不受影响。")}</p>
          <label className="switch" title={a.enabled ? tx("点一下停用") : tx("点一下启用")}>
            <input
              type="checkbox"
              checked={a.enabled}
              disabled={busy}
              aria-label={tx("启用 {0}", [a.name])}
              onChange={(event) => void save({ enabled: event.target.checked }, event.target.checked ? tx("已启用 {0}", [a.name]) : tx("已停用 {0}", [a.name]))}
            />
            <i />
          </label>
        </div>
      </div>

      {error && <p className="serr">{error}</p>}
      <div className="dfoot">
        <button className="btn btn-line" type="button" disabled={testing || a.status === 'missing'} onClick={test}>
          {testing ? tx("正在测试…") : tx("测试连接")}
        </button>
        {a.probe && !testing && <span className="when">{tx("上次测试：")}{ago(a.probe.at)}</span>}
      </div>
      {(testing || a.probe) && (
        <details className="agent-probe-details agent-inline-details" open={probeDetailsOpen} onToggle={(event) => setProbeDetailsOpen(event.currentTarget.open)}>
          <summary>{tx("连接详情")}<Chevron size={12} /></summary>
          {testing ? (
            <p className="probe-run">{tx("正在测试：启动进程 → 握手 → 新建会话。第一次用 npx 启动的 Agent 要先下载，会慢一些。")}</p>
          ) : (
            a.probe && <ProbeView probe={a.probe} />
          )}
        </details>
      )}
    </div>
  );
}

const STEPS: [ProbeResult['steps'][number]['key'], string][] = localizedLabels([
  ['spawn', '启动进程'],
  ['initialize', '握手'],
  ['session', '新建会话'],
]);

function seconds(ms: number): string {
  return ms < 1000 ? tx("{0} 毫秒", [ms]) : tx("{0} 秒", [(ms / 1000).toFixed(1)]);
}

/** 安装、版本：没装的一键安装；装好的显示版本，有新版本时一键更新 */
function SetupRow({
  agent: a,
  update,
  checking,
  run,
  busy,
  onRun,
}: {
  agent: AgentSettingsView;
  update: AgentUpdateCheck | undefined;
  checking: boolean;
  run: InstallRunView | undefined;
  busy: boolean;
  onRun: (action: 'install' | 'update' | 'view') => void;
}) {
  useLocale();
  const s = a.setup;
  const missing = a.status === 'missing' || a.status === 'config-only';
  if (!s) {
    // 对照表里没写网页上怎么装：只给手动安装的说明
    return missing && a.install ? (
      <div className="frow">
        <span className="k">{tx("安装")}</span>
        <div>
          <p className="help">{tx("在服务器上运行") + " "}<code>{a.install}</code>
          </p>
        </div>
      </div>
    ) : null;
  }
  const versions = s.versions.map((v) => `${v.name} ${v.version}`).join(' · ');
  const runVerb = run?.action === 'install' ? tx("安装") : tx("更新");
  // 正在做、或者上一次没成功：说一声，可以打开窗口看输出
  const runLine =
    run?.state.phase === 'running' ? (
      <div className="setup-line">
        <span className="lwait">{tx("正在")}{runVerb}…</span>
        <button className="btn btn-line btn-sm" type="button" onClick={() => onRun('view')}>{tx("查看")}</button>
      </div>
    ) : run?.state.phase === 'failed' ? (
      <div className="setup-line">
        <span className="serr">{tx("上次")}{runVerb}{tx("没成功")}</span>
        <button className="btn btn-quiet btn-sm" type="button" onClick={() => onRun('view')}>{tx("查看输出")}</button>
      </div>
    ) : null;
  const running = run?.state.phase === 'running';
  const busyTitle = busy ? tx("正在装别的 Agent，一次只做一件") : undefined;
  let body: ReactNode;
  if (s.how === 'bundled') {
    body = (
      <>
        <div className="cur-model">{versions || tx("项目自带")}</div>
        <p className="help">{tx("项目自带，跟着 Fika Desk 一起安装和更新。")}</p>
      </>
    );
  } else if (missing) {
    body = s.installCommand ? (
      <>
        <div className="setup-line">
          <span className="lstate bad">{tx("还没装")}</span>
          <button className="btn btn-ink btn-sm" type="button" disabled={busy || running} title={busyTitle} onClick={() => onRun('install')}>{tx("安装")}</button>
        </div>
        <p className="help">{tx("会在服务器上运行") + " "}<code>{s.installCommand}</code>
        </p>
      </>
    ) : (
      <>
        <div className="setup-line">
          <span className="lstate bad">{tx("还没装")}</span>
        </div>
        {a.install && (
          <p className="help">{tx("手动安装：")}<code>{a.install}</code>
          </p>
        )}
      </>
    );
  } else {
    const outdated = update?.outdated ?? [];
    const text =
      s.how === 'script'
        ? s.updateCommand ? tx("更新时会运行：{0}", [s.updateCommand]) : null
        : s.note
          ? null
          : update?.error
            ? tx("检查更新没成功：{0}", [update.error])
            : outdated.length
              ? tx("有新版本：{0}", [outdated.map((o) => `${o.name} ${o.from} → ${o.to}`).join('、')])
              : update
                ? tx("已经是最新版本（{0}查的）", [ago(update.at)])
                : checking
                  ? tx("正在检查有没有新版本…")
                  : '';
    body = (
      <>
        <div className="setup-line">
          {versions && <span className="cur-model">{versions}</span>}
          {s.updateCommand && (s.how === 'script' || outdated.length > 0) && (
            <button
              className={`btn ${outdated.length ? 'btn-ink' : 'btn-line'} btn-sm`}
              type="button"
              disabled={busy || running}
              title={busyTitle}
              onClick={() => onRun('update')}
            >{tx("更新")}</button>
          )}
        </div>
        {text && <p className={`help${outdated.length ? ' upd-text' : ''}`}>{text}</p>}
      </>
    );
  }
  return (
    <div className="frow">
      <span className="k">{missing ? tx("安装") : tx("版本")}</span>
      <div>
        {runLine}
        {!running && body}
        {!running && s.note && <p className="help">{tx(s.note)}</p>}
      </div>
    </div>
  );
}

/** 账号用量（目前只有 Codex）：订阅账号显示每个额度窗口剩多少、什么时候重置 */
function QuotaRow({ agentId }: { agentId: string }) {
  useLocale();
  const quota = useStore((s) => s.quotas[agentId]);
  const [loading, setLoading] = useState(false);
  const load = async (force: boolean) => {
    setLoading(true);
    try {
      // 读到的结果也会通过实时连接推给所有页面，这里不用另外处理
      await api(`/api/settings/agents/${agentId}/quota${force ? '?force=1' : ''}`);
    } catch {
      // 读不到就保持原样
    }
    setLoading(false);
  };
  useEffect(() => {
    void load(false);
  }, [agentId]);

  let body;
  if (!quota) body = <p className="help">{loading ? tx("正在读取…") : tx("还没读到。")}</p>;
  else if (quota.kind === 'api-key') body = <div className="cur-model">{tx("用 API Key 登录：按用量计费，没有额度限制")}</div>;
  else if (quota.kind === 'unknown') body = <p className="help">{tx("读不到用量")}{quota.error ? `：${quota.error}` : ''}</p>;
  else
    body = (
      <div className="quota-box">
        {quota.windows.map((w) => {
          const left = Math.max(0, Math.round(100 - w.usedPercent));
          return (
            <div key={w.label} className="q-win">
              <span className="q-l">{w.label}</span>
              <span className="q-bar" role="meter" aria-label={w.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, left)} aria-valuetext={tx("剩余 {0}%", [left])}>
                <i className={left < 10 ? 'low' : left < 25 ? 'warn' : undefined} style={{ width: `${left}%` }} />
              </span>
              <span className="q-v">{tx("剩") + " "}{left}%</span>
              {w.resetsAt && <span className="q-r">{resetText(w.resetsAt)}{" " + tx("重置")}</span>}
            </div>
          );
        })}
        {Boolean(quota.credits || quota.resetCredits) && (
          <p className="help">
            {[quota.credits && tx("积分 {0}", [quota.credits]), quota.resetCredits && tx("还有 {0} 次免费重置额度", [quota.resetCredits])].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    );

  return (
    <div className="frow">
      <span className="k">{tx("账号用量")}</span>
      <div className="agent-quota-content">
        <div className="agent-quota-heading">
          <span className="q-plan">{quota?.kind === 'subscription' && quota.plan ? `ChatGPT ${quota.plan} ${tx("账号")}` : tx("账号用量")}</span>
          <div className="agent-quota-actions">
            {quota && <span className="when">{ago(quota.at)}{tx("读的")}</span>}
            <button className="btn btn-quiet btn-sm" type="button" disabled={loading} onClick={() => void load(true)}>
              {loading ? tx("正在读取…") : tx("刷新")}
            </button>
          </div>
        </div>
        {body}
      </div>
    </div>
  );
}

function ProbeView({ probe }: { probe: ProbeResult }) {
  useLocale();
  return (
    <div className="probe-wrap">
      <ol className="probe">
        {STEPS.map(([key, label]) => {
          const step = probe.steps.find((s) => s.key === key);
          return (
            <li key={key} className={step ? (step.ok ? 'ok' : 'bad') : 'skip'}>
              <span className="pm">{step ? (step.ok ? '✓' : '✗') : '·'}</span>
              <span className="pl">{label}</span>
              <span className="ms">{step ? seconds(step.ms) : tx("没走到")}</span>
              <span className="err">{step?.error ?? ''}</span>
            </li>
          );
        })}
      </ol>
      {probe.ok && (
        <p className="probe-sum">{tx("连接成功")}{probe.version ? `：${probe.version}` : ''}
          {probe.currentModel ? tx("，当前模型 {0}", [probe.currentModel]) : ''}
        </p>
      )}
      {probe.needsLogin && (
        <p className="help">{tx("这个 Agent 在服务器上还没登录。通过上面的“登录”或服务器终端完成登录，然后再测一次。")}</p>
      )}
      {probe.detail && <pre className="probe-detail">{probe.detail}</pre>}
    </div>
  );
}
