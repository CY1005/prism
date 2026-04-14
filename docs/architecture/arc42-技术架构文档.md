# Prism 技术架构文档

> 基于 [arc42](https://arc42.org/) 模板（轻量模式，选用节 1/3/5/6/8/9/11）
> 版本：v0.1（2026-04-10）
> 状态：MVP（v0.0.1 已交付，v0.0.2 开发中）

---

## 1. Introduction & Goals

### 1.1 系统定义

Prism 是一个**通用项目知识管理与分析平台**，以功能模块为核心组织单元，将散落在各处的产品知识（需求、设计决策、竞品情报、测试策略、技术方案等）统一到一个可结构化、可搜索、可关联的平台中。

核心问题：项目知识散落在 Confluence/Notion/飞书/脑子里，无法按功能维度交叉查看，导致需求分析遗漏、经验无法复用。

### 1.2 Top 3 质量目标

| 优先级 | 质量目标 | 度量方式 |
|--------|---------|---------|
| 1 | **可扩展性（Extensibility）** | 新增项目类型/维度类型 = 纯数据操作，不改表结构、不改代码 |
| 2 | **交互速度（Responsiveness）** | 树导航、维度编辑、搜索操作响应 < 200ms（本地部署） |
| 3 | **AI 分析准确性（Accuracy）** | 需求影响范围分析的召回率 > 80%（v0.3 目标） |

### 1.3 关键 Stakeholders

| 角色 | 关注点 | 与系统的交互 |
|------|--------|-------------|
| CY（开发者/测试者/用户） | 功能正确性、开发效率、面试叙事 | 全部功能，dogfooding |
| Mentor/面试官 | 架构合理性、技术选型理由 | 审查架构文档和代码 |
| 未来团队成员（v1.0） | 上手成本、权限隔离 | 项目级协作 |

---

## 3. Context & Scope

### 3.1 系统上下文（C4 Level 1）

```
┌─────────────────────────────────────────────────────────┐
│                      外部环境                            │
│                                                         │
│  [用户/浏览器]                                           │
│       │                                                 │
│       │ HTTPS (localhost:3001)                           │
│       ▼                                                 │
│  ┌─────────────┐                                        │
│  │   Prism     │──── HTTP ────▶ [Claude API]            │
│  │  (系统边界)  │              (Anthropic 云服务)         │
│  └─────────────┘                                        │
│       │                                                 │
│       │ TCP:5432                                        │
│       ▼                                                 │
│  [PostgreSQL 16]                                        │
│  (Docker 容器)                                           │
└─────────────────────────────────────────────────────────┘
```

**外部依赖：**

| 外部系统 | 协议 | 用途 | 故障影响 |
|---------|------|------|---------|
| Claude API（Anthropic） | HTTPS | AI 需求分析、测试点生成、竞品对比 | AI 分析功能不可用，CRUD 不受影响 |
| PostgreSQL 16 | TCP/SQL | 所有数据持久化 | 系统完全不可用 |

**边界决策：**
- 认证自包含（Auth.js），不依赖外部 IdP
- 部署自包含（Docker Compose），不依赖云服务
- 向量搜索延迟到 v0.3（pgvector），MVP 阶段用全文搜索

---

## 5. Building Block View

### 5.1 容器图（C4 Level 2）

```
┌──────────────────────────────────────────────────────────────┐
│                     Docker Compose 网络                       │
│                                                              │
│  ┌────────────────────────────────┐   ┌───────────────────┐  │
│  │  web (Next.js 16, port:3001)  │   │ analyzer (FastAPI  │  │
│  │                                │   │   port:8001)       │  │
│  │  ┌──────────┐  ┌───────────┐  │   │                    │  │
│  │  │ App Router│  │ Server    │  │──▶│ POST /analyze      │  │
│  │  │ (RSC/SSR) │  │ Actions   │  │   │ POST /test-points  │  │
│  │  │          │  │           │  │   │ POST /compare      │  │
│  │  │ React Flow│  │ services/ │  │   │ POST /embed (v0.3) │  │
│  │  │ Recharts │  │ db/       │  │   │ GET  /search       │  │
│  │  └──────────┘  └─────┬─────┘  │   └────────┬──────────┘  │
│  └────────────────────────┼───────┘            │              │
│                           │ Drizzle ORM        │ SQLAlchemy   │
│                           ▼                    ▼              │
│                    ┌──────────────────────────────┐           │
│                    │  db (PostgreSQL 16, port:5432)│           │
│                    │  8 张核心表 + knowledge_items  │           │
│                    └──────────────────────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Web 容器组件分解

```
web/
├── app/                     # Next.js App Router
│   ├── (auth)/              # 认证相关页面（登录/注册）
│   ├── (dashboard)/         # 主工作区页面
│   │   ├── projects/        # 项目列表/创建
│   │   └── workspace/       # 项目工作区（树+维度+版本）
│   └── api/                 # API Routes（仅 webhook/流式）
├── components/              # UI 组件
│   ├── tree/                # 节点树（自引用树导航）
│   ├── dimensions/          # 维度卡片（JSONB 动态渲染）
│   ├── graph/               # React Flow 关系图（v0.2+）
│   └── ui/                  # shadcn/ui 基础组件
├── actions/                 # Server Actions 入口层
│   ├── node-actions.ts      # 节点 CRUD
│   ├── dimension-actions.ts # 维度记录 CRUD
│   └── project-actions.ts   # 项目 CRUD
├── services/                # 业务逻辑层
│   ├── node-service.ts      # 节点业务规则（树操作、路径计算）
│   ├── dimension-service.ts # 维度业务规则（Schema 校验、版本锁）
│   └── project-service.ts   # 项目业务规则（模板实例化、权限）
├── db/                      # 数据访问层
│   ├── schema.ts            # Drizzle 表定义（唯一 schema 真相源）
│   ├── queries/             # 查询函数（含事务）
│   └── migrations/          # Drizzle 迁移文件
└── lib/                     # 工具函数
    ├── auth.ts              # Auth.js 配置
    └── api-client.ts        # FastAPI 调用封装
```

**分层约束：**
- `actions/` — 只做入口：收参、鉴权、调 service，禁止业务逻辑
- `services/` — 业务逻辑归属地，调 `db/` 完成数据操作
- `db/` — 纯查询和事务，不含业务判断

### 5.3 Analyzer 容器组件分解

```
api/
├── main.py                  # FastAPI 入口 + CORS + 路由挂载
├── models.py                # SQLAlchemy 模型（只读 + 写 knowledge_items）
├── routers/
│   ├── analyze.py           # POST /analyze — 需求影响范围分析
│   ├── test_points.py       # POST /test-points — 测试点生成
│   ├── compare.py           # POST /compare — 竞品对比
│   └── search.py            # GET /search — 全文/语义搜索
├── services/
│   ├── claude_client.py     # Claude SDK 封装
│   └── embedding.py         # 向量化服务（v0.3）
└── Dockerfile               # Python 3.12 + uvicorn
```

### 5.4 数据模型（9 张表）

| 表名 | 职责 | 关键字段 |
|------|------|---------|
| `projects` | 项目根实体 | hierarchy_labels (JSONB), template_type, version_mode |
| `dimension_types` | 维度类型全局注册表 | name, json_schema (JSONB), 12 个预置 |
| `project_dimension_configs` | 项目×维度启用关系 | project_id, dimension_type_id, sort_order |
| `nodes` | 自引用树（功能模块） | parent_id, materialized_path, depth |
| `dimension_records` | 统一维度数据存储 | content (JSONB), version (乐观锁) |
| `version_records` | 版本记录 | release/continuous 两种模式 |
| `node_relations` | 节点间关联 | 跨项目, depends_on/related_to/conflicts_with |
| `knowledge_items` | 知识条目（FastAPI 读写） | confidence, source, tags, content |
| `project_templates` | 项目模板 | 4 种预设（竞品分析/系统架构/研究平台/自定义） |

**数据模型设计原则：**
- 维度数据统一存 JSONB，通过 `dimension_types.json_schema` 做 Schema 校验 — 加维度不改表
- 节点树用 materialized path 实现 — 子树查询 O(1)，移动节点需更新路径
- 乐观锁（version 字段）防止并发覆盖维度编辑

---

## 6. Runtime View

### 6.1 创建功能节点

```
用户（浏览器）         Server Action          node-service         DB (nodes)
     │                    │                      │                    │
     │ 右键→添加子节点     │                      │                    │
     │──────────────────▶│                      │                    │
     │                    │ createNode(parentId,  │                    │
     │                    │   name, type)         │                    │
     │                    │─────────────────────▶│                    │
     │                    │                      │ 计算 materialized   │
     │                    │                      │ path + depth        │
     │                    │                      │───────────────────▶│
     │                    │                      │                    │ INSERT node
     │                    │                      │◀───────────────────│ 返回新节点
     │                    │◀─────────────────────│                    │
     │ revalidatePath     │                      │                    │
     │◀──────────────────│                      │                    │
     │ 树自动刷新          │                      │                    │
```

### 6.2 编辑维度记录（含乐观锁）

```
用户                Server Action       dimension-service        DB
 │                       │                    │                   │
 │ 点维度卡片→编辑        │                    │                   │
 │─────────────────────▶│                    │                   │
 │                       │ updateDimension    │                   │
 │                       │ (id, content,      │                   │
 │                       │  expectedVersion)  │                   │
 │                       │──────────────────▶│                   │
 │                       │                    │ UPDATE ... WHERE  │
 │                       │                    │ version = expected │
 │                       │                    │──────────────────▶│
 │                       │                    │                   │
 │                       │                    │  [affected=0?]    │
 │                       │                    │  → 抛冲突错误      │
 │                       │                    │  [affected=1?]    │
 │                       │                    │  → version+1, 返回│
 │                       │◀──────────────────│                   │
 │ TanStack Query 刷新   │                    │                   │
 │◀─────────────────────│                    │                   │
```

### 6.3 AI 需求分析

```
用户              Next.js (web)           FastAPI (analyzer)       Claude API
 │                     │                        │                      │
 │ 输入需求描述         │                        │                      │
 │───────────────────▶│                        │                      │
 │                     │ POST /analyze           │                      │
 │                     │ {description, context}  │                      │
 │                     │──────────────────────▶│                      │
 │                     │                        │ 构建 prompt            │
 │                     │                        │ (需求+项目上下文)       │
 │                     │                        │─────────────────────▶│
 │                     │                        │                      │ Claude 分析
 │                     │                        │◀─────────────────────│ 返回结构化结果
 │                     │                        │                      │
 │                     │                        │ 解析影响范围            │
 │                     │                        │ + 分析结论              │
 │                     │◀──────────────────────│                      │
 │ 展示分析结果          │                        │                      │
 │ (可保存到维度记录)    │                        │                      │
 │◀───────────────────│                        │                      │
```

### 6.4 跨项目搜索

```
用户              Server Action            DB (nodes + dimension_records)
 │                     │                              │
 │ 输入关键词           │                              │
 │───────────────────▶│                              │
 │                     │ SELECT ... FROM nodes         │
 │                     │ LEFT JOIN dimension_records   │
 │                     │ WHERE name ILIKE '%keyword%'  │
 │                     │ OR content::text ILIKE ...    │
 │                     │────────────────────────────▶│
 │                     │◀────────────────────────────│
 │                     │ 结果附带 project badge         │
 │◀───────────────────│                              │
```

### 6.5 认证流程

```
用户                middleware           Auth.js            DB (users)
 │                     │                   │                   │
 │ 请求任意页面          │                   │                   │
 │───────────────────▶│                   │                   │
 │                     │ 检查 JWT token     │                   │
 │                     │──────────────────▶│                   │
 │                     │                   │ [无/过期]          │
 │                     │                   │ → redirect /login  │
 │                     │                   │                   │
 │ POST /login         │                   │                   │
 │ {email, password}   │                   │                   │
 │────────────────────────────────────────▶│                   │
 │                     │                   │ authorize()        │
 │                     │                   │──────────────────▶│
 │                     │                   │                   │ 查 user
 │                     │                   │                   │ bcrypt.compare
 │                     │                   │◀──────────────────│
 │                     │                   │ 签发 JWT           │
 │◀────────────────────────────────────────│                   │
 │ Set-Cookie: JWT     │                   │                   │
```

---

## 8. Crosscutting Concepts

### 8.1 认证与授权

| 层级 | 策略 | 实现 |
|------|------|------|
| 认证 | Auth.js v5 Credentials Provider | authorize() 查 users 表 + bcrypt.compare |
| 会话 | JWT（无 session 表） | middleware 检查每个请求的 JWT |
| 授权 | 项目级权限 | service 层判断 project.owner_id === session.user.id |
| 密码存储 | bcrypt | 开发者责任（Auth.js 不自动哈希） |

**演进路径：** MVP 无 session 表 → v1.0 需设备管理/审计时切 database session strategy。

### 8.2 错误处理

| 场景 | 策略 |
|------|------|
| Server Action 失败 | 返回 `{ success: false, error: string }`，前端 toast 提示 |
| 乐观锁冲突 | 返回冲突错误 + 最新数据，前端提示"数据已被修改，请刷新" |
| FastAPI 不可用 | Next.js 捕获连接错误，AI 功能降级，CRUD 不受影响 |
| Claude API 超时/限流 | FastAPI 返回 503，前端提示"分析服务暂时不可用" |
| 数据校验失败 | Zod schema 在 action 层拦截，返回字段级错误信息 |

### 8.3 日志策略

| 容器 | 方式 | 内容 |
|------|------|------|
| web (Next.js) | console.log → Docker stdout | Server Action 调用、错误栈 |
| analyzer (FastAPI) | Python logging → Docker stdout | API 调用、Claude 请求耗时、错误 |
| db (PostgreSQL) | pg_log → Docker stdout | 慢查询 (>1s) |
| 统一收集 | `docker compose logs -f` | MVP 阶段不上 ELK |

### 8.4 API 设计模式

**内部通信（Next.js → FastAPI）：**
- RESTful JSON over HTTP
- 基础路径：`http://analyzer:8001`（Docker 内部网络）
- 无认证（容器间通信，不暴露到宿主机外部）
- 超时：分析类接口 30s，搜索类接口 5s

**前端数据获取：**
- 读操作：React Server Components 直接调 `db/queries`，零 API 调用
- 写操作：Server Actions，自动 revalidate 关联路径
- AI 分析：Server Action 内部 fetch FastAPI，对前端透明

### 8.5 状态管理

| 数据类型 | 管理方 | 示例 |
|---------|--------|------|
| 服务端数据（DB） | TanStack Query | 节点列表、维度记录、项目配置 |
| UI 临时状态 | Zustand | 侧边栏折叠、当前选中节点、编辑模式 |
| React Flow 视图 | React Flow 内部状态 | 节点 x/y 坐标、缩放、选中态 |
| 派生数据 | 不存储，实时计算 | 节点统计、维度完成度 |

**禁令：** 服务端数据禁止复制到 Zustand；React Flow 视图状态禁止入库。

---

## 9. Architecture Decisions

### ADR 索引

所有 ADR 原始文档位于 `prism/docs/adr/`，本节为索引。

| ADR | 标题 | 状态 | 核心决策 |
|-----|------|------|---------|
| ADR-001 | 前端框架选型 | Accepted | Next.js 15 (App Router)。React Flow 锁定 React 生态；AI 生成 Next.js 代码质量最高。 |
| ADR-002 | 数据库与 ORM | Accepted | PostgreSQL 16 + Drizzle ORM。JSONB 灵活查询、WITH RECURSIVE 树查询、pgvector 预留。否决 Prisma（JSONB 操作受限）、MongoDB（关联查询弱）。 |
| ADR-003 | Server Actions 边界 | Accepted | Server Actions 为主通路（用户操作），API Routes 仅 webhook/流式/外部对接。分层：actions/ 入口 → services/ 业务 → db/ 查询。 |
| ADR-004 | AI 服务层抽象 | Accepted | 自定义 LLMProvider 接口（analyze/generate/embed），不绑死 Vercel AI SDK。各模型实现接口，按配置切换。 |
| ADR-005 | 认证方案 | Accepted | Auth.js v5 Credentials Provider。用户量 1-20 人够用；密码哈希是开发者责任（bcrypt）；OAuth 升级路径保留。 |
| ADR-006 | 状态管理 | Accepted | TanStack Query（服务端数据）+ Zustand（UI 状态），职责严格分离。 |
| ADR-007 | 向量搜索 | Deferred → v0.3 | pgvector 延后。触发条件：关键词搜索明确不够用时。 |
| ADR-008 | 项目归属模型 | Deferred → v1.0 | MVP 项目归个人；v1.0 迁移策略：自动建"个人团队"，项目挂载过去。 |
| ADR-009 | React Flow 数据分离 | Accepted | DB 只存业务真相（节点实体、关联）；前端管视图状态（位置、缩放、折叠）。布局持久化用 layout_preferences 表，不污染 node 表。 |
| ADR-010 | 混合架构 | Accepted | Next.js（CRUD）+ FastAPI（AI 分析）双服务。理由：面试叙事 + Python AI 生态 + 复用已有 Python 技能。 |

---

## 11. Risks & Technical Debt

### 11.1 已知技术风险

| ID | 风险 | 影响 | 缓解措施 | 状态 |
|----|------|------|---------|------|
| R1 | Drizzle 在 AI 训练数据中覆盖度低 | AI 生成的 Drizzle 代码可能有误，需要更多人工审查 | IDAKE Break 阶段逐条验证；踩坑记入 engineering-notes | 持续监控 |
| R2 | 双 ORM 共享 DB（Drizzle + SQLAlchemy） | Schema 变更需两侧协调，可能出现不一致 | Drizzle 为 schema 唯一真相源；FastAPI 侧只读 + 写 knowledge_items | 已有约束 |
| R3 | Claude API 依赖 | API 不可用或限流导致 AI 分析功能中断 | 降级策略：CRUD 不受影响；前端提示服务不可用 | 已设计 |
| R4 | JWT 无 session 表 | 无法主动失效 token、无设备管理、无审计日志 | MVP 可接受；v1.0 切 database session strategy | 已延迟 |

### 11.2 已知技术债

| ID | 债务 | 产生原因 | 偿还计划 |
|----|------|---------|---------|
| D1 | 全文搜索替代语义搜索 | pgvector 延迟到 v0.3 | v0.3 引入 pgvector + embedding |
| D2 | 无自动化测试 | MVP 阶段用 IDAKE 人工验证 | v0.2 引入关键路径 E2E 测试 |
| D3 | React Flow + Recharts 可视化未实现 | 开发量大，MVP 优先 CRUD | v0.2 React Flow 关系图；v0.3 Recharts 统计图表 |
| D4 | 容器间通信无认证 | Docker 内部网络，MVP 不暴露外部 | 上线前加 API key 或 mTLS |
| D5 | 日志无结构化收集 | MVP 用 Docker stdout | 用户量增长后引入结构化日志 |

### 11.3 扩展性评估

| 维度 | 当前能力 | 瓶颈点 | 扩展路径 |
|------|---------|--------|---------|
| 项目数量 | 单用户 ~50 项目 | 跨项目搜索性能（全表扫描） | 加搜索索引 / pgvector |
| 节点规模 | 单项目 ~1000 节点 | materialized path 更新（移动子树） | 按需改用 nested set 或 closure table |
| 并发用户 | 1-5 人 | JWT 无 session 管理 | v1.0 database session + 连接池 |
| AI 分析吞吐 | 串行调用 Claude | Claude API rate limit | 队列化 + 多 key 轮换 |

---

## 附录：技术栈速查

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js (App Router) | 16 |
| UI 组件 | shadcn/ui + Tailwind CSS | v4 |
| ORM (主) | Drizzle ORM | latest |
| ORM (分析服务) | SQLAlchemy | latest |
| AI 分析 | FastAPI + Claude SDK | Python 3.12 |
| 数据库 | PostgreSQL | 16 |
| 状态管理 | TanStack Query + Zustand | — |
| 可视化 | React Flow + Recharts (v0.3) | — |
| 认证 | Auth.js v5 Credentials | — |
| 部署 | Docker Compose | — |
| 开发方法论 | IDAKE (Spec→Build→Fix→Evolve) | — |
```

---
