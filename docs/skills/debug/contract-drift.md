---
name: contract-drift
description: 前后端契约漂移排错（出现频率最高的 Bug 模式）
trigger: API 返回 500 / 前端 undefined / 字段缺失
related_bugs: [BUG-043, BUG-044, BUG-045, BUG-046, BUG-047, BUG-048, BUG-049, BUG-050, BUG-054, BUG-055, BUG-056, BUG-057, BUG-058, BUG-059, BUG-060, BUG-061, BUG-062, BUG-066, BUG-070, BUG-082]
last_updated: 2026-04-15
---

# 模式 #1：前后端契约漂移（出现频率最高）

症状：API 返回 500 / 前端 undefined / 字段缺失

```
排查路径：
1. 比对 api/schemas/ 的 Pydantic 字段 vs web/src/services/ 的 TS 类型
2. 检查 snake_case ↔ camelCase 转换
3. 检查前端是否绕过 Server Action 直接 fetch（禁止行为）
4. 检查前端组件是否自定义了响应类型（应从 services/ 导入）
5. 检查 JSONB 字段的结构是否一致
```

来源：BUG-043~050（8个）、BUG-054~062（9个）、BUG-066、BUG-070、BUG-082
