# F9 搜索 — v0.2 Phase 5 测试清单

> 日期: 2026-04-12
> 验证方式: 代码审查 (功能测试需启动服务后手动验证)

## 构建验证

| 项目 | 状态 | 备注 |
|------|------|------|
| Backend (`python3 -c "from api.main import app"`) | ✅ | 需设置 PYTHONPATH |
| Frontend (`npx tsc --noEmit`) | ✅ | 无类型错误 |

## AC 验证结果

| AC | 描述 | 代码审查 | 备注 |
|----|------|---------|------|
| AC1 | 顶部搜索框输入关键词，实时显示匹配结果 | ✅ | `global-search-bar.tsx` 有 300ms debounce (setTimeout)，已集成到 projects、overview、analysis、product-lines、comparison、issues 共6个页面 |
| AC2 | 搜索范围覆盖节点名称、维度记录内容、F7问题 | ✅ | `search.py` 搜索三类：nodes(name ILIKE)、dimension_records(content JSONB cast to Text ILIKE)、issues(description+tags ILIKE)。Issue 模型在 tables.py 已定义 |
| AC3 | 结果展示路径面包屑+关键词高亮 | ✅ | 后端 `_build_breadcrumb()` 基于 node.path 的 materialized path 生成面包屑数组；前端 `highlightKeyword()` 用正则 split+mark 标签实现黄色高亮 |
| AC4 | 点击跳转到对应功能项档案页 | ✅ | 搜索结果链接到 `/projects/${project_id}/features/${node_id}`；API 响应包含 `node_id` 字段 |
| AC5 | 权限控制（只返回有权限的项目内容） | ⚠️ | 后端逻辑正确：`_get_accessible_project_ids()` 检查 ProjectMember，platform_admin 跳过过滤。**但前端搜索页和 GlobalSearchBar 直接调用 `searchUnified` service 而非 `globalSearch` server action，未传 user_id** — 见"发现的问题" |
| AC6 | 默认跨全部项目搜索，可按项目/维度类型/问题分类筛选 | ✅ | 搜索页左侧栏有三组 Checkbox 筛选器（项目范围/维度类型/问题分类）；后端 API 接受 project_id、dimension_type、issue_category 参数。注意：筛选是前端 client-side filter，非服务端过滤 |
| AC7 | 结果标注来源项目 Badge | ✅ | API 响应包含 `project_name`；前端用 Badge 组件渲染，按项目名映射不同颜色 class |

## 补充测试项

| 测试项 | 预期结果 | 状态 |
|--------|---------|------|
| 中文搜索 | ILIKE 配合 `%keyword%` 模式在 PostgreSQL 中支持中文匹配，代码层面无问题 | 待手动验证 |
| 长文本截取 | `_extract_snippet()` 限制 150 字符，关键词前后各取 40/60 字符，超出加省略号 | ✅ 代码审查通过 |
| 跨项目搜索 | 默认不 hardcode project_id 过滤，仅按用户权限过滤 | ✅ 代码审查通过 |
| 空搜索保护 | GlobalSearchBar 空字符串时清空结果不发请求；搜索页 handleSearch 检查 trim | ✅ 代码审查通过 |
| SQL 注入 | 使用 SQLAlchemy ORM 的 ILIKE 参数化查询，安全 | ✅ 代码审查通过 |
| 搜索结果去重 | `unified_search()` 末尾用 seen set 按 id 去重 | ✅ 代码审查通过 |
| Enter 键全页跳转 | GlobalSearchBar 的 Enter 路由到 `/search?q=...`，搜索页 Enter 触发 doSearch | ✅ 代码审查通过 |
| ESC 关闭下拉 | GlobalSearchBar 支持 Escape 键关闭下拉 + 点击外部关闭 | ✅ 代码审查通过 |
| Issue 无关联 node | issue.node_id 可为 null，此时 breadcrumb 仅显示项目名，node_id 为 null 时链接到项目页 | ✅ 代码审查通过 |
| 大量结果性能 | 搜索 API 和前端分别有 limit 参数（默认 20/50），但无分页实现 | 待手动验证 |

## 发现的问题

### P0: 权限控制绕过 — 前端未传 user_id

**文件**: `web/src/app/search/page.tsx` (L114), `web/src/components/global-search-bar.tsx` (L58)

**描述**: 两处前端代码都直接调用 `searchUnified(q, { limit })` 而非使用 server action `globalSearch()`。`searchUnified` 是 HTTP client 直接调用 FastAPI，不传 `user_id` 参数。而 API 端点 `/search/unified` 要求 `user_id` 为必填参数（`Query(...)`），这意味着：
1. 当前搜索请求会因缺少 user_id 返回 422 错误
2. 已有的 `globalSearch` server action（`web/src/actions/search.ts`）正确实现了 `requireAuth()` 并传 `user_id`，但从未被引用

**影响**: 搜索功能在当前状态下无法工作（API 会拒绝请求），即使绕过也会缺失权限控制。

### P1: 筛选器仅前端过滤

**文件**: `web/src/app/search/page.tsx` (L170-184)

**描述**: 搜索页的项目/维度/问题分类筛选全部在前端 client-side 执行，未通过 API 参数传给后端。后端已支持 `project_id`、`dimension_type`、`issue_category` 参数但未被利用。结果是先全量拉取再前端过滤，不利于性能和准确性（limit 截断后再过滤可能丢失匹配项）。

### P2: 项目列表硬编码

**文件**: `web/src/app/search/page.tsx` (L64-69)

**描述**: 搜索页左侧项目筛选列表是硬编码的 4 个项目（`defaultProjects`），未从 API 动态获取用户可访问的项目列表。
