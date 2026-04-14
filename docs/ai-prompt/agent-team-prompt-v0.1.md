# Prism Agent Team 开发提示词（完整版）

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
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建 Server Action 封装，组件只调 Server Action。直接 fetch 会绕过 auth 且导致契约漂移（参考 BUG-043~062 教训）
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
- 发现 bug 记录在 docs/testing/test-checklist-v0.1-phase1.md，标注修复建议
- 发现的 bug 必须同步追加到 docs/testing/bug-log.md，沿用已有编号（BUG-NNN 递增），包含：严重度/问题描述/根因/修复建议/受影响文件
- 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body 的字段名、类型、必填项

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
2. 写 docs/testing/test-checklist-v0.1-phase2.md
3. 逐条验证 F3/F4/F5 的每个 AC
4. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
5. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

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
4. 写 docs/testing/test-checklist-v0.1-phase3.md
5. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
6. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 150 次工具调用（Phase 3 范围较小）

## 完成标准
- zip 上传 → 解压预览 → 手动映射 → 批量创建 全流程跑通
- 空模块显示引导页
- v0.1 全部 Phase 完成，可以开始用
```

---

## Phase 4: F7 问题沉淀 + F6 竞品参考

```
Create a team with 4 agents to implement Prism v0.2 Phase 4.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F7 和 F6 章节，包括所有 AC）
ADR:
  - docs/adr/011-competitor-entity-and-comparison.md（竞品全局实体设计）
  - docs/adr/012-issue-entity-and-visualization.md（问题独立实体设计）
前置: v0.1 全部 Phase 已完成，功能树+档案页+版本时间线+导入可用
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts（已有 users/projects/nodes/dimension_records/version_records 表）
工程陷阱记录: web/engineering-notes.md（编码前必读）
UI 原型参考:
  - 功能项档案页（竞品和问题区块在此展示）: design/ui-prototype/app/projects/[id]/features/[featureId]/page.tsx
环境:
  - 启动数据库: cd /root/cy/prism && docker compose up -d
  - 前端 dev: cd web && PORT=3001 npm run dev
  - 后端 dev: cd api && uvicorn main:app --reload --port 8001
  - DB URL: postgres://prism:prism_dev_2026@127.0.0.1:5432/prism

## Agent 1 — Backend（仅改 api/ 和 web/src/db/ 和 web/src/actions/）

实现内容:

### F7 问题沉淀
1. web/src/db/schema.ts — 新增 issues 表:
   - id, nodeId, projectId, category(enum: bug/tech_debt/design_flaw/performance), description, tags(JSONB), createdAt, updatedAt
   - 问题是独立实体，不是维度记录的子类型（见 ADR-012）
2. web/src/actions/issues.ts — 问题 CRUD Server Actions:
   - createIssue: 创建问题，自动关联当前功能项
   - updateIssue / deleteIssue
   - getIssuesByNode: 获取功能项下的问题列表
   - getIssuesByCategory: 按分类筛选
3. 问题按分类自动关联到对应维度的逻辑:
   - bug → 测试分析维度
   - tech_debt → 工程经验维度
   - design_flaw → 设计决策维度
   - performance → 技术实现维度

### F6 竞品参考
4. web/src/db/schema.ts — 新增 competitors 表（全局实体）:
   - id, projectId, name, website, description, createdAt
5. web/src/db/schema.ts — 新增 competitor_references 表:
   - id, nodeId, competitorId, version, featureCoverage, technicalApproach, prosAndCons, createdAt, updatedAt
6. web/src/actions/competitors.ts — 竞品实体 CRUD:
   - 项目级 CRUD，确保名称统一、跨功能项复用
7. web/src/actions/competitor-references.ts — 竞品参考记录 CRUD:
   - createReference, updateReference, deleteReference
   - getReferencesByNode: 获取功能项的竞品参考列表
8. 运行 drizzle-kit push 迁移数据库

规则:
- 不碰 web/src/app/ 和 web/src/components/（前端 agent 的领地）
- 竞品是全局实体（competitors 表），竞品参考是功能项级记录（competitor_references 表）
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:

### F7 问题沉淀 UI
1. web/src/components/issue-card.tsx — 问题卡片组件:
   - 支持添加问题（选分类 + 填描述 + 添加标签）
   - 问题列表展示（按分类图标+颜色区分）
   - 按标签筛选
2. 在功能项档案页集成问题入口:
   - 档案页增加"添加问题"按钮
   - 在对应维度卡片底部展示关联的问题列表（如"工程经验"卡片底部显示关联的技术债）

### F6 竞品参考 UI
3. web/src/components/competitor-reference-card.tsx — 竞品参考卡片:
   - "添加竞品参考"按钮 → 从全局竞品列表选择竞品（或新建）→ 填写结构化模板（版本/功能覆盖/技术方案/优劣势）
   - 竞品参考列表展示
   - 编辑和删除已有参考
4. web/src/app/projects/[projectId]/settings/ — 项目设置增加"竞品管理"Tab:
   - 项目级竞品实体 CRUD（名称/网站/描述）
   - 竞品作为全局实体管理，确保名称统一
5. 在功能项档案页"竞品参考"维度区块集成竞品参考卡片

规则:
- 不碰 api/ 和 web/src/db/schema.ts
- API 调用通过 web/src/actions/ 封装
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建，组件只调 Server Action
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件

## Agent 3 — QA 测试（只读代码，只写 docs/ 和 tests/）

