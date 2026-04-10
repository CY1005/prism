# ADR-005: Auth.js v5 Credentials Provider 最简配置

## Status: Accepted（2026-04-03 修正）

## Context

Prism 用户规模 1-20 人，非商业化。需要多用户登录和项目级权限隔离（管理员/编辑者/查看者）。

## Decision

使用 Auth.js v5 Credentials Provider（邮箱+密码登录）。

**Auth.js 负责什么：**
- 登录流程（调用你写的 authorize()）
- Session 管理（JWT 或 database）
- 回调 / hooks

**Auth.js 不负责什么（你自己管）：**
- 用户业务模型（role / status / invitedBy 等）
- 密码哈希（Credentials Provider 下，authorize() 里你自己查库、自己比对 hash）
- 业务权限判断（项目级隔离逻辑）

### MVP 最小表结构

```
必须：
  users          — id, email, name, password_hash, role, status, created_at
  
暂不需要：
  sessions       — MVP 用 JWT strategy，不需要 session 表
  accounts       — 仅 Credentials 时不需要，引入 OAuth 后再加
```

### 密码处理

Credentials Provider 不帮你哈希密码。你需要：
- 注册时：bcrypt.hash(password) → 存入 users.password_hash
- 登录时：authorize() 里 bcrypt.compare(input, stored_hash)

### Session 策略

- MVP：JWT（无状态，不需要 session 表，部署简单）
- 未来需要服务端可撤销会话 / 设备管理 / 审计时：切 database session

## Alternatives

| 方案 | 否决原因 |
|------|----------|
| 手写 JWT | 安全细节多（token 刷新/CSRF），容易写出漏洞 |
| 内网基础密码 | 无法实现项目级权限隔离 |
| Lucia Auth | 2024 年已归档停止维护 |
| Auth.js 全量配置 | OAuth 对 20 人规模无价值 |

## Consequences

- **好处**：Next.js 深度集成；Session 管理不用自己写；升级路径清晰
- **代价**：密码哈希逻辑自己写；Auth.js v5 配置有坑
- **升级路径**：需要 OAuth 时加 Provider + accounts 表，不改架构

## 修正记录

- 2026-04-03 初版：低估了 Credentials Provider 下开发者的职责
- 2026-04-03 修正：明确密码哈希由开发者负责，Auth.js 不自动处理；明确 MVP 用 JWT 不建 session 表
