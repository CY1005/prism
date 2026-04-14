# Test Checklist — Prism v0.4 Phase 9 (F17 AI智能导入)

**Date**: 2026-04-14
**QA Agent**: Claude Code (Phase 9 QA)
**Scope**: F17 AI智能导入全部10条AC + 前后端契约对齐 + 安全检查 + F15联动
**Source files**:
- Backend: `api/services/ai_import.py`, `api/routers/import_.py`
- Frontend Server Action: `web/src/actions/import-ai.ts`
- Frontend Components: `web/src/components/ai-import-wizard.tsx`, `web/src/components/ai-mapping-table.tsx`
- Frontend Pages: `web/src/app/projects/[projectId]/import/import-page-client.tsx`, `page.tsx`, `import-wizard.tsx`

---

## Cross-cutting Checks

| Check | Status | Notes |
|-------|--------|-------|
| Import router 注册 | **PASS** | `api/main.py:26` — `app.include_router(import_router.router, prefix="/api/import")` |
| Server Action 文件存在 | **PASS** | `web/src/actions/import-ai.ts` — 3个 server action（aiAnalyzeZip, aiConfirmImport, aiUndoImport） |
| AI import service 导入 | **PASS** | `api/routers/import_.py:12` — 正确导入 `analyze_zip_files`, `confirm_ai_import`, `undo_ai_import` |

---

## F17 AC 验证

### AC1: 上传 zip 后展示文件树和预览

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| zip 上传入口 | Yes | `ai-import-wizard.tsx:651-703` — 拖拽/点击上传区域，accept=".zip" |
| 50MB 大小限制 | Yes | `ai-import-wizard.tsx:361` + `import_.py:36` — 前后端一致校验 |
| 文件树展示 | Yes | `ai-import-wizard.tsx:707-733` — FileTreeItem 递归渲染文件树 |
| 文件预览 | Yes | `ai-import-wizard.tsx:736-767` — 右侧预览面板展示文件内容 |
| 格式 badge | Yes | `ai-import-wizard.tsx:746-749` — 显示 markdown/csv/text badge |

---

### AC2: AI 分析输出映射表（文件 -> 模块 -> 维度 -> 置信度）

**Status: ⚠️ 部分实现（后端完整，前端调用有严重契约不匹配）**

| What | Verified | How |
|------|----------|-----|
| 后端 AI 分析逻辑 | Yes | `ai_import.py:315-514` — analyze_zip_files 完整实现，含 prompt 构建、批次处理、解析、容错 |
| 后端映射表结构 | Yes | `ai_import.py:209-251` — 包含 title/source_path/content/module/dimension/confidence/reason/product_line_tags |
| 后端置信度类型 | Yes | `ai_import.py:225` — confidence 为 int (0-100) |
| 前端调用方式 | **BUG** | `ai-import-wizard.tsx:428` — 直接 fetch 而非调用 server action，见 BUG-054 |
| 前端请求体字段 | **BUG** | `ai-import-wizard.tsx:421-434` — files 字段名不匹配 + 缺少 user_id，见 BUG-054/055 |
| 前端响应解析 | **BUG** | `ai-import-wizard.tsx:444` — 读 `data.mappings` 但后端返回 `data.mapping_rows`，见 BUG-056 |
| 前端置信度类型 | **BUG** | `ai-mapping-table.tsx:42` — confidence 为 string enum ("high"\|"medium"\|"low")，后端返回 int (0-100)，见 BUG-057 |

---

### AC3: 可调整映射 + 批量操作

**Status: ⚠️ 部分实现（前端UI完整，API契约不匹配）**

