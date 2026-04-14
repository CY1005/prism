# Prism Bug Fix Log

记录修复过程中的设计决策，补充 bug-log.md 的根因分析。

---

## 2026-04-14 后端修复记录

### BUG-063: 语义搜索 Issue 结果 breadcrumb 为 None

**状态**: 已修复
**文件**: `api/services/hybrid_search.py`

**实现方案**: 方案A（hybrid_search 层 ORM 补全）

在 `hybrid_search()` 中，RRF 合并后调用新增的 `_backfill_issue_breadcrumbs(db, merged)` 函数。该函数：
1. 收集结果列表中 `type=="issue"` 且 `breadcrumb is None` 且 `node_id` 不为空的条目
2. 批量 ORM join 查询 `nodes + projects`
3. 调用已有的 `_build_breadcrumb(db, node, project_name)` 补全 breadcrumb

**未选方案B原因**: 在 raw SQL 中 JOIN 祖先节点需要递归 CTE，SQL 复杂度高，且与 `_build_breadcrumb_raw` 实现重复。方案A复用已有逻辑，代码量小，依赖清晰。

---

### BUG-064: Issue 向量搜索 SQL 列名错误（i.type → i.category）

**状态**: 验证已修复（代码当前已是正确状态）

交叉验证结果：读取 `hybrid_search.py` 第256行，已为 `i.category = %s`，SQL SELECT 也用 `i.category`。bug-log 描述的是历史错误状态，代码已在某次提交中修正。无需重新修改。

---

### BUG-066: search_mode 字段被 Pydantic 过滤

**状态**: 验证已修复（代码当前已是正确状态）

交叉验证结果：读取 `api/schemas/search.py` 第26行，`SearchResponse` 已有 `search_mode: str = "keyword"`。无需重新修改。

---

### F13 AC4 遗留: 关系图高亮 affected_node_ids 传递

**状态**: 后端已实现，前端待 frontend-fixer 完成高亮渲染

#### 设计决策

**问题**: 前端 F13 分析结果页面生成的 `affected_modules` 未传递给 `relation-graph` 页面进行高亮展示。

**方案选择**: 存入 DimensionRecord（而非 AnalysisTask 表）

**原因**:
- `analysis_tasks` 表结构存在但当前代码完全未使用，引入写入逻辑需要新增状态管理（pending/completed流转），超出此修复范围
- `affected_node_ids` 语义上是分析结果的一部分，属于节点维度记录，与 `analysis_result` 一同存储语义更清晰
- 前端已有读取节点维度记录的能力，新增轻量 GET 端点即可实现跨页面通信

#### 后端实现

1. **`api/schemas/analyze.py`**: `SaveAnalysisRequest` 增加 `affected_node_ids: list[str] | None = None` 字段；新增 `AffectedNodesResponse` schema

2. **`api/routers/analyze.py`**:
   - `save_analysis` 端点：将 `affected_node_ids` 存入 `DimensionRecord.content.metadata.affected_node_ids`，向后兼容（字段可选）
   - 新增 `GET /analyze/affected-nodes?node_id=&project_id=` 端点：查询该节点最近一次 `requirement_analysis` 维度记录，返回 `affected_node_ids`

#### 前端需做（通知 frontend-fixer）

- `relation-graph` 页面加载时，调用 `GET /api/analyze/affected-nodes?node_id={currentNodeId}&project_id={projectId}`
- 对返回的 `affected_node_ids` 中的节点，添加高亮样式（建议: `ring-2 ring-orange-400` 或 `glow` 效果）
- 当 `affected_node_ids` 为空时不高亮，正常渲染

**API 契约**:
```
GET /api/analyze/affected-nodes?node_id={uuid}&project_id={uuid}
Response: {
  "node_id": "...",
  "affected_node_ids": ["uuid1", "uuid2", ...],
  "analysis_record_id": "uuid | null"
}
```

---

## 2026-04-14 扫尾修复记录

### BUG-083: hierarchy_labels dict→list 序列化失败

**状态**: 已修复
**文件**: `api/services/project_crud.py`, `api/routers/projects.py`

**实现方案**: 在 service 层新增 `_normalize_hierarchy_labels()` 归一化函数，所有返回 `hierarchy_labels` 的出口统一调用。

**设计决策**:
- 选择在 service 层做归一化而非 Pydantic validator，原因：问题根源是 DB 数据格式不一致 + 模板写入未校验，在数据出口统一兜底比依赖 schema 验证更可靠
- 同时修复了 DB 中存量的 dict 格式数据（1 行），防止其他未覆盖到的查询路径再次触发

---

### BUG-084: backfill 无效 competitor_id 导致 500

**状态**: 已修复
**文件**: `api/routers/comparison.py`

**实现方案**: 在 `CompetitorReference` INSERT 前添加 `Competitor` 存在性校验，返回 404。

**设计决策**:
- 选择应用层校验而非依赖 DB FK 异常捕获，原因：500 IntegrityError 不提供用户友好信息，且混入了日志噪声
- 校验成本极低（单行 PK 查询），不值得为节省一次查询而让 500 暴露给前端

---

### BUG-079/081/082 验证记录

这三个 bug 在本次扫尾测试中确认已在先前的修复轮次中解决：

| BUG | 修复证据 | 验证方式 |
|-----|---------|---------|
| BUG-079 | `exporter.py:274-279` 已有 fallback 逻辑，无 h1 时将整文件作为单个功能项 | E2E 测试：上传纯文本 Markdown → 200 OK，返回 `parsed_feature` |
| BUG-081 | `auth.py:66-78,96-99` 已有 `OperationalError` try/except，返回 503 | 代码审查确认 |
| BUG-082 | `comparison-data.ts` 已使用 `score: number` 字段（1/-1/0），无 `highlight` 字段 | 代码审查确认 |

---

### SKIP 测试点解除记录

本次将 4 个 SKIP 测试点 + 2 个 TEST-DESIGN 测试点全部重新验证通过：

| TP-ID | 之前状态 | 解除原因 | 验证结果 |
|-------|---------|---------|---------|
| TP-007 | SKIP (无维度写入API) | 通过 `POST /api/snapshot/save` 写入 `competitor` 维度记录 | PASS |
| TP-063 | SKIP (无 comparison 数据) | `POST /api/comparison/generate` 可在无 AI 时生成 mock 数据 | PASS |
| TP-064 | SKIP (无 comparison 数据) | 同上，`GET /export` 返回 Markdown 表格 | PASS |
| TP-065 | SKIP (无 comparison 数据) | 同上，`POST /backfill` 成功写入 CompetitorReference | PASS |
| TP-014 | FAIL (test-design) | 测试点需传 `project_id` 查询参数，补充后 PASS | PASS |
| TP-035 | FAIL (test-design) | API 使用 `email` 而非 `user_id` 邀请成员，按实际 API 测试通过 | PASS |