等 Agent 1 和 Agent 2 完成后:
1. 读所有新增代码
2. 运行 cd web && npx tsc --noEmit
3. 用 curl 测试 issues 和 competitors/competitor-references 相关端点
4. 验证 F7 AC:
   - AC1: 添加问题（选分类+填描述）
   - AC2: 问题自动关联到对应维度
   - AC3: 标签筛选
   - AC4: 维度卡片底部展示关联问题
   - AC5: 问题归入功能项（为 F13 AI 分析预留数据基础）
5. 验证 F6 AC:
   - AC1: 从全局竞品列表选择竞品，填写结构化模板
   - AC2: 同一功能项多条竞品参考
   - AC3: 结构化模板字段完整
   - AC4: 编辑和删除
   - AC5: 竞品全局实体管理（competitors 表）
6. 写 docs/testing/test-checklist-v0.2-phase4.md

规则:
- 不直接修改代码
- bug 记录在测试清单中，并同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
- 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body 的字段名、类型、必填项

## Agent 4 — 预算监控（后台运行）

同前规则，本次预算上限: 200 次工具调用

## 文件领地

| 目录 | Agent 1 | Agent 2 | Agent 3 | Agent 4 |
|------|---------|---------|---------|---------|
| api/ | ✅ 写 | ❌ 不碰 | 👀 只读 | ❌ |
| web/src/db/ | ✅ 写 | ❌ 不碰 | 👀 只读 | ❌ |
| web/src/actions/ | ✅ 写 | ❌ 不碰 | 👀 只读 | ❌ |
| web/src/app/ | ❌ 不碰 | ✅ 写 | 👀 只读 | ❌ |
| web/src/components/ | ❌ 不碰 | ✅ 写 | 👀 只读 | ❌ |
| docs/ | ❌ | ❌ | ✅ 写 | ✅ 写 |

## 完成标准
- F7 全部 AC（AC1-AC5）已实现
- F6 全部 AC（AC1-AC5）已实现（AC6 回填功能留到 F12 Phase 实现）
- 问题按分类正确关联到对应维度卡片
- 竞品作为全局实体可复用
- tsc = 0 错误，git commit 完成
```

---

## Phase 5: F9 搜索

```
Create a team with 4 agents to implement Prism v0.2 Phase 5.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F9 章节，包括所有 AC）
ADR: docs/adr/013-ai-analysis-search-and-version-reorder.md
前置: v0.1 + Phase 4（F6/F7）已完成
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts
UI 原型参考: design/ui-prototype/app/search/page.tsx
环境: 同前

## Agent 1 — Backend（仅改 api/ 和 web/src/db/ 和 web/src/actions/）

实现内容:
1. api/routers/search.py — 搜索 API:
   - GET /api/search?q=关键词&projectId=可选&dimensionType=可选&issueCategory=可选
   - 搜索范围: 节点名称 + 维度记录内容(JSONB) + issues 表(描述+标签)
   - 使用 PostgreSQL ILIKE 关键词匹配（v0.2 阶段，v0.4 升级为 Hybrid 搜索）
   - 返回结果包含: 匹配内容片段、路径面包屑（项目→产品线→模块→功能项）、来源项目 Badge
   - 权限控制: 只返回用户有权限的项目中的结果
2. web/src/actions/search.ts — Server Action 封装搜索请求
3. 搜索结果高亮匹配关键词

规则:
- 搜索受权限控制，必须检查 project_members
- ILIKE 搜索，不用全文搜索索引（v0.4 再升级）
- 返回路径面包屑需要递归查询 nodes 的 materializedPath
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:
1. web/src/app/search/page.tsx — 搜索结果页:
   - 搜索结果列表，每条结果展示:
     - 路径面包屑（项目→产品线→模块→功能项）
     - 匹配内容片段，关键词高亮
     - 来源项目 Badge（项目名称标签）
   - 筛选器: 按项目 / 按维度类型 / 按问题分类
   - 点击结果跳转到对应功能项档案页
2. 顶部导航栏搜索框组件（全局搜索入口）:
   - 输入关键词实时搜索（debounce 300ms）
   - 下拉展示前 5 条匹配结果
   - 回车或点击"查看全部"跳转到搜索结果页
3. 搜索结果默认跨全部项目，可按项目/维度类型/问题分类筛选

规则:
- 不碰 api/ 和 web/src/db/
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建，组件只调 Server Action
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件

## Agent 3 — QA 测试

等 Agent 1 和 Agent 2 完成后:
1. 验证 F9 全部 AC:
   - AC1: 顶部搜索框输入关键词，实时显示匹配结果
   - AC2: 搜索范围覆盖节点名称、维度记录内容、F7问题
   - AC3: 结果展示路径面包屑+关键词高亮
   - AC4: 点击跳转到对应功能项
   - AC5: 权限控制（只返回有权限的项目内容）
   - AC6: 默认跨全部项目搜索，可按项目/维度/问题分类筛选
   - AC7: 结果标注来源项目 Badge
2. 测试中文搜索、长文本匹配、跨项目搜索
3. 写 docs/testing/test-checklist-v0.2-phase5.md
4. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
5. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 150 次工具调用

## 完成标准
- F9 全部 AC（AC1-AC7）已实现
- 搜索范围覆盖节点名称+维度内容+问题
- 权限控制生效
- tsc = 0 错误，git commit 完成
```

---

## Phase 6: F10 项目全景图 + F8 模块关系图

```
Create a team with 4 agents to implement Prism v0.2 Phase 6.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F10 和 F8 章节，包括所有 AC）
ADR:
  - docs/adr/009-react-flow-state-separation.md（React Flow 状态分离）
  - docs/adr/012-issue-entity-and-visualization.md（全景图 Treemap 决策）
