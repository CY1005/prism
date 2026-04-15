# CLAUDE.md — Prism 开发指南

## 项目概述

Prism 是一个**以功能模块为中心的产品知识管理平台**，将分散在 Confluence/Notion/Jira/飞书/本地笔记中的产品分析、技术决策、测试洞察、竞品对标等知识，围绕功能模块进行整合。

- **状态**: v1.x 生产就绪，20 个功能（F1-F20）全部实现，155 测试点 100% 通过
- **方法论**: IDAKE 5 步循环（Spec → Build → Break → Fix → Evolve）
- **开发者**: CY（单人开发，VibeCoding 模式）

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 16 (App Router) + React 19 + TypeScript + shadcn/ui + Tailwind CSS 4 |
| 后端 | FastAPI + SQLAlchemy 2.0 + Pydantic 2 |
| 数据库 | PostgreSQL 16 + pgvector + Drizzle ORM（前端）/ SQLAlchemy（后端） |
| 认证 | Auth.js v5 (Credentials) + JWT + RBAC |
| 可视化 | @xyflow/react (关系图) |
| 部署 | Docker Compose |

## 架构（ADR-010 混合架构）

```
Next.js 16 (App Router)              FastAPI (AI 微服务)
├── Server Actions → CRUD            ├── AI 需求分析 (F13)
├── Drizzle ORM → PostgreSQL         ├── 智能导入 (F17)
├── Auth.js v5 → JWT + RBAC          ├── 混合搜索 (F18, pgvector + RRF)
└── SSR/ISR 渲染                      ├── 对比矩阵 (F12)
         ↓                           ├── AI 快照 (F16)
    共享 PostgreSQL 16 + pgvector     └── Feed 聚合 (F14)
```

- Next.js 处理 CRUD/渲染，FastAPI 处理 AI 密集型任务
- 通信: HTTP JSON over localhost:8001（内部）
- 认证: Bearer Token（用户）+ Internal Token（服务间 HMAC）

## 目录结构

```
web/                          # Next.js 前端
├── src/app/                  # App Router 页面
├── src/actions/              # Server Actions（18 个文件）
├── src/components/           # UI + 业务组件
├── src/db/schema.ts          # Drizzle schema（26 张表，单一真相源）
├── src/services/             # API 客户端
├── src/contexts/             # React Context (ProjectRole)
├── src/lib/                  # 工具函数 + 验证器
└── drizzle/                  # 数据库迁移

api/                          # FastAPI 后端
├── main.py                   # 应用入口 + 路由注册
├── routers/                  # 11 个路由模块
├── services/                 # 业务逻辑 + AI Provider
├── models/tables.py          # SQLAlchemy 模型（只读镜像 Drizzle schema）
├── schemas/                  # Pydantic 请求/响应模型
└── tests/                    # pytest 测试套件

docs/                         # 项目文档
├── product/PRD.md            # 产品需求文档
├── adr/                      # 13 个架构决策记录 (MADR 3.0)
├── dev-plan/                 # 路线图 + Agent 编排
├── architecture/             # arc42 技术架构
└── testing/                  # 测试计划 + Bug 日志
```

## 开发规范

### 分层架构（严格执行）

- **Actions 层**: 参数收集 + 认证检查 + 调用 Service（禁止放业务逻辑）
- **Service 层**: 业务规则 + 调用 Data 层
- **Data 层**: 查询和事务（禁止业务判断）

### 新增功能的标准流程

**新增 API 路由**:
1. `api/schemas/` 创建 Pydantic 模型
2. `api/routers/` 创建路由文件
3. `api/services/` 创建业务逻辑
4. `api/main.py` 注册路由（`app.include_router()`）
5. 注意 CORS 已配置为 localhost:3000

**新增前端页面**:
1. `web/src/app/` 下创建目录 + page.tsx
2. `web/src/actions/` 创建 Server Action（标记 `"use server"`）
3. 返回 `ActionResult<T>` 类型
4. 使用 `revalidatePath()` 刷新 ISR
5. shadcn 组件需先 `npx shadcn-ui add xxx`

**新增数据库表**:
1. `web/src/db/schema.ts` 添加 Drizzle schema（单一真相源）
2. `npx drizzle-kit push` 推送变更
3. `api/models/tables.py` 添加 SQLAlchemy 镜像（`extend_existing=True`）

### 禁止的模式