| What | Verified | How |
|------|----------|-----|
| 表格内模块 Select | Yes | `ai-mapping-table.tsx:358-376` — 每行可选择模块 |
| 表格内维度 Select | Yes | `ai-mapping-table.tsx:379-405` — 每行可选择维度 |
| 批量改模块 | Yes | `ai-mapping-table.tsx:213-224` — 工具栏批量更新 |
| 批量改维度 | Yes | `ai-mapping-table.tsx:227-239` — 工具栏批量更新 |
| 全选/取消全选 | Yes | `ai-mapping-table.tsx:207-210` — 按钮 + 表头 Checkbox |
| 置信度过滤 | Yes | `ai-mapping-table.tsx:244-262` — 按高/中/低筛选 |
| 排序 | Yes | `ai-mapping-table.tsx:123-140` — 文件名/模块/置信度排序 |
| ai-mapping API 调用 | **BUG** | `ai-import-wizard.tsx:460-484` — 字段名不匹配，见 BUG-058 |

---

### AC4: 大文件可拆分

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| Markdown 按标题拆分 | Yes | `ai_import.py:60-97` — _split_markdown_by_heading，按 # 到 ### 级别拆分 |
| CSV 按行拆分 | Yes | `ai_import.py:100-133` — _split_csv_by_rows，每行一条 |
| 纯文本兜底 | Yes | `ai_import.py:150-152` — 整文件作为一条 |
| 拆分入口 | Yes | `ai_import.py:136-152` — split_file_into_items 按 format 分发 |
| 批次处理 | Yes | `ai_import.py:416-417` — batch_size=30 避免 prompt 过长 |

---

### AC5: 产品线差异自动打标签

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| 标签模式定义 | Yes | `ai_import.py:39-45` — 5种产品线标签模式（私有云/智算中心/公有云/混合云/企业版） |
| 检测函数 | Yes | `ai_import.py:48-55` — _detect_product_line_tags，正则匹配 |
| 解析结果中携带标签 | Yes | `ai_import.py:228` — mapping_rows 每行含 product_line_tags |
| 标签写入维度记录 | Yes | `ai_import.py:813-814` — content_payload 包含 product_line_tags |

---

### AC6: 跨模块引用自动创建关联

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| 关联检测（分析阶段） | Yes | `ai_import.py:285-310` — _detect_cross_module_relations，内容中包含其他标题则判定为引用 |
| 短标题过滤 | Yes | `ai_import.py:299-300` — len(title) < 4 时跳过避免误匹配 |
| 关联创建（确认阶段） | Yes | `ai_import.py:631-666` — 重新检测关联并创建 NodeRelation |
| 去重检查 | Yes | `ai_import.py:652-654` — 查重已有关联，不重复创建 |
| 数量上限 | Yes | `ai_import.py:650` — cap at 50 条 |

---

### AC7: 批量创建 + 导入结果摘要

**Status: ⚠️ 部分实现（后端完整，前端调用有严重契约不匹配）**

| What | Verified | How |
|------|----------|-----|
| 后端 confirm 逻辑 | Yes | `ai_import.py:519-700` — confirm_ai_import 完整实现 |
| import/merge/skip 三种 action | Yes | `ai_import.py:567-629` — 按 action 分支处理 |
| 结果摘要返回 | Yes | `ai_import.py:692-700` — 返回 imported/merged/skipped/errors/created_node_ids/relations_created |
| 前端 confirm 调用 | **BUG** | `ai-import-wizard.tsx:548-554` — 字段名不匹配，见 BUG-059 |
| 前端响应字段 | **BUG** | `ai-import-wizard.tsx:574` — 读 `result.import_session_id` 但后端返回 `result.session_id`，见 BUG-060 |

---

### AC8: 同名功能项提示合并或跳过

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| 后端去重检测 | Yes | `ai_import.py:256-280` — _detect_duplicates，检查 file 类型节点的 name 匹配 |
| conflict 标记 | Yes | `ai_import.py:272-278` — conflict/conflict_message/existing_node_id 三字段 |
| 前端去重对话框 | Yes | `ai-import-wizard.tsx:69-130` — DedupDialog 组件提供 合并/跳过/新建 三选项 |
| 后端合并处理 | Yes | `ai_import.py:585-603` — action=="merge" 时 upsert 已有节点的维度记录 |

