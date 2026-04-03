# ADR-005: Auth.js v5 Credentials Provider 最简配置

## Status: Accepted

## Context

Prism 用户规模 1-20 人，非商业化。需要多用户登录和项目级权限隔离（管理员/编辑者/查看者）。

GPT Review 认为 Auth.js "偏重"，建议按场景分级。但 Week 4 就需要多用户+权限，简单密码保护不够。

## Decision

使用 Auth.js v5，但只用 Credentials Provider（邮箱+密码），不接 OAuth。

- 不做 Google/GitHub 第三方登录（没必要）
- 不做 magic link（需要邮件服务）
- Session 用 JWT（不需要 session 表，部署简单）

## Alternatives

| 方案 | 否决原因 |
|------|----------|
| 手写 JWT | 安全细节多（token 刷新/CSRF/密码哈希），容易写出漏洞 |
| 内网基础密码 | 无法实现项目级权限隔离和多角色 |
| Lucia Auth | 2024 年已归档停止维护 |
| Auth.js 全量配置 | OAuth/多 Provider 对 20 人规模无价值 |

## Consequences

- **好处**：Next.js 深度集成；中间件鉴权一行配置；密码哈希/Session 管理不用自己写
- **代价**：Auth.js v5 有 breaking changes，配置可能踩坑
- **升级路径**：未来需要 OAuth 时只需加 Provider 配置，不改架构
