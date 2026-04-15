# Skills 总索引

> 从 Prism 99 个 Bug 和实际开发经验中提炼的程序性技能。按需加载，触发时读对应文件。

## 开发类（Dev Skills）

| Skill | 文件 | 触发条件 | 验证项数 | 状态 |
|-------|------|----------|---------|------|
| 新增 AI 分析类端点 | [dev/new-ai-endpoint.md](dev/new-ai-endpoint.md) | 需要新增一个调用 LLM 的分析功能 | 8 | 活跃 |
| 新增前后端联调功能 | [dev/frontend-backend-contract.md](dev/frontend-backend-contract.md) | 功能涉及前端调后端 API | 6 | 活跃 |
| 新增数据库表 | [dev/new-db-table.md](dev/new-db-table.md) | 需要新增一张表 | 7 | 活跃 |
| 开发闭环协议 | [dev/dev-closed-loop.md](dev/dev-closed-loop.md) | 每次开发任务开始/结束时 | 7 | 活跃 |

## 排错类（Debug Skills）

| Skill | 文件 | 症状匹配 | 验证项数 | 状态 |
|-------|------|----------|---------|------|
| 前后端契约漂移 | [debug/contract-drift.md](debug/contract-drift.md) | API 500 / 前端 undefined / 字段缺失 | 7 | 活跃 |
| 空状态/边界值未处理 | [debug/empty-state.md](debug/empty-state.md) | 页面空白 / Cannot read properties of undefined | 7 | 活跃 |
| AI 生成代码过时 API | [debug/stale-api.md](debug/stale-api.md) | TypeScript 编译错误 / Property does not exist | 6 | 活跃 |
| 认证/权限漏洞 | [debug/auth-permission.md](debug/auth-permission.md) | 未登录可访问 / 权限绕过 | 6 | 活跃 |
| 错误处理缺失 | [debug/silent-error.md](debug/silent-error.md) | 操作无反应 / 静默吞错 | 7 | 活跃 |

## 使用方式

1. **开发前**：读 dev-closed-loop 的 Phase 0 Preflight Checklist
2. **开发中**：根据任务类型读对应 Dev Skill
3. **遇到 Bug**：匹配症状后读对应 Debug Skill 的排查路径
4. **开发后**：执行 dev-closed-loop 的 Phase 4 YWT 反思
