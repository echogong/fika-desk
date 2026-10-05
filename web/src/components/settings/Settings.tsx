import { tx, useLocale, localizedLabels } from '../../i18n';
// 设置页：占右侧窗口区，左侧栏不动。
// Agent、工作区、语言、安全、关于；配色在侧栏直接切换。
import { useEffect, useState } from 'react';
import type { AboutView } from '../../../../shared/types';
import { api } from '../../api';
import { duration, tildify } from '../../format';
import { setState, useStore, type SettingsTab } from '../../store';
import { AgentTab } from './AgentTab';
import { LanguageTab } from './LanguageTab';
import { SecurityTab } from './SecurityTab';
import { WorkspaceTab } from './WorkspaceTab';

const TABS: [SettingsTab, string][] = localizedLabels([
  ['agent', 'Agent'],
  ['workspace', '工作区'],
  ['language', '语言'],
  ['security', '安全'],
  ['about', '关于'],
]);

export function Settings() {
  useLocale();
  const tab = useStore((s) => s.settingsTab);
  return (
    <main className="settings" aria-label={tx("设置")}>
      <nav className="snav" aria-label={tx("设置分类")}>
        <h1>{tx("设置")}</h1>
        {TABS.map(([id, label]) => (
          <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setState({ settingsTab: id })}>
            {label}
          </button>
        ))}
      </nav>
      <div className="sscroll">
        <div className="scontent">
          {tab === 'agent' && <AgentTab />}
          {tab === 'workspace' && <WorkspaceTab />}
          {tab === 'language' && <LanguageTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'about' && <AboutTab />}
        </div>
      </div>
    </main>
  );
}

function AboutTab() {
  useLocale();
  const home = useStore((s) => s.home);
  const [about, setAbout] = useState<AboutView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AboutView>('/api/settings/about').then(setAbout, (e: Error) => setError(e.message));
  }, []);

  return (
    <>
      <header className="shead">
        <div className="txt">
          <h2>{tx("关于")}</h2>
        </div>
      </header>
      {error && <p className="serr">{error}</p>}
      {about && (
        <dl className="kv">
          <dt>{tx("版本")}</dt>
          <dd>{about.version}</dd>
          <dt>{tx("数据目录")}</dt>
          <dd>
            <code>{tildify(about.dataDir, home)}</code>
            <p className="help">{tx("会话记录、登录信息和设置都存在这里，文件权限 600。")}</p>
          </dd>
          <dt>{tx("已运行")}</dt>
          <dd>{duration(Date.now() - about.startedAt)}</dd>
          <dt>{tx("运行环境")}</dt>
          <dd>
            Node {about.node} · {about.platform}
          </dd>
          <dt>{tx("工作区")}</dt>
          <dd>
            {about.workspaces.map((w) => (
              <div key={w.path}>
                <code>{w.path}</code>
              </div>
            ))}
          </dd>
          <dt>{tx("协议日志")}</dt>
          <dd>
            <a className="btn btn-line" href="/api/settings/protocol-log" download>{tx("下载，用于排查 Agent 问题")}</a>
            <p className="help">{tx("包含开着的会话最近的通信记录，里面可能有对话内容，发给别人之前先看一眼。")}</p>
          </dd>
          <dt>{tx("忘记密码")}</dt>
          <dd>{tx("在运行 Fika Desk 的电脑上，进入 Fika Desk 的目录运行") + " "}<code>npm run reset-password</code>{tx("，再用后台日志里的新链接重新设置密码。")}
          </dd>
        </dl>
      )}
    </>
  );
}
