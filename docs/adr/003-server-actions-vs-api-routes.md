# ADR-003: Server Actions 为主，API Routes 仅用于特定场景

## Status: Accepted

## Context

Next.js 15 同时提供 Server Actions 和 API Routes 两种服务端能力。同时使用容易导致边界混乱：认证、错误处理、缓存失效、日志、调试都会分裂成两套。

GPT Review 指出："不要把两套都当主通路"。

## Decision

- **Server Actions**：内部表单提交、页面数据操作、CRUD（主通路）
- **API Routes**：仅用于 webhook 回调、AI 流式输出、外部系统对接

判断标准：如果是用户在页面上的操作 → Server Actions。如果是异步/外部/流式 → API Routes。

## Alternatives

| 方案 | 否决原因 |
|------|----------|
| 只用 API Routes | 丧失 Server Actions 的开发效率优势，需要写大量 fetch + 类型同步 |
| 只用 Server Actions | 流式输出和 webhook 无法用 Server Actions 实现 |
| 两者并列不分主次 | GPT 指出的边界混乱问题 |

## 工程约束

- `actions/` 只做入口层：收参、鉴权、调用 service
- `services/` 承载业务逻辑
- `db/` 或 `repositories/` 负责查询与事务
- **禁止**：在 action 文件里堆积验证、权限、事务、DB 操作、格式转换
- **禁止**：Action 与 API Route 对同一逻辑重复实现两套

## Consequences

- **好处**：职责清晰，开发时不用纠结用哪个；Server Actions 省掉 REST 层
- **代价**：需要遵守约定，不让 API Routes 蔓延
- **执行机制**：Architecture Guardrail — 每月架构检查时审查 API Routes 数量，超过 5 个要审视是否有滥用
