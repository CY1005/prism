---
name: new-ai-endpoint
description: 新增一个调用 LLM 的 AI 分析类端点的标准流程
trigger: 需要新增一个调用 LLM 的分析功能
related_bugs: [BUG-043, BUG-044, BUG-045, BUG-046, BUG-047, BUG-048, BUG-049, BUG-050, BUG-051, BUG-052, BUG-053, BUG-054, BUG-055, BUG-056, BUG-057, BUG-058, BUG-059, BUG-060, BUG-061, BUG-062, BUG-075, BUG-080, BUG-095]
last_updated: 2026-04-15
---

# Skill: 新增 AI 分析类端点

触发：需要新增一个调用 LLM 的分析功能

```
1. api/schemas/xxx.py    — 定义 Request/Response Pydantic 模型
2. api/services/xxx.py   — 业务逻辑，调用 get_provider(ai_provider, api_key)
3. api/routers/xxx.py    — 路由，SSE 流式用 StreamingResponse
4. api/main.py           — app.include_router() 注册，选对 prefix
5. web/src/services/xxx.ts  — 前端 API 客户端（fetchJson/postJson）
6. web/src/actions/xxx.ts   — Server Action，标记 "use server"
7. web/src/app/.../page.tsx — 页面组件
```

陷阱（来自 BUG-043~062）：
- SSE 格式必须是 `event: chunk\ndata: {...}\n\n`，不是纯 JSON
- Provider 降级：无 API key → MockProvider，**不要报错**
- 大文本截断：AI prompt 中每个文档限 5000 字符
- **Server Action 必须加认证**：`const user = await requireAuth()`（BUG-095）
- **新端点必须加认证**：`Depends(require_user)`（BUG-075、BUG-080）

## 验证

- [ ] `tsc --noEmit` 零错误
- [ ] `curl localhost:8001/docs` 能看到新端点的 Swagger 文档
- [ ] 无 API key 时返回 MockProvider 结果，不报错
- [ ] 有 API key 时 SSE 流式正常返回 `event: chunk\ndata: {...}\n\n` 格式
- [ ] Server Action 未登录时返回 401
- [ ] 新 FastAPI 端点未认证时返回 401（非 422）
- [ ] 大文本输入（>5000 字符）正确截断，不崩溃
- [ ] `api/main.py` 中已注册 `app.include_router()`

## 执行检查点

1. **Pydantic Schema 定义完成后**：`python -c "from api.schemas.xxx import *; print('OK')"` 确认可导入
2. **Service 层完成后**：确认调用了 `get_provider(ai_provider, api_key)` 而非直接实例化 Provider
3. **Router 注册完成后**：`curl localhost:8001/docs` 确认端点出现在 Swagger
4. **前端 API 客户端完成后**：确认使用 `services/` 下的 fetchJson/postJson，未绕过 Server Action
5. **Server Action 完成后**：确认首行有 `const user = await requireAuth()`

## 改进触发器

- 发现了新的 AI 端点陷阱（新 Bug 涉及 SSE/Provider/认证）→ 追加到"陷阱"段
- AI Provider 体系变更（新增 Provider 类型或接口变化）→ 更新步骤和陷阱
- 验证项发现遗漏（线上 Bug 本应在验证阶段拦住）→ 追加到"验证"段
- 本 Skill 连续 3 次使用无新发现 → 标记为"稳定"
- 上次更新超过 30 天且有新 Bug 属于本模式 → 强制 Review