前置: v0.1 + Phase 4-5 已完成（F6/F7/F9 可用）
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts
UI 原型参考:
  - 全景图: design/ui-prototype/app/projects/[id]/panorama/page.tsx
  - 关系图: design/ui-prototype/app/projects/[id]/relation-graph/page.tsx
环境: 同前

## Agent 1 — Backend（仅改 api/ 和 web/src/db/ 和 web/src/actions/）

实现内容:

### F10 全景图数据
1. web/src/actions/panorama.ts — 全景图数据聚合:
   - getPanoramaData: 返回项目下所有节点的 Treemap 数据（节点名/功能项数量/完善度）
   - 支持 drill down: 按层级返回（项目级→产品线级→模块级→功能项级）
   - getProjectStats: 项目级统计（总模块数/功能数/平均完善度/最近更新时间）

### F8 关系图数据
2. web/src/db/schema.ts — 新增 node_relations 表:
   - id, sourceNodeId, targetNodeId, relationType(enum: depends_on/related_to/conflicts_with), createdAt
3. web/src/actions/relations.ts — 关联关系 CRUD:
   - createRelation: 创建关联（选择关联类型+目标节点）
   - deleteRelation
   - getRelationsByNode: 获取节点的所有关联
   - getRelationGraph: 获取项目的完整关系图数据（模块级视图）
   - getModuleRelationDetail: 展开某模块，返回其下功能项的跨模块关联
4. 运行 drizzle-kit push 迁移数据库

规则:
- 关系图节点上限 ≤200，通过展开/折叠控制
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:

### F10 全景图 UI
1. web/src/app/projects/[projectId]/overview/page.tsx — 项目概览页:
   - "全景图"Tab + "关系图"Tab（两个独立 Tab，F10 和 F8 并列）
   - 页面显示项目级统计（总模块数/功能数/平均完善度/最近更新时间）
2. web/src/components/treemap-view.tsx — Treemap 组件（使用 recharts 或 d3-treemap）:
   - 色块面积 = 功能项数量
   - 颜色 = 完善度（红→黄→绿）
   - drill down: 点击模块色块进入功能项级 Treemap
   - 顶部面包屑导航（项目→产品线→模块）可返回上层
   - 点击最底层功能项色块跳转到档案页

### F8 关系图 UI
3. web/src/components/relation-graph.tsx — 关系图组件（使用 React Flow）:
   - 默认模块级视图: 模块折叠为单节点，展示模块间关联的力导向图
   - 关联类型用不同线型/颜色区分:
     - depends_on: 实线
     - related_to: 虚线
     - conflicts_with: 红线
   - 点击节点高亮该节点的所有直接关联
   - 点击节点可跳转到对应模块/功能项档案页
   - 支持功能项级视图: 点击模块节点可展开，展示该模块下功能项的跨模块关联
4. 功能项档案页增加"添加关联"按钮:
   - 选择关联类型 + 目标节点（支持模块级和功能项级）

规则:
- React Flow 按 ADR-009 做状态分离（UI 状态和数据状态分开管理）
- Treemap 不用全量铺开，用 drill down 控制渲染量
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件

## Agent 3 — QA 测试

等 Agent 1 和 Agent 2 完成后:
1. 验证 F10 全部 AC:
   - AC1: 全景图 Tab 展示 Treemap
   - AC2: 色块面积=功能项数量，颜色=完善度
   - AC3: drill down 到功能项级+面包屑导航
   - AC4: 点击功能项色块跳转到档案页
   - AC5: 项目级统计数据正确
2. 验证 F8 全部 AC:
   - AC1: 关系图 Tab 展示模块级力导向图
   - AC2: 三种关联类型线型/颜色区分
   - AC3: 点击节点高亮直接关联
   - AC4: 点击跳转到档案页
   - AC5: 功能项档案页可添加关联
   - AC6: 功能项级视图（点击模块展开）
   - AC7: 节点数 ≤200 上限控制
3. 性能测试: 验证节点数 >20 时关系图渲染性能
4. 写 docs/testing/test-checklist-v0.2-phase6.md
5. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
6. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 250 次工具调用（可视化组件开发量大）

## 完成标准
- F10 + F8 全部 AC 已实现
- Treemap 色块可 drill down，颜色反映完善度
- 关系图支持模块级+功能项级视图，三种关联类型视觉区分
- tsc = 0 错误，git commit 完成
```

---

## Phase 7: F13 AI 需求分析 + F12 功能对比矩阵

```
Create a team with 4 agents to implement Prism v0.3 Phase 7.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F13 和 F12 章节，包括所有 AC）
ADR:
  - docs/adr/004-ai-service-layer.md（AI 服务层设计）
  - docs/adr/011-competitor-entity-and-comparison.md（F12 回填机制）
  - docs/adr/013-ai-analysis-search-and-version-reorder.md（F13 渐进式披露）
前置: v0.2 全部完成（F6/F7/F8/F9/F10 可用），F6竞品参考+F7问题沉淀+F8关系图+F9搜索 是 F13 的上下文来源
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts
UI 原型参考:
  - 需求分析: design/ui-prototype/app/projects/[id]/analysis/page.tsx
  - 对比矩阵: design/ui-prototype/app/projects/[id]/comparison/page.tsx
环境: 同前

## Agent 1 — Backend（仅改 api/ 和 web/src/actions/）

实现内容:

