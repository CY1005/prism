# Bug 模式索引

> 基于 99 个 Bug 的模式统计，5 大分类覆盖 ~80% 的 Bug。

## Top 5 Bug 模式

| # | 模式 | 典型 Bug | 占比 | 排错 Skill |
|---|------|---------|------|-----------|
| 1 | **前后端契约漂移** | BUG-043~050, BUG-054~062, BUG-066, BUG-070, BUG-082 | ~28% | [contract-drift](../../skills/debug/contract-drift.md) |
| 2 | **空状态/边界值未处理** | BUG-020~026, BUG-033~036, BUG-067, BUG-072, BUG-092 | ~15% | [empty-state](../../skills/debug/empty-state.md) |
| 3 | **AI 生成代码过时 API** | BUG-027~032, BUG-087 | ~10% | [stale-api](../../skills/debug/stale-api.md) |
| 4 | **认证/权限漏洞** | BUG-075, BUG-076, BUG-080, BUG-095 | ~4% | [auth-permission](../../skills/debug/auth-permission.md) |
| 5 | **错误处理缺失/静默吞错** | BUG-077, BUG-078, BUG-081, BUG-084, BUG-086, BUG-098, BUG-099 | ~7% | [silent-error](../../skills/debug/silent-error.md) |

## 文件说明

- **bug-log.md** — 所有 Bug 的主记录（BUG-001 ~ BUG-099+），包含现象、根因、修复
- **bug-fix-log.md** — 修复过程的详细记录
- **rca-final.md** — 根因分析终版报告，系统性总结
- **pain-log.md** — 开发痛点日志，为工具/流程改进积累素材
