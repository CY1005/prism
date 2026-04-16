# 业务错误码治理（Error Code Governance）

> **单一真相源**：`web/src/lib/error-codes.ts`
> **配套工具**：`web/src/lib/errors.ts`（抛错 + Action 包装）/ `web/src/lib/client-error.ts`（前端分发）
> **触发场景**：Server Action / 业务 Service 抛错、前端处理 ActionResult

## 为什么要有

历史上 Prism 抛错方式两种并存：
1. `throw Errors.UNAUTHORIZED`（规范）
2. `throw new Error("UNAUTHORIZED")`（不规范，原生 Error）

后者在 `actionError()` 的 `instanceof AppError` 检查中判为 false，**被降级为 `INTERNAL_ERROR / warning`**，导致前端看到"操作失败"而不是"请先登录"。典型案例见 `docs/testing/bugs/bug-log.md` BUG-110。

## 规则

### 后端抛错（严格）

| 场景 | 做法 |
|------|------|
| 有预定义的错误 | `throw Errors.UNAUTHORIZED` 等 |
| 需要自定义 message | `throw new AppError(msg, severity, ErrorCode.XXX, statusCode)` |
| 新错误语义 | 先在 `error-codes.ts` 加 code → 再在 `errors.ts` 加 `Errors.XXX` → 再使用 |
| **禁止** | `throw new Error("...")` 在 `src/lib` / `src/actions` / `src/services` 下 |

### 前端处理（推荐）

所有 Server Action 返回的 `ActionResult<T>` 都应走 `handleActionResult(result, router)`：

```tsx
const result = await someAction(data);
const handled = handleActionResult(result, router, { currentPath: pathname });

if (handled.ok) {
  // 成功分支，拿 handled.data
} else if (!handled.autoHandled) {
  // UNAUTHORIZED 已自动跳 /login，其余 code 由调用方决定 UI（setError/toast 等）
  setError(handled.message);
}
```

### Code 列表

见 `web/src/lib/error-codes.ts`。按类别划分：

| 类别 | codes |
|------|-------|
| 认证/授权 | UNAUTHORIZED, FORBIDDEN, ACCOUNT_DISABLED, ACCOUNT_LOCKED |
| 数据冲突 | VERSION_CONFLICT, DUPLICATE_ENTRY |
| 业务校验 | VALIDATION_ERROR, NOT_FOUND |
| 外部服务 | AI_UNAVAILABLE, AI_TIMEOUT, NETWORK_ERROR |
| 系统/配置 | CONFIG_MISSING, INTERNAL_ERROR |
| 成功提示 | SAVE_SUCCESS |

### Severity 语义

- **blocking**：阻塞用户流程，必须处理（登录、权限、冲突、校验）
- **warning**：可重试的外部/系统问题（AI 超时、网络）
- **info**：提示类（保存成功）

## 新错误落地检查

新增一个 code 时走这 4 步：

1. [ ] `error-codes.ts` 加常量
2. [ ] `errors.ts` 加 `Errors.XXX` 或 factory
3. [ ] 需要前端特殊处理？→ 在 `client-error.ts` 的 switch 加分支
4. [ ] 文档表格同步更新（本文件 + `bug-log.md` 触发记录）

## Agent 提示词约束

所有 Backend / Frontend Agent 的任务 AC 里必须包含：

> **错误抛出规范**：业务错误必须 `throw Errors.XXX` 或 `new AppError(..., ErrorCode.XXX, ...)`。
> 禁止在 `src/lib | src/actions | src/services` 下使用 `throw new Error(...)`。
> 新错误语义必须先在 `error-codes.ts` 加 code。

## 验证

```bash
# 扫描不合规的抛错
grep -rn "throw new Error(" web/src/lib web/src/actions web/src/services --include="*.ts"
# 期望：零结果
```

## 历史

- 2026-04-17：v1 落地（BUG-110 修复驱动）。code 常量集中到 `error-codes.ts`，`handleActionResult` helper 上线，`projects/new/page.tsx` 作为示范接入。
- TODO：其他 20+ 调用 Server Action 的页面逐步迁移到 `handleActionResult`（渐进式，不阻塞新功能）。
