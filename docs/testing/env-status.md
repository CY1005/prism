# Prism 环境状态报告

生成时间: 2026-04-14 18:25 (Asia/Tokyo)

---

## 数据库

| 项目 | 状态 |
|------|------|
| 容器 | prism-db-1 healthy (pgvector/pgvector:pg16) |
| 端口 | 127.0.0.1:5432 |
| 连接串 | postgresql://prism:prism_dev_2026@127.0.0.1:5432/prism |
| 表数量 | 20张 |
| 种子数据 | users: 1条 (cy@prism.dev / admin123) |

表清单: analysis_tasks, dimension_records, dimension_types, embeddings, feed_items, feed_node_links, feed_sources, issues, knowledge_items, node_relations, nodes, project_dimension_configs, project_members, project_templates, projects, refresh_tokens, team_members, teams, users, version_records

---

## 后端 API

| 项目 | 状态 |
|------|------|
| 启动方式 | `PYTHONPATH=/root/cy/prism uvicorn api.main:app --host 0.0.0.0 --port 8001` |
| 进程 | 运行中 (后台) |
| 日志 | /tmp/api.log |
| /health 响应 | `{"status":"ok","version":"0.1.0","db_connected":true}` |

注意: `http://localhost:8001/health` 返回 307 重定向，需访问 `http://127.0.0.1:8001/health/`（含尾斜杠）。

---

## 前端

| 项目 | 状态 |
|------|------|
| 启动方式 | `cd /root/cy/prism/web && PORT=3001 npm run dev` |
| 框架 | Next.js 16.2.3 (Turbopack) |
| 进程 | 运行中 (后台) |
| 日志 | /tmp/web.log |
| /login 响应码 | 200 |

---

## 核心端点测试结果

| 端点 | 方法 | 结果 | 备注 |
|------|------|------|------|
| `GET /health/` | GET | 200 `{"status":"ok","db_connected":true}` | 需尾斜杠 |
| `/api/auth/login` | POST | 200 返回 access_token | 用户: cy@prism.dev / admin123 |
| `/api/projects/` | GET | 200 返回1个项目 | 需 Authorization Bearer token |
| `/search/` | GET | 200 `{"results":[]}` | 无测试数据，结构正常 |

---

## 发现的问题

### 1. analyzer 容器持续重启 (非阻塞)
- **现象**: `prism-analyzer-1` 状态为 `Restarting (1)`
- **原因**: 容器内缺少 `feedparser` 模块 (`ModuleNotFoundError: No module named 'feedparser'`)
- **影响**: docker compose 内的 analyzer 服务不可用，但本地直接启动 uvicorn 的 API 正常
- **处理**: 本地 pip install 已补全依赖，uvicorn 进程正常运行

### 2. 登录邮箱与文档不符
- **现象**: 任务说明中用 `admin@prism.dev`，实际种子数据为 `cy@prism.dev`
- **影响**: 直接影响认证测试脚本，需使用 `cy@prism.dev`

### 3. health 端点 307 重定向
- **现象**: GET `/health` 返回 307，需访问 `/health/`
- **影响**: 测试脚本需加尾斜杠或使用 `-L` 跟随重定向

---

## 环境总结

| 服务 | 状态 |
|------|------|
| PostgreSQL (docker) | 正常 |
| FastAPI (本地 uvicorn) | 正常 |
| Next.js (本地 dev server) | 正常 |
| analyzer (docker) | 异常 (feedparser缺失，非核心流程) |
