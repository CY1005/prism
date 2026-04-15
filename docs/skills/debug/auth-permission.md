---
name: auth-permission
description: 认证/权限漏洞排错
trigger: 未登录可访问 / 低权限可执行高权限操作 / 401 变 422
related_bugs: [BUG-075, BUG-076, BUG-080, BUG-095]
last_updated: 2026-04-15
---

# 模式 #4：认证 / 权限漏洞

症状：未登录可访问 / 低权限可执行高权限操作 / 401 变 422

```
排查路径：
1. 新端点是否加了 Depends(require_user)？（BUG-075）
2. Server Action 是否调了 requireAuth()？（BUG-095）
3. 权限检查是否用了 checkProjectAccess(userId, projectId, 'editor')？（BUG-076）
4. 认证失败是否返回 401 而非 422？（BUG-080）
5. 用 Viewer 角色测试一遍所有写操作
```

来源：BUG-075、BUG-076、BUG-080、BUG-095
