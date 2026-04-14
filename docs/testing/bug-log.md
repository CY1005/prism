# Prism Bug Log

## BUG-001: Next.js 动态路由参数名冲突导致启动失败

- **日期**: 2026-04-10
- **严重度**: Critical (阻塞启动)
- **状态**: 已修复

### 现象

```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'projectId').
```

Next.js dev server 无法启动。

### 根因

`src/app/projects/` 下同时存在两个动态路由目录：
- `[projectId]/` — 新版 workspace 页面（page.tsx + workspace.tsx）
- `[id]/` — 旧版子路由（overview、settings、analysis、comparison、modules、product-lines）

Next.js 要求同一路径层级的动态段必须使用相同的参数名，两个目录并存导致冲突。

**推测成因**: VibeCoding 迭代过程中，新版页面用了 `[projectId]` 参数名，但旧版子路由仍保留 `[id]`，未统一重命名。

### 修复

1. 将 `[id]/` 下所有子路由合并到 `[projectId]/` 目录
2. 更新 6 个文件中的参数引用：`params.id` → `params.projectId`
3. 清理 `.next` 构建缓存

### 受影响文件

- `src/app/projects/[projectId]/comparison/page.tsx`
- `src/app/projects/[projectId]/product-lines/[plId]/page.tsx`
- `src/app/projects/[projectId]/settings/page.tsx`
- `src/app/projects/[projectId]/analysis/page.tsx`
- `src/app/projects/[projectId]/modules/[moduleId]/page.tsx`
- `src/app/projects/[projectId]/overview/page.tsx`

### 教训

VibeCoding 生成代码时，如果涉及动态路由重构/重命名，需检查同层级是否有残留的旧参数名目录。可作为 Code Quality Gate 的一个检查项。

---

## BUG-002: start.sh 使用 docker-compose v1 命令

- **日期**: 2026-04-10
- **严重度**: Minor (阻塞启动但易修)
- **状态**: 已修复

### 现象

```
/root/cy/prism/scripts/start.sh: line 32: docker-compose: command not found
```

### 根因

脚本中使用了 `docker-compose`（v1 独立二进制），但服务器上安装的是 Docker Compose v2（`docker compose` 子命令）。

### 修复

`docker-compose` → `docker compose`（2 处）。

---

## BUG-003 ~ BUG-019: 代码审查发现的 17 个问题（Sprint 8 后）

- **日期**: 2026-04-10
- **来源**: 代码审查（commit 34bddcf）
- **状态**: 全部已修复
- **验证**: 26 pytest 全绿 + tsc 0 新增错误

### Critical（阻塞/安全）

| ID | 问题 | 文件 | 修复 |
|----|------|------|------|
| C1 | search API 用 f-string 直拼 SQL ILIKE，存在 SQL 注入风险 | `api/services/search.py` | 改为参数化变量传递 |
| C2 | search CRUD 的 not found 返回普通 Response 而非标准错误 | `api/routers/search.py` | 改为 `HTTPException(404)` |
| C3 | project 创建 DB 失败时静默成功，前端拿不到错误 | `api/services/project_crud.py` | 失败时抛 `RuntimeError` |
| C4 | analysis 重试按钮没有实际调用分析函数 | `web/src/app/projects/[id]/analysis/page.tsx` | 改为调用 `handleAnalyze` |

### High（性能/可靠性）

| ID | 问题 | 文件 | 修复 |
|----|------|------|------|
| H1 | project_stats/project_crud 存在 N+1 查询 | `api/services/project_stats.py`, `project_crud.py` | 改为 `group_by` 聚合 |
| H2 | knowledge 搜索循环查 Project 表 | `api/services/search.py` | 改为 `outerjoin` |
| H3 | auth/settings 的 DB 错误返回 404/401 而非 503 | `api/routers/auth.py`, `settings.py` | 改为 `503 Service Unavailable` |
| H4 | overview 页 API 失败时无任何提示 | `web/src/app/projects/[id]/overview/page.tsx` | 添加黄色警告提示 |
| H5 | 4 个 API 页面缺少 Error Boundary | 新增 4 个 `error.tsx` | 添加 Error Boundary 组件 |
| H6 | settings schema 缺少严格类型定义 | `api/schemas/settings.py` | 添加 `MemberInfo`/`DimensionConfigInfo` 模型 |

### Medium（规范/可维护性）

| ID | 问题 | 文件 | 修复 |
|----|------|------|------|
| M1 | 8 个前端 service 硬编码 API 地址 | `web/src/services/*.ts` | 统一用 `NEXT_PUBLIC_ANALYZER_URL` |
| M2 | 7 个后端文件空 `except: pass` 吞掉所有异常 | `api/services/*.py` | 改为 `logger.warning` |
| M3 | DB 连接池无配置，默认值不适合生产 | `api/db.py` | 添加 `pool_size`/`recycle`/`pre_ping` |
| M4 | config.py 缺少开发环境说明 | `api/config.py` | 添加注释 |
| M5 | 前端无公共 HTTP client，各 service 重复写请求逻辑 | 新增 `web/src/services/http-client.ts` | 抽取公共模块 |
| M6 | search CRUD 缺少 `response_model` | `api/routers/search.py` | 添加响应模型声明 |
| M7 | 跳过（路由层已保证格式） | — | 无需修复 |

### 教训

1. **SQL 注入（C1）**：VibeCoding 生成的数据库查询代码必须检查参数化，f-string 拼 SQL 是高危模式
2. **静默失败（C3, M2）**：错误处理不能吞异常，至少要 log
3. **N+1 查询（H1, H2）**：ORM 代码需要审查查询模式，循环内查 DB 是典型 N+1
4. **硬编码配置（M1）**：环境相关的值必须走环境变量

---

## BUG-020 ~ BUG-026: 运行时监控发现的 7 个问题

- **日期**: 2026-04-10
- **来源**: Playwright 自动化浏览器监控
- **状态**: 全部已修复

### Critical（阻塞功能）

| ID | 问题 | 根因 | 修复 |
|----|------|------|------|
| BUG-020 | 首页未登录直接抛 `UNAUTHORIZED` 异常，白屏 | `page.tsx` 直接调 `getProjects()` → `requireAuth()` 抛异常，无 redirect 逻辑 | 首页加 `auth()` 检查，未登录 `redirect("/login")` |
| BUG-021 | `.env.local` 缺 `AUTH_SECRET`，Auth.js 报 `MissingSecret` | 根目录 `.env` 有密钥但 `web/.env.local` 没同步 | 补充 `AUTH_SECRET` 到 `web/.env.local` |
| BUG-022 | 注册失败 "操作失败，请重试" | 数据库缺 `users` 表，schema.ts 定义了但未 push 到 DB | 手动 `CREATE TABLE users` |
| BUG-023 | 首页查询报错 `project_members` 表不存在 | 同上，`project_members` 和 `analysis_tasks` 表未建 | 手动建两张表 + 关联现有项目到用户 |
| BUG-024 | 项目详情页 500，查询 `nodes` 表缺列 | `projects` 缺 `created_by`/`ai_provider`/`ai_api_key_enc`；`nodes` 缺 `current_version_id`/`created_by`/`updated_by` | `ALTER TABLE` 补齐所有缺失列 |

### High（功能受损）

