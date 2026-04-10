# ADR-002: 选择 PostgreSQL + Drizzle ORM

## Status: Accepted

## Context

Prism 的数据模型核心是"节点树 + JSONB 灵活扩展 + 维度注册表"。需要：
- 自引用树查询（WITH RECURSIVE）
- JSONB 字段的灵活查询和索引
- 全文搜索（中文）
- 未来可能加向量搜索（pgvector）
- 单机部署，运维成本低

## Decision

- 数据库：PostgreSQL 16+
- ORM：Drizzle ORM
- pgvector：MVP 不装，v0.3 语义搜索需求明确时再加

## Alternatives

| 方案 | 否决原因 |
|------|----------|
| Prisma | JSONB 操作受限（只能 $queryRaw 脱离类型系统），WITH RECURSIVE 支持差 |
| TypeORM | 维护停滞，bug 多 |
| MongoDB | 关联查询弱，单机部署 PostgreSQL 更成熟 |
| 原生 SQL | 无类型安全，手动迁移 |

## Consequences

- **好处**：SQL-first 思维，JSONB 操作自然，TypeScript 类型联动好，轻量无额外引擎
- **代价**：Drizzle 在 AI 训练数据中覆盖度低于 Prisma，Claude Code 生成可能有错误
- **风险**：若 Drizzle 错误率过高，早期可切 Prisma（迁移成本可控）
- **决策依据**：Prism 的 JSONB 操作是高频需求，Drizzle 在这方面的优势大于 AI 熟悉度的劣势
