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
