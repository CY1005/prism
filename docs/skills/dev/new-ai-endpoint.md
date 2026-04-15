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
