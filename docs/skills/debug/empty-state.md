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

## 验证

- [ ] 空数组场景：传入 `[]` 时组件显示 fallback UI，不崩溃
- [ ] null/undefined 场景：数据为 null 时组件不报 `Cannot read properties of undefined`
- [ ] useTransition 期间：切换选中项时旧数据与新 UI 不错配
- [ ] JSONB content 渲染前有 `if (!Array.isArray(x)) return fallback` 检查
- [ ] Server Action 正确 await，async/await 链完整
- [ ] `revalidatePath()` 在数据变更后调用，ISR 正确刷新
- [ ] 新建项目/节点后立即查看，页面不空白

## 执行检查点

1. **定位到空白页面后**：先检查浏览器控制台有无 `Cannot read properties` 错误
2. **找到数据源后**：`console.log` 确认数据是空数组还是 undefined（两者处理方式不同）
3. **修复完成后**：分别用空数据和有数据两种场景各测一次

## 改进触发器

- 发现新的空状态变体（如 Map/Set 类型、分页边界）→ 追加到排查路径
- React/Next.js 数据流变更（如新的 Suspense 模式）→ 更新排查路径
- 验证项发现遗漏 → 追加到"验证"段
- 本 Skill 连续 3 次使用无新发现 → 标记为"稳定"
- 上次更新超过 30 天且有新 Bug 属于本模式 → 强制 Review
