# Bug 模式索引

> 基于 99 个 Bug 的模式统计，5 大分类覆盖 ~80% 的 Bug。
> 每个模式链接到对应的排错 Skill，形成 Bug → Skill 双向导航。

## Top 5 Bug 模式统计

| # | 模式 | Bug 数量 | 占比 | 排错 Skill | 验证项数 |
|---|------|---------|------|-----------|---------|
| 1 | **前后端契约漂移** | 20 | ~28% | [contract-drift](../../skills/debug/contract-drift.md) | 7 |
| 2 | **空状态/边界值未处理** | 14 | ~15% | [empty-state](../../skills/debug/empty-state.md) | 7 |
| 3 | **AI 生成代码过时 API** | 7 | ~10% | [stale-api](../../skills/debug/stale-api.md) | 6 |
| 4 | **认证/权限漏洞** | 4 | ~4% | [auth-permission](../../skills/debug/auth-permission.md) | 6 |
| 5 | **错误处理缺失/静默吞错** | 7 | ~7% | [silent-error](../../skills/debug/silent-error.md) | 7 |

## 模式详情

### 模式 #1：前后端契约漂移（~28%，最高频）

**典型 Bug**：BUG-043~050, BUG-054~062, BUG-066, BUG-070, BUG-082
**症状**：API 返回 500 / 前端 undefined / 字段缺失
**排错 Skill**：[contract-drift.md](../../skills/debug/contract-drift.md)
**预防 Skill**：[frontend-backend-contract.md](../../skills/dev/frontend-backend-contract.md)

### 模式 #2：空状态/边界值未处理（~15%）

**典型 Bug**：BUG-020~026, BUG-033~036, BUG-067, BUG-072, BUG-092
**症状**：页面空白 / Cannot read properties of undefined
**排错 Skill**：[empty-state.md](../../skills/debug/empty-state.md)

### 模式 #3：AI 生成代码过时 API（~10%）

**典型 Bug**：BUG-027~032, BUG-087
**症状**：TypeScript 编译错误 / Property does not exist
**排错 Skill**：[stale-api.md](../../skills/debug/stale-api.md)

### 模式 #4：认证/权限漏洞（~4%）

**典型 Bug**：BUG-075, BUG-076, BUG-080, BUG-095
**症状**：未登录可访问 / 低权限可执行高权限操作
**排错 Skill**：[auth-permission.md](../../skills/debug/auth-permission.md)
**预防 Skill**：[new-ai-endpoint.md](../../skills/dev/new-ai-endpoint.md)（认证检查步骤）

### 模式 #5：错误处理缺失/静默吞错（~7%）

**典型 Bug**：BUG-077, BUG-078, BUG-081, BUG-084, BUG-086, BUG-098, BUG-099
**症状**：操作无反应 / 用户不知道成功还是失败
**排错 Skill**：[silent-error.md](../../skills/debug/silent-error.md)

## 导航

- **遇到 Bug** → 匹配上方症状 → 读对应排错 Skill 的排查路径
- **开发新功能** → 读对应 Dev Skill 的验证段 → 提前拦截 Bug
- **Skills 总索引** → [docs/skills/INDEX.md](../../skills/INDEX.md)

## 文件说明

- **bug-log.md** — 所有 Bug 的主记录（BUG-001 ~ BUG-099+），包含现象、根因、修复
- **bug-fix-log.md** — 修复过程的详细记录
- **rca-final.md** — 根因分析终版报告，系统性总结
- **pain-log.md** — 开发痛点日志，为工具/流程改进积累素材
