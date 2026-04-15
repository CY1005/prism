---
name: empty-state
description: 空状态/边界值未处理排错
trigger: 页面空白 / Cannot read properties of undefined / 组件不渲染
related_bugs: [BUG-020, BUG-021, BUG-022, BUG-023, BUG-024, BUG-025, BUG-026, BUG-033, BUG-034, BUG-035, BUG-036, BUG-067, BUG-072, BUG-092]
last_updated: 2026-04-15
---

# 模式 #2：空状态 / 边界值未处理

症状：页面空白 / Cannot read properties of undefined / 组件不渲染

```
排查路径：
1. 数据是否为空数组/null/undefined？→ 加 fallback 渲染
2. useTransition 期间旧数据和新 UI 是否错配？→ 渲染前校验 selectedId
3. JSONB content 是否假设了结构？→ 开头加 if (!Array.isArray(x)) return
4. Server Action 是否正确 await？→ 检查 async/await 链
5. revalidatePath() 是否在变更后调用？→ 确认 ISR 刷新
```

来源：BUG-020~026、BUG-033~036、BUG-067、BUG-072、BUG-092
