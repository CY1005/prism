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

## 开发 Skill 模板（高频任务标准流程）

> 从 99 个 Bug 和实际开发经验中提炼。每次开发前对照执行。

### Skill: 新增 AI 分析类端点

触发：需要新增一个调用 LLM 的分析功能

```
1. api/schemas/xxx.py    — 定义 Request/Response Pydantic 模型
2. api/services/xxx.py   — 业务逻辑，调用 get_provider(ai_provider, api_key)
3. api/routers/xxx.py    — 路由，SSE 流式用 StreamingResponse
4. api/main.py           — app.include_router() 注册，选对 prefix
5. web/src/services/xxx.ts  — 前端 API 客户端（fetchJson/postJson）
6. web/src/actions/xxx.ts   — Server Action，标记 "use server"
7. web/src/app/.../page.tsx — 页面组件
```

陷阱（来自 BUG-043~062）：
- SSE 格式必须是 `event: chunk\ndata: {...}\n\n`，不是纯 JSON
- Provider 降级：无 API key → MockProvider，**不要报错**
- 大文本截断：AI prompt 中每个文档限 5000 字符
- **Server Action 必须加认证**：`const user = await requireAuth()`（BUG-095）
- **新端点必须加认证**：`Depends(require_user)`（BUG-075、BUG-080）

### Skill: 新增前后端联调功能

触发：功能涉及前端调后端 API

```
1. 后端先行：定义 Pydantic Schema（Contract-first）
2. 前端跟进：TypeScript 类型必须与 Pydantic 字段一一对应
3. 字段名规则：后端 snake_case → 前端 camelCase
4. 验证对齐：逐字段检查，不靠"看起来差不多"
```

陷阱（PAIN-001，8 个 Bug 的根因）：
- **绕过 Server Action 直接 fetch 是禁止的**（BUG-054~062 的共同根因）
- 前端组件**不得自定义响应类型**，必须从 `services/` 导入（BUG-055~058）
- JSONB 字段的前端渲染**必须校验结构**（BUG-020、BUG-083）

### Skill: 新增数据库表

触发：需要新增一张表

```
1. web/src/db/schema.ts  — Drizzle 定义（单一真相源）
2. DATABASE_URL=... npx drizzle-kit push
3. api/models/tables.py  — SQLAlchemy 镜像，必须 extend_existing=True
4. 如果 FastAPI 写入该表 → 在 tables.py 文件头注释中说明
```

陷阱：
- `text()` 返回 string 不是联合类型 → 组件入口处 `as` 断言（BUG-027）
- JSONB 字段定义用 `jsonb("xxx").$type<YourType>()`，渲染前必须防御检查
- drizzle-kit 不读 .env.local → 必须手动传 DATABASE_URL 前缀（BUG-085）
- 新增列时检查 ORM 列名与 DB 列名是否一致（BUG-070）

## 排错 Skill 模板（Top 5 Bug 模式 + 排查路径）

> 基于 99 个 Bug 的模式统计。遇到问题时先匹配模式再排查。

### 模式 #1：前后端契约漂移（出现频率最高）

症状：API 返回 500 / 前端 undefined / 字段缺失

```
排查路径：
1. 比对 api/schemas/ 的 Pydantic 字段 vs web/src/services/ 的 TS 类型
2. 检查 snake_case ↔ camelCase 转换
3. 检查前端是否绕过 Server Action 直接 fetch（禁止行为）
4. 检查前端组件是否自定义了响应类型（应从 services/ 导入）
5. 检查 JSONB 字段的结构是否一致
```

来源：BUG-043~050（8个）、BUG-054~062（9个）、BUG-066、BUG-070、BUG-082

### 模式 #2：空状态 / 边界值未处理

症状：页面空白 / Cannot read properties of undefined / 组件不渲染

```
排查路径：
1. 数据是否为空数组/null/undefined？→ 加 fallback 渲染
2. useTransition 期间旧数据和新 UI 是否错配？→ 渲染前校验 selectedId
3. JSONB content 是否假设了结构？→ 开头加 if (!Array.isArray(x)) return
4. Server Action 是否正确 await？→ 检查 async/await 链
5. revalidatePath() 是否在变更后调用？→ 确认 ISR 刷新
```

来源：BUG-020~026、BUG-033~036、BUG-067、BUG-072、BUG-092

### 模式 #3：AI 生成代码使用过时 API

症状：TypeScript 编译错误 / Property does not exist / 运行时类型不匹配