### F13 AI 需求分析
1. api/services/ai_provider.py — AI 服务层（如不存在则创建）:
   - LLMProvider 接口: analyze(prompt, context) → stream response
   - 支持 Claude / Kimi / Codex 三种 Provider
   - 从项目 AI 配置读取当前 Provider
2. api/routers/analyze.py — 需求分析 API:
   - POST /api/analyze/requirement — 需求分析（支持文本输入+文件上传 Markdown/Word）
   - 渐进式三层上下文:
     - L1 快速分析: 读取当前功能项的已有维度 + F7 已知问题
     - L2 关联分析: 追加 F8 关系图中直接关联模块及其维度
     - L3 全局分析: 用 F9 搜索能力提取关键词筛选相关功能项
   - 流式输出（SSE），每层结果标注来源层级
   - POST /api/analyze/save — 保存分析结果到功能项的"需求分析"维度
3. api/routers/analyze.py — 测试点生成:
   - POST /api/analyze/generate-test-points — 基于需求分析结果生成测试点
   - POST /api/analyze/save-test-points — 将测试点一键录入"测试分析"维度

### F12 功能对比矩阵
4. api/routers/comparison.py — 对比矩阵 API:
   - POST /api/comparison/generate — 选择 2+ 个竞品（从全局 competitors 表），AI 生成对比表格
   - 默认对比维度: 功能覆盖度(有/无/部分) + 技术方案差异 + 用户体验差异
   - 支持用户自定义添加对比维度
   - PUT /api/comparison/:id — 手动编辑对比表格（增删改行/列）
   - POST /api/comparison/backfill — 将对比表某行回填到对应功能项的 F6 竞品参考卡片
   - GET /api/comparison/export — 导出对比结果（Markdown 格式）

规则:
- AI 服务层必须可插拔（实现 LLMProvider 接口），参考 ADR-004
- F13 渐进式三层必须按 ADR-013 实现，不能固定上下文范围
- F12 对比表由 AI 生成，不是纯数据聚合
- 流式输出使用 SSE
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:

### F13 需求分析 UI
1. web/src/app/projects/[projectId]/analysis/page.tsx — 需求分析页:
   - 输入区: 文本输入框 + 文件上传（Markdown/Word）
   - 分析结果区: 流式展示分析结果
   - L1 结果底部显示"扩展分析范围"按钮 → 触发 L2
   - L2 结果底部显示"全局扫描"按钮 → 触发 L3
   - 每层结果标注来源层级（"基于当前功能项" / "基于关联模块" / "基于全局扫描"）
   - 各层结果保留不覆盖
   - "保存到需求分析维度"按钮
2. web/src/components/analysis-result.tsx — 分析结果组件:
   - 影响范围可视化（如果 F8 关系图数据可用，高亮受影响模块）
   - 流式渲染（SSE 接收）
3. 测试点生成:
   - "生成测试点"按钮 → 展示测试点列表
   - 可勾选/取消勾选 → "一键录入测试分析维度"
4. 功能项档案页增加入口: 点击功能项右上角"需求分析"按钮跳转到分析页

### F12 对比矩阵 UI
5. web/src/app/projects/[projectId]/comparison/page.tsx — 对比矩阵页:
   - 顶部: 选择功能项 + 选择竞品（从全局竞品列表，支持多选 Badge 展示）
   - "生成对比"按钮 → AI 生成对比表格
   - 对比表格:
     - 行: 对比维度（功能覆盖/技术方案/用户体验+自定义）
     - 列: 本产品 + 已选竞品
     - 差异项自动高亮
     - 支持手动编辑（增删改行/列/单元格）
   - 每行提供"回填"按钮 → 将该行结论同步到对应功能项的 F6 竞品参考卡片
   - "导出"按钮 → 导出 Markdown
6. 可临时切换 AI Provider（每次 AI 操作时）

规则:
- 不碰 api/ 和 web/src/db/
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建，组件只调 Server Action
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件

## Agent 3 — QA 测试

等 Agent 1 和 Agent 2 完成后:
1. 验证 F13 全部 AC:
   - AC1: 支持粘贴/上传 PRD 文档
   - AC2: 渐进式三层分析（L1/L2/L3）
   - AC3: 每层结果标注来源层级
   - AC4: 影响范围在关系图高亮
   - AC5: 分析结果可保存到需求分析维度
   - AC6: 生成测试点
   - AC7: 测试点可一键录入测试分析维度
2. 验证 F12 全部 AC:
   - AC1: 选择 2+ 竞品生成对比表格
   - AC2: 默认 3 维度 + 自定义维度
   - AC3: 对比表手动增删改查
   - AC4: 差异项高亮
   - AC5: 可导出
   - AC6: 回填到 F6 竞品参考
3. 测试 AI Provider 切换
4. 写 docs/testing/test-checklist-v0.3-phase7.md
5. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
6. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 300 次工具调用（AI 集成开发量大）

## 完成标准
- F13 + F12 全部 AC 已实现
- AI 渐进式三层分析可用
- 对比矩阵可生成+编辑+回填+导出
- AI 服务层可切换 Provider
- tsc = 0 错误，git commit 完成
```

---

## Phase 8: F16 AI 快照 + F15 数据流转可视化

```
Create a team with 4 agents to implement Prism v0.3 Phase 8.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F16 和 F15 章节，包括所有 AC）
ADR:
  - docs/adr/013-ai-analysis-search-and-version-reorder.md（F16 双输出决策）
  - docs/adr/012-issue-entity-and-visualization.md（F15 过程可见决策）