| ID | 问题 | 根因 | 修复 |
|----|------|------|------|
| BUG-025 | Overview 页请求 `localhost:8001` 连接拒绝 | docker-compose 中 analyzer 用 `expose`（仅容器内部），未映射到宿主机 | `expose: "8001"` → `ports: "127.0.0.1:8001:8001"` |
| BUG-026 | Analysis 页 hydration error，页面闪烁 | `TooltipTrigger asChild` 包裹 `Button`，渲染为 `<button>` 嵌套 `<button>`，违反 HTML 规范 | 去掉 `asChild`，直接在 `TooltipTrigger` 上加样式和事件 |

### 已知警告（不修复）

| 问题 | 原因 | 说明 |
|------|------|------|
| `React does not recognize the 'asChild' prop` | Radix UI 与 React 19 兼容问题 | 全页面出现，无功能影响，等 Radix 上游修复 |

### 教训

1. **Schema 与 DB 不同步（BUG-022~024）**：VibeCoding 迭代 schema 后未执行 `drizzle-kit push`，导致代码引用的表/列在 DB 中不存在。**Quality Gate 检查项：每次 schema 变更后必须验证 DB 同步状态**
2. **环境变量分散（BUG-021）**：根目录 `.env` 和 `web/.env.local` 两处维护，容易遗漏。应统一管理或在启动脚本中做完整性检查
3. **端口映射遗漏（BUG-025）**：`expose` 只在容器网络内可见，前端直连需要 `ports` 映射。docker-compose 配置必须考虑前端的请求路径
4. **HTML 嵌套违规（BUG-026）**：`asChild` 模式将 Trigger 渲染为子组件的根元素，如果子组件也是 `<button>` 就会嵌套。VibeCoding 生成的组件组合需检查最终 DOM 结构

---

## BUG-027 ~ BUG-032: Phase 1 TypeScript 编译错误（46 个）

- **日期**: 2026-04-10
- **来源**: `npx tsc --noEmit` 静态类型检查
- **状态**: 全部已修复
- **根因总结**: VibeCoding 生成代码时基于旧版 API 假设（Zod v3、Radix asChild、shadcn Select v1），未适配当前依赖版本

### BUG-027: `asChild` prop 不存在于 Button 组件（26 处）

- **严重度**: High（编译阻塞）
- **受影响文件**: `analysis/page.tsx`(3)、`comparison/page.tsx`(3)、`issues/page.tsx`(3)、`modules/page.tsx`(3)、`overview/page.tsx`(3)、`product-lines/page.tsx`(3)、`settings/page.tsx`(3)、`workspace.tsx`(2)、`proto/dimension-card.tsx`(1)、`proto/version-timeline.tsx`(2)

**现象**:
```
error TS2322: Property 'asChild' does not exist on type 'ButtonProps'
```

**根因**: VibeCoding 生成的代码使用了 Radix UI 的 `asChild` 模式（`<Button asChild><Link>...</Link></Button>`），但项目中 shadcn/ui 的 Button 组件是基于 `class-variance-authority` 实现的，不是 Radix Slot 模式，没有 `asChild` prop。

**修复**: 在 `components/ui/button.tsx` 的 `ButtonProps` 类型中添加 `asChild?: boolean`（接受但忽略该 prop），避免大规模页面改动。proto 组件中 `CollapsibleTrigger` 上的无效 `asChild` 直接移除。

**教训**: VibeCoding 生成 shadcn/ui 代码时，会假设所有组件都支持 Radix 的 `asChild`。**Quality Gate 检查项：生成 UI 代码后跑 `tsc --noEmit` 验证类型**。

---

### BUG-028: Zod v4 错误对象 API 变更（2 处）

- **严重度**: Critical（运行时崩溃）
- **受影响文件**: `actions/auth.ts`(1)、`actions/projects.ts`(1)

**现象**:
```
error TS2339: Property 'errors' does not exist on type 'ZodError'
```

**根因**: 项目安装的是 Zod v4（`zod@^4.x`），但 VibeCoding 生成的代码使用 Zod v3 的 `error.errors` 属性。Zod v4 将该属性重命名为 `error.issues`。

**修复**: `parsed.error.errors[0]?.message` → `parsed.error.issues[0]?.message`（2 处）

**教训**: VibeCoding 的训练数据基于 Zod v3，不会自动适配 v4 的 breaking change。**Quality Gate 检查项：安装依赖后检查 major version 与 AI 生成代码的兼容性**。

---

### BUG-029: Select 组件 `onValueChange` 回调签名不匹配（8 处）

- **严重度**: High（编译阻塞）
- **受影响文件**: `issues/page.tsx`(5)、`settings/page.tsx`(2)、`modules/page.tsx`(1)

**现象**:
```
error TS2322: Type 'Dispatch<SetStateAction<string>>' is not assignable to 
type '(value: string | null, eventDetails: SelectRootChangeEventDetails) => void'
```

**根因**: shadcn/ui 的 Select 组件基于 base-ui（非旧版 Radix Select），`onValueChange` 回调签名为 `(value: string | null, eventDetails) => void`，第一个参数可以是 `null`。但 `useState<string>` 的 setter 类型是 `(value: string) => void`，不接受 `null`。

**修复**: 将 `onValueChange={setSomeState}` 改为 `onValueChange={(v) => v && setSomeState(v)}`，过滤掉 `null` 值。

**教训**: VibeCoding 基于旧版 shadcn Select（Radix 实现，回调 `(value: string) => void`）生成代码，不适配 base-ui 的新签名。**Quality Gate 检查项：UI 库迁移后 grep 所有 `onValueChange` 调用验证签名**。

---

### BUG-030: Server Action 函数调用参数不匹配（1 处）

- **严重度**: Critical（运行时崩溃）
- **受影响文件**: `actions/projects.ts`

**现象**:
```
error TS2554: Expected 1 arguments, but got 0
```

**根因**: `projects.ts` 中有一段查询模板维度配置的代码调用 `.where()` 时缺少参数（`where()` 不传条件等于无 WHERE 子句，但 Drizzle ORM 要求至少一个参数）。这是 VibeCoding 在重构过程中产生的残留死代码。

**修复**: 移除该段无用的查询代码。

---

### BUG-031: Auth 类型断言不安全（2 处）

- **严重度**: Medium（编译阻塞但无运行时影响）
- **受影响文件**: `lib/auth.ts`

**现象**:
```
error TS2352: Conversion of type 'X' to type 'Y' may be a mistake
```

**根因**: NextAuth 的 `user` 和 `session.user` 类型定义与代码中期望的扩展字段（`role`, `status`）不匹配，直接 `as` 断言报错。

**修复**: 加中间 `unknown` 转换：`user as unknown as ExtendedUser`。

---

### BUG-032: Workspace 组件类型定义与实际数据结构不匹配（3 处）

- **严重度**: Medium（编译阻塞）
- **受影响文件**: `app/projects/[projectId]/workspace.tsx`

**现象**:
```
error TS2339: Property 'xxx' does not exist on type 'NodeData'
```

**根因**: `workspace.tsx` 中手动定义的 `NodeData` 类型缺少 DB 实际返回的字段（如 `isCurrent`），且 `updateDimensionRecord` 调用缺少必需的 `version` 参数。

**修复**: 
- `NodeData` 类型加宽（添加 index signature 和可选字段）
- `updateDimensionRecord(id, content)` → `updateDimensionRecord(id, content, 1)` 补上 version 参数

