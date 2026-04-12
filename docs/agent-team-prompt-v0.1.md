# Prism v0.1 Agent Team 开发提示词

> 使用方式：在新的 Claude Code session 中，确保 settings.json 已启用 Agent Teams，然后粘贴下方提示词。
> 按 Phase 分 session 执行，每个 session 完成一个 Phase。

---

## Phase 1: F1 用户认证 + F2 项目管理

```
Create a team with 4 agents to implement Prism v0.1 Phase 1.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F1 和 F2 章节，包括所有 AC）
ADR: docs/adr/005-auth-strategy.md, docs/adr/008-project-ownership-evolution.md
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts
现有 API: api/routers/, api/services/
工程陷阱记录: web/engineering-notes.md（编码前必读）
UI 原型参考: design/ui-prototype/（复用交互模式和布局）
环境:
  - 启动数据库: cd /root/cy/prism && docker compose up -d
  - 前端 dev: cd web && PORT=3001 npm run dev
  - 后端 dev: cd api && uvicorn main:app --reload --port 8001
  - DB URL: postgres://prism:prism_dev_2026@127.0.0.1:5432/prism

## Agent 1 — Backend（仅改 api/ 和 web/src/db/）

实现内容:
1. web/src/db/schema.ts — 确认 users/projects/project_members 表存在，按 PRD F1/F2 AC 补全字段
2. web/src/db/seed.ts — 初始管理员账号 + 4个项目模板种子数据
3. api/routers/auth.py — 登录/登出/刷新 token 端点（F1 AC1-AC10）
4. api/routers/projects.py — 项目 CRUD + 成员管理 + 软删除（F2 全部 AC）
5. api/services/project_crud.py — 业务逻辑层

规则:
- 不碰 web/src/app/ 和 web/src/components/（前端 agent 的领地）
- 参考 api/routers/health.py 的代码风格
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:
1. web/src/app/login/page.tsx — 登录表单（从 design/ui-prototype/app/login/page.tsx 搬运布局）
2. web/src/app/register/page.tsx — 注册页（如果 PRD 要求）
3. web/src/app/admin/page.tsx — 管理后台用户列表（F1 AC11-12）
4. web/src/app/projects/page.tsx — 项目列表 + 创建按钮
5. web/src/app/projects/new/page.tsx — 创建项目（模板选择器，4 种模板卡片）
6. web/src/app/projects/[projectId]/settings/page.tsx — 项目设置（成员管理/维度管理/层级标签/AI配置）
7. web/src/components/template-selector.tsx — 4 模板卡片组件

规则:
- 不碰 api/ 和 web/src/db/schema.ts（后端 agent 的领地）
- API 调用通过 web/src/services/ 或 web/src/actions/ 封装
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件，参考原型代码风格

## Agent 3 — QA 测试（只读代码，只写 docs/ 和 tests/）

等 Agent 1 和 Agent 2 完成后:
1. 读 Agent 1 和 Agent 2 写的所有代码
2. 运行 cd web && npx tsc --noEmit，检查类型错误
3. 用 curl 测试每个 API 端点，验证响应格式和状态码
4. 安全检查: SQL 注入、认证绕过、缺失权限校验、密码明文存储
5. 写测试清单 docs/test-checklist-v0.1-phase1.md:
   - 逐条列出 F1 和 F2 的每个 AC
   - 标记: ✅ 已实现 / ⚠️ 部分实现 / ❌ 未实现
   - 记录发现的 bug（含 file:line 定位）
6. 如果发现 ❌ 未实现的 AC，通知 Agent 1 或 Agent 2 补充

规则:
- 不直接修改 api/ 或 web/src/ 的代码
- 发现 bug 记录在 docs/test-checklist-v0.1-phase1.md，标注修复建议

## Agent 4 — 预算监控（后台运行）

你是预算控制 agent，职责是防止开发超出月度 token 预算。

监控规则:
1. 记录每个 agent 的工具调用次数（tool_uses）
2. 设定本次 session 预算上限: 总计 200 次工具调用（约 $15-20 token 消耗）
3. 每当总调用次数到达以下阈值时，向所有 agent 发消息:
   - 100 次（50%）: "⚠️ 预算已用 50%，请评估剩余工作量"
   - 150 次（75%）: "⚠️ 预算已用 75%，请优先完成核心 AC，跳过优化"
   - 180 次（90%）: "🛑 预算即将耗尽，请在 20 次调用内收尾：提交代码、写完测试清单、停止开发"
   - 200 次（100%）: "🛑 预算耗尽，全部 agent 立即停止。运行 git add + git commit 保存进度"
4. 如果某个 agent 陷入 doom loop（同一文件编辑 >6 次），提醒它换思路
5. session 结束时输出预算报告:
   - 各 agent 工具调用次数
   - 完成的 AC 数量
   - 未完成项目清单（下次 session 继续）

规则:
- 不写任何代码
- 不干预开发决策，只管预算和进度

## 文件领地（关键——防止冲突）

| 目录 | Agent 1 | Agent 2 | Agent 3 | Agent 4 |
|------|---------|---------|---------|---------|
| api/ | ✅ 写 | ❌ 不碰 | 👀 只读 | ❌ |
| web/src/db/ | ✅ 写 | ❌ 不碰 | 👀 只读 | ❌ |
| web/src/app/ | ❌ 不碰 | ✅ 写 | 👀 只读 | ❌ |
| web/src/components/ | ❌ 不碰 | ✅ 写 | 👀 只读 | ❌ |
| web/src/actions/ | ✅ 写 | ✅ 写(不同文件) | 👀 只读 | ❌ |
| docs/ | ❌ | ❌ | ✅ 写 | ✅ 写 |
| tests/ | ❌ | ❌ | ✅ 写 | ❌ |

## 完成标准
- F1 + F2 全部 AC 已实现（Agent 3 清单无 ❌）
- tsc --noEmit = 0 错误
- API 端点 curl 测试通过
- git commit 完成
- Agent 4 预算报告输出
```

