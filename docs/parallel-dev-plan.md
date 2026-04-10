# Prism 前后端并行开发协调计划

> 创建时间：2026-04-10
> 协调者：主 Claude Code session
> 当前版本：v0.0.1 → v0.0.2 (前端) + v0.1.0 骨架 (后端)

---

## 一、当前状态

| Session | 技术栈 | 已完成 | 代码位置 |
|---------|--------|--------|----------|
| 前端 | Next.js 16 + shadcn/ui + Drizzle | F3模块树 + F4档案页基础版 + CRUD Server Actions | `web/` |
| 后端 | FastAPI + SQLAlchemy | health + search router 骨架 | `api/` |

---

## 二、阶段目标（Sprint 1: v0.0.2）

### 前端 Session 目标

按 roadmap Week 2，聚焦 **F4 完整版 + F5 时间线**：

| # | 任务 | AC 概要 | 优先级 |
|---|------|---------|--------|
| FE-1 | F4 档案页 8 个维度区块完整渲染 | 8 个维度区块全部可展示、可折叠 | P0 |
| FE-2 | 空状态引导 | 空维度卡片显示引导文案，点击直接进入编辑 | P0 |
| FE-3 | 信息完善度进度条 | 基于已填维度/总维度计算百分比 | P1 |
| FE-4 | F5 版本演进时间线 | 版本记录 CRUD + 时间线可视化 | P1 |
| FE-5 | 为后端预留 API 调用层 | 创建 `services/analyzer.ts`，封装对 FastAPI 的 HTTP 调用 | P1 |

**交付标准**：档案页 8 维度完整可用，时间线可视，有 analyzer 调用层骨架。

### 后端 Session 目标

按 ADR-010，搭建 **FastAPI 分析服务完整骨架 + 第一个可用 API**：

| # | 任务 | AC 概要 | 优先级 |
|---|------|---------|--------|
| BE-1 | 项目结构规范化 | routers/services/schemas 三层分离，pytest 测试骨架 | P0 |
| BE-2 | 数据库连接 + 现有表只读访问 | SQLAlchemy 能读 Drizzle 创建的 nodes/projects 表 | P0 |
| BE-3 | POST /analyze — 需求影响范围分析 | 输入需求文本 → 返回影响的模块列表 + 理由（先 mock，再接 Claude SDK） | P0 |
| BE-4 | POST /test-points — 测试点生成 | 输入需求+模块信息 → 返回测试点列表（复用 test-workflow Skill 逻辑） | P1 |
| BE-5 | API 文档 + Pydantic schema | 所有 endpoint 有 OpenAPI 文档，request/response 有 Pydantic 模型 | P1 |

**交付标准**：`docker compose up` 后 FastAPI 服务可访问，/analyze 能返回结构化结果。

---

## 三、API 契约（前后端对齐的接口定义）

前后端必须对齐以下接口，**后端先定义 schema，前端按 schema 实现调用层**：

### 3.1 POST /analyze — 需求影响范围分析

```json
// Request
{
  "project_id": "uuid",
  "requirement_text": "string",
  "context": {
    "include_modules": ["uuid"] // 可选，限定分析范围
  }
}

// Response
{
  "affected_modules": [
    {
      "node_id": "uuid",
      "node_name": "string",
      "node_path": "string",
      "impact_level": "high | medium | low",
      "reason": "string"
    }
  ],
  "completeness_issues": ["string"],
  "suggestions": ["string"],
  "metadata": {
    "model": "string",
    "tokens_used": 0,
    "analysis_time_ms": 0
  }
}
```

### 3.2 POST /test-points — 测试点生成

```json
// Request
{
  "project_id": "uuid",
  "requirement_text": "string",
  "affected_modules": ["uuid"], // 来自 /analyze 结果
  "test_depth": "smoke | standard | comprehensive"
}

// Response
{
  "test_points": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "priority": "P0 | P1 | P2",
      "category": "functional | boundary | exception | performance",
      "related_module": "uuid"
    }
  ],
  "coverage_summary": {
    "total": 0,
    "by_priority": {"P0": 0, "P1": 0, "P2": 0},
    "by_category": {}
  }
}
```

### 3.3 GET /health — 健康检查（已有）

```json
// Response
{
  "status": "ok",
  "version": "0.1.0",
  "db_connected": true
}
```

---

## 四、同步规则

### 4.1 Schema 变更协议

```
Drizzle (前端) 是 schema 的唯一真相源
  → 前端做 migration
  → 后端 SQLAlchemy 模型跟随更新，不做 migration
  → 变更时在 bulletin.md 留言通知对方
```

### 4.2 同步检查点

| 检查点 | 时机 | 内容 |
|--------|------|------|
| CP-1 | 后端 BE-5 完成后 | 前端确认 API schema 可对接，调整 `analyzer.ts` |
| CP-2 | 前端 FE-5 完成后 | 后端确认前端调用方式符合预期 |
| CP-3 | 双方各自模块完成后 | 协调者做集成测试 |

### 4.3 通信机制

两个 session 通过 `/root/cy/shared/bulletin.md` 异步通信：
- Schema 变更 → 必须留言
- API 契约变更 → 必须留言并等对方确认
- 阻塞问题 → 留言 + @协调者

---

## 五、集成测试计划（协调者执行）

### 5.1 模块级测试（每个任务完成后）

**前端模块测试：**
- [ ] FE-1: 打开档案页，8 个维度区块全部渲染，折叠/展开正常
- [ ] FE-2: 新建空节点，每个维度显示引导文案，点击可编辑
- [ ] FE-3: 填写 3/8 维度，进度条显示 37.5%
- [ ] FE-4: 为功能项添加 3 个版本记录，时间线正确排序显示
- [ ] FE-5: `analyzer.ts` 能发起 HTTP 请求到 localhost:8001

**后端模块测试：**
- [ ] BE-1: pytest 能跑通，目录结构符合规范
- [ ] BE-2: FastAPI 能读到 Drizzle 创建的 nodes 数据
- [ ] BE-3: POST /analyze 返回结构化 JSON，符合契约 schema
- [ ] BE-4: POST /test-points 返回测试点列表
- [ ] BE-5: /docs 页面能看到所有 endpoint 文档

### 5.2 集成测试（CP-3 同步点）

| 场景 | 步骤 | 预期 |
|------|------|------|
| E2E-1: 需求分析全链路 | 前端输入需求 → 调 /analyze → 展示影响模块 | 前端正确渲染后端返回的分析结果 |
| E2E-2: 测试点生成全链路 | 选择影响模块 → 调 /test-points → 展示测试点 | 测试点列表可展示、可录入档案页 |
| E2E-3: 服务隔离 | 关闭 FastAPI → 前端 CRUD 正常 | 分析功能不可用不影响基础功能 |
| E2E-4: Docker 一键启动 | `docker compose up` → 访问前端 → 触发分析 | 全链路跑通 |

### 5.3 测试工具

```bash
# 后端 API 直测
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{"project_id": "...", "requirement_text": "新增支付退款功能"}'

# 前端启动
cd web && npm run dev

# 全栈启动
docker compose up

# 后端单测
cd api && pytest -v
```

---

## 六、风险与缓解

| 风险 | 缓解 |
|------|------|
| 两层 ORM schema 不同步 | Drizzle 是唯一源，变更必须 bulletin 通知 |
| API 契约变更导致对接失败 | 契约定义在本文档，变更需双方确认 |
| 后端 AI 服务依赖外部 API Key | 先用 mock 模式开发，有 key 后切换 |
| Docker 环境不一致 | 统一 docker-compose.yml，每次同步点验证 |