---

### AC9: 支持 Markdown/CSV/纯文本

**Status: ✅ 已实现**

| What | Verified | How |
|------|----------|-----|
| Markdown 解析 | Yes | `import_handler.py:141` — format="markdown" |
| CSV 解析 | Yes | `import_handler.py:164` — format="csv" |
| 纯文本解析 | Yes | `import_handler.py:140-143` — format="text" (默认) |
| 前端格式支持提示 | Yes | `ai-import-wizard.tsx:693` — "支持 Markdown、CSV、纯文本格式" |
| 后端拆分按格式分发 | Yes | `ai_import.py:136-152` — split_file_into_items 按 format 分派 |

---

### AC10: 一键撤销本次导入

**Status: ⚠️ 部分实现（后端完整，前端调用有严重契约不匹配）**

| What | Verified | How |
|------|----------|-----|
| 后端撤销逻辑 | Yes | `ai_import.py:705-750` — undo_ai_import，逐节点删除 + commit |
| 后端级联清理 | Yes | `ai_import.py:716` — 注释说明 cascade delete 清理 dimension_records 和 node_relations |
| 后端事务回滚 | Yes | `ai_import.py:731-735` — commit 失败时 rollback |
| 后端路由 | Yes | `import_.py:198-224` — POST /undo，校验 created_node_ids 非空 |
| 前端撤销调用 | **BUG** | `ai-import-wizard.tsx:597-603` — 字段名不匹配且缺少必填字段，见 BUG-061 |

---

## 前后端 API 契约对齐检查（重点）

### 端点 1: POST /api/import/ai-analyze

**问题路径**: ai-import-wizard.tsx 直接 fetch 而非调用 server action

| 字段 | 后端 (AIAnalyzeRequest) | 前端 wizard fetch | 前端 server action | 匹配? |
|------|------------------------|-------------------|--------------------|-------|
| project_id | `str` required | `project_id: projectId` | `project_id: projectId` | wizard OK, SA OK |
| user_id | `str` required | **缺失** | `user_id: user.id` | **wizard FAIL -> 422** |
| files | `list[dict]` required | `files: [{file_name, file_path, content, format}]` | `files` (透传) | wizard 字段名不匹配 |
| 响应 mapping_rows | `mapping_rows: [...]` | 读 `data.mappings` | 读 `data.mapping_rows` | **wizard FAIL**, SA OK |
| 响应 confidence | `int (0-100)` | 期望 `Confidence ("high"\|"medium"\|"low")` | 正确 `number` | **wizard 类型不匹配** |

### 端点 2: PUT /api/import/ai-mapping

| 字段 | 后端 (AIMappingUpdateRequest) | 前端 wizard fetch | 匹配? |
|------|------------------------------|-------------------|-------|
| session_id | `str` required | **缺失** | **FAIL -> 422** |
| project_id | `str` required | `project_id: projectId` | OK |
| adjustments | `list[MappingAdjustItem]` required | 发 `changes: [{row_id, module_id, dimension_id}]` | **FAIL -> 422** (字段名 + 子结构全部不匹配) |

### 端点 3: POST /api/import/ai-confirm

| 字段 | 后端 (AIConfirmRequest) | 前端 wizard fetch | 前端 server action | 匹配? |
|------|------------------------|-------------------|--------------------|-------|
| session_id | `str` required | **缺失** | `session_id: sessionId` | **wizard FAIL -> 422** |
| project_id | `str` required | `project_id: projectId` | `project_id: projectId` | OK |
| user_id | `str` required | **缺失** | `user_id: user.id` | **wizard FAIL -> 422** |
| mapping_rows | `list[dict]` required | 发 `items: [...]` | `mapping_rows: mappingRows` | **wizard FAIL -> 422**, SA OK |
| 响应 session_id | `session_id` | 读 `import_session_id` | 正确 `session_id` | **wizard FAIL** |

