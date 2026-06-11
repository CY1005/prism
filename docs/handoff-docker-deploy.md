# Prism Docker 部署交接文档

> 创建时间：2026-04-16
> 上一个会话完成了：Docker全栈部署 + Cloudflare Tunnel公网上线
> 本文档用于交接给新 Claude 会话继续测试和修复

## 当前环境状态

### 服务架构

```
用户浏览器 → Cloudflare CDN (SSL)
  → prism.19911005.xyz    → Cloudflare Tunnel → localhost:3000 (Next.js)
  → api-prism.19911005.xyz → Cloudflare Tunnel → localhost:8001 (FastAPI)

Docker Compose (3 services):
  db:       pgvector/pgvector:pg16  → 127.0.0.1:5432
  analyzer: FastAPI + uvicorn       → 127.0.0.1:8001
  web:      Next.js 16 standalone   → 127.0.0.1:3000

Cloudflare Tunnel: systemd service (cloudflared)
Config: /etc/cloudflared/config.yml
```

### 关键路径

```
/root/cy/prism/                    # 项目根目录
├── docker-compose.yml             # 三服务编排
├── .env                           # 环境变量（已配置，勿提交）
├── web/                           # Next.js 前端
│   ├── Dockerfile                 # 多阶段构建 (deps→build→runtime)
│   ├── docker-entrypoint.sh       # drizzle-kit push + node server.js
│   └── .dockerignore
├── api/                           # FastAPI 后端
│   ├── Dockerfile
│   ├── main.py                    # CORS 配置在这里
│   └── .dockerignore
├── docs/testing/bugs/bug-log.md   # Bug 记录（当前到 BUG-103）
└── scripts/start.sh               # 一键启动脚本
```

### 常用命令

```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs web --tail 50
docker compose logs analyzer --tail 50

# 重建单个服务（修改代码后）
docker compose up -d --build web       # ~60s，含 Next.js build
docker compose up -d --build analyzer  # ~10s

# 全部重建（从零开始）
docker compose down -v && docker compose up -d --build

# 数据库操作
docker compose exec db psql -U prism -c "SELECT count(*) FROM users;"

# Cloudflare Tunnel
systemctl status cloudflared
# config: /etc/cloudflared/config.yml

# 测试公网（注意 bypass proxy）
curl --noproxy '*' -s https://prism.19911005.xyz/login
curl --noproxy '*' -s https://api-prism.19911005.xyz/health/
```

### 当前数据库 Seed 数据

- 1 个用户：`sxiao19911005@gmail.com` / `test1234` / platform_admin
- 4 个项目模板：product_analysis, system_architecture, research_platform, custom
- 5 个维度类型：requirement, design, implementation, testing, experience
- 0 个项目（需要通过 UI 创建）

### 安全配置

- Cloudflare Access：只允许 `sxiao19911005@gmail.com` 访问 `prism.19911005.xyz`
- `api-prism.19911005.xyz` 未加 Access（API 自身有 Internal Token 认证）
- 所有端口绑定 `127.0.0.1`，不对外暴露
- `.env` 中的密钥已配置，勿提交到 git

## 已知问题和修复历史

### 已修复 (BUG-100 ~ BUG-103)

| Bug | 问题 | 根因 |
|-----|------|------|
| BUG-100 | production build 失败 | templates.ts AppError 缺 code 参数 |
| BUG-101 | Docker 容器间 API 不通 | import.ts/export.ts 硬编码 localhost:8001 |
| BUG-102 | 空数据库显示 mock 项目 | listProjects 空数组时 fallback 到 mock |
| BUG-103 | 公网环境 mock 不消失 | 客户端 fetch FastAPI 在公网不可达，改用 Server Action |

### 已知的架构债务

1. **`web/src/services/*.ts` 中的客户端直调 FastAPI 模式**：多个 service 文件用 `NEXT_PUBLIC_ANALYZER_URL` 在浏览器端直接 fetch FastAPI。公网环境下如果 `api-prism.19911005.xyz` 被 Access 保护或 API 需要认证，这些调用都会失败。应逐步迁移到 Server Action。
2. **`web/src/lib/projects-data.ts` 等 mock 数据文件**：仍然存在，虽然不再被 projects 页面使用，但可能被其他页面引用。
3. **每次代码修改需要重建 Docker 镜像**（~60s），开发效率低。可考虑开发时用 `npm run dev` + Docker 只跑 DB/API。

## 未来优化（2026-05-11 新增）

