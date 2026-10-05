import { tx, useLocale } from '../../i18n';
// 模型接入：兼容接口在网页保存；账号订阅和原生向导交给各 Agent 自己管理。
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MODEL_PROVIDERS, providerModels, providerContext, type ProviderPreset } from '../../../../shared/providers';
import { MODEL_APIS, type ModelApi, type ModelBilling, type ModelProviderInput } from '../../../../shared/model-access';
import type { AgentSettingsView, ProviderTestResult } from '../../../../shared/types';
import { api } from '../../api';
import { Select } from '../Select';
import { Chevron } from '../Icons';

type ProviderPatch = ModelProviderInput | null;
type ProviderProps = {
  agent: AgentSettingsView;
  busy: boolean;
  save: (patch: { provider: ProviderPatch }, done: string) => Promise<boolean>;
  onSaved: () => void;
  onNative: (methodId?: string) => void;
  saveError?: string | null;
};

const errorText = (e: unknown) => (e instanceof Error ? e.message : tx("出错了，稍后再试"));
const normalizedUrl = (url: string) => url.trim().replace(/\/+$/, '');
const billingName = (billing: ModelBilling) => billing === 'subscription' ? tx("编程套餐 / Coding Plan Key") : tx("按 API 用量计费");
const apiName = (value: ModelApi) => tx(MODEL_APIS.find((item) => item.id === value)?.name ?? value);
const choicesFor = (wire: ModelApi, billing: ModelBilling, agentId: string) => MODEL_PROVIDERS.filter((p) => p.id === 'custom' || (p.api === wire && p.billing === billing && (!p.agents || p.agents.includes(agentId))));

export function ProviderRow(props: ProviderProps) {
  useLocale();
  const { agent: a } = props;
  const access = a.modelAccess;
  const originalRequired = access?.mode === 'direct' && Boolean(a.provider);
  return (
    <div className="frow model-access-row">
      <span className="k">{tx("模型接入")}</span>
      <div className="model-access-content">
        {access?.mode === 'direct' && access.apis.length > 0 && <DirectProvider {...props} />}
        <p className="help top">{access ? tx(access.description) : tx("使用 Agent 自己的配置和账号登录。测试连接后，可以查看它提供的登录方式。")}</p>
        {access?.mode === 'direct' ? <details className="model-access-alternatives agent-inline-details">
          <summary>{tx("原生登录与配置文档")}<Chevron size={12} /></summary>
          <NativeAccess {...props} />
        </details> : <NativeAccess {...props} />}
        {originalRequired && <p className="help">{tx("要改用原生订阅账号，先点“使用 Agent 原有配置”，再登录账号。")}</p>}
      </div>
    </div>
  );
}

function NativeAccess({ agent: a, busy, onNative }: ProviderProps) {
  useLocale();
  const access = a.modelAccess;
  const missing = a.status === 'missing' || a.status === 'config-only';
  const methods = a.probe?.authMethods ?? [];
  const setups = access?.setups ?? [];
  const showLoginMethods = methods.length > 0 || setups.length === 0;
  const loginLabel = setups.some((setup) => setup.name === '原生账号登录') ? tx("其他登录方式") : tx("原生账号登录");
  const originalRequired = access?.mode === 'direct' && Boolean(a.provider);
  return (
    <div className="model-access-native">
      {access?.mode === 'direct' && <p className="help">{tx("也可以使用 Agent 原有配置或原生账号登录。订阅账号凭据由 Agent 自己保管。")}</p>}
      {setups.map((setup) => (
        <div key={setup.id}>
          <button className="btn btn-line btn-sm" type="button" disabled={busy || missing || originalRequired} onClick={() => onNative(setup.id)}>
            {tx(setup.name)}
          </button>
          <p className="help">{tx(setup.description)}</p>
        </div>
      ))}
      <div className="lbtns">
        {showLoginMethods && <button className="btn btn-line btn-sm" type="button" disabled={busy || missing || originalRequired || methods.length === 0} onClick={() => onNative()}>
          {loginLabel}
        </button>}
        {access?.docsUrl && <a className="btn btn-line btn-sm" href={access.docsUrl} target="_blank" rel="noopener noreferrer">{tx("配置文档 ↗")}</a>}
      </div>
      {missing ? (
        <p className="help">{tx("先安装") + " "}{a.name}{tx("，再打开原生登录或配置向导。")}{access?.mode === 'direct' && tx("兼容接口配置可以先保存。")}</p>
      ) : methods.length === 0 && (
        <p className="help">{tx("测试连接后，才能查看当前 Agent 提供的账号登录方式。")}{access?.setups.length ? tx("原生向导可以直接打开。") : tx("也可以按配置文档使用 Agent 自己的设置。")}</p>
      )}
      {access?.mode !== 'direct' && <p className="help">{tx("账号授权和凭据由") + " "}{a.name}{" " + tx("自己管理。打开窗口后，点开始才会运行登录或设置向导。")}</p>}
    </div>
  );
}

