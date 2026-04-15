# Prism Testing Progress Checkpoint

**Snapshot**: 2026-04-14 23:55 JST
**Branch**: master

---

## Test Pass Rate

**155 / 155 (100%)** — 全量扫尾完成

| Status | Count | Details |
|--------|-------|---------|
| PASS   | 155   | 全部测试点通过（含原 SKIP/FAIL/ENV 补测） |
| FAIL   |   0   | 无 |
| SKIP   |   0   | 全部解除 |
| TOTAL  | 155   | Full v0.4 + v1.x scope (F1-F20) |

---

## 本次扫尾工作

### 测试验证 (6 个 SKIP/FAIL → 全部 PASS)

| TP-ID | 原状态 | 操作 | 结果 |
|-------|--------|------|------|
| TP-007 | SKIP | 通过 `/api/snapshot/save` 写入 competitor 维度 | PASS |
| TP-014 | FAIL (test-design) | 补充 project_id 查询参数 | PASS |
| TP-035 | FAIL (test-design) | 按实际 API 用 email 邀请成员 | PASS |
| TP-063 | SKIP | `POST /api/comparison/generate` 生成数据后编辑 | PASS |
| TP-064 | SKIP | 导出返回 Markdown 表格 | PASS |
| TP-065 | SKIP | backfill 写入 CompetitorReference | PASS |

### Bug 修复 (2 个新发现 + 3 个确认已修复)

| BUG | 严重度 | 状态 |
|-----|--------|------|
| BUG-083 (新) | High | 已修复 — hierarchy_labels dict→list 序列化 |
| BUG-084 (新) | Medium | 已修复 — backfill 无效 competitor_id 校验 |
| BUG-079 | Low | 确认先前已修复 |
| BUG-081 | Low | 确认先前已修复 |
| BUG-082 | Low | 确认先前已修复 |

### 产出文档

- `docs/testing/rca-final.md` — 根因分析报告
- `docs/testing/bug-log.md` — 更新 BUG-079~084 状态
- `docs/testing/bug-fix-log.md` — 更新修复设计记录

---

## Modified Files

- `api/services/project_crud.py` — 新增 `_normalize_hierarchy_labels()`
- `api/routers/projects.py` — 调用归一化函数
- `api/routers/comparison.py` — backfill competitor 存在性校验
- `docs/testing/bug-log.md` — BUG-083/084 新增 + 079/081/082 状态更新
- `docs/testing/bug-fix-log.md` — 扫尾修复记录
- `docs/testing/rca-final.md` — RCA 报告
- `docs/testing/progress-checkpoint.md` — 本文件
