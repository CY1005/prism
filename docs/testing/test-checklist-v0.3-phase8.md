# Test Checklist — Prism v0.3 Phase 8 (F16 + F15)

**Date**: 2026-04-14
**QA Agent**: Claude Code (补充验证)
**Scope**: F16 AI快照, F15 数据流转可视化, Cross-cutting checks
**Source commit**: `89eae64` (feat: Phase 3 导入功能 + 快照 + 活动日志)

---

## Cross-cutting Checks

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript compilation (`npx tsc --noEmit`) | **PASS** | 0 errors |
| Python import (`from api.main import app`) | **PASS** | `api/main.py:28` includes snapshot router |
| Snapshot router registered | **PASS** | `app.include_router(snapshot.router, prefix="/api/snapshot")` |
| activity_logs 表定义 | **PASS** | `web/src/db/schema.ts:272-286` 字段完整（id/projectId/userId/actionType/targetType/targetId/summary/metadata/createdAt） |

---

## F16 AI快照

### AC1: 版本记录 ≥3 时显示"生成当前快照"按钮

**Status: ✅ PASS**

| What | Verified | How |
|------|----------|-----|
| 条件判断 | Yes | `workspace.tsx:775` — `nodeData.versions.length >= 3` |
| 按钮渲染 | Yes | `workspace.tsx:776-790` — 条件满足时渲染 Button |
| Loading 状态 | Yes | `workspace.tsx:781-784` — `snapshotLoading` 时显示 Spinner |
| 版本 <3 时隐藏 | Yes | 条件渲染，不满足时不渲染按钮 |

---

### AC2: AI 输出一句话概要 + 按维度结构化

**Status: ✅ PASS**

| What | Verified | How |
|------|----------|-----|
| 后端双格式输出 | Yes | `api/routers/snapshot.py:55-155` — 返回 `SnapshotGenerateResponse(summary, dimensions)` |
| AI Prompt 要求双格式 | Yes | `snapshot.py:111-121` — prompt 明确要求 JSON `{summary, dimensions}` |
| 版本记录 ≥3 前置校验 | Yes | `snapshot.py:72-76` — 不足3条返回 400 |
| 版本上下文构建 | Yes | `snapshot.py:87-97` — 遍历版本记录构建 version_context |
| 维度上下文构建 | Yes | `snapshot.py:96-98` — 遍历维度记录构建 dim_context |
| AI 返回解析 + 容错 | Yes | `snapshot.py:128-153` — JSON 解析失败时 fallback 到原始文本 |
| 前端展示双格式 | Yes | `snapshot-result.tsx:79-95` — 一句话概要区 + 维度结构化区 |

---

### AC3: 可选择性覆盖维度卡片内容

**Status: ✅ PASS**

| What | Verified | How |
|------|----------|-----|
| 维度勾选 Checkbox | Yes | `snapshot-result.tsx:126-132` — 每个维度有 Checkbox |
| 已选计数展示 | Yes | `snapshot-result.tsx:109-111` — "已选中 N/M 个维度" |
| 确认按钮文案动态 | Yes | `snapshot-result.tsx:156-163` — 显示选中数量 |
| 概要可编辑 | Yes | `snapshot-result.tsx:90-94` — Textarea 可编辑 |
| Save 端点 upsert 逻辑 | Yes | `snapshot.py:158-236` — 概要和维度均支持 update/create |
| Dialog 展示 | Yes | `workspace.tsx:1226-1239` — Dialog 包裹 SnapshotResult |

---

## F16 BUG 清单

### BUG-F16-01: snapshot/generate 前后端字段名不匹配（严重）

**File**: `workspace.tsx:367` vs `api/schemas/snapshot.py:5-7`

- 前端发送: `{ nodeId: "xxx" }` (camelCase)
- 后端期望: `{ node_id: "xxx", project_id: "xxx" }` (snake_case)
- Pydantic 没有配置 `alias_generator` 或 `populate_by_name`
- **结果**: 请求会返回 422 Validation Error（缺少 `node_id` 和 `project_id`）
- **修复建议**: 前端改为 `{ node_id: nodeData.node.id, project_id: project.id }` 或后端 Pydantic model 添加 `model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)`

### BUG-F16-02: snapshot/save 前后端字段名不匹配（严重）

**File**: `workspace.tsx:388-392` vs `api/schemas/snapshot.py:25-30`

- 前端发送: `{ nodeId, summary, selectedDimensions }` (camelCase)
- 后端期望: `{ node_id, project_id, summary, dimensions }` (snake_case)
- 字段名也不一致: 前端 `selectedDimensions` vs 后端 `dimensions`
- **结果**: 请求会返回 422 Validation Error
- **修复建议**: 同 BUG-F16-01，统一命名

### BUG-F16-03: snapshot API 缺少认证和权限校验（安全）

**File**: `api/routers/snapshot.py`

- `generate` 和 `save` 两个端点均未添加认证 middleware
- 对比其他端点：`analyze.py` 同样未加（因为通过 Next.js proxy 间接调用），但 snapshot 可直接通过 API 端口访问
- 同 F13 的架构模式——FastAPI 端点依赖前端页面级 auth 保护
- **风险**: 如果 FastAPI 端口(8001)对外暴露，任意用户可调用
- **建议**: 与 F13 一致暂不修，但记录为技术债