---

### 统计

| 错误类别 | 数量 | 根因 |
|---------|------|------|
| `asChild` prop 不存在 | 26 | VibeCoding 假设 Radix Slot 模式，实际用 CVA |
| Select 回调签名 | 8 | base-ui Select vs Radix Select API 差异 |
| Zod v4 API 变更 | 2 | `.errors` → `.issues` |
| Auth 类型断言 | 2 | NextAuth 类型不含扩展字段 |
| NodeData 类型不匹配 | 3 | 手动类型定义落后于 schema 演进 |
| 函数参数缺失 | 2 | 重构残留死代码 |
| **合计** | **46** | |

### 教训

1. **VibeCoding 的版本盲区**：AI 生成的代码基于训练数据中的旧版本 API（Zod v3、Radix Select、asChild 模式）。当项目使用新版本依赖时，生成的代码大概率会有类型错误。**每次 AI 生成代码后必须跑 `tsc --noEmit`**。

2. **组件库迁移的隐性成本**：shadcn/ui 底层从 Radix 迁移到 base-ui，Select 等组件的回调签名静默变更，不会有 deprecation 警告，只有编译时才能发现。

3. **类型定义的维护债务**：手动定义的类型（如 `NodeData`）随 schema 演进而失步。应该从 Drizzle schema 自动推导类型（`typeof nodes.$inferSelect`），而非手写。

4. **Quality Gate 建议新增检查项**：
   - AI 生成代码后自动跑 `tsc --noEmit`
   - 依赖 major version 升级后 grep 常见 breaking change 模式
   - 手动类型定义处标注 `// TODO: derive from schema`

---

## BUG-033 ~ BUG-036: v0.1 原型页面修复（4 个）

- **日期**: 2026-04-11
- **来源**: 原型验收
- **状态**: 全部已修复

| ID | 问题 | Commit | 修复 |
|----|------|--------|------|
| BUG-033 | 功能档案页缺少左侧功能树导航 | `df14846` | 加 FeatureTree 组件 + treeData |
| BUG-034 | AI 分析按钮无法直接点击（需先输入内容） | `df14846` | 默认填入示例需求文本 |
| BUG-035 | 项目概览页导入链接 404（/import 应为 /import-ai） | `df14846` | 链接路径修正 |
| BUG-036 | 功能树空白（Next.js 16 Turbopack 下 useEffect+mounted 守卫不渲染） | `0ab0c9c` | 改为 useState 直接初始化展开节点 |

---

## BUG-037 ~ BUG-038: v0.1 Tab 导航 + 默认状态修复（2 个）

- **日期**: 2026-04-11
- **来源**: UI 一致性审查
- **状态**: 全部已修复

| ID | 问题 | Commit | 修复 |
|----|------|--------|------|
| BUG-037 | 12 个页面 Tab 导航不统一（不同页面 Tab 项和顺序不一致） | `0fd9b0b` | 统一 Tab 导航组件 |
| BUG-038 | 需求工作台和 AI 分析页面打开后空白，需手动操作才有内容 | `0551567` | 默认 isAnalyzed=true，打开直接展示分析结果 |

---

## BUG-039 ~ BUG-042: v0.2 Phase 5 — F9 搜索 4 个 bug

- **日期**: 2026-04-12
- **来源**: 搜索功能测试
- **Commit**: `707beff`
- **状态**: 全部已修复

| ID | 优先级 | 问题 | 修复 |
|----|--------|------|------|
| BUG-039 | P1 | 搜索结果面包屑缺少节点自身名称（path 不含 self） | 追加 node.name |
| BUG-040 | P2 | 非 UUID 的 user_id 导致 500 崩溃（应返回空结果） | 异常处理 |
| BUG-041 | P2 | dimension_type 按 key 过滤，前端显示 display name 不匹配 | 改为按 display name 过滤 |
| BUG-042 | P3 | 搜索结果 limit 50 太少，频繁截断 | limit 提到 100，API 上限放到 200 |

---

## BUG-043 ~ BUG-050: v0.3 Phase 7 — Agent 并行开发契约漂移（8 个）

- **日期**: 2026-04-12
- **来源**: QA 验证 (Round 1: 6 个) + Team Lead 逐字段审查 (Round 2: 2 个)
- **Commit**: `5eb01e8` (Round 1 修复) + `f60fd2b` (Round 2 修复)
- **状态**: 7 已修复，1 遗留
- **详细记录**: `docs/test-checklist-v0.3-phase7.md`

### Round 1 — QA 发现的 6 个契约不匹配

| ID | AC | 问题 | 修复 |
|----|-----|------|------|
| BUG-043 | F13 AC5 | saveAnalysis: 前端发 `{ layers }`, 后端要 `{ analysis_result: str }` → 422 | 前端序列化 layers 为 JSON string |
| BUG-044 | F13 AC7 | saveTestPoints: 前端发 `{ test_point_ids }`, 后端要 `{ test_points: AITestPoint[] }` → 422 | 前端改发完整对象 |
| BUG-045 | F12 AC1 | generateComparison: 前端发 `{ feature_name, competitors: string[] }`, 后端要 `{ node_ids: UUID[], competitor_ids: UUID[] }` → 422 | 前端改用 UUID-based request |
| BUG-046 | F12 AC5 | exportComparison: URL 不匹配 `GET ?project_id=` vs `GET /{id}/export` → 404 | 前端改用 path param |
| BUG-047 | F12 AC6 | backfillRow: URL 和 payload 不匹配 → 404/422 | 前端改用 path param + UUID payload |
| BUG-048 | F12 AC4 | highlight: 前端用 `ComparisonCell.highlight`, 后端用 `ComparisonCell.score` → 高亮不生效 | 前端改用 score 判断 |

### Round 2 — 逐字段审查发现的 2 个运行时 bug

| ID | AC | 问题 | 修复 |
|----|-----|------|------|
| BUG-049 | F13 AC2 | SSE 字段名: 前端发 `level`, 后端要 `analysis_level` → L2/L3 永远不触发; `node_id` optional vs required → 422 | 字段名对齐 + node_id 改 required |
| BUG-050 | F13 AC6 | generateTestPoints: 前端发 `{ requirement_text, affected_modules }`, 后端要 `{ node_id, analysis_result }` → 完全不同 schema → 422 | 新建 `generateTestPointsAI()` 匹配后端 schema |

### 遗留

| — | F13 AC4 | 关系图高亮: affected modules 未传递给 relation-graph 组件 | 需跨页面通信，计划后续 Phase 实现 |

### 根因分析

**为什么 8 个 bug？** Backend 和 Frontend Agent 并行开发，没有共享 API contract 文件（如 OpenAPI spec）。两边各自基于 PRD 理解独立实现，字段命名、类型、URL 结构全靠默契 → 不可能对齐。

**为什么 Round 1 修完又漏 2 个？** Round 1 修的是表层（URL path, 顶层字段名）。Round 2 的 `level` vs `analysis_level` 和 `generateTestPoints` 整个 schema 差异需要逐字段比对请求体才能发现。

### 教训

Agent Team 并行开发模式下，**必须有 contract-first 机制**：
1. Backend 先输出 OpenAPI schema（FastAPI 自动生成）
2. Frontend 基于 schema 生成 TypeScript 类型
3. 或者 Team Lead 在分发任务前先定义共享 API contract 文件
4. QA 验证应包含 "逐字段比对请求/响应 schema" 步骤，不能只看 URL 和顶层字段

