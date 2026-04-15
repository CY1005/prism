---
name: stale-api
description: AI 生成代码使用过时 API 排错
trigger: TypeScript 编译错误 / Property does not exist / 运行时类型不匹配
related_bugs: [BUG-027, BUG-028, BUG-029, BUG-030, BUG-031, BUG-032, BUG-087]
last_updated: 2026-04-15
---

# 模式 #3：AI 生成代码使用过时 API

症状：TypeScript 编译错误 / Property does not exist / 运行时类型不匹配

```
排查路径：
1. 检查 shadcn/ui 组件：是否用了 asChild？（禁止）
2. 检查 Zod：error.errors → error.issues（v3→v4 breaking change）
3. 检查 Select：onValueChange 签名是否含 null（base-ui 新签名）
4. 检查 Next.js：params 是否需要 await（App Router 变更）
5. 通用规则：AI 生成 UI 代码后**立即跑 tsc --noEmit**
```

来源：BUG-027~032（46个编译错误）、BUG-087

## 验证

- [ ] `tsc --noEmit` 零错误（修复后立即运行）
- [ ] 未使用 `asChild` prop（`grep -r "asChild" web/src/` 应为空）
- [ ] Zod 错误处理使用 `error.issues` 而非 `error.errors`
- [ ] Select 组件 `onValueChange` 签名符合当前 base-ui 版本
- [ ] Next.js App Router 的 `params` 已正确 `await`
- [ ] 修改的 UI 组件在浏览器中正常渲染，无运行时类型错误

## 执行检查点

1. **AI 生成代码后**：立即跑 `tsc --noEmit`，不要等写完整个功能
2. **使用 shadcn 组件前**：检查 `node_modules/` 中该组件的实际 API，不信训练数据
3. **修复编译错误后**：在浏览器中确认 UI 正常，编译通过不等于运行正常

## 改进触发器

- 发现新的过时 API（框架升级导致 breaking change）→ 追加到排查路径
- shadcn/ui 或 Next.js 大版本升级 → 全面 Review 排查路径
- 验证项发现遗漏 → 追加到"验证"段
- 本 Skill 连续 3 次使用无新发现 → 标记为"稳定"
- 上次更新超过 30 天且有新 Bug 属于本模式 → 强制 Review