前置: v0.3 Phase 7 已完成（F12/F13 AI 能力已就位）
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts
UI 原型参考:
  - AI 快照: design/ui-prototype/app/projects/[id]/modules/[moduleId]/snapshot/page.tsx
  - 数据流转: design/ui-prototype/app/projects/[id]/data-flow/page.tsx
  - 活动日志: design/ui-prototype/app/projects/[id]/activity/page.tsx
环境: 同前

## Agent 1 — Backend（仅改 api/ 和 web/src/db/ 和 web/src/actions/）

实现内容:

### F16 AI 快照
1. api/routers/snapshot.py — AI 快照 API:
   - POST /api/snapshot/generate — 基于功能项的版本历史记录生成快照
   - 前置条件: 功能项需有 3+ 条版本演进记录
   - AI 输出双格式:
     - 一句话概要（自由文本，描述当前功能核心定位）
     - 按维度结构化输出各维度最新状态
   - POST /api/snapshot/save — 保存快照:
     - 一句话概要 → 功能项摘要字段
     - 结构化部分 → 按维度选择性覆盖/更新对应维度卡片内容

### F15 数据流转可视化
2. web/src/db/schema.ts — 新增 activity_logs 表:
   - id, projectId, userId, actionType(enum: import/create/update/delete/analyze), targetType, targetId, summary, metadata(JSONB), createdAt
3. web/src/actions/activity-log.ts — 活动日志:
   - logActivity: 记录操作日志（各 action 调用时自动记录）
   - getActivityLogs: 获取项目的活动日志列表（分页）
4. 在已有的导入/录入/分析 action 中插入 logActivity 调用:
   - F11 导入完成时记录导入摘要
   - F13 分析完成时记录分析结果流向
   - 节点/维度记录的 CRUD 操作记录
5. 运行 drizzle-kit push 迁移数据库

规则:
- F16 必须检查版本记录数 ≥3 才允许生成快照
- F15 活动日志是辅助功能，不能影响主流程性能（异步写入或最终一致）
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:

### F16 AI 快照 UI
1. 功能项档案页增加"生成当前快照"按钮（仅版本记录 ≥3 时显示）
2. web/src/components/snapshot-result.tsx — 快照结果组件:
   - 展示一句话概要
   - 展示按维度结构化的各维度最新状态
   - 用户可勾选要回写的维度 → "确认更新"按钮
   - 一句话概要可编辑后保存为功能项摘要

### F15 数据流转 UI
3. 导入（F11）过程中增加实时进度面板:
   - 当前处理哪个文件、怎么拆分的、归入了哪个模块、进度百分比
4. 录入/导入完成后展示流转摘要:
   - 导入了 N 条数据、拆分为 M 个功能项、关联了 K 条记录、归入了哪些模块
5. F13 分析完成后增加结果流向提示:
   - "分析结果已保存到 XX 功能项的需求分析维度，生成了 N 条测试点"
6. web/src/app/projects/[projectId]/overview/ — 项目概览页增加"活动日志"Tab:
   - 历史操作列表（时间/操作类型/影响范围）
   - 分页加载

规则:
- 不碰 api/ 和 web/src/db/
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建，组件只调 Server Action
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件

## Agent 3 — QA 测试

等 Agent 1 和 Agent 2 完成后:
1. 验证 F16 全部 AC:
   - AC1: 版本记录 ≥3 时显示"生成当前快照"按钮
   - AC2: AI 输出一句话概要 + 按维度结构化
   - AC3: 可选择性覆盖维度卡片内容
2. 验证 F15 全部 AC:
   - AC1: 导入过程实时展示进度
   - AC2: 完成后展示流转摘要
   - AC3: F13 分析后展示结果流向提示
   - AC4: 活动日志页展示历史操作列表
3. 测试 F16 前置条件: 版本记录 <3 时按钮不显示
4. 写 docs/testing/test-checklist-v0.3-phase8.md
5. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
6. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 200 次工具调用

## 完成标准
- F16 + F15 全部 AC 已实现
- AI 快照双输出（概要+结构化）可用
- 活动日志记录完整
- v0.3 全部 Phase 完成
- tsc = 0 错误，git commit 完成
```

---

## Phase 9: F17 AI 智能导入

```
Create a team with 4 agents to implement Prism v0.4 Phase 9.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F17 章节，包括所有 AC）
ADR:
  - docs/adr/012-issue-entity-and-visualization.md（F17 与 F15 联动设计）
  - docs/adr/004-ai-service-layer.md
前置: v0.3 全部完成，F11 手动导入已可用（F17 是 F11 的 AI 增强版）
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts
UI 原型参考: design/ui-prototype/app/projects/[id]/import-ai/page.tsx
环境: 同前

## Agent 1 — Backend（仅改 api/ 和 web/src/actions/）

实现内容:
1. api/services/ai_import.py — AI 智能导入服务:
   - 逐文件读取内容，AI 分析并输出映射表（文件→推荐模块→推荐维度→置信度）
   - 拆分能力: 单个大文件按表格行/标题层级拆分为多个功能项
   - 归类能力: AI 根据文件内容推荐归属模块和维度
   - 提取能力: 从文件中提取结构化信息填入对应维度
   - 关联识别: 识别跨模块引用关系
   - 去重检测: 发现已有同名功能项时提示合并或跳过
   - 产品线差异标注: 识别"私有云特有""智算中心不支持"等描述，自动打标签
