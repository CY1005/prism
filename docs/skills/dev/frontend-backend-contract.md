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

## 验证

- [ ] Pydantic Schema 字段与 TypeScript 类型一一对应（逐字段核对）
- [ ] snake_case（后端）↔ camelCase（前端）转换正确
- [ ] 前端组件未自定义响应类型，全部从 `services/` 导入
- [ ] 未绕过 Server Action 直接 fetch 后端 API
- [ ] JSONB 字段渲染前有 `if (!Array.isArray(x)) return fallback` 防御检查
- [ ] `tsc --noEmit` 零错误

## 执行检查点

1. **后端 Schema 定义完成后**：`python -c "from api.schemas.xxx import *; print('OK')"` 确认可导入
2. **前端类型定义完成后**：`tsc --noEmit` 确认类型对齐，逐字段与 Pydantic 对比
3. **Server Action 完成后**：确认没有绕过 Server Action 直接 fetch，确认有 `"use server"` 标记
4. **组件渲染完成后**：确认 JSONB 数据在渲染前做了结构校验

## 改进触发器

- 发现新的契约漂移 Bug → 追加到"陷阱"段并补充对应验证项
- 前后端通信方式变更（如新增 WebSocket / GraphQL）→ 更新步骤
- 验证项发现遗漏（字段不匹配类 Bug 漏网）→ 追加到"验证"段
- 本 Skill 连续 3 次使用无新发现 → 标记为"稳定"
- 上次更新超过 30 天且有新 Bug 属于本模式 → 强制 Review
