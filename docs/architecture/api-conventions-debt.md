# API 规约存量债务（api-conventions-debt）

> 本文件记录 api-conventions V2 发布时已知的存量不合规端点。
> 规约定应然，本文件定"已知例外"，每条债务需标注修复优先级和负责方。

---

## 安全级债务（必须在下一个 milestone 前修复）

### ~~DEBT-001：export.py 两个端点无认证~~ ✅ 已关闭（2026-04-17）
- **文件**：`api/routers/export.py`
- **端点**：`POST /api/export/nodes`、`POST /api/export/project`
- **修复内容**：两个端点加 `user: User = Depends(require_user)` + `check_permission(..., "viewer")`；前端 `web/src/actions/export.ts` 配套加 `X-Internal-Token` + `X-User-Id` header
- **关闭验证**：后端 require_user 依赖强制认证，前端 Server Action 走服务间 HMAC 透传用户身份

---

## 语义一致性债务

### DEBT-002：FastAPI delete_node 不级联子树
- **文件**：`api/routers/nodes.py`，L130 `delete_node`
- **违规规则**：api-conventions §4.2（删除节点必须级联子孙）
- **现状**：`db.delete(node)` 只删本节点，子孙节点变成孤节点
- **风险**：绕过前端直调 FastAPI 会导致树结构损坏
- **修复方案**：在 FastAPI delete_node 中复现前端逻辑：先查 path LIKE 子孙，再批量删
- **临时缓解**：在函数 docstring 注明"禁止绕过 Server Action 直调此端点"
- **优先级**：P1，生产上线前修复

---

## 错误处理债务

### DEBT-003：projects.py 三处 detail=str(e) 泄露内部错误
- **文件**：`api/routers/projects.py`，L71、L198、L217
- **违规规则**：api-conventions §6.3（500 禁止 detail=str(e)）
- **风险**：将 Python 异常信息（包括 SQL 错误、堆栈摘要）暴露给前端
- **修复方案**：
  ```python
  # L71 改为：
  logger.exception("创建项目失败")
  raise HTTPException(status_code=500, detail="创建项目失败，请重试")
  ```
- **优先级**：P2，下一批次安全修复

---

## 功能完整性债务

### DEBT-004：issues 列表不支持分页
- **文件**：`web/src/actions/issues.ts`，`getIssuesByNode` / `getIssuesByCategory`
- **违规规则**：api-conventions §1.2（新列表端点必须支持分页）
- **现状**：直接返回全量 issues，无 page / page_size 参数
- **豁口理由**：单节点 issues 数量当前不超过百条，无性能问题
- **触发升级条件**：单节点 issues 超过 200 条时必须补分页
- **优先级**：P3，按需升级

---

## 已关闭债务

> （暂无）

---

*最后更新：2026-04-17*