2. api/routers/import.py — 扩展导入 API:
   - POST /api/import/ai-analyze — AI 分析上传的 zip，返回映射表
   - PUT /api/import/ai-mapping — 用户调整映射表（批量操作）
   - POST /api/import/ai-confirm — 确认导入，批量创建功能项+维度记录+关联关系
   - POST /api/import/undo — 一键撤销本次导入（批量删除本次创建的记录）
3. 导入过程中记录 F15 活动日志（实时进度）
4. 确认导入后写入 F15 流转摘要

规则:
- F17 是 F11 的 AI 增强版，复用 F11 的 zip 解压和文件预览能力
- 确认前是 F17 的 review 映射表（交互模式），确认后切换到 F15 的流转进度面板（观察模式）
- 支持 Markdown(.md)、CSV、纯文本格式
- 已有同名功能项时提示合并或跳过，不覆盖已有数据
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:
1. web/src/app/projects/[projectId]/import/page.tsx — 升级导入页面，增加 AI 模式:
   - Tab 切换: "手动映射"（F11 已有）/ "AI 智能导入"（F17 新增）
   - AI 模式流程:
     - Step 1: 上传 zip（复用 F11 的拖拽上传）
     - Step 2: 文件树预览 + 文件内容预览
     - Step 3: 点击"AI 分析" → 展示映射表:
       - 每行: 文件名 → 推荐模块 → 推荐维度 → 置信度(高/中/低)
       - 可逐行调整模块/维度归属
       - 支持批量操作（全选/反选/批量改模块）
       - 低置信度行高亮提醒
     - Step 4: 确认导入 → 切换到 F15 流转进度面板
2. web/src/components/ai-mapping-table.tsx — AI 映射表组件:
   - 可编辑的表格，支持排序、筛选、批量操作
   - 置信度颜色标记（高=绿/中=黄/低=红）
3. 导入完成后:
   - 展示导入结果摘要（成功/跳过/需人工处理）
   - "一键撤销"按钮
4. 去重提示组件: 发现同名功能项时弹出选择（合并/跳过/创建新的）

规则:
- 不碰 api/ 和 web/src/db/
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建，组件只调 Server Action
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件

## Agent 3 — QA 测试

等 Agent 1 和 Agent 2 完成后:
1. 准备测试 zip 文件:
   - 包含多个 md 文件（模拟知识库）
   - 包含一个大文件（需要拆分）
   - 包含与已有功能项同名的文件（测试去重）
2. 验证 F17 全部 AC:
   - AC1: 上传 zip 后展示文件树和预览
   - AC2: AI 分析输出映射表（文件→模块→维度→置信度）
   - AC3: 可调整映射+批量操作
   - AC4: 大文件可拆分
   - AC5: 产品线差异自动打标签
   - AC6: 跨模块引用自动创建关联
   - AC7: 批量创建+导入结果摘要
   - AC8: 同名功能项提示合并或跳过
   - AC9: 支持 Markdown/CSV/纯文本
   - AC10: 一键撤销本次导入
3. 验证与 F15 的联动: 确认导入后切换到流转进度面板
4. 写 docs/testing/test-checklist-v0.4-phase9.md
5. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
6. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 300 次工具调用（AI 导入逻辑复杂）

## 完成标准
- F17 全部 AC（AC1-AC10）已实现
- AI 映射表可 review + 调整 + 批量操作
- 拆分/归类/关联/去重/差异标注 全链路跑通
- 一键撤销可用
- tsc = 0 错误，git commit 完成
```

---

## Phase 10: F18 Hybrid 混合搜索

```
Create a team with 4 agents to implement Prism v0.4 Phase 10.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F18 章节，包括所有 AC）
ADR:
  - docs/adr/007-pgvector-deferred.md
  - docs/adr/013-ai-analysis-search-and-version-reorder.md（F18 Hybrid 搜索决策）
前置: v0.3 + Phase 9 已完成，F9 关键词搜索已可用（F18 是 F9 的升级版）
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + pgvector + Drizzle ORM
数据库 schema: web/src/db/schema.ts
环境: 同前

## Agent 1 — Backend（仅改 api/ 和 web/src/db/）

实现内容:
1. PostgreSQL 启用 pgvector 扩展:
   - docker compose 配置中添加 pgvector
   - CREATE EXTENSION IF NOT EXISTS vector;
2. web/src/db/schema.ts — 新增 embeddings 表:
   - id, targetType(node/dimension_record/issue), targetId, embedding(vector), updatedAt
3. api/services/embedding.py — Embedding 服务:
   - 使用 text-embedding-3-small（或同类模型）生成向量
   - 节点名称 / 维度记录内容 / 问题描述 → 向量化
   - 增量更新: 内容变更时重新生成对应向量
4. api/routers/search.py — 升级搜索 API 为 Hybrid:
   - 双路召回:
     - BM25 关键词搜索（保留 F9 已有的 ILIKE 搜索）
     - pgvector 语义向量搜索（cosine similarity）
   - RRF（Reciprocal Rank Fusion）合并排名:
     - 两种方法都命中的结果自动加权靠前
   - pgvector 不可用时自动降级到纯关键词搜索
   - F9 已有的全部能力保留（权限控制/面包屑/问题覆盖/筛选）
5. api/services/embedding_worker.py — 后台 Embedding 生成:
   - 首次部署: 全量生成所有已有内容的向量
   - 运行时: 内容变更时触发增量向量更新