### 端点 4: POST /api/import/undo

| 字段 | 后端 (UndoRequest) | 前端 wizard fetch | 前端 server action | 匹配? |
|------|-------------------|-------------------|--------------------|-------|
| session_id | `str` required | 发 `import_session_id` | `session_id: sessionId` | **wizard FAIL -> 422** |
| project_id | `str` required | `project_id: projectId` | `project_id: projectId` | OK |
| user_id | `str` required | **缺失** | `user_id: user.id` | **wizard FAIL -> 422** |
| created_node_ids | `list[str]` required | **缺失** | `created_node_ids: createdNodeIds` | **wizard FAIL -> 422** |

### 契约检查结论

**Server Action (import-ai.ts) 的 3 个端点（ai-analyze, ai-confirm, undo）与后端 Pydantic schema 完全对齐，字段名、类型、必填/可选均一致。**

**但 ai-import-wizard.tsx 组件完全绕过 Server Action，直接用 fetch 调用后端 API，所有 4 个端点的请求/响应字段都不匹配，全部会导致 422 Validation Error 或运行时错误。** 这是本次最严重的发现——存在两套调用路径，且前端实际使用的路径（wizard fetch）全部不可用。

---

## F15 联动检查

| Check | Status | Notes |
|-------|--------|-------|
| 导入进度面板 | ✅ | `ai-import-wizard.tsx:512-571` — 模拟逐文件进度动画 |
| 导入完成后摘要 | ⚠️ | 后端返回正确摘要，但前端读错字段名（BUG-060），无法正常展示 |
| 导入后跳转 workspace | ✅ | `ai-import-wizard.tsx:578-581` — `router.push(/projects/{id}?imported=true)` |
| workspace 接收 imported 参数 | ✅ | `workspace.tsx:326-330` — 检测 `?imported=true` 并定位到模块 |
| 活动日志写入 | ✅ | `ai_import.py:397-410,494-505,671-690,737-748` — 分析/确认/完成/撤销 4 个阶段都写入 activity_logs |

---

## 安全检查

### SQL 注入

| Check | Status | Notes |
|-------|--------|-------|
| ai_import.py 查询 | **PASS** | 全部使用 SQLAlchemy ORM query/filter，无 raw SQL 拼接 |
| import_.py 路由层 | **PASS** | 参数通过 Pydantic model 校验，无直接 SQL 拼接 |

### 认证/权限

| Check | Status | Notes |
|-------|--------|-------|
| Server Action 层 | **PASS** | `import-ai.ts:91-92,139-140,210-211` — 每个 action 都有 requireAuth + checkProjectAccess("editor") |
| FastAPI 路由层 | **WARN** | `import_.py` — 4个新端点均无后端认证中间件（同 F13/F16 模式） |
| 风险评估 | 低 | 通过 Next.js proxy 调用，FastAPI 端口不对外暴露。但 **ai-import-wizard.tsx 直接 fetch** 绕过了 Server Action 的 auth 检查（见 BUG-062） |

### 文件上传安全

| Check | Status | Notes |
|-------|--------|-------|
| 文件类型校验 | **PASS** | `import_.py:29` — 只接受 .zip 后缀 |
| 文件大小限制 | **PASS** | `import_.py:34-35` — 50MB 上限 |
| 空文件校验 | **PASS** | `import_.py:37-38` — 拒绝空文件 |
| 路径遍历检查 | **需确认** | 依赖 `import_handler.extract_and_parse_zip` 的实现（不在本次 review 范围内，但 zip 解压存在 zip slip 风险，建议确认 `extractall` 是否做了路径规范化） |

---

## BUG 汇总

