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

## 验证

- [ ] Pydantic Schema 字段名与 TypeScript 类型逐一核对
- [ ] snake_case ↔ camelCase 转换无遗漏
- [ ] 前端未绕过 Server Action 直接 fetch（`grep -r "fetch(" web/src/components/` 无直连后端调用）
- [ ] 前端组件未自定义响应类型（`grep -r "interface.*Response" web/src/components/` 应为空）
- [ ] JSONB 字段渲染前有结构校验（`if (!Array.isArray(x)) return fallback`）
- [ ] `tsc --noEmit` 零错误
- [ ] API 返回 200 且前端正确渲染数据（非 undefined / 非空白）

## 执行检查点

1. **定位到可疑字段后**：同时打开 Pydantic Schema 和 TypeScript 类型文件，逐字段对比
2. **修复字段名后**：`tsc --noEmit` 确认编译通过
3. **修复完成后**：用真实数据（非空）调一次 API，确认前端正确渲染

## 改进触发器

- 发现新的契约漂移变体（如嵌套对象、枚举值不匹配）→ 追加到排查路径
- 前后端序列化方式变更 → 更新排查路径第 2 步
- 验证项发现遗漏 → 追加到"验证"段
- 本 Skill 连续 3 次使用无新发现 → 标记为"稳定"
- 上次更新超过 30 天且有新 Bug 属于本模式 → 强制 Review