function DirectProvider({ agent: a, busy, save, onSaved, saveError }: ProviderProps) {
  useLocale();
  const current = a.provider ?? null;
  const allowed = a.modelAccess!.apis;
  const supportsContextWindow = a.modelAccess.supportsContextWindow !== false;
  const defaultInfo = MODEL_PROVIDERS.find((p) => p.id !== 'custom' && allowed.includes(p.api) && p.profiles?.[a.id]?.models.length)
    ?? MODEL_PROVIDERS.find((p) => p.id !== 'custom' && allowed.includes(p.api)) ?? MODEL_PROVIDERS.find((p) => p.id === 'custom')!;
  const defaultModel = providerModels(defaultInfo, a.id)[0] ?? '';
  const [editing, setEditing] = useState(false);
  const [preset, setPreset] = useState(current?.preset ?? defaultInfo.id);
  const [wire, setWire] = useState<ModelApi>(current?.api ?? defaultInfo.api);
  const [billing, setBilling] = useState<ModelBilling>(current?.billing ?? defaultInfo.billing);
  const [baseUrl, setBaseUrl] = useState(current?.baseUrl ?? defaultInfo.baseUrl);
  const [model, setModel] = useState(current?.model ?? defaultModel);
  const [contextWindow, setContextWindow] = useState(String(current?.contextWindow ?? providerContext(defaultInfo, defaultModel, a.id) ?? ''));
  const [search, setSearch] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [working, setWorking] = useState<'test' | 'save' | 'reset' | null>(null);
  const lock = useRef(false);
  const [result, setResult] = useState<ProviderTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedSave, setFailedSave] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const pending = busy || working !== null;
  const activeError = error ?? (failedSave ? saveError ?? tx("没能保存，请检查配置后重试。") : null);
  useEffect(() => { if (activeError) errorRef.current?.focus(); }, [activeError]);

  const info = MODEL_PROVIDERS.find((p) => p.id === preset) ?? MODEL_PROVIDERS.find((p) => p.id === 'custom')!;
  const choices = choicesFor(wire, billing, a.id);
  const query = search.trim().toLocaleLowerCase();
  const matches = choices.filter((p) => p.id !== 'custom' && (!query || `${p.name} ${tx(p.name)} ${p.baseUrl} ${p.models.join(' ')}`.toLocaleLowerCase().includes(query)));
  const visibleChoices = choices.filter((p) => p.id === 'custom' || p.id === preset || matches.includes(p));
  const suggestions = [...new Set([...providerModels(info, a.id), ...(result?.models ?? [])])];
  const keepKey = Boolean(current) && current?.preset === preset && current?.api === wire && current?.billing === billing && normalizedUrl(current.baseUrl) === normalizedUrl(baseUrl) && !apiKey.trim();
  const clearFeedback = () => { setResult(null); setError(null); setFailedSave(false); setFeedback(null); };
  const begin = () => {
    setPreset(current?.preset ?? defaultInfo.id);
    setWire(current?.api ?? defaultInfo.api);
    setBilling(current?.billing ?? defaultInfo.billing);
    setBaseUrl(current?.baseUrl ?? defaultInfo.baseUrl);
    setModel(current?.model ?? defaultModel);
    setContextWindow(String(current?.contextWindow ?? providerContext(defaultInfo, defaultModel, a.id) ?? ''));
    setSearch('');
    setApiKey('');
    clearFeedback();
    setEditing(true);
  };
  const pick = (next: ProviderPreset, nextWire = next.api, nextBilling = next.billing) => {
    setPreset(next.id);
    setWire(nextWire);
    setBilling(nextBilling);
    setBaseUrl(next.baseUrl);
    const nextModel = providerModels(next, a.id)[0] ?? '';
    setModel(nextModel);
    setContextWindow(String(providerContext(next, nextModel, a.id) ?? ''));
    setApiKey('');
    clearFeedback();
  };
  const chooseWire = (next: ModelApi) => {
    setSearch('');
    if (preset === 'custom') { setWire(next); setApiKey(''); clearFeedback(); return; }
    pick(choicesFor(next, billing, a.id)[0], next, billing);
  };
  const chooseBilling = (next: ModelBilling) => {
    setSearch('');
    if (preset === 'custom') { setBilling(next); setApiKey(''); clearFeedback(); return; }
    pick(choicesFor(wire, next, a.id)[0], wire, next);
  };
  const input = (): ModelProviderInput | null => {
    if (!baseUrl.trim()) { setError(tx("填写供应商的接口地址。")); return null; }
    if (!model.trim()) { setError(tx("填写模型名。")); return null; }
    if (!apiKey.trim() && !keepKey) { setError(tx("填写 API Key；更换接口地址、协议或套餐后需要重新提供 Key。")); return null; }
    const context = supportsContextWindow && contextWindow.trim() ? Number(contextWindow) : undefined;
    if (context !== undefined && (!Number.isSafeInteger(context) || context < 1024 || context > 10_000_000)) { setError(tx("上下文长度要填 1024 到 10000000 之间的整数，或留空使用默认。")); return null; }
    return { preset, api: wire, billing, baseUrl, model, apiKey, ...(context === undefined ? {} : { contextWindow: context }) };
  };
  const start = (kind: 'test' | 'save' | 'reset') => {
    if (lock.current || busy) return false;
    lock.current = true;
    setWorking(kind);
    setError(null);
    setFailedSave(false);
    setFeedback(null);
    return true;
  };
  const finish = () => { lock.current = false; setWorking(null); };
  const test = async () => {
    const body = input();
    if (!body || !start('test')) return;
    setResult(null);
    try {
      setResult(await api<ProviderTestResult>(`/api/settings/agents/${a.id}/provider-test`, body));
    } catch (e) {
      setError(errorText(e));
    } finally { finish(); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body = input();
    if (!body || !start('save')) return;
    try {
      if (await save({ provider: body }, tx("{0} 的模型接入配置已保存", [a.name]))) {
        setEditing(false);
        setApiKey('');
        setFeedback(a.status === 'missing' || a.status === 'config-only' ? tx("已保存。安装 Agent 后测试连接，新开的会话会使用此配置。") : tx("已保存。新开的会话会使用此配置。"));
        onSaved();
      } else setFailedSave(true);
    } catch (e) { setError(errorText(e)); } finally { finish(); }
  };
  const reset = async () => {
    if (!start('reset')) return;
    try {
      if (await save({ provider: null }, tx("{0} 已使用原有模型配置", [a.name]))) {
        setFeedback(tx("已恢复使用 Agent 原有配置，新开的会话会生效。"));
        onSaved();
      } else setFailedSave(true);
    } catch (e) { setError(errorText(e)); } finally { finish(); }
  };

  if (!editing) return (
    <div className="model-access-summary">
      <div className="model-access-actions">
        <span className="cur-model">{current ? `${current.name} · ${current.model}` : tx("使用 Agent 原有配置")}</span>
        <button className="btn btn-line btn-sm" type="button" disabled={pending} onClick={begin}>{current ? tx("修改模型配置") : tx("配置兼容接口")}</button>
        {current && <button className="btn btn-quiet btn-sm" type="button" disabled={pending} onClick={() => void reset()}>{working === 'reset' ? tx("正在恢复…") : tx("使用 Agent 原有配置")}</button>}
      </div>
      {current && <p className="help">{apiName(current.api)} · {billingName(current.billing)}<br />{current.baseUrl}{current.keyTail ? tx(" · Key 末尾 {0}", [current.keyTail]) : ''}</p>}
      {feedback && <p className="help model-access-feedback" role="status">{feedback}</p>}
      {activeError && <p className="serr" role="alert" tabIndex={-1} ref={errorRef}>{activeError}</p>}
    </div>
  );

  const id = (name: string) => `${a.id}-prov-${name}`;
  return (
    <form className="prov-form model-access-form" onSubmit={submit} aria-label={tx("{0} 模型配置", [a.name])}>
      <label htmlFor={id('api')}>{tx("接口类型")}</label>
      <Select id={id('api')} className="sel" label={tx("接口类型")} value={wire} disabled={pending}
        options={MODEL_APIS.filter((item) => allowed.includes(item.id)).map((item) => ({ value: item.id, name: tx(item.name) }))} onChange={(value) => chooseWire(value as ModelApi)} />
      <label htmlFor={id('billing')}>{tx("计费方式")}</label>
      <Select id={id('billing')} className="sel" label={tx("计费方式")} value={billing} disabled={pending}
        options={[{ value: 'api', name: tx("API 用量计费") }, { value: 'subscription', name: tx("编程套餐 / Coding Plan Key") }]} onChange={(value) => chooseBilling(value as ModelBilling)} />
      <label htmlFor={id('search')}>{tx("供应商搜索")}</label>
      <input id={id('search')} className="inp" type="search" value={search} disabled={pending} autoComplete="off" placeholder={tx("搜索名称、地址或模型")} aria-describedby={id('search-help')}
        onChange={(event) => setSearch(event.target.value)} />
      <label htmlFor={id('preset')}>{tx("供应商")}</label>
      <Select id={id('preset')} className="sel" label={tx("供应商")} value={preset} disabled={pending}
        options={visibleChoices.map((p) => ({ value: p.id, name: tx(p.name), description: p.baseUrl || tx("填写自己的接口地址与模型") }))} onChange={(value) => pick(MODEL_PROVIDERS.find((p) => p.id === value)!, wire, billing)} />
      <div className="prov-wide"><p className="help" id={id('search-help')} role="status">{matches.length ? tx("当前协议和计费方式下找到 {0} 个供应商预设。", [matches.length]) : tx("没有匹配的供应商，试试其他名称，或选择“其他兼容接口”填写地址。")}</p></div>
      {info.endpointCandidates && info.endpointCandidates.length > 1 && <>
        <label htmlFor={id('endpoint')}>{tx("预设备用地址")}</label>
        <Select id={id('endpoint')} className="sel" label={tx("预设备用地址")} value={info.endpointCandidates.includes(normalizedUrl(baseUrl)) ? normalizedUrl(baseUrl) : ''} disabled={pending}
          options={[{ value: '', name: tx("手动填写接口地址") }, ...info.endpointCandidates.map((url) => ({ value: url, name: url }))]}
          onChange={(value) => { if (value) { setBaseUrl(value); setApiKey(''); clearFeedback(); } }} />
      </>}
      <label htmlFor={id('url')}>{tx("接口地址")}</label>
      <input id={id('url')} className="inp mono" value={baseUrl} disabled={pending} spellCheck={false} placeholder="https://…" autoComplete="off"
        onChange={(event) => { setBaseUrl(event.target.value); clearFeedback(); }} />
      <label htmlFor={id('key')}>API Key</label>
      <input id={id('key')} className="inp mono" type="password" autoComplete="off" spellCheck={false} value={apiKey} disabled={pending}
        aria-describedby={id('key-help')} placeholder={keepKey ? tx("已保存{0}；不换就留空", [current?.keyTail ? tx("，末尾 {0}", [current.keyTail]) : '']) : tx("粘贴这个接口的 Key")}
        onChange={(event) => { setApiKey(event.target.value); clearFeedback(); }} />
      <div className="prov-wide"><p className="help" id={id('key-help')}>{keepKey ? tx("留空保留这个接口已保存的 Key。") : current && !apiKey.trim() ? tx("接口地址、协议或套餐已变更，需要重新提供 Key。") : tx("这里保存 API 或编程套餐 Key；订阅账号授权请使用原生账号登录。")}</p></div>
      <label htmlFor={id('model')}>{tx("模型")}</label>
      <input id={id('model')} className="inp mono" list={id('models')} value={model} disabled={pending} spellCheck={false} placeholder={tx("供应商文档中的模型 ID")}
        onChange={(event) => {
          const value = event.target.value;
          const previousDefault = providerContext(info, model, a.id);
          if (!contextWindow || contextWindow === String(previousDefault ?? '')) setContextWindow(String(providerContext(info, value, a.id) ?? ''));
          setModel(value); clearFeedback();
        }} />
      <datalist id={id('models')}>{suggestions.map((m) => <option key={m} value={m} />)}</datalist>
      <label htmlFor={id('context')}>{tx("上下文")}</label>
      <input id={id('context')} className="inp mono" type="number" min="1024" max="10000000" step="1" inputMode="numeric" value={supportsContextWindow ? contextWindow : ''} disabled={pending || !supportsContextWindow}
        placeholder={supportsContextWindow ? tx("留空使用默认") : tx("由 Agent 管理")} aria-describedby={id('context-help')}
        onChange={(event) => { setContextWindow(event.target.value); clearFeedback(); }} />
      <div className="prov-wide">
        <p className="help" id={id('context-help')}>{supportsContextWindow ? tx("按所选模型填写上下文 token 数；留空使用预设或 Agent 默认，切换模型时以供应商文档为准。") : tx("此 Agent 使用自身的上下文设置。")}</p>
        {info.help && <p className="help">{tx(info.help)}</p>}
        {info.docsUrl && <a className="model-access-doc" href={info.docsUrl} target="_blank" rel="noopener noreferrer">{tx("供应商文档 ↗")}</a>}
        {!info.docsUrl && info.websiteUrl && <a className="model-access-doc" href={info.websiteUrl} target="_blank" rel="noopener noreferrer">{tx("供应商网站 ↗")}</a>}
        {activeError && <p className="serr" id={id('error')} role="alert" tabIndex={-1} ref={errorRef}>{activeError}</p>}
        <div className="lbtns">
          <button className="btn btn-line btn-sm" type="button" disabled={pending} onClick={() => void test()}>{working === 'test' ? tx("正在检查…") : tx("检查接口")}</button>
          <button className="btn btn-ink btn-sm" type="submit" disabled={pending}>{working === 'save' ? tx("正在保存…") : tx("保存配置")}</button>
          <button className="btn btn-quiet btn-sm" type="button" disabled={pending} onClick={() => { setEditing(false); setApiKey(''); clearFeedback(); }}>{tx("取消")}</button>
        </div>
        {result && <ul className="prov-test model-access-test" aria-live="polite">{result.steps.map((s, index) => {
          const level = s.level ?? (s.ok ? 'ok' : 'error');
          return <li key={index} className={level === 'error' ? 'bad' : level}>{level === 'warning' ? '!' : level === 'error' ? '✗' : '✓'} {s.text}</li>;
        })}</ul>}
        <p className="help">{tx("接口检查读取模型列表并提交空体协议校验，不发送对话内容；实际模型权限和订阅额度需进一步确认。列出的模型仅作参考，不代表当前 Key 都有权限。Key 只保存在服务器上，保存后新开的会话才生效。")}</p>
      </div>
    </form>
  );
}
