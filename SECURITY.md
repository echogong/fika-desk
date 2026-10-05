# 安全策略 / Security Policy

## 支持的版本 / Supported versions

只修复最新发布版本里的安全问题。
Security fixes are made for the latest release only.

## 报告漏洞 / Reporting a vulnerability

请**不要**在公开的 Issue、讨论区或 Pull Request 里描述漏洞。

请在本仓库的 **Security → Report a vulnerability** 私下提交报告，写清楚：

- 影响的版本和部署方式；
- 复现步骤或概念验证；
- 可能造成的影响（比如绕过登录、读到工作区外的文件、执行了没批准的命令）。

我会尽快回复，确认问题后修复并发布新版本，并在公告里致谢（除非你希望匿名）。

Please do **not** report security issues in public issues, discussions or pull requests. Use **Security → Report a vulnerability** on this repository to report privately, and include the affected version, steps to reproduce and the potential impact. I will respond as soon as I can, fix confirmed issues in a new release and credit you unless you prefer to stay anonymous.

## 范围 / Scope

Fika Desk 的设计就是让 AI Agent 以运行用户的身份在服务器上执行命令，所以“Agent 能执行命令”本身不是漏洞。我们关心的是：

- 没有登录就能访问或操作；
- 绕过登录锁定、设备退出、来源校验；
- 通过文件浏览、改动面板或图片接口读到工作区外或受保护的文件；
- 绕过审批，或让 Agent 执行用户没有批准的操作；
- 泄露 API Key、登录凭证或其他敏感数据。

By design, Fika Desk lets AI agents run commands on the server as the service user, so "an agent can run commands" is not a vulnerability by itself. Reports about authentication bypass, escaping the workspace through the file, changes or image endpoints, bypassing approvals, or leaking credentials are very welcome.
