# ADR-010: 混合架构 — CRUD 保持 Next.js，AI 分析层用 FastAPI

## Status: Accepted

## Context

Week 1 Build 使用 Next.js Server Actions 实现了全部 CRUD，已跑通。但北极星计划原定技术栈是 FastAPI + React + PostgreSQL（current-Prism.md 第10行），偏离发生在 4月3日 PRD 撰写时——AI 建议全栈 Next.js 更高效，但**没有对照面试需求评估**。

偏离的核心问题：
1. **面试叙事断裂**：AI Infra 测试岗要求 Python + FastAPI，Next.js 全栈对简历无加分
2. **技能线断裂**：线A（394 pytest 框架化）是 Python，线B（Prism）变成了纯 TypeScript，35% 精力不贡献 Python 经验
3. **AI 生态劣势**：v0.2 要接入的 AI 分析能力（需求分析、测试点生成、语义搜索），Python 生态远强于 Node.js

同时，已完成的 Next.js CRUD 层推翻重写不划算——代码跑通了，7 条工程经验记录了，IDAKE 闭环也走完了。

## Decision

**混合架构：Next.js 负责前端 + CRUD，FastAPI 负责 AI 分析微服务。**

```
┌──────────────────────────────────────────┐
│  Next.js 15 (前端 + CRUD)                │
│  ├── 页面渲染（SSR/RSC）                  │
│  ├── Server Actions（节点/维度/项目 CRUD） │
│  └── 调用 FastAPI 分析服务                │
│       ↓ HTTP API                         │
├──────────────────────────────────────────┤
│  FastAPI (AI 分析微服务)                  │
│  ├── POST /analyze — 需求影响范围分析      │
│  ├── POST /test-points — 测试点生成       │
│  ├── POST /compare — 竞品对比分析         │
│  ├── POST /embed — 文本向量化（v0.3）     │
│  └── GET  /search — 语义搜索（v0.3）     │
│       ↓ SQL                              │
├──────────────────────────────────────────┤
│  PostgreSQL 16 (共享数据库)               │
└──────────────────────────────────────────┘
```

### 具体边界

| 层 | 技术 | 职责 |
|---|------|------|
| 前端 + CRUD | Next.js 15 + Server Actions + Drizzle | 页面、节点/维度/项目管理、用户认证 |
| AI 分析 | FastAPI + SQLAlchemy + Claude SDK | 需求分析、测试点生成、竞品对比、语义搜索 |
| 数据库 | PostgreSQL 16 | 两者共享同一个数据库 |

### 通信方式

Next.js → FastAPI：HTTP API（JSON），走 `localhost:8000`，不对外暴露。

### Docker Compose 结构

```yaml
services:
  db:       # PostgreSQL 16
  web:      # Next.js (port 3001)
  analyzer: # FastAPI (port 8000, 内部)
```

## Alternatives

| 方案 | 否决原因 |
|------|----------|
| 全部改 FastAPI + React | 推翻已完成的 Week 1 工作，浪费 ~3 小时产出 |
| 维持纯 Next.js，Python 靠其他项目补 | Prism 占 35% 精力却不贡献 Python 经验，面试叙事空洞 |
| Next.js 内嵌 Python（child_process） | 架构恶心，不可维护 |

## Consequences

**好处：**
- 面试能讲"FastAPI 微服务 + Next.js 前端"的微服务架构，比纯全栈更有含量
- AI 分析层用 Python，可以直接复用已有的 test-workflow Skill
- Claude SDK / LangChain / sentence-transformers 全是 Python 优先
- 线A（pytest）和线B（FastAPI）共用 Python 技能线
- 已完成的 CRUD 层不受影响

**代价：**
- 多一个服务要维护（Docker Compose 管理）
- 两层 ORM（Drizzle + SQLAlchemy）共享一个数据库，schema 变更需要协调
- AI 分析的请求多一跳网络延迟（localhost，可忽略）

**风险控制：**
- Schema 变更统一由 Drizzle migration 管理，FastAPI 侧用 SQLAlchemy 只读 + 写分析结果
- FastAPI 服务不做 schema migration，只跟随 Drizzle 的表结构

## 时间线

- v0.0.1（已完成）：Next.js CRUD 骨架
- v0.0.2（Week 2）：Next.js 维度编辑体验优化
- **v0.1.0（Week 3-4）：FastAPI 分析服务骨架 + 第一个分析 API**
- v0.2.0（Month 2）：完整的 AI 分析能力

## 对 ADR-003 和 ADR-004 的影响

- **ADR-003（Server Actions vs API Routes）**：不变。Next.js 内部仍然 Server Actions 为主，FastAPI 是独立服务不是 API Route。
- **ADR-004（LLMProvider 接口）**：**修订**。原定在 TypeScript 中定义 LLMProvider 接口，现在改为在 FastAPI 侧用 Python 实现。Next.js 侧通过 HTTP 调用 FastAPI，不再直接实现 LLMProvider。
