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

## 验证

- [ ] 新端点有 `Depends(require_user)` 注入
- [ ] Server Action 首行有 `const user = await requireAuth()`
- [ ] 写操作有 `checkProjectAccess(userId, projectId, 'editor')` 权限检查
- [ ] 未认证请求返回 401（非 422）
- [ ] 用 Viewer 角色执行所有写操作，全部被拒绝
- [ ] 登录失败 5 次后账户锁定 15 分钟

## 执行检查点

1. **新端点创建后**：立即检查是否添加了认证依赖，不要等联调时才发现
2. **权限检查添加后**：用 Viewer 角色调一次写接口，确认返回 403
3. **修复完成后**：未登录状态访问该端点，确认返回 401 而非 500 或 422

## 改进触发器

- 发现新的权限绕过方式 → 追加到排查路径
- 认证体系变更（如 Token 机制、角色层级调整）→ 全面 Review 排查路径
- 验证项发现遗漏（线上发现未认证可访问）→ 追加到"验证"段
- 本 Skill 连续 3 次使用无新发现 → 标记为"稳定"
- 上次更新超过 30 天且有新 Bug 属于本模式 → 强制 Review