---

## BUG-051 ~ BUG-053: v0.3 Phase 8 — F16 快照 + F15 活动日志（3 个）

- **日期**: 2026-04-14
- **来源**: Phase 8 补充 QA 验证
- **Commit**: 见下方修复 commit
- **状态**: 全部已修复
- **详细记录**: `docs/testing/test-checklist-v0.3-phase8.md`

| ID | Feature | 严重度 | 问题 | 根因 | 修复 |
|----|---------|--------|------|------|------|
| BUG-051 | F16 AC2 | **严重** | `POST /api/snapshot/generate`: 前端发 `{ nodeId }` (camelCase), 后端 Pydantic 要 `{ node_id, project_id }` (snake_case) → 422 | 同 BUG-043~050 的 Agent 并行契约漂移问题 | 前端改为 `{ node_id, project_id }` |
| BUG-052 | F16 AC3 | **严重** | `POST /api/snapshot/save`: 前端发 `{ nodeId, summary, selectedDimensions }`, 后端要 `{ node_id, project_id, summary, dimensions: [{ dimension_type_key, content }] }` → 422 + 字段结构不匹配 | 同上 | 前端改为 snake_case + 重构 dimensions 结构匹配 `DimensionSaveItem` schema |
| BUG-053 | F15 AC4 | 中 | F13 需求分析和测试点生成完成后未写入 `activity_logs` 表，活动日志页看不到 AI 分析操作记录 | 分析走 FastAPI 端点，不走 Server Action，logActivity 调用遗漏 | 新增 `logActivityAuto()` (内部 requireAuth)，在 analysis page 保存回调中调用 |

### 根因分析

BUG-051/052 与 Phase 7 的 BUG-043~050 **同一根因**：Backend Agent 和 Frontend Agent 并行开发，snapshot 端点的 Phase 8 代码实际在 Phase 3 commit 中一起提交（`89eae64`），跳过了独立 QA 验证环节，导致契约不匹配问题在生产中存在但从未被发现。

BUG-053 属于**跨架构边界遗漏**：Next.js Server Actions 内部的 CRUD 操作已正确接入 logActivity（11处调用），但 FastAPI 侧的 AI 分析端点走的是独立 HTTP 调用路径，不经过 Server Action 层，因此 logActivity 调用链断裂。

---

## BUG-054 ~ BUG-062: v0.4 Phase 9 — F17 AI智能导入前后端契约漂移（9 个）

- **日期**: 2026-04-14
- **来源**: Phase 9 QA 验证——前后端 API 契约逐字段对齐审查
- **状态**: 全部待修
- **详细记录**: `docs/testing/test-checklist-v0.4-phase9.md`

### 根因

Server Action (`import-ai.ts`) 的 3 个函数与后端 Pydantic schema **已经完全对齐**。但 `ai-import-wizard.tsx` 组件**完全绕过 Server Action**，自行用 `fetch()` 直接调用后端 API，且所有 4 个端点的请求体字段名、响应字段名、字段类型全部与后端不匹配。

这是 Phase 7/8 契约漂移问题的升级版——不是"两个 Agent 各写各的"，而是"Server Action 已对齐但组件层没用它"。

### BUG-054 (Critical): ai-analyze 缺少 user_id + 直接 fetch 绕过 auth

- **严重度**: Critical
- **问题描述**: `ai-import-wizard.tsx:428-434` 直接 `fetch("/api/import/ai-analyze")` 而非调用 `import-ai.ts` 的 `aiAnalyzeZip()` server action。请求体缺少必填字段 `user_id`。
- **根因**: 前端组件开发时未使用已有的 Server Action，自行实现了一套 fetch 调用
- **修复建议**: 将 `handleAnalyze()` 改为调用 `aiAnalyzeZip(projectId, filePayload)`
- **受影响文件**: `web/src/components/ai-import-wizard.tsx:416-456`

### BUG-055 (Critical): ai-analyze files 子字段名不匹配

- **严重度**: Critical
- **问题描述**: 前端发送 `{file_name, file_path, content, format}`，后端 `ai_import.py:143` 读取 `file.get("path")` 和 `file.get("name")`。`file_name` 和 `file_path` 不会被读取，导致所有文件的 source_path 为空字符串。
- **根因**: 前端使用 camelCase-like 命名（file_name），后端使用 import_handler 的原始字段名（name, path）
- **修复建议**: 改为调用 Server Action（自动透传原始 files 结构），或修正字段名为 `{name, path, content, format}`
- **受影响文件**: `web/src/components/ai-import-wizard.tsx:421-426`

### BUG-056 (Critical): ai-analyze 响应字段名不匹配

- **严重度**: Critical
- **问题描述**: 前端 `ai-import-wizard.tsx:282-294` 定义的 `AIAnalyzeResult` 类型期望 `data.mappings`，但后端 `ai_import.py:507-514` 返回 `mapping_rows`。前端会读到 `undefined`，映射表为空。
- **根因**: 前端组件定义了独立的响应类型，与后端实际返回结构不一致
- **修复建议**: 改为调用 Server Action 并使用 `import-ai.ts` 中已正确定义的 `AIAnalyzeResult` 类型
- **受影响文件**: `web/src/components/ai-import-wizard.tsx:282-294,444`

### BUG-057 (High): confidence 类型不匹配

- **严重度**: High
- **问题描述**: `ai-mapping-table.tsx:42` 定义 `confidence` 为 `Confidence` 类型（"high"|"medium"|"low" string enum），但后端 `ai_import.py:225` 返回 `confidence` 为 `int` (0-100)。前端排序、过滤、badge 渲染全部依赖 string enum，int 值无法匹配。
- **根因**: 前端组件独立定义了与后端不同的 confidence 类型
- **修复建议**: 在数据转换层增加 int->string 映射（>=85="high", >=60="medium", <60="low"），或者统一为 number 类型并调整 UI 逻辑
- **受影响文件**: `web/src/components/ai-mapping-table.tsx:34-48,72-106`, `web/src/components/ai-import-wizard.tsx:282-294`

### BUG-058 (High): ai-mapping 请求字段名不匹配

- **严重度**: High
- **问题描述**: 前端 `ai-import-wizard.tsx:471-478` 发送 `{project_id, changes: [{row_id, module_id, dimension_id}]}`，后端 `import_.py:110-115` 期望 `{session_id, project_id, adjustments: [{id, recommended_module_id, ...}]}`。缺少 `session_id`，`changes` vs `adjustments`，子字段全部不匹配。
- **根因**: 前端组件独立实现，未参考后端 schema
- **修复建议**: 此端点为 fire-and-forget（前端是状态源），修正字段名即可。或者考虑移除此端点（纯前端状态管理不需要后端校验）
- **受影响文件**: `web/src/components/ai-import-wizard.tsx:460-484`

### BUG-059 (Critical): ai-confirm 请求字段名全面不匹配