规则:
- 搜索框不变，用户无感，后端自动走 Hybrid
- pgvector 挂了必须自动降级，不能阻塞搜索
- 关键词搜索不能丢——企业用户搜精确产品名/工单ID
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:
1. 搜索 UI 基本不变（F9 已实现），仅增加:
   - 搜索结果中语义匹配的结果标注"语义匹配"小标签（与精确匹配区分）
   - 搜索结果排序优化（RRF 排序后自然展示）
2. 确保搜索体验流畅:
   - 语义搜索可能比关键词搜索慢，先展示关键词结果，语义结果异步追加
   - 加载状态提示

规则:
- 不碰 api/ 和 web/src/db/
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建，组件只调 Server Action
- 完成后运行: cd web && npx tsc --noEmit

## Agent 3 — QA 测试

等 Agent 1 和 Agent 2 完成后:
1. 验证 F18 全部 AC:
   - AC1: 搜索框不变，后端同时执行关键词+语义搜索
   - AC2: 双路结果通过 RRF 合并排名
   - AC3: 搜索"配额"能命中"quota""额度限制""资源上限"等语义相关结果
   - AC4: pgvector 不可用时自动降级到纯关键词搜索
   - AC5: F9 全部能力保留（权限/面包屑/问题覆盖/筛选）
2. 降级测试: 停止 pgvector → 验证搜索仍可用
3. 语义匹配质量测试: 同义词搜索、跨语言匹配
4. 性能测试: 搜索响应 ≤3s
5. 写 docs/testing/test-checklist-v0.4-phase10.md
6. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
7. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 200 次工具调用

## 完成标准
- F18 全部 AC（AC1-AC5）已实现
- Hybrid 搜索: 关键词+语义双路召回+RRF 合并
- pgvector 降级到纯关键词搜索可用
- 语义搜索能返回同义词结果
- tsc = 0 错误，git commit 完成
```

---

## Phase 11: F14 行业动态（AI 推送）

```
Create a team with 4 agents to implement Prism v0.4 Phase 11.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F14 章节，包括所有 AC）
ADR: docs/adr/013-ai-analysis-search-and-version-reorder.md（F14 AI 主动推送决策）
前置: v0.4 Phase 9-10 已完成
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts
UI 原型参考:
  - 动态 Feed: design/ui-prototype/app/projects/[id]/feed/page.tsx
  - 洞察: design/ui-prototype/app/projects/[id]/insights/page.tsx
环境: 同前

## Agent 1 — Backend（仅改 api/ 和 web/src/db/ 和 web/src/actions/）

实现内容:
1. web/src/db/schema.ts — 新增表:
   - feed_sources 表: id, projectId, sourceType(rss/search), url, name, isActive, createdAt
   - feed_items 表: id, projectId, sourceId, title, source, publishedDate, summary, tags(JSONB), suggestedNodeId, status(enum: pending/confirmed/ignored), createdAt
   - feed_node_links 表: id, feedItemId, nodeId（确认关联后写入）
2. api/services/feed_fetcher.py — 动态抓取服务:
   - RSS 源定期抓取（解析 RSS/Atom feed）
   - AI 联网搜索: 基于项目已有模块和竞品列表生成搜索查询，调用搜索 API
   - 抓取结果结构化（标题/来源/日期/摘要/标签）
   - AI 推荐关联的功能项（suggestedNodeId）
3. api/routers/feed.py — 动态管理 API:
   - GET /api/feed/items — 获取待 review 的动态列表
   - POST /api/feed/items/:id/confirm — 确认关联（创建 feed_node_links）
   - POST /api/feed/items/:id/ignore — 忽略
   - PUT /api/feed/items/:id/reassign — 手动调整关联的功能项
   - CRUD /api/feed/sources — 订阅源管理
4. 定时任务机制:
   - 使用 APScheduler 或 Celery Beat 定期执行抓取
   - 抓取频率可配置（默认每 6 小时）
5. 运行 drizzle-kit push 迁移数据库

规则:
- F14 是 AI 主动推送，不是手动录入
- 独立 Feed 页集中 review，不直接塞进功能项档案页
- 确认关联后才在功能项档案页可见
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:
1. web/src/app/projects/[projectId]/overview/ — 项目概览增加"行业动态"Tab:
   - 待 review 的动态列表（卡片形式）
   - 每条动态显示: 标题/来源/日期/摘要/标签/AI 推荐关联的功能项
   - 操作按钮: "确认关联" / "忽略" / "手动调整关联"
   - 已确认和已忽略的动态可折叠查看
2. web/src/components/feed-card.tsx — 动态卡片组件
3. 项目设置页增加"订阅源管理"Tab:
   - RSS/订阅源列表 CRUD
   - 添加订阅源: 输入 URL + 名称
   - 启用/禁用开关
4. 功能项档案页增加"相关动态"区块:
   - 展示已确认关联到该功能项的动态列表（只读）

规则:
- 不碰 api/ 和 web/src/db/
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建，组件只调 Server Action
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件

## Agent 3 — QA 测试

等 Agent 1 和 Agent 2 完成后:
1. 验证 F14 全部 AC:
   - AC1: RSS 订阅源配置+定期抓取
   - AC2: AI 基于项目知识联网搜索动态
   - AC3: 抓取结果结构化 + AI 推荐关联功能项
   - AC4: Feed 页集中 review（确认关联/忽略/调整）
   - AC5: 确认关联后在功能项档案页可见
2. 测试订阅源管理 CRUD
3. 测试 AI 推荐关联的准确性
4. 写 docs/testing/test-checklist-v0.4-phase11.md
5. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
6. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 250 次工具调用

