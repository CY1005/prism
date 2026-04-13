真实痛点记录，为 AI Code Quality Gate (B线项目) 积累素材。

---

## PAIN-001: Agent 并行开发的契约漂移

- **日期**: 2026-04-12
- **场景**: v0.3 Phase 7, 4-Agent Team (Backend + Frontend + QA + Budget)
- **痛感**: 高 — 8 个运行时 bug，两轮修复才清完

### 发生了什么

Backend 和 Frontend Agent 并行开发 F13/F12，没有共享 API contract。两边各自基于 PRD 理解独立实现：
- 字段命名不一致: `level` vs `analysis_level`, `text` vs `value`, `highlight` vs `score`
- 请求结构不一致: 前端发 `{ layers }` 后端要 `{ analysis_result: str }`
- URL pattern 不一致: `?project_id=` vs `/{id}/export`
- 类型不一致: 前端发 `string[]` (names), 后端要 `UUID[]` (IDs)

### 为什么没早发现

1. **tsc 通过 ≠ 运行时正确**: TypeScript 只验证前端内部类型一致性，不验证和后端 schema 是否对齐
2. **QA Round 1 只修了表层**: URL path 和顶层字段名容易看出来，请求 body 内部字段名需要逐字段比对
3. **没有集成测试**: 只有各自的 import check，没有端到端请求验证

### Quality Gate 可以做什么

1. **Contract-first**: Team Lead 分发任务前先定义共享 API contract (OpenAPI/JSON Schema)
2. **Schema 自动对齐**: Backend 输出 OpenAPI → 自动生成 Frontend TypeScript 类型
3. **自动化契约检查**: CI 中对比 FastAPI 的 `/openapi.json` 和前端 service 层类型定义
4. **QA 增加逐字段验证步骤**: 不能只看 "endpoint 存在"，要比对每个字段的名称、类型、required/optional

### 量化

| 指标 | 值 |
|------|-----|
| Bug 数量 | 8 |
| 修复轮次 | 2 (QA 发现 6 + 人工审查 2) |
| 涉及文件 | 2 (services/analyzer.ts + comparison/page.tsx + analysis/page.tsx) |
| 根因类别 | 并行开发无共享契约 |
| 可自动化检测 | 是 — OpenAPI schema diff |
