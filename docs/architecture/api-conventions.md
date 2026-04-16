# Prism API 规约 V2

> 版本：V2 | 状态：草案 | 日期：2026-04-17
> 基础：归纳自现有代码，YAGNI 原则，与上位规约（Next.js Server Actions、FastAPI）不打架
> 存量不合规端点见 `docs/architecture/api-conventions-debt.md`

---

## 总则

Prism 采用混合架构：Next.js Server Actions 处理 CRUD 和业务流程，FastAPI 处理 AI 密集型、流式、跨语言场景。两层架构的规约分开定义，共享本文件通用约定。

**SSE / 流式端点**：V2 不覆盖，规范待 ADR 评审后专项定义。

---

## 规则一：分页

适用范围：FastAPI 列表端点；前端 Read Action 按需遵守。

**分页参数**
```
GET /api/xxx?page=1&page_size=20
```
- `page` 从 1 开始，默认 1；`page_size` 默认 20，最大 100
- 响应结构：`{ items: [], total: int, page: int, page_size: int }`

**约定**
- issues 列表当前不分页（单节点百条以内），豁口见 DEBT-004
- 新建列表端点必须默认支持分页，不能裸返回数组
- [V2 新增] filter 变化时 page 重置归属前端职责，前端发起新筛选时重置 `page=1`，后端不感知
- [V2 新增] 批量导入/导出的结果不是分页列表场景，使用§批量操作响应结构（规则六 §6.4）

**为什么不做 cursor 分页**：当前最大数据集量级可控，offset 足够；F21 批量导入结果是一次性操作反馈，不是翻页场景。

---

## 规则二：路径命名

**资源路由**（CRUD，产生持久化资源）
```
/api/projects/{id}
/api/projects/{id}/nodes/{node_id}
```
全小写，连字符分隔，复数名词。

**[V2 新增] 操作路由**（不产生持久化资源，如导出、分析）
- 格式：`/api/{动词}/{名词}`
- HTTP 方法：有请求体用 POST，无副作用查询用 GET
- 示例：`POST /api/export/nodes`、`GET /api/analyze/affected-nodes`

**子操作路由**
- 软删恢复：`POST /api/projects/{id}/restore` — 动词做子路由合法
- 永久删除：`POST /api/projects/{id}/purge` — [V2 修改] 禁用纯形容词路径段，`/permanent` 改 `/purge`
- 路径段必须是名词或动词，禁用形容词

**流式端点**：V2 不覆盖，见待定 ADR。

---

## 规则三：字段命名

**Drizzle ↔ 数据库**
Drizzle schema 定义 camelCase，ORM 自动转 snake_case，无需手工映射。

**[V2 修改] Server Action → FastAPI 字段转换**
- 禁止直接将 camelCase 对象展开传给 FastAPI 请求体
- 必须显式构造 snake_case 字面量：
  ```typescript
  // ✅ 合法
  body: JSON.stringify({ project_id: projectId, node_ids: nodeIds })
  // ❌ 禁止
  body: JSON.stringify({ ...camelCaseObj })
  ```
- 不引入运行时转换中间件（全局自动转换掩盖映射关系，调试成本更高）
- 字段映射如有歧义，在调用处行内注释说明

**FastAPI 响应 → 前端**
FastAPI Pydantic model 统一 snake_case，前端消费时显式映射或保留 snake_case。

---

## 规则四：删除语义

**软删 vs 物理删**
- `projects`：软删，`PATCH /api/projects/{id}` 设 `deleted_at`，`POST /api/projects/{id}/restore` 恢复
- `nodes` / `issues`：物理删

**[V2 新增] 删除节点必须级联子树**
- 删除节点的语义约定：**递归删除该节点所有子孙**
- 无论通过 Server Action 还是 FastAPI 直调，行为必须一致
- FastAPI `DELETE /api/projects/{id}/nodes/{node_id}` 当前只删本节点，不符合规约（见 DEBT-002，修复前禁止绕过前端直调）