- **严重度**: Critical
- **问题描述**: 前端 `ai-import-wizard.tsx:548-554` 发送 `{project_id, items: [...]}`, 后端 `import_.py:146-153` 期望 `{session_id, project_id, user_id, mapping_rows: [...]}`. 缺少 `session_id` 和 `user_id`，`items` vs `mapping_rows`，子结构也完全不同（前端发 row_id/file_name/target_node_id，后端期望完整 mapping row dict）。
- **根因**: 同 BUG-054，直接 fetch 绕过 Server Action
- **修复建议**: 改为调用 `aiConfirmImport(projectId, sessionId, mappingRows)`
- **受影响文件**: `web/src/components/ai-import-wizard.tsx:503-587`

### BUG-060 (High): ai-confirm 响应字段名不匹配

- **严重度**: High
- **问题描述**: 前端 `ai-import-wizard.tsx:574` 读取 `result.import_session_id`，但后端 `ai_import.py:692` 返回字段名为 `session_id`。导致 `importSessionId` 状态为 `undefined`，撤销功能无法触发。
- **根因**: 前端组件 `AIConfirmResult` 类型定义（line 296-302）的字段名与后端不一致
- **修复建议**: 改为调用 Server Action，使用 `import-ai.ts` 中已正确定义的类型
- **受影响文件**: `web/src/components/ai-import-wizard.tsx:296-302,574`

### BUG-061 (Critical): undo 请求字段名不匹配 + 缺少必填字段

- **严重度**: Critical
- **问题描述**: 前端 `ai-import-wizard.tsx:597-603` 发送 `{project_id, import_session_id}`，后端 `import_.py:189-195` 期望 `{session_id, project_id, user_id, created_node_ids: [...]}`。缺少 `user_id` 和 `created_node_ids`（两个 required 字段），`import_session_id` vs `session_id`。
- **根因**: 同 BUG-054，直接 fetch 绕过 Server Action
- **修复建议**: 改为调用 `aiUndoImport(projectId, sessionId, createdNodeIds)`
- **受影响文件**: `web/src/components/ai-import-wizard.tsx:591-617`

### BUG-062 (High): AI 导入全部端点绕过认证

- **严重度**: High (安全)
- **问题描述**: `ai-import-wizard.tsx` 的 4 个 fetch 调用直接请求 `/api/import/*`，完全绕过了 `import-ai.ts` Server Action 中的 `requireAuth()` + `checkProjectAccess("editor")` 校验。如果 Next.js 配置了 API proxy 到 FastAPI，未认证用户可直接调用 AI 导入功能。
- **根因**: 前端组件绕过 Server Action 层
- **修复建议**: 改为调用 Server Action（一次性解决全部契约问题 + 认证问题）
- **受影响文件**: `web/src/components/ai-import-wizard.tsx:428,471,548,597`

### 统计

| 严重度 | 数量 | 涉及端点 |
|--------|------|---------|
| Critical | 5 | ai-analyze(2), ai-confirm(1), undo(1), 文件字段(1) |
| High | 4 | confidence类型(1), ai-mapping(1), confirm响应(1), 认证绕过(1) |
| **合计** | **9** | |

### 教训

1. **Server Action 写了但没用**：这是比"没写"更危险的情况——import-ai.ts 的契约已经对齐，给人"已联调"的假象。实际上 ai-import-wizard.tsx 根本没调用它，自己写了一套不兼容的 fetch 逻辑。**Quality Gate 应检查：每个 Server Action 必须有 grep 到的调用方**。

2. **组件内定义重复类型**：ai-import-wizard.tsx:282-302 定义了 `AIAnalyzeResult` 和 `AIConfirmResult`，与 import-ai.ts 中的同名类型字段不同。重复类型定义是契约漂移的温床。**应统一从 Server Action 导出类型定义**。

3. **直接 fetch vs Server Action**：Next.js Server Action 是前后端契约的唯一桥梁，绕过它不仅丢失类型安全，还丢失认证和权限校验。**前端组件不应直接 fetch 后端 API**。

---

## BUG-063: 语义搜索结果缺失 breadcrumb（F9 面包屑能力回归）

- **日期**: 2026-04-14
- **严重度**: High
- **状态**: Open
- **Phase**: 10 (F18 Hybrid混合搜索)

### 现象

语义搜索命中的结果在搜索页不显示面包屑路径（如"AI云平台 -> 计算服务 -> GPU实例"），只有关键词命中的结果有面包屑。当 RRF 合并后，同一页面中部分结果有面包屑、部分没有，体验不一致。

### 根因

`api/services/hybrid_search.py` 的 `vector_search()` 函数中，三类实体（node/dimension/issue）的返回结果均硬编码 `breadcrumb: None`（行164, 219, 276）。

F9 的关键词搜索通过 ORM Join + `_build_breadcrumb()` 函数构建面包屑，但 F18 的向量搜索使用 raw SQL，没有实现等价的 breadcrumb 构建逻辑。

### 修复建议

在 `vector_search()` 返回结果后，对每个结果调用 `_build_breadcrumb(db, node, project_name)` 补充 breadcrumb。需要传入 ORM Session（当前 `vector_search` 只接收 `db_engine`，不接收 `db` Session）。

**方案A**（推荐）：在 `hybrid_search()` 中，对语义结果中 breadcrumb 为 None 的条目，通过 ORM 查询补充 breadcrumb。
**方案B**：在 `vector_search` 的 raw SQL 中 JOIN 祖先节点构建 breadcrumb（SQL 复杂度高）。

- **受影响文件**: `api/services/hybrid_search.py:164,219,276`

---

## BUG-064: Issue 向量搜索 SQL 引用不存在的列 `i.type`

- **日期**: 2026-04-14
- **严重度**: Critical
- **状态**: Open
- **Phase**: 10 (F18 Hybrid混合搜索)

### 现象

语义搜索 Issue 类型的结果时，SQL 执行报错：`column i.type does not exist`。导致 Issue 类的语义搜索结果全部丢失。

由于外层 try/except（行279-280）捕获了异常并 warning 跳过，不会导致整个搜索崩溃，但 Issue 的语义结果永远为空。

### 根因

`api/services/hybrid_search.py` 行240和行247使用了 `i.type` 作为 Issue 分类列名，但实际数据库列名为 `i.category`（见 `api/models/tables.py:247` — `category = Column(Text, nullable=False)`）。

行235-241的注释中还残留了一段被覆盖的错误代码：
```python
issue_where_parts.append(
    "(i.type = %s OR (column_name = 'category' AND i.category = %s))"
)
# Simplified: just filter on what columns may exist
issue_where_parts[-1] = "i.type = %s"
```
这段代码先 append 了一个包含 `column_name` 的无效 SQL 条件，然后立即用 `i.type` 覆盖——两行都是错的。

### 修复建议

1. 行240: `i.type = %s` 改为 `i.category = %s`
2. 行247: `issue_type_col = "i.type"` 改为 `issue_type_col = "i.category"`
3. 删除行235-238的残留注释和无效代码

- **受影响文件**: `api/services/hybrid_search.py:235-241,247`

---

## BUG-065: 前端 SearchResultItem 接口缺少 `score` 字段

- **日期**: 2026-04-14
- **严重度**: Low
- **状态**: Open
- **Phase**: 10 (F18 Hybrid混合搜索)

### 现象

后端通过 Pydantic schema 返回 `score` 字段（RRF 融合得分），但前端 TypeScript 接口 `SearchResultItem` 未定义该字段。当前不影响功能（前端未使用 score），但类型不完整。

### 根因

