# Session 1: Bug修复 + 启动服务

> 使用方式：新开 Claude Code session，粘贴下方 ``` 内的全部内容
> 3个Agent并行：前端修bug + 后端修bug + 启动服务
> 预估：200-250次工具调用，$15-20

---

```
Create a team with 3 agents to fix Prism's remaining bugs and start all services.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
Bug清单: docs/testing/bug-log.md（必须完整阅读，每个bug都有精确的file:line和修复建议）
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
工程陷阱记录: web/engineering-notes.md（编码前必读）
环境:
  - 启动数据库: cd /root/cy/prism && docker compose up -d
  - 前端 dev: cd web && PORT=3001 npm run dev
  - 后端 dev: cd api && uvicorn main:app --reload --port 8001
  - DB URL: postgres://prism:prism_dev_2026@127.0.0.1:5432/prism

当前bug状态（67个中53个已修复，14个未修复+1个遗留）:
  - BUG-054~062: F17 AI智能导入契约漂移（9个，全部待修）
  - BUG-063~067: F18 混合搜索（5个，全部Open）
  - F13 AC4 遗留: 关系图高亮跨页面通信未实现

核心教训（从之前12个Phase总结）:
  - 前端组件不得直接 fetch 后端 API，必须通过 web/src/actions/ 下的 Server Action
  - Server Action 是前后端契约的唯一桥梁，绕过它会丢失类型安全+认证+权限校验
  - 修完后必须 tsc --noEmit 验证零新增错误

## Agent 1 — 前端修复 (model: sonnet)

你负责修复前端相关的 bug。修复前必须完整阅读 docs/testing/bug-log.md 对应 bug 的描述、根因、修复建议。

### 批次1: BUG-054~062（F17 AI智能导入，9个bug，核心问题：绕过Server Action）

核心修复思路（一次性解决9个bug）：
1. 读 web/src/actions/import-ai.ts — 这是已对齐后端的 Server Action，有3个函数
2. 读 web/src/components/ai-import-wizard.tsx — 这是问题文件，4处直接 fetch
3. 将 ai-import-wizard.tsx 中的 4 个 fetch 调用全部替换为调用 import-ai.ts 的 Server Action:
   - handleAnalyze() 中的 fetch("/api/import/ai-analyze") → 调用 aiAnalyzeZip()
   - handleAdjustMapping() 中的 fetch("/api/import/ai-mapping") → 调用 aiAdjustMapping()
   - handleConfirm() 中的 fetch("/api/import/ai-confirm") → 调用 aiConfirmImport()
   - handleUndo() 中的 fetch("/api/import/undo") → 调用 aiUndoImport()
4. 删除 ai-import-wizard.tsx 中重复的类型定义（AIAnalyzeResult, AIConfirmResult），改为从 import-ai.ts 导入
5. confidence 类型转换：在数据接收处加 int→string 映射（>=85="high", >=60="medium", <60="low"）

### 批次2: BUG-065, BUG-067（F18 前端部分，2个bug）

1. BUG-065: web/src/services/search.ts — SearchResultItem 接口添加 `score?: number;`
2. BUG-067: web/src/app/search/page.tsx — 搜索完成后统一 setSemanticLoading(false)，不再推断语义搜索状态（用方案B，无依赖）

### 完成后

```bash
cd /root/cy/prism/web && npx tsc --noEmit
```
修复所有新增的 TypeScript 错误。然后通知 Agent 2 你已完成。

规则:
- 只改 web/src/ 下的文件
- 不碰 api/ 目录
- 禁止新增 fetch() 直接调用后端 API

## Agent 2 — 后端修复 (model: sonnet, F13 AC4 部分用 opus)

你负责修复后端相关的 bug + 一个需要设计判断的遗留项。修复前必须完整阅读 docs/testing/bug-log.md 对应 bug 的描述。

### BUG-064: Issue 向量搜索 SQL 列名错误

文件: api/services/hybrid_search.py
1. 行240: `i.type = %s` → `i.category = %s`
2. 行247: `issue_type_col = "i.type"` → `issue_type_col = "i.category"`
3. 删除行235-238的残留无效代码

### BUG-066: search_mode 字段被 Pydantic 过滤

文件: api/schemas/search.py
在 SearchResponse 中添加: `search_mode: str = "keyword"`

### BUG-063: 语义搜索结果缺失 breadcrumb

文件: api/services/hybrid_search.py
在 hybrid_search() 的 RRF 合并后，对语义结果中 breadcrumb 为 None 的条目，通过 ORM 查询补充 breadcrumb（方案A）。
具体：用结果中的 entity_id 查 nodes 表拿到 node，再调用已有的 _build_breadcrumb() 函数。

