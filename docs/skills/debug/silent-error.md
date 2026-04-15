---
name: silent-error
description: 错误处理缺失/静默吞错排错
trigger: 操作无反应 / 用户不知道成功还是失败 / 500 错误无提示
related_bugs: [BUG-077, BUG-078, BUG-081, BUG-084, BUG-086, BUG-098, BUG-099]
last_updated: 2026-04-15
---

# 模式 #5：错误处理缺失 / 静默吞错

症状：操作无反应 / 用户不知道成功还是失败 / 500 错误无提示

```
排查路径：
1. catch 块是否吞掉了错误？→ 至少 console.error + 用户提示（BUG-098）
2. 成功操作是否有视觉反馈？→ toast/状态变化（BUG-099）
3. DB 异常是否返回 503？→ 包装 try-except（BUG-081）
4. 非法参数是否返回 422 而非 500？→ UUID 格式校验（BUG-077）
5. 软删除后查询是否过滤？→ WHERE deleted_at IS NULL（BUG-078）
```

来源：BUG-077、BUG-078、BUG-081、BUG-084、BUG-086、BUG-098、BUG-099