`web/src/services/search.ts:9-22` 的 `SearchResultItem` 接口在 F18 升级时添加了 `match_type` 但遗漏了 `score`。

### 修复建议

在 `SearchResultItem` 接口中添加 `score?: number;`。

- **受影响文件**: `web/src/services/search.ts:9-22`

---

## BUG-066: `search_mode` 字段被 Pydantic response_model 过滤

- **日期**: 2026-04-14
- **严重度**: Medium
- **状态**: Open
- **Phase**: 10 (F18 Hybrid混合搜索)

### 现象

`hybrid_search()` 返回的 dict 包含 `search_mode: "keyword"|"hybrid"` 字段，但路由 `search_unified()` 使用 `response_model=SearchResponse`，而 `SearchResponse` schema 未定义 `search_mode` 字段。Pydantic 会在序列化时剥离该字段，前端永远收不到。

### 根因

`api/schemas/search.py:22-25` 的 `SearchResponse` 只定义了 `query`, `total`, `results` 三个字段，未包含 `search_mode`。

### 修复建议

在 `SearchResponse` 中添加 `search_mode: str = "keyword"`，前端 `SearchResponse` 接口同步添加。这样前端可以根据 `search_mode` 判断是否为降级模式，修复 BUG-067。

- **受影响文件**: `api/schemas/search.py:22-25`, `web/src/services/search.ts:24-28`

---

## BUG-067: 纯关键词降级模式下"正在加载语义匹配结果..."永远转圈

- **日期**: 2026-04-14
- **严重度**: High
- **状态**: Open
- **Phase**: 10 (F18 Hybrid混合搜索)

### 现象

当 pgvector 不可用（降级到纯关键词搜索）时，搜索结果旁边的"正在加载语义匹配结果..."提示和 spinner 永远不消失。

### 根因

`web/src/app/search/page.tsx` 行119设置 `setSemanticLoading(true)`，行139-146的判断逻辑：
```typescript
const hasSemanticInResults = result.data.results.some(
  (r: SearchResultItem) => r.match_type === "semantic" || r.match_type === "both"
)
setSemanticLoading(!hasSemanticInResults)
```
在降级模式下，所有结果的 `match_type` 都是 `"keyword"`，`hasSemanticInResults` 永远为 `false`，`semanticLoading` 永远为 `true`。

### 修复建议

**方案A**（需先修复 BUG-066）：根据 `search_mode` 判断，如果是 `"keyword"` 则直接 `setSemanticLoading(false)`。
**方案B**（无依赖）：搜索完成后统一 `setSemanticLoading(false)`，不再尝试推断语义搜索状态。语义搜索是后端自动执行的，前端无需区分。

- **受影响文件**: `web/src/app/search/page.tsx:119,139-146`

## BUG-068: version_records 表缺少 change_type/snapshot_data/mode 列（migration 0001 未应用）

- **日期**: 2026-04-14
- **严重度**: High
- **来源**: E2E测试 TP-006
- **状态**: Open

### 现象
version_records 表实际列为 id, node_id, version_label, summary, details, created_at。缺少 change_type, is_current, snapshot_data, mode 四列。后端 ORM 模型定义了这些列，但数据库中不存在，运行时写入这些字段会报 SQL 错误。

### 根因
Drizzle migration `web/drizzle/0001_hard_misty_knight.sql:158-160` 定义了 ALTER TABLE 添加 change_type、snapshot_data、mode 列，但该 migration 未被应用到当前数据库。初始 migration `0000_tense_penance.sql:70-78` 只创建了基础 6 列（含 is_current），而 0001 补充的 3 列从未生效。

SQLAlchemy 模型 `api/models/tables.py:165-168` 定义了 change_type、is_current、snapshot_data、mode，与实际 DB schema 不同步。

### 修复建议
执行 migration 0001：`psql -h 127.0.0.1 -U prism -d prism -f web/drizzle/0001_hard_misty_knight.sql`，或手动执行缺失的 ALTER TABLE 语句。

### 受影响文件
- `api/models/tables.py:160-169`（ORM 模型定义）
- `web/drizzle/0001_hard_misty_knight.sql:158-160`（未应用的 migration）

---

## BUG-069: POST /api/projects/{id}/tree-overview 返回 405，无节点 CRUD 端点

- **日期**: 2026-04-14
- **严重度**: High
- **来源**: E2E测试 TP-004
- **状态**: Open

### 现象
POST /api/projects/{id}/tree-overview 返回 405 Method Not Allowed。项目中不存在节点创建/修改/删除的 API 端点，只有 GET tree-overview。

### 根因
`api/routers/projects.py:277` 只定义了 `@router.get("/{project_id}/tree-overview")`，没有 POST/PUT/DELETE 端点用于节点 CRUD。整个 routers 目录中无 nodes.py 路由文件，节点数据只能通过种子脚本或 AI 导入写入。

### 修复建议
新建 `api/routers/nodes.py`，实现节点 CRUD 端点：POST（创建）、PATCH（修改）、DELETE（删除），注册到 `api/main.py`。

### 受影响文件
- `api/routers/projects.py:277`（仅有 GET）
- `api/main.py`（缺少 nodes router 注册）

---

## BUG-070: issues 表使用 type 列但 ORM 模型定义 category，hybrid_search.py 引用 i.category

- **日期**: 2026-04-14
- **严重度**: High
- **来源**: E2E测试 TP-008, TP-053, TP-111
- **状态**: Open

### 现象
1. POST /api/projects/{id}/issues 返回 404，无 issues CRUD 端点
2. issues 表实际数据库中列名为 `type`，但 ORM 模型 `tables.py:248` 定义为 `category`
3. `hybrid_search.py:256,264` 使用 `i.category` 进行 SQL 查询，与实际 DB 列名 `type` 不匹配，语义搜索 issue 时会报 SQL 列不存在错误

### 根因
DB migration 创建 issues 表时使用 `type` 列名，但 ORM 模型和 hybrid_search 的原始 SQL 均使用 `category`。两处列名不同步。同时，整个 API 层无 issues 的 CRUD 路由。

### 修复建议
1. 统一列名：将 DB 中 `type` 列 ALTER 为 `category`（与 ORM 保持一致），或反过来修改 ORM 和 SQL
2. 新建 issues CRUD 路由
3. 修复 `hybrid_search.py:256,264` 中的列名引用

### 受影响文件
- `api/models/tables.py:248`（ORM 定义 category）
- `api/services/hybrid_search.py:256`（SQL 引用 i.category）
- `api/services/hybrid_search.py:264`（SQL 引用 i.category）

---

## BUG-071: settings 端点不返回 hierarchy_labels，PATCH 也不更新

- **日期**: 2026-04-14
- **严重度**: Medium
- **来源**: E2E测试 TP-029, TP-031, TP-040
- **状态**: Open

### 现象
1. GET /api/projects/{id}/settings 返回中无 hierarchy_labels 字段（始终 null）
2. PATCH /api/projects/{id}/settings 不支持 hierarchy_labels 更新
3. hierarchy_labels 实际存储在 projects 表中，通过 GET /api/projects/{id} 可以读取

