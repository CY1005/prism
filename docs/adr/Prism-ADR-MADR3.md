# Prism 架构决策记录 (ADR)

> 格式：MADR 3.0 | 最后更新：2026-04-10

## 索引

| ADR | 标题 | 状态 | 版本 |
|-----|------|------|------|
| [ADR-001](#adr-001-选择-nextjs-15-作为前端框架) | 选择 Next.js 15 作为前端框架 | Accepted | 完整版 |
| [ADR-002](#adr-002-postgresql--drizzle-orm) | PostgreSQL + Drizzle ORM | Accepted | 完整版 |
| [ADR-003](#adr-003-server-actions-为主要服务端通路) | Server Actions 为主要服务端通路 | Accepted | 完整版 |
| [ADR-004](#adr-004-自定义-llmprovider-接口) | 自定义 LLMProvider 接口 | Superseded by ADR-010 | 精简版 |
| [ADR-005](#adr-005-authjs-v5-credentials-最简认证) | Auth.js v5 Credentials 最简认证 | Accepted | 标准版 |
| [ADR-006](#adr-006-tanstack-query--zustand-职责分离) | TanStack Query + Zustand 职责分离 | Accepted | 标准版 |
| [ADR-007](#adr-007-pgvector-延迟到-v03) | pgvector 延迟到 v0.3 | Accepted | 精简版 |
| [ADR-008](#adr-008-0x-项目归个人1x-团队化) | 0.x 项目归个人，1.x 团队化 | Accepted | 精简版 |
| [ADR-009](#adr-009-react-flow-视图状态与业务数据分离) | React Flow 视图状态与业务数据分离 | Accepted | 标准版 |
| [ADR-010](#adr-010-混合架构-nextjsfastapi) | 混合架构 Next.js + FastAPI | Accepted | 完整版 |

---

# ADR-001: 选择 Next.js 15 作为前端框架

## Status

Accepted

## Context and Problem Statement

Prism 是一个可视化重、CRUD 轻的行业知识管理平台。核心可视化依赖 React Flow（仅有 React 版本，锁定 React 生态）。需要选择一个前端框架，同时满足：v0 原型工具输出兼容、AI 代码生成质量高、单机部署简单。

## Decision Drivers

* React Flow 只有 React 版本，框架必须基于 React 生态
* v0 原型工具输出 React/Next.js 代码，需要无缝衔接
* Claude Code 对 Next.js 的生成质量最高，VibeCoding 效率直接受影响
* 单机部署，需要前后端同仓、最小化运维复杂度

## Considered Options

1. Next.js 15 (App Router)
2. React + Vite
3. Vue 3 + Nuxt
4. Svelte

## Decision Outcome

Chosen option: "Next.js 15 (App Router)"，because React Flow 锁定 React 生态，v0 和 Claude Code 对 Next.js 的生成质量最高，Server Actions 省去单独搭 REST 层的成本。

### Consequences

* Good, because 前后端同仓同语言（TypeScript），开发体验统一
* Good, because Server Actions 省去手写 REST API 层，CRUD 开发效率高
* Good, because AI 代码生成质量高，VibeCoding 工作流顺畅
* Bad, because App Router 学习曲线陡峭，框架约定多
* Neutral, because Server Actions 和 API Routes 边界容易混乱 → 由 ADR-003 约束

## Pros and Cons of the Options

### React + Vite

* Good, because 灵活度高，无框架约定
* Bad, because 需要单独搭路由、无 Server Actions，CRUD 开发效率低

### Vue 3 + Nuxt

* Good, because Vue 生态成熟，模板语法直观
* Bad, because React Flow 无 Vue 版本，核心可视化无法实现
* Bad, because AI 对 Vue 的生成质量低于 React/Next.js

### Svelte

* Good, because 语法简洁，编译时优化
* Bad, because 生态规模小，可视化库支持差
* Bad, because AI 训练数据覆盖度低

## More Information

ADR-003 约束了 Server Actions 与 API Routes 的边界划分。ADR-010 引入 FastAPI 后，Next.js 专注前端 + CRUD。

---

# ADR-002: PostgreSQL + Drizzle ORM

## Status

Accepted

## Context and Problem Statement

Prism 的数据模型涉及树形结构（行业→领域→维度）和灵活的元数据存储。需要一个数据库方案，支持递归查询、JSONB 灵活索引、全文搜索，并为未来的语义搜索（pgvector）预留扩展空间。单机部署，不引入额外中间件。

## Decision Drivers

* 需要 `WITH RECURSIVE` 树查询支持行业知识的层级结构
* JSONB 灵活查询和索引，适配元数据多变的场景
* 全文搜索能力（tsvector），避免引入 Elasticsearch
* 未来 pgvector 语义搜索扩展需求
* 单机部署，最小化运维成本

## Considered Options

1. PostgreSQL 16 + Drizzle ORM
2. PostgreSQL + Prisma
3. PostgreSQL + TypeORM
4. MongoDB
5. 原生 SQL（无 ORM）

## Decision Outcome

Chosen option: "PostgreSQL 16 + Drizzle ORM"，because Drizzle 的 SQL-first 设计让 JSONB 高频操作更自然，TypeScript 类型联动强，且轻量适合单机部署。pgvector 延迟到 v0.3（见 ADR-007）。

**决策依据**：JSONB 高频操作的优势 > AI 熟悉度的劣势。

### Consequences

* Good, because SQL-first 设计，JSONB 操作直接用 SQL 表达，无 ORM 抽象损耗
* Good, because TypeScript 类型从 schema 定义自动推导，编译期捕获错误
* Good, because 轻量级，无 Prisma 的 engine 二进制依赖
* Bad, because Drizzle 在 AI 训练数据中覆盖度低于 Prisma，生成代码错误率较高
* Neutral, because 如果 AI 生成错误率持续过高，可切换到 Prisma 作为降级方案

## Pros and Cons of the Options

### PostgreSQL + Prisma

* Good, because AI 训练数据覆盖度高，生成代码准确
* Good, because 社区大，文档丰富
* Bad, because JSONB 操作受限，需要 `$queryRaw` 绕过
* Bad, because Prisma Engine 是独立二进制，增加部署复杂度

### PostgreSQL + TypeORM

* Good, because 功能全面，装饰器语法直观
* Bad, because 维护停滞，社区活跃度下降
* Bad, because TypeScript 类型支持不如 Drizzle 和 Prisma

### MongoDB

* Good, because 文档模型天然适配灵活元数据
* Bad, because 关联查询能力弱，树形结构需要多次查询
* Bad, because 无法利用 pgvector，语义搜索需要额外方案

### 原生 SQL

* Good, because 零抽象，完全控制
* Bad, because 无类型安全，重构和维护成本高

## More Information

ADR-007 决定 pgvector 延迟到 v0.3。ADR-010 引入 FastAPI 后，schema 变更统一由 Drizzle migration 管理，FastAPI 侧只读 + 写分析结果。

---

# ADR-003: Server Actions 为主要服务端通路

## Status

Accepted

## Context and Problem Statement

Next.js 15 同时提供 Server Actions 和 API Routes 两种服务端能力。如果两套都当主通路，会导致边界混乱、代码分散。GPT Review 明确指出不要两套并行，需要确定主次关系和工程约束。

## Decision Drivers

* 需要明确的架构边界，避免同一功能两种实现方式
* Server Actions 对表单/CRUD 场景效率高（无需手写 fetch）
* 部分场景（webhook、流式响应、外部调用）只能用 API Routes
* GPT Review 指出两套并列会导致边界混乱

## Considered Options

1. Server Actions 为主，API Routes 仅限特定场景
2. 只用 API Routes
3. 只用 Server Actions
4. 两者并列，按场景自由选择

## Decision Outcome

Chosen option: "Server Actions 为主，API Routes 仅限特定场景"，because 既能利用 SA 的 CRUD 效率优势，又保留 API Routes 处理 webhook/流式等特殊场景的能力。

**职责划分**：
- Server Actions = 内部表单 / CRUD（主通路）
- API Routes = 仅 webhook / 流式响应 / 外部集成

**工程约束**：
- `actions/` 只做入口：收参、鉴权、调 service
- `services/` 承载业务逻辑
- `db/` 负责查询和事务
- 禁止在 action 中堆叠业务逻辑

### Consequences

* Good, because 职责清晰，开发者不用纠结选哪个
* Good, because Server Actions 减少样板代码，CRUD 开发快
* Bad, because 需要团队遵守约定，违反时无编译期检查
* Neutral, because 每月审查 API Routes 数量，超过 5 个时需审视是否边界漂移

## Pros and Cons of the Options

### 只用 API Routes

* Good, because 模式统一，所有服务端逻辑走同一通路
* Bad, because 丧失 Server Actions 的效率优势，CRUD 需要手写 fetch

### 只用 Server Actions

* Good, because 极致统一，零 API Routes
* Bad, because 流式响应、webhook 等场景无法实现

### 两者并列

* Good, because 灵活度最高
* Bad, because 边界混乱，同一功能可能出现两种实现

## More Information

此决策是 ADR-001 的直接延伸。ADR-010 引入 FastAPI 后，AI 分析相关的 API 调用走 FastAPI HTTP API，不经过 Next.js API Routes。

---

# ADR-004: 自定义 LLMProvider 接口

## Status

Superseded by ADR-010

## Context and Problem Statement

Prism 需支持多模型按项目配置，Vercel AI SDK 可能对底层模型切换有限制。GPT 建议业务核心层自定义接口，UI 层可选用 AI SDK。

## Decision Outcome

原方案：业务层自定义 `LLMProvider` 接口（analyze / generate / embed），UI 层可选用 AI SDK。

已被 ADR-010 取代：LLM 调用逻辑迁移到 FastAPI Python 侧实现，利用 Python AI 生态的天然优势。

### Consequences

* Neutral, because 原始设计思路（业务层抽象 LLM 接口）在 FastAPI 侧继续沿用

---

# ADR-005: Auth.js v5 Credentials 最简认证

## Status

Accepted（2026-04-03 修正）

## Context and Problem Statement

Prism 目标用户 1-20 人，非商业化产品。需要多用户支持和项目级权限隔离，但不需要 OAuth 等复杂认证流程。初版低估了 Credentials Provider 下开发者的职责范围，后修正。

## Decision Drivers

* 1-20 人规模，OAuth 对内部工具无价值
* 需要项目级权限隔离
* 安全性不能妥协（密码哈希、Session 管理）

## Considered Options

1. Auth.js v5 Credentials（邮箱密码）
2. 手写 JWT
3. Lucia Auth
4. Auth.js 全量配置（含 OAuth）

## Decision Outcome

Chosen option: "Auth.js v5 Credentials（邮箱密码）"，because 对 1-20 人规模，邮箱密码足够，Auth.js 提供标准化的登录流程和 Session 管理，避免手写安全逻辑的坑。MVP 用 JWT，不建 session 表。

**职责划分**：
- Auth.js 负责：登录流程 / Session 管理 / 回调 hooks
- 开发者自己管：用户业务模型 / 密码哈希（bcrypt）/ 业务权限判断

**MVP 用户表**：`users(id, email, name, password_hash, role, status, created_at)`

### Consequences

* Good, because 标准化登录流程，不用手写 token 签发/验证
* Good, because 足够轻量，不引入 OAuth 复杂度
* Bad, because Credentials Provider 下开发者需自行管理密码哈希和业务权限，初版低估了这部分工作量
* Neutral, because 未来如需 OAuth，Auth.js 支持平滑升级

## Pros and Cons of the Options

### 手写 JWT

* Good, because 完全可控
* Bad, because 安全坑多（token 泄露、刷新机制、CSRF）

### Lucia Auth

* Good, because 轻量、设计优雅
* Bad, because 已归档，不再维护

### Auth.js 全量配置

* Good, because OAuth 开箱即用
* Bad, because 对 20 人内部工具，OAuth 配置是纯成本无收益

## More Information

2026-04-03 修正：初版低估 Credentials Provider 下开发者职责，补充了职责划分说明。

---

# ADR-006: TanStack Query + Zustand 职责分离

## Status

Accepted

## Context and Problem Statement

Prism 存在两类前端状态：服务端数据（需缓存、失效、乐观更新）和 UI 交互状态（React Flow 的节点位置、面板折叠等纯本地状态）。GPT 指出单人开发最容易把数据放乱，需要从架构层面划清边界。

## Decision Drivers

* 服务端数据需要缓存失效和乐观更新机制
* React Flow 产生大量纯 UI 状态，不应入库
* 单人开发容易混淆两类状态的边界

## Considered Options

1. TanStack Query（服务端）+ Zustand（前端）
2. 只用 Zustand
3. 只用 TanStack Query
4. Redux
5. React Context

## Decision Outcome

Chosen option: "TanStack Query 管服务端数据 + Zustand 管纯前端状态"，because 职责天然分离，各自解决各自领域的问题。

**核心规则**：
- TanStack Query：服务端数据的缓存、失效、乐观更新
- Zustand：纯前端 UI 状态（React Flow 视图、面板状态等）
- 派生数据不存储，实时计算
- **禁止**：将 TQ 缓存数据复制到 Zustand

### Consequences

* Good, because 两类状态有明确的归属，不会混乱
* Good, because TanStack Query 的缓存失效机制开箱即用
* Bad, because 需要开发者理解两个库的边界，有认知成本
* Neutral, because Zustand 足够轻量，不增加显著的 bundle 大小

## Pros and Cons of the Options

### 只用 Zustand

* Good, because 单一状态库，心智模型简单
* Bad, because 缓存失效、乐观更新需要手写，重复造轮子

### 只用 TanStack Query

* Good, because 服务端状态管理能力强
* Bad, because 管不了 React Flow 等纯 UI 状态

### Redux

* Good, because 生态成熟，中间件丰富
* Bad, because 对单人项目过重，样板代码多

### React Context

* Good, because 零依赖，React 内置
* Bad, because 性能差，任何 context 变化触发全子树重渲染

## More Information

ADR-009 进一步细化了 React Flow 视图状态的处理方式。

---

# ADR-007: pgvector 延迟到 v0.3

## Status

Accepted

## Context and Problem Statement

Prism 未来需要语义搜索能力，但 GPT 指出提前安装 pgvector 会复杂化 schema 设计，MVP 阶段不应引入。

## Decision Outcome

Chosen option: "MVP 使用 pg_trgm + tsvector 实现搜索，v0.3 再引入 pgvector"，because 当前关键词搜索足够，避免过早复杂化。

**触发条件**：关键词搜索明确不够用时，启动 pgvector 集成。

### Consequences

* Good, because MVP schema 保持简洁，降低开发和调试成本
* Bad, because 如果语义搜索需求提前到来，需要临时调整计划
* Neutral, because PostgreSQL 生态内升级，无需更换数据库

---

# ADR-008: 0.x 项目归个人，1.x 团队化

## Status

Accepted

## Context and Problem Statement

Prism 未来需要团队和空间概念，但 MVP 阶段仅 1-5 人使用，提前建团队模型是过度设计。

## Decision Outcome

Chosen option: "0.x 版本 `project.owner_id = user_id`，1.x 版本引入 team 表"，because MVP 阶段用最简模型，团队化时再扩展。

**迁移方案**：升级时自动为每个用户建"个人团队"，将项目挂到团队下。
**前提**：权限判断抽成独立模块，不硬编码 owner_id 逻辑。

### Consequences

* Good, because MVP 数据模型简洁，开发速度快
* Bad, because 1.x 迁移需要数据 migration，有一次性成本
* Neutral, because 权限模块独立后，迁移影响面可控

---

# ADR-009: React Flow 视图状态与业务数据分离

## Status

Accepted

## Context and Problem Statement

React Flow 维护大量视图状态（节点坐标 x/y、缩放比例、折叠状态、选中状态等）。如果将这些视图状态混入数据库，会污染业务数据模型。GPT 指出不要把视图状态当业务模型存储。

## Decision Drivers

* React Flow 视图状态变化频繁（拖拽、缩放），不适合每次写 DB
* 业务数据（节点内容、关系）和视图数据（位置、样式）本质不同
* 需要支持布局持久化，但不应污染核心表

## Considered Options

1. DB 只存业务数据，前端管视图状态
2. 视图状态和业务数据统一存 DB
3. 视图状态存 localStorage

## Decision Outcome

Chosen option: "DB 只存业务真相（node / node_relation），前端管视图状态"，because 职责分离，高频视图变化不冲击数据库。

**实现方式**：
- DB 存储：`node`（业务内容）、`node_relation`（业务关系）
- 前端 Zustand 管理：x/y 坐标、缩放比例、折叠状态、选中状态
- 布局持久化：单独 `layout_preferences` 表，按需保存
- `onNodesChange` 更新 Zustand，不触发 DB 写入

### Consequences

* Good, because 业务数据模型干净，不混入视图噪音
* Good, because 高频视图变化不产生 DB 写入压力
* Bad, because 刷新页面后视图状态丢失，需要 layout_preferences 做持久化
* Neutral, because 与 ADR-006 的 Zustand 职责一致，视图状态归 Zustand

## More Information

此决策是 ADR-006（TanStack Query + Zustand 职责分离）的具体应用场景。

---

# ADR-010: 混合架构 Next.js + FastAPI

## Status

Accepted

## Context and Problem Statement

Week 1 用 Next.js Server Actions 实现全部 CRUD 已跑通。但纯 Next.js 方案存在三个关键问题：面试叙事断裂（AI Infra 岗位需要 Python 能力展示，纯 TS 无法支撑）、技能线断裂（线 A pytest 是 Python，线 B 变纯 TS，两线不互通）、AI 生态劣势（Python 的 AI/ML 生态远强于 Node.js）。但推翻 Week 1 产出全面重写不划算。

## Decision Drivers

* 面试叙事需要：AI Infra 岗位需要展示 Python 微服务架构能力
* 技能线复用：线 A 的 pytest 是 Python，线 B 需要共享 Python 能力
* AI 生态优势：Python 的 LLM/ML 库生态远强于 Node.js
* 沉没成本：Week 1 的 Next.js CRUD 已跑通，不应浪费

## Considered Options

1. 混合架构：Next.js 前端 + CRUD，FastAPI AI 分析微服务
2. 全部改为 FastAPI + React（纯 Python 后端）
3. 纯 Next.js，Python 能力靠其他项目补
4. Next.js 内嵌 Python 运行时

## Decision Outcome

Chosen option: "混合架构 Next.js + FastAPI"，because 既保留 Week 1 的 Next.js 产出，又引入 Python 微服务支撑面试叙事和 AI 生态。

**架构图**：
```
Next.js (SSR/RSC/Server Actions)
    → HTTP API →
FastAPI (analyze / test-points / compare / embed / search)
    → SQL →
PostgreSQL 16 (共享数据库)
```

**Docker Compose 部署**：
- `db`：PostgreSQL 16
- `web`：Next.js（端口 3001）
- `analyzer`：FastAPI（端口 8001）

**Schema 管理**：变更统一由 Drizzle migration 管理，FastAPI 只读 + 写分析结果。

**时间线**：
- v0.0.1：Next.js CRUD
- v0.0.2：维度优化
- v0.1.0：FastAPI 骨架
- v0.2.0：完整 AI 分析

### Consequences

* Good, because 面试可讲微服务架构设计决策，展示架构判断力
* Good, because 复用 Python Skill，线 A 和线 B 共用 Python 能力栈
* Good, because 直接使用 Python AI 生态（LangChain、LlamaIndex 等）
* Bad, because 多一个服务需要维护，Docker Compose 复杂度增加
* Bad, because 两层 ORM（Drizzle + SQLAlchemy），需要约定 schema 变更流程
* Bad, because 多一跳网络延迟（Next.js → FastAPI）

## Pros and Cons of the Options

### 全部改为 FastAPI + React

* Good, because 后端语言统一为 Python
* Bad, because 浪费 Week 1 的 Next.js CRUD 产出
* Bad, because 需要重新搭建前端基础设施

### 纯 Next.js，Python 靠其他项目补

* Good, because 架构最简，单一技术栈
* Bad, because 35% 的开发精力不贡献 Python 能力，面试叙事断裂
* Bad, because Node.js AI 生态弱，LLM 集成受限

### Next.js 内嵌 Python 运行时

* Good, because 单一部署单元
* Bad, because 架构不合理，两种运行时混在一起，维护困难

## More Information

此决策取代了 ADR-004（自定义 LLMProvider 接口），LLM 调用逻辑迁移到 FastAPI Python 侧。
```

---