**关联数据处理**
- `issues.node_id`：`onDelete: "set null"`，删节点后 issues 保留但解除关联，**不是悬挂**，是合理业务设计
- `dimensionRecords` / `versionRecords`：`onDelete: "cascade"`，随节点级联删

---

## 规则五：排序与筛选

**通用规则**
- 筛选和排序参数扁平放在 query string，不做嵌套
- 排序：`sort_by={field}&sort_dir=asc|desc`，**单字段**
- 不支持多字段排序；小量级列表（百条以内）的多维排序需求由前端内存处理

**[V2 新增] issues 列表专项参数**
```
GET /api/projects/{id}/issues
  ?node_id=&category=&sort_by=created_at&sort_dir=desc&page=1&page_size=20
```
- `node_id`：按节点过滤（可选）
- `category`：bug / tech_debt / design_flaw / performance（可选）
- `sort_by`：`created_at`（默认）、`updated_at`、`category`
- `sort_dir`：`asc` / `desc`，默认 `desc`

**[V2 新增] 专用 Read Action 的边界**
- 纯走 DB、无 AI 能力、仅前端使用的 Read Action（如 `getIssuesByNode`、`getProjectTree`）不需要对应 FastAPI 端点
- 此类 Action 可以直接返回数据或抛 `AppError`，见规则六 §6.1

**为什么不支持多字段排序**：issues 最大百条量级，前端内存排序足够，后端 orderBy 组合实现成本不匹配收益。

---

## 规则六：新增端点最小契约

**[V2 修改] §6.1 ActionResult 使用边界**

| Action 类型 | 要求 |
|---|---|
| Mutate Action（写操作，有副作用）| 必须返回 `ActionResult<T>`，用 `actionSuccess` / `actionError` 包装 |
| Read Action（只读，期望数据或报错）| 可以直接返回数据或抛 `AppError`，不强制包 `ActionResult` |

判断依据：调用方是否需要区分"失败但继续"（用 ActionResult）vs"失败就报错"（throw AppError）。

**[V2 新增] §6.2 认证要求**
- 所有 FastAPI 端点**默认 require_user**
- 公开端点（如确实需要）必须在函数处显式注释：
  ```python
  # PUBLIC: 此端点不要求认证，原因：[说明]
  def some_public_endpoint(...):
  ```
- `export.py` 当前无认证为安全漏洞（DEBT-001），**V2 发布前必须修复，不作为豁口**

**[V2 修改] §6.3 错误响应规范**
- 500 响应禁止 `detail=str(e)`，必须用通用描述：
  ```python
  # ✅
  logger.exception("操作失败 project=%s", project_id)
  raise HTTPException(status_code=500, detail="操作失败，请重试")
  # ❌
  raise HTTPException(status_code=500, detail=str(e))
  ```
- 400 / 404 可以给 ValueError 的具体 message
- 存量违规见 DEBT-003

**[V2 新增] §6.4 批量操作响应结构**
适用于 importNodesFromCSV 等批量端点：
```typescript
{
  success_count: number
  failure_count: number
  failures: Array<{ index: number; reason: string }>
}
```
不使用分页包装，不用 `ActionResult.data` 直接装数组。

**[V2 新增] §6.5 导出响应模式**
- 小文件导出（单节点 Markdown）：base64 包在 JSON，走 `ActionResult<{ filename: string; content: string }>`
- 大文件导出（项目 zip）：`StreamingResponse`，前端 Action 透传 blob，不包 ActionResult

**[V2 修改] §6.6 乐观锁范围**
- `version` 字段约束**仅适用于 `dimensionRecords` 表的更新操作**
- 其他表（knowledge_items 等）不要求乐观锁，除非有明确并发写冲突场景

---

## 附：不在本规约覆盖范围

- SSE / 流式端点命名和契约 → 待 ADR 评审
- 公开访问 / 访客 / 分享链接场景 → 功能未排期，进入排期时做 ADR
- 多字段排序 → 当前 YAGNI，数据量达到阈值时重新评估

---

*存量债务完整列表见 `docs/architecture/api-conventions-debt.md`*