- **禁止 asChild prop**: shadcn/ui v4+ 已移除 Radix 的 asChild
- **禁止 JSONB 盲信**: 渲染 JSONB 前必须 `if (!Array.isArray(x)) return fallback`
- **禁止裸端口暴露**: Docker 端口绑定 `127.0.0.1:port:port`
- **禁止跳过 AC**: 没有验收标准不写代码
- **禁止超长循环**: 同一文件 >6 次编辑 = 停下来重新思考

### 必须的模式

- **类型安全优先**: `tsc --noEmit` = 0 errors
- **空状态测试**: >50% 的 bug 来自空状态
- **Contract-first**: API 接口先定义再写代码
- **垂直切片**: 一个功能 DB→后端→前端完整完成再做下一个
- **乐观锁**: dimension_records 的 `version` 字段用于并发控制
- **软删除**: projects 使用 `deletedAt` 时间戳，过滤条件 `deletedAt IS NULL`
- **物化路径**: nodes 的 `path` 字段存储层级路径，支持 O(1) 面包屑查询
- **活动日志**: 重要变更操作使用 fire-and-forget 方式记录 activity_log

## Available Skills（按需加载，触发时读对应文件）

> 完整索引见 [docs/skills/INDEX.md](docs/skills/INDEX.md)

### 开发类
- [new-ai-endpoint](docs/skills/dev/new-ai-endpoint.md) — 触发：新增 AI 分析端点
- [frontend-backend-contract](docs/skills/dev/frontend-backend-contract.md) — 触发：前后端联调
- [new-db-table](docs/skills/dev/new-db-table.md) — 触发：新增数据库表
- [dev-closed-loop](docs/skills/dev/dev-closed-loop.md) — 触发：每次开发任务开始/结束时

### 排错类（匹配症状后读对应文件）
- [contract-drift](docs/skills/debug/contract-drift.md) — API 500 / 前端 undefined / 字段缺失
- [empty-state](docs/skills/debug/empty-state.md) — 页面空白 / Cannot read properties of undefined
- [stale-api](docs/skills/debug/stale-api.md) — TypeScript 编译错误 / Property does not exist
- [auth-permission](docs/skills/debug/auth-permission.md) — 未登录可访问 / 权限绕过
- [silent-error](docs/skills/debug/silent-error.md) — 操作无反应 / 静默吞错

## AI Provider 体系（ADR-004）

```python
# api/services/ai_provider.py
# 可插拔 Provider：Claude / DeepSeek / Kimi / OpenAI / Mock
# 工厂函数: get_provider(ai_provider, api_key) -> LLMProvider
# 接口: analyze() 流式返回, generate() 一次性返回
# 降级: 无 API key → MockProvider
```

- 每个项目可独立配置 AI Provider + 加密 API Key（AES-256-GCM）
- 嵌入服务: OpenAI text-embedding-3-small 或 MockEmbeddingProvider
- SSE 流式格式: `event: chunk/complete/error\ndata: {...}\n\n`

## 认证体系

- **用户认证**: Auth.js v5 JWT（24h 有效期）+ Credentials Provider
- **服务间认证**: `X-Internal-Token`（HMAC）+ `X-User-Id`
- **权限层级**: platform_admin > project admin > editor > viewer
- **安全措施**: 5 次失败登录 → 15 分钟锁定，bcrypt 12 rounds

## 数据库关键设计

- **Drizzle 是 schema 真相源**: 迁移由 drizzle-kit 管理
- **SQLAlchemy 只读镜像**: FastAPI 侧的模型必须标记 `extend_existing=True`
- **JSONB 统一存储**: dimension_records.content 是 JSONB，不为新维度类型建列
- **pgvector**: embeddings 表由 FastAPI 启动时的 raw SQL 管理（非 Drizzle）
- **RRF 混合搜索**: 关键词搜索 + 语义搜索，k=60 融合，相似度阈值 0.3

## 快速启动

```bash
docker compose up -d                            # 启动 DB + FastAPI
cd web && npm install && PORT=3001 npm run dev   # 启动前端
# http://localhost:3001 — 前端
# http://localhost:8001/docs — FastAPI Swagger
```

## 关键文档索引

- 产品需求: `docs/product/PRD.md`
- 架构决策: `docs/adr/ADR-001~013.md`
- 开发方法论: `docs/dev-plan/vibecoding-workflow.md`
- 技术架构: `docs/architecture/arc42-技术架构文档.md`
- 工程笔记: `web/engineering-notes.md`（每次开发前必读）
- Skills 索引: `docs/skills/INDEX.md`
- Bug 日志: `docs/testing/bugs/bug-log.md`
- 测试索引: `docs/testing/test-points/Prism-测试点-索引.md`
