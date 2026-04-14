# Architecture Decision Records

> 格式标准：[MADR 3.0](https://adr.github.io/madr/) (Markdown Any Decision Records)
> 状态值：Proposed → Accepted → Deprecated / Superseded

| ADR | 决策 | 状态 | 版本 |
|-----|------|------|------|
| [001](001-frontend-framework.md) | Next.js 15 作为前端框架 | Accepted | v0.1 |
| [002](002-database-and-orm.md) | PostgreSQL + Drizzle ORM | Accepted | v0.1 |
| [003](003-server-actions-vs-api-routes.md) | Server Actions 为主，API Routes 仅 webhook/流式 | Accepted | v0.1 |
| [004](004-ai-service-layer.md) | 自定义 LLMProvider，不绑死 Vercel AI SDK | Superseded by 010 | v0.1 |
| [005](005-auth-strategy.md) | Auth.js v5 Credentials 最简配置 | Accepted | v0.1 |
| [006](006-state-management.md) | TanStack Query + Zustand 职责分离 | Accepted | v0.1 |
| [007](007-pgvector-deferred.md) | pgvector 延迟到 v0.3 | Accepted | v0.1 |
| [008](008-project-ownership-evolution.md) | 0.x 项目归个人，1.x 团队化 | Accepted | v0.1 |
| [009](009-react-flow-state-separation.md) | React Flow 视图状态与业务数据分离 | Accepted | v0.1 |
| [010](010-hybrid-architecture-fastapi.md) | 混合架构：CRUD用Next.js，AI分析层用FastAPI | Accepted | v0.1 |
| [011](011-competitor-entity-and-comparison.md) | 竞品全局实体 + 对比矩阵回填 + 研究模板复用 | Accepted | v0.2 |
| [012](012-issue-entity-and-visualization.md) | 问题独立实体、关系图双级、全景图Treemap、数据流转 | Accepted | v0.2 |
| [013](013-ai-analysis-search-and-version-reorder.md) | AI渐进式披露、Hybrid搜索、版本重排、权限预留 | Accepted | v0.3+ |