```
排查路径：
1. 检查 shadcn/ui 组件：是否用了 asChild？（禁止）
2. 检查 Zod：error.errors → error.issues（v3→v4 breaking change）
3. 检查 Select：onValueChange 签名是否含 null（base-ui 新签名）
4. 检查 Next.js：params 是否需要 await（App Router 变更）
5. 通用规则：AI 生成 UI 代码后**立即跑 tsc --noEmit**
```

来源：BUG-027~032（46个编译错误）、BUG-087

### 模式 #4：认证 / 权限漏洞

症状：未登录可访问 / 低权限可执行高权限操作 / 401 变 422

```
排查路径：
1. 新端点是否加了 Depends(require_user)？（BUG-075）
2. Server Action 是否调了 requireAuth()？（BUG-095）
3. 权限检查是否用了 checkProjectAccess(userId, projectId, 'editor')？（BUG-076）
4. 认证失败是否返回 401 而非 422？（BUG-080）
5. 用 Viewer 角色测试一遍所有写操作
```

来源：BUG-075、BUG-076、BUG-080、BUG-095

### 模式 #5：错误处理缺失 / 静默吞错

症状：操作无反应 / 用户不知道成功还是失败 / 500 错误无提示

```
排查路径：
1. catch 块是否吞掉了错误？→ 至少 console.error + 用户提示（BUG-098）
2. 成功操作是否有视觉反馈？→ toast/状态变化（BUG-099）
3. DB 异常是否返回 503？→ 包装 try-except（BUG-081）
4. 非法参数是否返回 422 而非 500？→ UUID 格式校验（BUG-077）
5. 软删除后查询是否过滤？→ WHERE deleted_at IS NULL（BUG-078）
```

来源：BUG-077、BUG-078、BUG-081、BUG-084、BUG-086、BUG-098、BUG-099

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

## 开发闭环协议（每次开发自动执行）

> 融合 Hermes Skills 闭环 + Google SRE Blameless Postmortem + Toyota Kata + DevEx 三维度 + 日本 YWT 振返り法 + Preflight Checklist。
> 目标：遇到的每个问题都能自动沉淀、反思根因、回流到系统、量化改进。

### Phase 0: Preflight Checklist（开始开发前）

每次开发任务启动前，跑完以下检查：

```
□ 读过 engineering-notes.md？（已知陷阱不要重踩）
□ AC（验收标准）写清楚了？（没有 AC 不写代码）
□ 涉及哪些文件？列出影响范围
□ 检索 bug-log：有没有同区域的历史 Bug？
□ 如果涉及前后端联调：Contract-first 定义了？
```

来源：航空业 Preflight Checklist——飞行员不论经验多丰富，每次起飞都必须跑检查清单。

### Phase 1: 触发条件（何时启动沉淀）

以下任一情况发生时，**必须**执行沉淀流程：
- 修复了一个 Bug（不论大小）
- 同一文件编辑 >3 次才解决问题
- 发现文档/注释与实际行为不一致
- 使用了一个之前没用过的模式或 workaround
- `tsc --noEmit` 或测试失败后调试修复

### Phase 2: 沉淀流程（5 步）

```
① 记录现象 → ② Blameless 5 Whys → ③ 归类模式 → ④ 回流更新 → ⑤ 验证闭环
```

**① 记录现象**：在 `docs/testing/bug-log.md` 追加条目
- 现象是什么？报错信息？
- 在哪个文件、哪一行？

**② Blameless 5 Whys**：问"什么机制允许了这个错误"，不问"我犯了什么错"

来源：Google SRE —— "You can't fix people, but you can fix systems and processes."

```
- Why 1: 为什么报错？→ 字段名不匹配
- Why 2: 为什么不匹配？→ 前端用 camelCase，后端用 snake_case
- Why 3: 什么机制允许了这个不匹配通过？→ 没有 Contract-first 检查
- Why 4: 为什么流程里没有这个检查？→ 没人加过
- 系统性根因: 开发流程缺少前后端 Schema 对齐步骤
- 系统性修复: 在 Preflight Checklist 增加"联调前 Schema 对齐"检查项
```

**③ 归类模式**：这个问题属于哪个已知模式？
- 检查 `web/engineering-notes.md` 是否有类似规则
- 如果是新模式 → 新增规则
- 如果是已有模式的变体 → 补充到已有规则
- 标注来源：`[首次出现] / [模式 #N 变体] / [与 BUG-XXX 同源]`

