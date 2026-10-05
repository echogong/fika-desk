import { tx, useLocale } from '../i18n';
import type { WorkspaceInfo } from '../../../shared/types';
import { startAgent } from '../actions';
import { STATE_LABEL } from '../format';
import { hasUnreadCompletion } from '../session-attention';
import { openSessionById, openSettings, sessionsIn, setState, useStore } from '../store';
import { CoffeeIllustration } from './CoffeeIllustration';
import { AgentIcon } from './AgentIcon';
import { GlassButton } from './GlassButton';
import { Chevron, Folder, Gear, Plus, Spark } from './Icons';
import { Dot, lampOf } from './Lamp';

/** 没有打开窗口时，把继续工作和新建会话放在同一处。 */
export function WorkspaceWelcome({ ready, connected, workspace }: { ready: boolean; connected: boolean; workspace?: WorkspaceInfo }) {
  useLocale();
  const agents = useStore((s) => s.agents);
  const sessions = useStore((s) => s.sessions);
  const seenCompletions = useStore((s) => s.seenCompletions);
  // 仅使用服务端实际可启动且已启用的 Agent，不把设置中的连接目录当作入口。
  const available = agents.filter(agent => agent.available && agent.enabled);
  const existing = workspace ? sessionsIn(sessions, workspace.id) : [];
  const resume = existing[0];
  const resumeUnread = resume ? hasUnreadCompletion(sessions[resume.id], seenCompletions[resume.id]) : false;
  const resumeStatus = resume ? resumeUnread ? tx("已完成 · 未读") : STATE_LABEL[resume.state] : '';
  const title = !workspace ? tx("从一个工作区开始") : resume ? tx("继续你的工作") : available.length ? tx("开始一个新任务") : tx("准备好你的 Agent");
  const description = !workspace ? tx("打开项目文件夹，让 Agent 在这里与你协作。")
    : resume ? available.length ? tx("打开已有会话，或选择一个 Agent 开始新的任务。") : tx("打开已有会话继续工作，也可以在设置中配置新的 Agent。")
    : available.length ? tx("选择一个 Agent，一起完成项目里的下一件事。")
    : tx("先在设置中安装或启用一个 Agent，再开始对话。");

  return (
    <section className="workspace-welcome" aria-label={ready ? tx("开始工作") : tx("连接工作台")}>
      {!ready ? <p className="welcome-loading" role="status"><Spark size={18} />{tx("正在连接工作台…")}</p> : (
        <div className="welcome-content">
          <CoffeeIllustration />
          <div className="welcome-intro">
            <h2>{title}</h2>
            <p>{description}</p>
          </div>

          {resume && (
            <GlassButton className="welcome-resume" type="button" aria-label={tx("继续 {0} 会话：{1}，{2}", [resume.agentName, resume.title, resumeStatus])} onClick={() => openSessionById(resume.id)}>
              <Dot state={lampOf(resume.state, resumeUnread)} />
              <span className="welcome-resume-copy"><small><AgentIcon id={resume.agentId} name={resume.agentName} />{resume.agentName} · {resumeStatus}</small><strong title={resume.title}>{resume.title}</strong></span>
              <Chevron size={17} />
            </GlassButton>
          )}

          {!workspace ? (
            <button className="welcome-primary" type="button" disabled={!connected} onClick={() => setState({ dialog: 'folder' })}><Folder size={17} />{tx("打开文件夹")}<Chevron size={16} /></button>
          ) : available.length ? (
            <div className="welcome-launch">
              {resume && <span className="welcome-divider">{tx("开始新会话")}</span>}
              <div className="welcome-agents" aria-label={tx("选择 Agent 开始新会话")}>
                {available.map(agent => (
                  <GlassButton key={agent.id} className="welcome-agent" type="button" disabled={!connected} title={tx("启动 {0}", [agent.name])} aria-label={tx("启动 {0}", [agent.name])} onClick={() => startAgent(workspace.id, agent.id)}>
                    <AgentIcon id={agent.id} name={agent.name} />
                    <span className="welcome-agent-name">{agent.name}</span>
                    <Plus size={15} />
                  </GlassButton>
                ))}
              </div>
            </div>
          ) : (
            <button className="welcome-primary" type="button" onClick={() => openSettings('agent')}><Gear size={17} />{tx("配置 Agent")}<Chevron size={16} /></button>
          )}
          {!connected && <p className="welcome-connection" role="status">{tx("连接恢复后即可启动新会话。")}</p>}
        </div>
      )}
    </section>
  );
}