**来源**：腾讯技术工程《Harness 不是目的，知识才是护城河》（`/root/tmp/Harness不是目的，知识才是护城河 —— 一个AI工程交付团队的知识沉淀实践.pdf`）。读完后判定 Prism 当前数据模型缺三块能力，按 ROI 排序：

### F-OPT-001：知识成熟度 + 自动衰减（P0）

- **问题**：Prism 当前是单调累积，没有自净化机制。dimension_records 只进不出，3-6 个月后必然变沼泽。
- **方案**：
  - `dimension_records` 加 `maturity` 枚举字段（`draft`/`verified`/`proven`）+ `last_referenced_at` 时间戳
  - 新增 cron 跑衰减判定：`proven` 条目 12 月未引用 → 降 `verified`；`verified` 6 月未引用 → 降 `draft`；`draft` 持续未引用 → 归档
  - 引用计数靠 AI 分析端点（F13/F18）调用时自动 `UPDATE last_referenced_at`
- **影响文件**：`web/src/db/schema.ts`（加字段）、`api/services/*.py`（埋点）、新增 `api/services/maturity_decay.py`
- **配套 ADR**：建议写 ADR-015《知识生命周期管理》

### F-OPT-002：知识类型 MECE 推荐（P1）

- **问题**：用户当前可自由建维度，但没有分类引导，长期会出现"近似维度满天飞"。
- **方案**：在新建维度时由 F13 AI 分析推荐归入 5 种标准类型之一：`model`（实体定义）/ `decision`（架构决策）/ `guideline`（推荐做法）/ `pitfall`（已知坑）/ `process`（流程步骤）。用户可覆盖，但默认贴标签。
- **影响文件**：`web/src/actions/dimensions.ts`（建维度时调 AI）、`api/services/ai_provider.py`（加 classify_dimension prompt）

### F-OPT-003：Agent 友好的三级渐进索引 API（P2，但是跳槽叙事关键）

- **问题**：F18 RRF 混合搜索是给"人"用的；Agent 在 cost-aware 场景下需要分层探查（catalog → list → entry），而不是一次性灌入向量召回结果。
- **方案**：新增三个端点（不替换 F18，并存）：
  - `GET /api/agent/catalog`（~50 行：项目下有哪些维度/分类）
  - `GET /api/agent/list?dim=X`（~300 行：某分类下条目摘要 + tags）
  - `GET /api/agent/entry/{id}`（完整内容 + source_references）
- **影响文件**：`api/routers/agent_query.py`（新增）、`api/services/progressive_index.py`（新增）
- **战略意义**：这条直接对接 2026Q4 跳槽路线 A+C（PRISM 代表作 + AI 质量工程方向）。其他 RAG 产品都在做"语义召回"，Prism 走"结构化分层"是差异化卖点。

### 不要照抄的部分

- **不要回退到纯 Markdown / 文件系统即状态机**：腾讯团队场景是企业内网 + IDE 重度，Prism 用 DB 是对的；但**应当输出 Markdown 镜像作为导出能力**，避免成为知识监狱。
- **不要做冷启动 /flow-import 三 Agent 管道**：单人场景下复杂度大于价值。
- **不要做跨设备远程操控**：Prism 是 Web，天然解决。

## 测试指南

### 端到端测试流程

1. 打开 `https://prism.19911005.xyz`
2. Cloudflare Access 验证（邮箱 OTP）
3. 登录：`sxiao19911005@gmail.com` / `test1234`
4. 创建项目 → 进入项目 → 测试各功能页面
5. 浏览器 F12 → Console/Network 检查报错

### 重点关注

- 所有客户端 fetch 调用是否在公网环境下正常工作
- 空状态页面（无数据时的显示）
- AI 分析功能（需要在项目设置中配置 AI Provider + API Key）
- 导入/导出功能

## Bug 记录规范

追加到 `docs/testing/bugs/bug-log.md`，编号从 **BUG-104** 开始：

```markdown
## BUG-1XX: [标题]

- **日期**: 2026-04-XX
- **严重度**: Critical/Major/Minor
- **状态**: 已修复
- **阶段**: Docker部署

### 现象
[报错信息]

### 根因
[RCA 分析]

### 修复
[具体改了什么]

### 受影响文件
[文件列表]

### 教训
[可复用的经验]
```

## 修复流程

1. 复现问题（浏览器 F12 + docker compose logs）
2. 定位根因（grep/read 代码）
3. 修复代码
4. `docker compose up -d --build web`（或 analyzer）
5. 等 30s，公网验证
6. 写 RCA 到 bug-log.md
7. git commit