---

## Phase 2: F3 功能树 + F4 档案页 + F5 版本管理

```
Create a team with 4 agents to implement Prism v0.1 Phase 2.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F3、F4、F5 章节）
ADR: docs/adr/009-react-flow-state-separation.md
上一个 Phase 的测试清单: docs/test-checklist-v0.1-phase1.md（确认前置功能可用）
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts（Phase 1 已有 users/projects 表）
UI 原型参考:
  - 功能树: design/ui-prototype/components/feature-tree.tsx
  - 功能详情: design/ui-prototype/app/projects/[id]/features/[featureId]/page.tsx
  - 模块列表: design/ui-prototype/app/projects/[id]/modules/[moduleId]/page.tsx
环境: 同 Phase 1

## Agent 1 — Backend

实现内容:
1. web/src/db/schema.ts — 添加 nodes 表（id, projectId, parentId, name, type, materializedPath, completionPercent, sortOrder）
2. web/src/db/schema.ts — 添加 dimension_records 表（id, nodeId, dimensionTypeId, content JSONB, createdAt, updatedAt）
3. web/src/db/schema.ts — 添加 version_records 表（按 PRD F5 数据模型）
4. web/src/actions/nodes.ts — 功能树 CRUD Server Actions（创建/重命名/删除/移动/拖拽排序）
5. web/src/actions/dimensions.ts — 维度记录 CRUD
6. web/src/actions/versions.ts — 版本记录 CRUD + 快照创建
7. 运行 drizzle-kit push 迁移数据库

## Agent 2 — Frontend

实现内容:
1. web/src/components/feature-tree.tsx — 从原型搬运，接入真实数据
2. web/src/components/dimension-card.tsx — 从原型搬运，支持编辑/保存
3. web/src/components/version-timeline.tsx — 从原型搬运
4. web/src/app/projects/[projectId]/modules/[moduleId]/page.tsx — 模块详情（左树+右内容）
5. web/src/app/projects/[projectId]/features/[featureId]/page.tsx — 功能项详情（维度卡片+版本时间线）
6. 右键菜单组件（新建/重命名/删除）
7. 维度卡片支持 4 种录入方式（手动/Markdown/文件/URL）的 UI

## Agent 3 — QA 测试

同 Phase 1 模式:
1. 读代码 → tsc 检查 → curl 测试 → 安全检查
2. 写 docs/test-checklist-v0.1-phase2.md
3. 逐条验证 F3/F4/F5 的每个 AC

## Agent 4 — 预算监控

同 Phase 1 规则，本次预算上限: 250 次工具调用

## 文件领地
同 Phase 1

## 完成标准
- F3 + F4 + F5 全部 AC 已实现
- 功能树可展开/折叠/右键操作
- 维度卡片可编辑保存
- 版本时间线可创建版本+查看快照
- tsc = 0 错误，git commit 完成
```

---

## Phase 3: F11 冷启动导入

```
Create a team with 4 agents to implement Prism v0.1 Phase 3.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F11 章节）
UI 原型: design/ui-prototype/app/projects/[id]/import-ai/page.tsx
前置测试清单: docs/test-checklist-v0.1-phase2.md
环境: 同前

## Agent 1 — Backend

实现内容:
1. api/routers/import.py — POST /api/import/upload（接收 zip 文件）
2. api/services/import_handler.py — 解压 zip、解析 Markdown/CSV/文本、生成文件树
3. web/src/actions/import.ts — Server Action 封装: uploadZip, confirmImport
4. 确认导入后批量创建 nodes + dimension_records

## Agent 2 — Frontend

实现内容:
1. web/src/app/projects/[projectId]/import/page.tsx — 导入页面
   - Step 1: 上传 zip（拖拽区域）
   - Step 2: 文件树预览
   - Step 3: 手动映射（文件→模块）
   - Step 4: 确认导入
2. 导入完成后跳转到全景图并弹出引导提示（F11 AC6 Aha Moment）
3. 空模块引导页组件

## Agent 3 — QA 测试

1. 准备测试 zip 文件（从 /root/cy/ai-quality-engineering/01-工作/ 打包几个 md 文件）
2. 用测试 zip 走完导入流程
3. 验证 F11 每个 AC
4. 写 docs/test-checklist-v0.1-phase3.md

## Agent 4 — 预算监控

本次预算上限: 150 次工具调用（Phase 3 范围较小）

## 完成标准
- zip 上传 → 解压预览 → 手动映射 → 批量创建 全流程跑通
- 空模块显示引导页
- v0.1 全部 Phase 完成，可以开始用
```
