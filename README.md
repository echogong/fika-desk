# Fika Desk

**一边喝咖啡，看 Agent 做工作。** 部署在自己服务器上的多 Agent 网页工作台：在一个网页里同时使用 Codex、Claude Code、Gemini CLI、Pi、Hermes、CodeBuddy 等 AI 编程 Agent，基于 [ACP（Agent Client Protocol）](https://agentclientprotocol.com)。

**A self-hosted, multi-agent web workbench.** Run Codex, Claude Code, Gemini CLI, Pi, Hermes, CodeBuddy and other ACP-compatible coding agents side by side from one web page on your own server.

[English](#english) · [部署手册](docs/部署手册.md)

![登录页：一边喝咖啡，看 Agent 做工作](docs/images/login.png)

> [!WARNING]
> **安全提示：** Fika Desk 会让 AI Agent 以运行它的系统用户身份，在服务器上读写文件、执行任意命令。
> - 用普通用户运行，**不要用 root**；
> - 服务只监听 `127.0.0.1`，对外必须经过 Nginx 或 Caddy 的 **HTTPS**；
> - 登录密码至少 12 位，只部署在你自己控制的服务器上；
> - 这是**单用户**工具，不适合多人共用一个实例。
>
> 详见 [部署手册](docs/部署手册.md)。

## 能做什么

- **多个 Agent 并排工作**：窗口自动平铺，顶部看板一眼看清谁在工作、谁在等你批准、谁做完了。
- **审批**：Agent 要执行命令或改文件时弹出审批卡，“允许这一次 / 以后都允许 / 拒绝”直接点，每次批准都留痕。
- **关掉网页也不中断**：Agent 跑在独立的执行后台里，关浏览器、重启网页服务都不会打断任务。
- **在网页上管理 Agent**：内置 25 项 Agent 目录（国内 9 项、国外 / 开源 16 项），一键安装、更新、登录、测试连接；17 个 Agent 可在网页上配置第三方模型，内置 249 个供应商预设。
- **项目工具**：浏览和预览工作区文件，查看 Git 改动，在输入框里新建、切换、删除分支；支持发送和查看图片。
- **历史会话**：保存网页会话，读取支持的 Agent 在命令行里开的会话，可搜索、恢复、导出 Markdown。
- **五种界面语言**（简体中文、繁體中文、English、Svenska、日本語），深色、浅色两种配色，手机也能用。

![Fika Desk：四个 Agent 窗口并排](docs/images/main-four.png)

## 运行要求

- Linux 服务器（按 Ubuntu 写的手册），运行用户要能用 systemd 用户服务（开启 linger）；
- Node.js 22.13 以上，推荐 24 LTS；
- 至少 2 GB 可用磁盘；
- 公网访问时需要域名和 HTTPS（Nginx 或 Caddy 反向代理）。

macOS 可以用来开发和试用。

## 快速试用（本机）

```bash
git clone https://github.com/echogong/fika-desk.git
cd fika-desk
npm ci
npm run dev -- --port 4791 --data /tmp/fika-dev
```

- 第一次打开要设置登录密码，设置链接打印在执行后台的日志里：

  ```bash
  grep 'setup?k=' /tmp/fika-dev/runtime/runner.log | tail -1
  ```

- 开发模式自带一个“演示 Agent”，不联网、不花额度，可以先用它把界面走一遍。
- 关掉 `npm run dev` 不会停止执行后台。要全部停掉：

  ```bash
  node --import tsx server/index.ts stop-runner --data /tmp/fika-dev
  ```

只想看界面、不想启动服务的话，运行 `npx vite --mode fixture`，打开终端里显示的地址，看的是样例数据。

正式部署请照 [部署手册](docs/部署手册.md) 一步步来。

## 安全问题

发现安全漏洞，请**不要**开公开的 Issue，按 [SECURITY.md](SECURITY.md) 私下报告。

## 许可证

本项目使用 [MIT 许可证](LICENSE)。

项目里用到的第三方数据、字体和图标沿用各自的许可证，原文见 [licenses](licenses)（供应商预设数据）、[web/public/licenses](web/public/licenses)（字体）和 [THIRD_PARTY_LICENSES.txt](web/src/assets/agents/catalog/THIRD_PARTY_LICENSES.txt)（Agent 图标）。各 Agent 的名称和标志归各自所有者，Fika Desk 与它们没有隶属关系。

---

## English

### What it does

- **Agents side by side.** Panes tile automatically; a status board shows who is working, who is waiting for your approval and who is done.
- **Approvals.** When an agent wants to run a command or edit a file, an approval card offers *Allow once*, *Always allow* and *Reject*; every decision is recorded.
- **Keeps running when you close the page.** Agents run in an independent runner, so closing the browser or restarting the web service does not interrupt them.
- **Manage agents from the browser.** A catalog of 25 agents with one-click install, update, login and connection test; 17 of them accept third-party model providers, with 249 built-in provider presets.
- **Project tools.** Browse files, view Git changes, create and switch branches, send and view images.
- **History.** Search, resume and export sessions, including CLI sessions from supported agents.
- **Five UI languages** (Simplified Chinese, Traditional Chinese, English, Swedish, Japanese), dark and light themes, works on phones.

The [deployment guide](docs/部署手册.md) is currently written in Chinese.

> [!WARNING]
> Fika Desk lets AI agents read and write files and run arbitrary commands on your server as the user that runs it. Run it as a regular (non-root) user, keep it bound to `127.0.0.1` behind an HTTPS reverse proxy (Nginx or Caddy), use a strong password (12+ characters), and only deploy it on servers you control. It is a single-user tool.

### Requirements

- A Linux server with systemd user services (linger enabled) — the deployment guide targets Ubuntu
- Node.js 22.13 or later (24 LTS recommended)
- At least 2 GB of free disk space
- A domain with HTTPS for public access

macOS works for development and trying it out.

### Try it locally

```bash
git clone https://github.com/echogong/fika-desk.git
cd fika-desk
npm ci
npm run dev -- --port 4791 --data /tmp/fika-dev
# The first-time setup link is printed to the runner log:
grep 'setup?k=' /tmp/fika-dev/runtime/runner.log | tail -1
```

Development mode includes a demo agent that needs no network or API key. Stopping `npm run dev` leaves the runner alive; stop everything with `node --import tsx server/index.ts stop-runner --data /tmp/fika-dev`.

To preview the UI with sample data only, run `npx vite --mode fixture`.

### Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md), not in public issues.

### License

[MIT](LICENSE). Third-party data, fonts and icons keep their own licenses (see above). Agent names and logos belong to their respective owners; Fika Desk is not affiliated with them.