**④ 回流更新**：根据根因类型路由到对应文件

| 根因类型 | 回流到 | 更新内容 |
|----------|--------|----------|
| 代码模式陷阱 | `web/engineering-notes.md` | 新增/补充规则 |
| 开发流程缺失 | `CLAUDE.md` Preflight Checklist | 新增检查项 |
| 架构设计问题 | `docs/adr/` | 新增或修订 ADR |
| AI 生成代码通病 | `CLAUDE.md` 禁止的模式 | 新增禁止项 |
| 跨会话知识 | `~/.claude/memory/` | 新增 Memory 条目 |

**⑤ 验证闭环**：
- 回流的规则下次会被自动读取吗？（在 CLAUDE.md / engineering-notes 中？）
- 写一个断言：如果未来同样的问题再出现，哪条规则应该拦住它？

### Phase 3: 反思模板

```markdown
## BUG-XXX: [一句话描述]

- **日期**: YYYY-MM-DD
- **严重度**: Critical / High / Medium / Low
- **状态**: 已修复

### 现象
[报错信息 / 异常行为]

### Blameless 5 Whys
- Why 1: [直接原因]
- Why 2: [为什么直接原因会发生]
- Why 3: [什么机制允许了这个错误通过]
- Why 4: [为什么该机制不存在/失效]
- **系统性根因**: [一句话：流程/工具/规范层面的缺失]
- **系统性修复**: [改进流程/工具/规范的具体动作]

### 修复
[具体代码改动]

### 回流
- [ ] engineering-notes.md 已更新（规则 #N）
- [ ] CLAUDE.md 已更新（如涉及流程/规范变更）
- [ ] Preflight Checklist 已更新（如需新增检查项）
- [ ] Memory 已更新（如涉及跨会话知识）

### 模式分类
[首次出现 / 已有模式 #N 的变体 / 与 BUG-XXX 同源]
```

### Phase 4: Post-flight YWT（开发结束时）

来源：日本能率協会 JMAC 的 YWT 振返り法——从经验出发的个人成长反思。

每次开发任务完成后，花 2 分钟回答：
- **Y**（やった / 做了什么）：这次完成了什么功能 / 修了什么 Bug？
- **W**（わかった / 领悟了什么）：从中理解了什么**原理**？（不是"学了什么 API"，是"理解了什么设计取舍"）
- **T**（つぎ / 下次做什么）：下次开发前要改变什么**行为**？

如果 W 中有值得沉淀的内容 → 写入 engineering-notes.md 或 Memory。

### Phase 5: Kata 审计（每 10 个 Bug 或每个版本结束时）

来源：Toyota Kata 改善型——用数据驱动的持续改善，不靠感觉。

```
① 把握现状：统计 bug-log 最近 10 个 Bug 的模式分布
   - 类型A（前后端不匹配）: N 个，占 X%
   - 类型B（空状态）: N 个，占 X%
   - 类型C（AI 生成代码问题）: N 个，占 X%

② 设定目标状态：Top 1 模式在下 10 个 Bug 中占比降低 50%

③ 识别障碍：什么阻止了目标达成？
   - 是规则没写？→ 补规则
   - 是规则写了但没执行？→ 强化 Preflight Checklist
   - 是规则执行了但不够？→ 考虑自动化

④ 实验验证：执行改进，用下一批 Bug 数据验证效果

⑤ 清理过时规则：engineering-notes 中不再适用的规则标记 [DEPRECATED] 或删除
```

### 认知负荷控制

来源：DevEx 框架（ACM Queue）——降低认知负荷是提升开发效率的最有效手段。

- **Preflight 降低启动负荷**：不用"记住"要检查什么，跑清单就行
- **engineering-notes 降低编码负荷**：已知陷阱不用"想起来"，读文件就行
- **反思模板降低沉淀负荷**：不用"想怎么写"，填模板就行
- **CLAUDE.md 降低上下文负荷**：每次新对话自动加载，不用重复交代背景

## 关键文档索引

- 产品需求: `docs/product/PRD.md`
- 架构决策: `docs/adr/ADR-001~013.md`
- 开发方法论: `docs/dev-plan/vibecoding-workflow.md`
- 技术架构: `docs/architecture/arc42-技术架构文档.md`
- 工程笔记: `web/engineering-notes.md`（每次开发前必读）
- Bug 日志: `docs/testing/bug-log.md`
- 测试索引: `docs/testing/Prism-测试点-索引.md`