| ID | 严重度 | 描述 | 根因 | 影响端点 |
|----|--------|------|------|---------|
| BUG-054 | **Critical** | ai-import-wizard 绕过 server action，直接 fetch 后端 API，缺少 user_id | 双路径实现 | ai-analyze |
| BUG-055 | **Critical** | ai-analyze 请求 files 子字段名不匹配（file_name/file_path vs name/path） | 前端字段命名错误 | ai-analyze |
| BUG-056 | **Critical** | ai-analyze 响应字段名不匹配（读 mappings vs 实际返回 mapping_rows） | 前端类型定义与后端不一致 | ai-analyze |
| BUG-057 | **High** | confidence 类型不匹配：前端 string enum vs 后端 int 0-100 | 前端组件独立定义了不同类型 | ai-analyze + mapping table |
| BUG-058 | **High** | ai-mapping 请求字段名不匹配（changes vs adjustments）+ 缺少 session_id | 前端字段命名错误 | ai-mapping |
| BUG-059 | **Critical** | ai-confirm 请求字段名不匹配（items vs mapping_rows）+ 缺少 session_id 和 user_id | 前端字段命名错误 | ai-confirm |
| BUG-060 | **High** | ai-confirm 响应字段名不匹配（读 import_session_id vs 实际返回 session_id） | 前端类型定义错误 | ai-confirm |
| BUG-061 | **Critical** | undo 请求字段名不匹配 + 缺少 user_id 和 created_node_ids | 前端字段命名错误 | undo |
| BUG-062 | **High** | ai-import-wizard 直接 fetch 绕过 Server Action 的 requireAuth + checkProjectAccess | 架构绕过 | 全部4个端点 |

---

## 总结

### 完成状态

| AC | 描述 | 状态 | 备注 |
|----|------|------|------|
| AC1 | 上传 zip + 文件树 + 预览 | ✅ 已实现 | |
| AC2 | AI 分析输出映射表 | ⚠️ 部分实现 | 后端完整，前端调用全部 422 |
| AC3 | 可调整映射 + 批量操作 | ⚠️ 部分实现 | UI 完整，API 调用不匹配 |
| AC4 | 大文件可拆分 | ✅ 已实现 | |
| AC5 | 产品线差异自动打标签 | ✅ 已实现 | |
| AC6 | 跨模块引用自动创建关联 | ✅ 已实现 | |
| AC7 | 批量创建 + 导入结果摘要 | ⚠️ 部分实现 | 后端完整，前端调用全部 422 |
| AC8 | 同名功能项提示合并或跳过 | ✅ 已实现 | |
| AC9 | 支持 Markdown/CSV/纯文本 | ✅ 已实现 | |
| AC10 | 一键撤销本次导入 | ⚠️ 部分实现 | 后端完整，前端调用全部 422 |

### 根因分析

**本次发现的核心问题与 Phase 7/8 完全同一模式：前后端并行开发导致 API 契约漂移。**

但比之前的情况更复杂：`import-ai.ts` Server Action 的契约与后端 **已经对齐**，但 `ai-import-wizard.tsx` 组件完全绕开了 Server Action，自己写了一套 `fetch` 调用逻辑，且这套调用逻辑的字段名、结构、类型全部与后端不匹配。

**修复方向**：ai-import-wizard.tsx 应改为调用 import-ai.ts 的 Server Action（aiAnalyzeZip, aiConfirmImport, aiUndoImport），而不是直接 fetch。这样既解决契约问题，又恢复了认证保护。ai-mapping 端点因为只做校验+回显（前端是真正的状态源），可以保持 fire-and-forget 的 fetch，但需修正字段名。

### 修复优先级

1. **P0**: BUG-054/055/056/059/061 — 所有直接 fetch 改为调用 Server Action（消除 5 个 critical bug + BUG-062 的认证绕过）
2. **P1**: BUG-057 — confidence 类型对齐（后端 int 0-100 转换为前端 string enum，或统一为 number）
3. **P2**: BUG-058 — ai-mapping 的 fetch 字段名修正（非阻塞但会产生 console 报错）
4. **P2**: BUG-060 — 如果仍保留直接 fetch confirm 路径，修正 import_session_id -> session_id