### 根因
`api/routers/settings.py:58-65`：`ProjectSettingsResponse` schema 不包含 `hierarchy_labels` 字段（`api/schemas/settings.py:17-24` 无此字段）。
`api/routers/settings.py:68-93`：`ProjectSettingsUpdate` schema（`api/schemas/settings.py:27-29`）只有 `name` 和 `description`，不支持 `hierarchy_labels`。
但 `api/routers/projects.py:105-124` 的 PATCH `/{project_id}` 端点支持 `hierarchy_labels` 更新。

### 修复建议
在 `ProjectSettingsResponse` 和 `ProjectSettingsUpdate` schema 中添加 `hierarchy_labels` 字段，settings 路由的 GET 返回 `project.hierarchy_labels`，PATCH 也写入该字段。

### 受影响文件
- `api/schemas/settings.py:17-29`（缺少 hierarchy_labels 字段）
- `api/routers/settings.py:58-65`（GET 未返回 hierarchy_labels）
- `api/routers/settings.py:68-93`（PATCH 未处理 hierarchy_labels）

---

## BUG-072: open_source_research 模板无维度配置数据

- **日期**: 2026-04-14
- **严重度**: Medium
- **来源**: E2E测试 TP-038
- **状态**: Open

### 现象
使用 open_source_research 模板创建项目后，project_dimension_configs 为 0 条（期望 9 条）。custom 模板创建后只有 3 条（期望由用户自选或有默认值）。

### 根因
`api/services/project_crud.py:88-98`：创建项目时通过 `ProjectTemplate.dimension_keys` 查找对应模板的维度 key 列表。但 `project_templates` 表中未插入 `open_source_research` 模板记录（或其 `dimension_keys` 为空数组），导致创建时跳过维度配置写入。

### 修复建议
在种子数据或 migration 中确保 `project_templates` 表包含 `open_source_research` 模板记录，且 `dimension_keys` 含正确的 9 个维度 key。

### 受影响文件
- `api/services/project_crud.py:88-98`（模板查询逻辑正确，但数据缺失）
- 种子数据/migration（缺少 open_source_research 模板配置）

---

## BUG-073: PATCH dimension_configs enabled 状态不生效

- **日期**: 2026-04-14
- **严重度**: Medium
- **来源**: E2E测试 TP-039
- **状态**: Open

### 现象
PATCH 维度配置 enabled 字段返回 200，但再次 GET 时 enabled 状态未变化。

### 根因
`api/routers/settings.py:68-93`：PATCH settings 端点只处理 `name` 和 `description` 字段（第 83-86 行），不处理 `dimension_configs` 的 enabled 更新。没有独立的维度配置 PATCH 端点。

### 修复建议
新增 PATCH `/api/projects/{project_id}/dimension-configs/{config_id}` 端点，支持修改 `enabled` 和 `sort_order` 字段。

### 受影响文件
- `api/routers/settings.py:68-93`（不处理 dimension_configs）

---

## BUG-074: 搜索无最低相关度阈值，不匹配查询仍返回所有结果

- **日期**: 2026-04-14
- **严重度**: Medium
- **来源**: E2E测试 TP-061, TP-119
- **状态**: Open

### 现象
搜索完全不存在的关键词（如 "ZZZZNOTEXIST999"）仍返回 total=16 的结果，语义搜索无最低得分阈值过滤。

### 根因
`api/services/hybrid_search.py`：语义搜索路径使用 `1 - (embedding <=> query_vec)` 计算相似度，但未设置最低阈值过滤低相关结果。关键词搜索路径使用 ILIKE，无匹配时不返回结果，但语义搜索会返回所有已有 embedding 的记录按距离排序。RRF 合并后无最终阈值过滤。

### 修复建议
在语义搜索 SQL 中添加 `WHERE similarity > 0.3`（或其他合理阈值），或在 RRF 合并后过滤 score 低于阈值的结果。

### 受影响文件
- `api/services/hybrid_search.py`（语义搜索 SQL 缺少阈值过滤）

---

## BUG-075: /search/unified 端点无认证保护

- **日期**: 2026-04-14
- **严重度**: Critical
- **来源**: E2E测试 TP-094
- **状态**: Open

### 现象
GET /search/unified?q=xxx&user_id=xxx 无需 Authorization header 即可访问，返回 200 和搜索结果。

### 根因
`api/routers/search.py:126-151`：`search_unified` 函数未使用 `Depends(require_user)` 依赖。它通过 query 参数 `user_id` 做权限过滤，但不验证 Token，任何人可以伪造 user_id 访问。搜索路由注册在 `/search` 前缀下（`api/main.py:70`），与 `/api` 前缀的路由分离，认证保护被遗漏。

### 修复建议
给 `search_unified` 添加 `user: User = Depends(require_user)` 依赖，使用 `str(user.id)` 替代 query 参数 `user_id`。

### 受影响文件
- `api/routers/search.py:127`（缺少 Depends(require_user)）
- `api/main.py:70`（/search 前缀无全局认证中间件）

---

## BUG-076: Viewer 角色可以创建项目（权限漏洞）

- **日期**: 2026-04-14
- **严重度**: Critical
- **来源**: E2E测试 TP-120
- **状态**: Open

### 现象
以 viewer 角色用户调用 POST /api/projects/ 返回 201，成功创建项目。期望返回 403。

### 根因
`api/routers/projects.py:57-67`：`create_new_project` 仅使用 `Depends(require_user)` 验证登录状态，不检查用户角色。任何已登录用户（包括 viewer）都可以创建项目。PRD 要求只有 admin 或 editor 可以创建。

### 修复建议
在 `create_new_project` 中添加角色检查：`if user.role not in ("platform_admin",) and ...`，或新增平台级权限控制。根据业务需求确认哪些角色可以创建项目。

### 受影响文件
- `api/routers/projects.py:57-67`（缺少角色检查）

---

## BUG-077: 非 UUID 格式 project_id 导致 500 而非 422

- **日期**: 2026-04-14
- **严重度**: Medium
- **来源**: E2E测试 TP-128
- **状态**: Open

### 现象
GET /api/projects/not-a-uuid 返回 500 Internal Server Error，期望返回 422（参数格式错误）。

### 根因
`api/services/project_crud.py:151-154`：`get_project` 中 `uuid.UUID(project_id)` 对非 UUID 字符串抛出 `ValueError`，但 `api/routers/projects.py:79-102` 的 `get_project_detail` 中 `check_permission` 先调用 `uuid.UUID(user_id)`（成功），再调用 `uuid.UUID(project_id)`（失败），未被 try/except 捕获，FastAPI 返回 500。

### 修复建议
在路由层对 `project_id` 参数使用 UUID 类型注解（`project_id: uuid.UUID`），让 FastAPI 自动返回 422。或在 service 层捕获 `ValueError` 并抛出 `HTTPException(422)`。

### 受影响文件
- `api/routers/projects.py:79`（project_id 为 str 类型，无格式校验）
- `api/services/project_crud.py:151`（uuid.UUID() 可能抛出 ValueError）

---

## BUG-078: 软删除项目后 tree-overview 仍返回 200

- **日期**: 2026-04-14
- **严重度**: Medium
- **来源**: E2E测试 TP-129
- **状态**: Open

### 现象
项目被软删除后，GET /api/projects/{id}/tree-overview 仍返回 200 和空树数据，期望返回 404。

### 根因
`api/services/project_stats.py:72`：`get_project_tree_overview` 中 `db.query(Project).filter(Project.id == project_id)` 没有过滤 `deleted_at IS NULL`，导致软删除的项目仍可被查询到。同文件第 19 行的 `get_project_stats` 也有同样问题。