## 完成标准
- F14 全部 AC（AC1-AC5）已实现
- RSS 抓取 + AI 搜索双路推送可用
- Feed 页 review 流程跑通
- 确认关联后档案页可见
- v0.4 全部 Phase 完成
- tsc = 0 错误，git commit 完成
```

---

## Phase 12: F19 导入/导出 + F20 团队/空间

```
Create a team with 4 agents to implement Prism v1.x Phase 12.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（读 F19 和 F20 章节，包括所有 AC）
ADR:
  - docs/adr/013-ai-analysis-search-and-version-reorder.md（F19 格式闭环、F20 最小实现决策）
  - docs/adr/008-project-ownership-evolution.md（项目归属演进）
前置: v0.4 全部完成
技术栈: Next.js 16 (web/) + FastAPI (api/) + PostgreSQL + Drizzle ORM
数据库 schema: web/src/db/schema.ts
环境: 同前

## Agent 1 — Backend（仅改 api/ 和 web/src/db/ 和 web/src/actions/）

实现内容:

### F19 导入/导出
1. api/routers/export.py — 导出 API:
   - POST /api/export/nodes — 选中模块/功能项后导出为 Markdown 文件
   - 导出内容包含全部维度信息，按维度分 section
   - POST /api/export/project — 按项目/产品线级别批量导出，生成 zip 压缩包
   - zip 目录结构对应模块层级
   - 导出的 Markdown 格式可被 F11/F17 重新导入（格式闭环）
2. 导入能力: 复用 F11（手动）和 F17（AI），不重复建设
   - 仅需增加: Markdown 文件直接导入（不打 zip 的场景）

### F20 团队/空间
3. web/src/db/schema.ts — 新增 teams 表:
   - id, name, description, ownerId, createdAt
4. web/src/db/schema.ts — 新增 team_members 表:
   - id, teamId, userId, role(admin/member), joinedAt
5. web/src/db/schema.ts — projects 表新增 teamId 字段（nullable，null = 个人项目）
6. web/src/actions/teams.ts — 团队 CRUD:
   - createTeam, updateTeam, deleteTeam
   - inviteMember, removeMember, updateMemberRole
   - migrateProjectToTeam: 个人项目迁移到团队（更新 teamId）
7. 团队权限: 复用 F1 已有的管理员/编辑者/查看者权限模型
8. 运行 drizzle-kit push 迁移数据库

规则:
- F19 导出格式用 Markdown，不做 Word/PDF
- F20 团队化做最小实现——分组+权限复用，不做评论/通知/协作编辑
- 个人项目迁移到团队不能丢数据
- 完成后运行: cd api && python -c "from main import app; print('OK')"

## Agent 2 — Frontend（仅改 web/src/app/ 和 web/src/components/）

实现内容:

### F19 导入/导出 UI
1. 功能项档案页 / 模块页 增加"导出"按钮:
   - 导出单个功能项 → 下载 Markdown 文件
   - 导出整个模块 → 下载 zip（包含该模块下所有功能项的 Markdown）
2. 项目设置页增加"导出项目"按钮:
   - 导出整个项目 → 下载 zip（目录结构对应模块层级）
3. 导入页增加"导入 Markdown 文件"选项（不强制打 zip）

### F20 团队/空间 UI
4. web/src/app/teams/ — 团队管理页:
   - 团队列表 + 创建团队按钮
   - 团队详情: 成员列表 + 项目列表
5. web/src/app/teams/[teamId]/page.tsx — 团队详情页:
   - 成员管理（邀请/移除/改角色）
   - 团队下的项目列表
6. 项目设置页增加"迁移到团队"按钮:
   - 选择目标团队 → 确认迁移
7. 项目列表页区分"我的项目"和"团队项目":
   - Tab 切换或分组展示

规则:
- 不碰 api/ 和 web/src/db/
- **禁止在组件中直接 fetch 后端 API**。必须优先使用 web/src/actions/ 下已有的 Server Action；如不存在则新建，组件只调 Server Action
- 完成后运行: cd web && npx tsc --noEmit
- 使用 shadcn/ui 组件

## Agent 3 — QA 测试

等 Agent 1 和 Agent 2 完成后:
1. 验证 F19 全部 AC:
   - AC1: 导入 Markdown 文件/zip 压缩包（复用 F11/F17）
   - AC2: 导出功能项为 Markdown，包含全部维度信息
   - AC3: 批量导出项目/产品线为 zip（目录结构对应模块层级）
   - AC4: 导出的 Markdown 可被重新导入（格式闭环验证）
2. 验证 F20 全部 AC:
   - AC1: 创建团队 + 将项目归入团队
   - AC2: 个人项目一键迁移到团队（数据不丢失）
   - AC3: 团队成员权限（复用管理员/编辑者/查看者）
3. 迁移测试: 迁移后项目所有数据完整
4. 格式闭环测试: 导出 → 重新导入 → 内容一致
5. 写 docs/testing/test-checklist-v1.x-phase12.md
6. 发现的 bug 必须同步追加到 docs/testing/bug-log.md（BUG-NNN 递增，含严重度/根因/修复建议/受影响文件）
7. 重点检查前后端 API 契约对齐：逐字段比对 Pydantic schema 与前端 fetch body

## Agent 4 — 预算监控

本次预算上限: 250 次工具调用

## 完成标准
- F19 + F20 全部 AC 已实现
- 导出 Markdown 格式可被重新导入（闭环验证通过）
- 团队创建+项目迁移+权限控制 全流程跑通
- v1.x 全部功能完成
- tsc = 0 错误，git commit 完成
```