### F13 AC4 遗留: 关系图高亮（需要设计判断）

这是唯一需要设计决策的修复。当前问题：F13需求分析的 affected_modules 未传递给 relation-graph 页面。

建议方案（你来判断是否合理）：
1. 分析结果保存时，将 affected_node_ids 写入 analysis_tasks 表的 result_data JSONB
2. relation-graph 页面加载时查询最近一次分析的 affected_node_ids
3. 匹配的节点高亮显示（加 ring/glow 样式）

注意：这个修复涉及前端（relation-graph页面高亮），但你只负责后端部分（API返回affected_node_ids）。前端高亮部分通知 Agent 1 来做。

设计决策必须记录在 docs/testing/bug-fix-log.md。

### 完成后

```bash
cd /root/cy/prism/api && python -c "from main import app; print('OK')"
```
确认无 import 错误。然后通知 Agent 1 后端已完成（特别是 F13 AC4 如果需要前端配合）。

规则:
- 只改 api/ 目录下的文件
- 不碰 web/src/ 目录
- F13 AC4 的设计决策必须记录在 docs/testing/bug-fix-log.md

## Agent 3 — 运维 (model: sonnet)

你负责启动所有服务并验证基础连通性。与 Agent 1/2 并行执行，互不干扰。

### 1. 启动数据库

cd /root/cy/prism && docker compose up -d
docker compose ps  # 确认 db healthy

### 2. 数据库初始化检查

确认必要的表存在:
psql postgres://prism:prism_dev_2026@127.0.0.1:5432/prism -c "\dt"

如果表不存在，执行:
cd /root/cy/prism/web && npx drizzle-kit push

确认种子数据:
psql postgres://prism:prism_dev_2026@127.0.0.1:5432/prism -c "SELECT count(*) FROM users;"
如果为0，执行: cd /root/cy/prism/web && npx tsx src/db/seed.ts

### 3. 启动后端 API

cd /root/cy/prism/api
pip install -r requirements.txt  # 首次需要
uvicorn main:app --reload --host 0.0.0.0 --port 8001 &

验证:
curl -s http://localhost:8001/health | python3 -m json.tool
# 期望: {"status": "ok", "db_connected": true}

### 4. 启动前端

cd /root/cy/prism/web
npm install  # 首次需要
PORT=3001 npm run dev &

验证:
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login
# 期望: 200

### 5. 基础连通性验证

逐个验证核心端点:

# 认证
curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prism.dev","password":"admin123"}' | python3 -m json.tool

# 项目列表（用上面返回的token）
curl -s http://localhost:8001/api/projects \
  -H "Authorization: Bearer {token}" | python3 -m json.tool

# 搜索
curl -s "http://localhost:8001/search?q=test&project_id=1" | python3 -m json.tool

# 健康检查
curl -s http://localhost:8001/health | python3 -m json.tool

### 6. 输出环境状态报告

写入 docs/testing/env-status.md:
- 数据库: 连接状态 + 表数量 + 种子数据状态
- 后端API: 启动状态 + /health 响应
- 前端: 启动状态 + 首页响应码
- 核心端点: 逐个列出测试结果
- 发现的问题（如果有）

如果某个服务启动失败，记录错误信息并尝试修复。常见问题:
- 端口被占: lsof -i :8001 / :3001，kill 占用进程
- 依赖缺失: pip install / npm install
- 环境变量: 检查 .env 和 web/.env.local
- 数据库表缺失: drizzle-kit push

规则:
- 不改任何代码文件
- 只写 docs/testing/env-status.md
- 启动失败时可以修环境配置（.env、docker-compose.yml），但不改业务代码

## 文件领地

| 目录 | Agent 1 (前端) | Agent 2 (后端) | Agent 3 (运维) |
|------|---------------|---------------|---------------|
| web/src/ | ✅ 写 | ❌ 不碰 | ❌ 不碰 |
| api/ | ❌ 不碰 | ✅ 写 | ❌ 不碰 |
| docs/testing/bug-fix-log.md | ❌ | ✅ 写 | ❌ |
| docs/testing/env-status.md | ❌ | ❌ | ✅ 写 |
| .env / docker-compose.yml | ❌ | ❌ | ✅ 写(仅环境配置) |

## 完成标准

- [ ] BUG-054~067 全部修复
- [ ] F13 AC4 遗留已实现（后端API + 设计文档）
- [ ] tsc --noEmit = 0 新增错误
- [ ] api import 检查通过
- [ ] 数据库 + 后端API + 前端 全部启动成功
- [ ] 基础连通性验证通过
- [ ] env-status.md 已输出
- [ ] git commit: "fix: 修复BUG-054~067 + F13 AC4 + 环境验证"
```