### 修复建议
在 `get_project_tree_overview` 和 `get_project_stats` 的查询中添加 `.filter(Project.deleted_at.is_(None))`。

### 受影响文件
- `api/services/project_stats.py:72`（tree_overview 未过滤软删除）
- `api/services/project_stats.py:19`（stats 未过滤软删除）

---

## BUG-079: Markdown 导入对简单内容返回 400 "未解析到任何功能项"

- **日期**: 2026-04-14
- **严重度**: Low
- **来源**: E2E测试 TP-090
- **状态**: 已修复（先前修复，本次验证确认）

### 现象
POST /api/import/markdown 上传简单 Markdown 文件返回 400 "未解析到任何功能项"。

### 根因
`api/services/exporter.py:198-228`：`parse_markdown_content` 要求严格的导出格式（`# Feature Name` → `## Dimension Name` → content），普通 Markdown 文件不含 h1 标题时 `features` 列表为空。`api/routers/import_.py:263` 检查空列表后返回 400。

### 修复建议
增强 `parse_markdown_content` 的容错性：当没有 h1 标题时，将整个文件视为一个功能项；或在 API 文档中说明要求的 Markdown 格式。

### 受影响文件
- `api/services/exporter.py:198-228`（解析逻辑过严格）
- `api/routers/import_.py:263`（空列表返回 400）

---

## BUG-080: 导入端点未认证时返回 422 而非 401

- **日期**: 2026-04-14
- **严重度**: Medium
- **来源**: E2E测试 TP-109
- **状态**: Open

### 现象
POST /api/import/ai-analyze 无 Authorization header 时返回 422（body validation error），而非 401。

### 根因
`api/routers/import_.py:63-95`：`ai_analyze` 端点未使用 `Depends(require_user)` 依赖。请求体中包含 `user_id` 字段（`AIAnalyzeRequest`），导致 Pydantic 在认证检查前先做 body validation。所有导入端点（ai-analyze、ai-confirm、undo）均无认证保护。

### 修复建议
给所有导入端点添加 `Depends(require_user)` 依赖，使用 `str(user.id)` 替代请求体中的 `user_id` 字段。

### 受影响文件
- `api/routers/import_.py:63`（ai_analyze 无认证）
- `api/routers/import_.py:156`（ai_confirm 无认证）
- `api/routers/import_.py:199`（undo 无认证）

---

## BUG-081: auth.py 无数据库异常 503 处理

- **日期**: 2026-04-14
- **严重度**: Low
- **来源**: E2E测试 TP-098
- **状态**: 已修复（先前修复，本次验证确认）

### 现象
当数据库不可用时，auth 相关端点抛出未捕获异常（500），而非返回 503 "数据库不可用"。

### 根因
`api/routers/auth.py:62-83`：`login` 等端点直接调用 `db.query()`，无 try/except 包裹数据库操作。数据库连接失败时 SQLAlchemy 抛出 `OperationalError`，FastAPI 返回通用 500。

### 修复建议
在关键认证端点（login、refresh）添加数据库异常捕获，返回 HTTPException(503, "数据库暂时不可用")。

### 受影响文件
- `api/routers/auth.py:62-83`（login 无 DB 异常处理）
- `api/routers/auth.py:86-94`（refresh 无 DB 异常处理）

---

## BUG-082: 前端对比矩阵仍使用 highlight 字段而非 score

- **日期**: 2026-04-14
- **严重度**: Low
- **来源**: E2E测试 TP-115
- **状态**: 已修复（先前修复，本次验证确认）

### 现象
前端对比数据原型仍使用 `highlight: "green"/"red"/null` 字段，BUG-048 要求改用 `score` 数值字段。

### 根因
`web/src/lib/comparison-data.ts:10-36`：硬编码的 mock 数据使用 `highlight` 字段标注竞品优劣势。BUG-048 修复建议改用 `score` 数值字段，但前端原型数据未同步更新。

### 修复建议
将 `comparison-data.ts` 中的 `highlight` 字段替换为 `score` 数值（如 green→1, red→-1, null→0），或等后端对比 API 完善后统一替换。

### 受影响文件
- `web/src/lib/comparison-data.ts:10-36`（使用 highlight 而非 score）

---

## BUG-083: hierarchy_labels dict 格式导致 GET /api/projects/ 返回 500

- **日期**: 2026-04-14
- **严重度**: High (阻塞项目列表加载)
- **来源**: 扫尾测试中发现
- **状态**: 已修复

### 现象
GET /api/projects/ 返回 Internal Server Error (500)。FastAPI ResponseValidationError: `hierarchy_labels` 字段应为 list，实际值为 dict `{"L1": "产品线", "L2": "模块", "L3": "功能项"}`。

### 根因
`api/services/project_crud.py:70`：`list_projects()` 直接返回 `p.hierarchy_labels`，未做类型归一化。数据库中部分项目（如通过模板创建的 `OSS Research`）的 `hierarchy_labels` 存为 JSON object 而非 JSON array。`ProjectSummary` schema 声明 `hierarchy_labels: list[str]`，Pydantic 序列化时因类型不匹配抛出 ValidationError。

**推测成因**: 项目模板表 `project_templates` 中 `hierarchy_labels` 列被某些模板写入 dict 格式（如 `{"L1":"...", "L2":"..."}`），模板创建项目时直接赋值，未做格式校验。

### 修复
1. `api/services/project_crud.py`: 新增 `_normalize_hierarchy_labels()` 辅助函数，将 dict/list/None 统一转为 `list[str]`
2. 三处返回 `hierarchy_labels` 的位置均调用该函数：`list_projects()`, `create_project()`, `get_project_detail()`
3. 修复数据库现有不一致数据：`UPDATE projects SET hierarchy_labels = '["产品线","模块","功能项"]' WHERE jsonb_typeof(hierarchy_labels) = 'object'`

### 受影响文件
- `api/services/project_crud.py:21-28`（新增 `_normalize_hierarchy_labels`）
- `api/services/project_crud.py:79`（list_projects 调用归一化）
- `api/services/project_crud.py:154`（create_project 调用归一化）
- `api/routers/projects.py:101`（get_project_detail 调用归一化）

---

## BUG-084: backfill 无效 competitor_id 返回 500 而非 404

- **日期**: 2026-04-14
- **严重度**: Medium
- **来源**: 扫尾测试 TP-065 中发现
- **状态**: 已修复

### 现象
POST /api/comparison/{id}/backfill 传入不存在于 `competitors` 表的 `competitor_id` 时，返回 500 IntegrityError（FK violation），而非友好的错误提示。

### 根因
`api/routers/comparison.py:284-306`：`backfill_comparison()` 直接 INSERT `CompetitorReference` 记录，未预先校验 `competitor_id` 是否存在于 `competitors` 表。数据库 FK 约束 `competitor_references_competitor_id_competitors_id_fk` 抛出 `psycopg2.errors.ForeignKeyViolation`，FastAPI 返回通用 500。

### 修复
在 INSERT 前添加 `db.query(Competitor).filter(Competitor.id == competitor_id_str).first()` 校验，不存在时返回 `HTTPException(404, "竞品不存在")`。

### 受影响文件
- `api/routers/comparison.py:284-288`（新增 competitor 存在性校验）