---

## F15 数据流转可视化

### AC1: 导入过程实时展示进度

**Status: ✅ PASS**

| What | Verified | How |
|------|----------|-----|
| 实时进度面板 | Yes | `import-wizard.tsx:912-960` — 完整的进度面板组件 |
| 当前处理文件名 | Yes | `import-wizard.tsx:944-949` — 显示 `importProgress.currentFile` |
| 归入模块显示 | Yes | `import-wizard.tsx:950-956` — 显示 `importProgress.assignedModule` |
| 进度百分比 | Yes | `import-wizard.tsx:930-941` — 进度条 + 百分比数字 |
| 进行中/完成状态标记 | Yes | `import-wizard.tsx:917-926` — Badge 区分进行中/完成 |

---

### AC2: 完成后展示流转摘要

**Status: ✅ PASS**

| What | Verified | How |
|------|----------|-----|
| 摘要卡片 | Yes | `import-wizard.tsx:963-980` — 绿色边框摘要卡片 |
| 导入数据条数 | Yes | `importSummary.totalRecords` |
| 拆分功能项数 | Yes | `importSummary.featureItems` |
| 成功图标 | Yes | Check 图标 + "导入完成" 标题 |

---

### AC3: F13 分析后展示结果流向提示

**Status: ✅ PASS**

| What | Verified | How |
|------|----------|-----|
| 保存后流向提示 | Yes | `analysis/page.tsx:355` — "分析结果已保存到功能项 XX 的需求分析维度，涉及 N 个模块" |
| 测试点保存后提示 | Yes | `analysis/page.tsx:377` — "分析结果已保存...生成了 N 条测试点" |
| 提示来源明确 | Yes | 包含 nodeId 和数量信息 |

---

### AC4: 活动日志页展示历史操作列表

**Status: ✅ PASS**

| What | Verified | How |
|------|----------|-----|
| 活动日志 Tab | Yes | `overview/page.tsx:226-233` — 按钮切换活动日志面板 |
| 日志列表展示 | Yes | `overview/page.tsx:490-560` — 列表渲染每条日志 |
| 时间/操作类型/影响范围 | Yes | 每条日志展示 actionType + summary + createdAt |
| 分页加载 | Yes | `overview/page.tsx:557-560` — "加载更多"按钮 + activityPage 翻页 |
| 后端分页查询 | Yes | `activity-log.ts:38-57` — limit + offset 分页 |
| 权限校验 | Yes | `activity-log.ts:43-44` — requireAuth + checkProjectAccess("viewer") |

---

### F15 后端：logActivity 调用覆盖检查

| 操作 | 已接入 logActivity | File:Line |
|------|-------------------|-----------|
| F11 导入完成 | ✅ | `import.ts:182` |
| 节点创建 | ✅ | `nodes.ts:211` |
| 节点重命名 | ✅ | `nodes.ts:375` |
| 节点删除 | ✅ | `nodes.ts:417` |
| 节点移动 | ✅ | `nodes.ts:911` |
| 维度记录创建 | ✅ | `nodes.ts:248` |
| 维度记录更新 | ✅ | `nodes.ts:308` |
| 维度记录删除 | ✅ | `nodes.ts:344` |
| 版本创建 | ✅ | `versions.ts:128` |
| 版本删除 | ✅ | `versions.ts:208` |
| CSV 导入 | ✅ | `nodes.ts:746` |
| **F13 分析完成** | ❌ 未接入 | `api/routers/analyze.py`（FastAPI 侧无 logActivity） |

---

## F15 BUG 清单

### BUG-F15-01: F13 分析操作未写入 activity_logs（功能缺失）

**File**: `api/routers/analyze.py`

- F13 需求分析完成后仅在前端弹 Toast 提示，未调用 logActivity 写入 activity_logs
- 提示词要求: "F13 分析完成时记录分析结果流向"
- **影响**: 活动日志页看不到 AI 分析操作的历史记录
- **修复建议**: 在前端 analysis page 的保存成功回调中调用 `logActivity({ actionType: "analyze", ... })`

---

## 总结

### 完成状态

| Feature | AC 总数 | ✅ 已实现 | ⚠️ 部分实现 | ❌ 未实现 |
|---------|---------|----------|------------|----------|
| F16 AI快照 | 3 | 3 | 0 | 0 |
| F15 数据流转 | 4 | 4 | 0 | 0 |

### BUG 汇总

| ID | 严重度 | 描述 | 影响 |
|----|--------|------|------|
| BUG-F16-01 | **严重** | generate 端点前后端字段名不匹配 | 快照生成功能 422 不可用 |
| BUG-F16-02 | **严重** | save 端点前后端字段名不匹配 | 快照保存功能 422 不可用 |
| BUG-F16-03 | 低 | snapshot API 缺少后端认证 | 安全技术债（同 F13 模式） |
| BUG-F15-01 | 中 | F13 分析操作未写入 activity_logs | 活动日志不完整 |

### 结论

**F16 + F15 代码结构完整，但 F16 存在 2 个严重 bug 导致快照功能实际不可用**（前后端字段名不匹配会导致 422 错误）。修复后即可正常使用。
