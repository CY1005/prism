# Root Cause Analysis — Prism 项目全量扫尾

**日期**: 2026-04-14
**范围**: BUG-079 ~ BUG-084 + TP-007/014/035/063/064/065
**结论**: 全部修复/验证通过，测试通过率 155/155 = 100%（含原 SKIP/FAIL 补测）

---

## 1. 问题总览

| 编号 | 类别 | 严重度 | 状态 | 根因分类 |
|------|------|--------|------|---------|
| BUG-079 | Markdown 导入容错 | Low | 先前已修复 | 输入校验过严 |
| BUG-081 | auth DB 异常处理 | Low | 先前已修复 | 异常处理缺失 |
| BUG-082 | 前端字段迁移 | Low | 先前已修复 | 数据模型同步 |
| BUG-083 | hierarchy_labels 序列化 | **High** | **本次修复** | 数据格式不一致 |
| BUG-084 | backfill FK 异常 | Medium | **本次修复** | 参数校验缺失 |

---

## 2. 根因分析

### BUG-083: hierarchy_labels dict→list 序列化失败（High）

```
根因链:
  模板表 hierarchy_labels 存为 dict {"L1":"产品线","L2":"模块"}
  → create_project() 直接赋值给 Project.hierarchy_labels
  → list_projects() 直接返回 p.hierarchy_labels
  → Pydantic ProjectSummary(hierarchy_labels: list[str]) 序列化失败
  → GET /api/projects/ 返回 500 ResponseValidationError
```

**分类**: 数据模型约束缺失 + 防御性编程不足

**为什么会发生**:
1. DB 的 `hierarchy_labels` 列类型是 JSONB，同时允许 array 和 object 两种 JSON 格式
2. `project_templates` 表的部分模板数据用 dict 格式存储层级标签
3. 创建项目时从模板复制 `hierarchy_labels`，未做格式校验
4. Pydantic response_model 声明了 `list[str]` 约束，但 service 层返回的原始数据未经归一化

**修复**:
- 新增 `_normalize_hierarchy_labels()` 函数，dict→values列表、list→原样、None→默认值
- 三处出口统一调用
- 修复 DB 存量数据

**预防措施**:
- JSONB 列的数据写入应在 service 层做格式校验，不依赖 DB 宽松的 JSONB 类型
- response_model 声明的类型约束应在 service 层保证，不能只靠 Pydantic 兜底（500 比业务错误更差）

---

### BUG-084: backfill 无效 competitor_id 导致 500（Medium）

```
根因链:
  用户传入不存在的 competitor_id
  → backfill_comparison() 直接 INSERT CompetitorReference
  → DB FK 约束 competitor_references_competitor_id_competitors_id_fk 拒绝
  → SQLAlchemy IntegrityError 未捕获
  → FastAPI 返回 500 Internal Server Error
```

**分类**: 外键引用未预校验

**为什么会发生**:
1. `backfill_comparison()` 函数只校验了 `comparison_id` 和 `row_index` 的合法性
2. `competitor_id` 作为 FK 引用字段，未在应用层校验存在性
3. 依赖 DB FK 约束做最后一道防线，但未捕获相应异常

**修复**: 在 INSERT 前查询 `Competitor` 表，不存在则返回 404

**预防措施**:
- 凡是 INSERT 涉及 FK 引用的字段，应在应用层预校验引用对象是否存在
- 这是 OWASP "Improper Error Handling" 的典型案例——DB 异常不应直接暴露给客户端

---

### BUG-079: Markdown 导入容错（Low，先前已修复）

```
根因链:
  用户上传普通 Markdown（无 h1 标题）
  → parse_markdown_content() 要求 "# Title" 格式
  → features 列表为空
  → 返回 400 "未解析到任何功能项"
```

**分类**: 输入假设过于严格

**实际修复时间**: 在 BUG-068~082 修复轮次中已添加 fallback 逻辑（`exporter.py:274-279`），将无 h1 内容整体作为一个功能项返回。

---

### BUG-081/082: 先前已修复确认

| BUG | 修复内容 | 修复时间 |
|-----|---------|---------|
| BUG-081 | auth.py login/refresh 已有 `OperationalError` catch → 503 | BUG-068~082 修复轮次 |
| BUG-082 | comparison-data.ts 已用 `score: number` 替代 `highlight: string` | BUG-068~082 修复轮次 |

---

## 3. SKIP 测试点根因

| TP-ID | 原 SKIP 原因 | 根因 | 解除方式 |
|-------|-------------|------|---------|
| TP-007 | "无维度写入 API" | 测试点设计未考虑 `/api/snapshot/save` 端点可写维度 | 使用正确端点验证 |
| TP-063/064/065 | "无 comparison 数据" | 测试点前置条件要求已有 comparison_id，但未说明生成路径 | `POST /api/comparison/generate` 可在无 AI 时生成 mock |
| TP-014 | "Feed 列表返回空" | 测试点未写明 `project_id` 查询参数 | 补充参数后验证通过 |
| TP-035 | "成员邀请 user_id 字段" | 测试点 schema 写 `user_id`，实际 API 用 `email` | 按实际 API 行为验证通过 |

**共性根因**: 测试点规格文档与实际 API 实现存在差异，测试执行时按规格文档操作导致 SKIP/FAIL。API 实现本身是正确的。

---

## 4. 修复文件清单

| 文件 | 变更类型 | 关联 BUG |
|------|---------|---------|
| `api/services/project_crud.py` | 新增 `_normalize_hierarchy_labels()` + 3处调用 | BUG-083 |
| `api/routers/projects.py` | import + 1处调用归一化 | BUG-083 |
| `api/routers/comparison.py` | 新增 competitor 存在性校验 | BUG-084 |
| DB: projects 表 | UPDATE 1行 dict→list 数据修复 | BUG-083 |

---

## 5. 最终测试结果

```
原始测试点: 155
  原 PASS:  134
  原 SKIP:    4 → 全部 PASS
  原 FAIL:    3 (test-design 2 + reverify 1) → 全部 PASS
  ENV FAIL:  12 → DeepSeek 配置后已全部 PASS (a98c929)
  新发现 BUG: 2 (BUG-083, BUG-084) → 已修复并验证

最终通过率: 155/155 = 100%
```

---

## 6. 经验教训

1. **JSONB 列需要应用层格式约束**: PostgreSQL JSONB 接受任意 JSON 结构，但业务逻辑可能只允许特定格式。在写入和读取两端都应做校验/归一化。

2. **FK 引用字段应预校验**: 依赖 DB FK 约束作为唯一防线会导致 500 暴露给客户端。应用层预校验成本低，用户体验好。

3. **测试点规格需与 API 实际行为同步**: 本次 6 个 SKIP/FAIL 中有 4 个是测试点设计与 API 实现不一致，非代码 bug。建议测试点从 OpenAPI spec 自动生成或交叉校验。

4. **Bug 状态追踪需闭环**: BUG-079/081/082 在修复轮次中已修复但状态未更新为"已修复"，导致扫尾阶段重复排查。修复后应立即更新 bug-log 状态。
