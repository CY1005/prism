---
name: frontend-backend-contract
description: 前后端联调功能的标准流程，确保契约一致
trigger: 功能涉及前端调后端 API
related_bugs: [BUG-020, BUG-054, BUG-055, BUG-056, BUG-057, BUG-058, BUG-059, BUG-060, BUG-061, BUG-062, BUG-083]
last_updated: 2026-04-15
---

# Skill: 新增前后端联调功能

触发：功能涉及前端调后端 API

```
1. 后端先行：定义 Pydantic Schema（Contract-first）
2. 前端跟进：TypeScript 类型必须与 Pydantic 字段一一对应
3. 字段名规则：后端 snake_case → 前端 camelCase
4. 验证对齐：逐字段检查，不靠"看起来差不多"
```

陷阱（PAIN-001，8 个 Bug 的根因）：
- **绕过 Server Action 直接 fetch 是禁止的**（BUG-054~062 的共同根因）
- 前端组件**不得自定义响应类型**，必须从 `services/` 导入（BUG-055~058）
- JSONB 字段的前端渲染**必须校验结构**（BUG-020、BUG-083）
