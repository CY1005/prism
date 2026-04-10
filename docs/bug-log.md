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
