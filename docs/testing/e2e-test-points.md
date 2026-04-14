# Prism E2E 测试点（F1-F20 全覆盖）

> 生成时间: 2026-04-14
> 基于: PRD v1.0 + bug-log (BUG-001 ~ BUG-067)
> 测试环境: API http://127.0.0.1:8001 / DB postgres://prism:prism_dev_2026@127.0.0.1:5432/prism
> 种子用户: cy@prism.dev / admin123 (platform_admin)
> 已有项目: AI云平台竞品分析 (49b2a4fb-c7b6-4bbc-85b7-ea6f7b849903)

---

## 统计摘要

| 指标 | 数量 |
|------|------|
| **总测试点数** | **155** |
| P0 冒烟测试 | 20 |
| P1 功能测试 | 95 |
| P2 回归测试 | 22 |
| P3 边界测试 | 18 |

### 按 Feature 分布

| Feature | 测试点数 |
|---------|---------|
| F1 用户系统 | 14 |
| F2 项目管理 | 16 |
| F3 功能模块树 | 12 |
| F4 功能项档案页 | 12 |
| F5 版本演进时间线 | 8 |
| F6 竞品参考 | 5 |
| F7 问题沉淀 | 6 |
| F8 模块关系图 | 6 |
| F9 搜索 | 10 |
| F10 项目全景图 | 4 |
| F11 冷启动支持 | 4 |
| F12 功能对比矩阵 | 8 |
| F13 需求分析 | 10 |
| F14 行业动态 | 6 |
| F15 数据流转可视化 | 4 |
| F16 AI生成当前快照 | 6 |
| F17 AI智能导入 | 10 |
| F18 混合搜索 | 8 |
| F19 导入/导出 | 4 |
| F20 团队/空间 | 6 |
| 跨Feature | 4 |

---

## 环境变量约定

所有 curl 命令前需执行:
```bash
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
```

获取 Token:
```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cy@prism.dev","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
```

常量:
```
PROJECT_ID=49b2a4fb-c7b6-4bbc-85b7-ea6f7b849903
USER_ID=2e3fd565-143f-47f6-91c8-1d4d41c98db0
```

---

## P0 冒烟测试（核心链路）

### TP-001: F1 登录并获取 Token

- **Feature**: F1 用户系统
- **AC**: AC2, AC6
- **优先级**: P0
- **前置条件**: 种子用户 cy@prism.dev 存在
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"cy@prism.dev","password":"admin123"}'`
- **预期结果**: HTTP 200, 响应包含 `access_token` (JWT格式) 和 `refresh_token` 字段
- **验证方式**: API响应检查

### TP-002: F1 Token 访问受保护端点

- **Feature**: F1 用户系统
- **AC**: AC3
- **优先级**: P0
- **前置条件**: TP-001 获取的 Token
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/api/projects/`
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('projects' in d)"`
- **预期结果**: 步骤1返回 401; 步骤2返回 200 且包含 `projects` 数组
- **验证方式**: API响应检查

### TP-003: F2 创建项目并出现在列表

- **Feature**: F2 项目管理
- **AC**: AC1, AC5
- **优先级**: P0
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"E2E测试项目","description":"自动化测试","template_type":"product_analysis","user_id":"'$USER_ID'"}'`
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print([p['name'] for p in d['projects']])"`
- **预期结果**: 步骤1返回 200/201 且包含新项目 id; 步骤2列表包含 "E2E测试项目"
- **验证方式**: API响应检查

### TP-004: F3 创建节点并在树中可见

- **Feature**: F3 功能模块树
- **AC**: AC1, AC8
- **优先级**: P0
- **前置条件**: 已有项目
- **操作步骤**:
  1. 创建模块节点: `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/$PROJECT_ID/tree-overview -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"测试模块","node_type":"folder","parent_id":null}'`
  2. 创建功能项: (使用步骤1返回的 node_id 作为 parent_id)
  3. 获取树: `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/tree-overview -H "Authorization: Bearer $TOKEN"`
- **预期结果**: 树结构包含新建的模块和功能项节点
- **验证方式**: API响应检查

### TP-005: F4 编辑维度内容并持久化

- **Feature**: F4 功能项档案页
- **AC**: AC1, AC12
- **优先级**: P0
- **前置条件**: 已有功能项节点
- **操作步骤**:
  1. 写入维度内容 (通过 API 写入 dimension_record)
  2. 重新读取该功能项的维度记录
- **预期结果**: 写入的内容在重新读取后完整保留
- **验证方式**: API响应检查 + 数据库检查: `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT content FROM dimension_records WHERE node_id='<NODE_ID>' LIMIT 1;"`

### TP-006: F5 添加版本并在时间线显示

- **Feature**: F5 版本演进时间线
- **AC**: AC4, AC1
- **优先级**: P0
- **前置条件**: 已有功能项节点
- **操作步骤**:
  1. 添加版本记录 (POST version_records)
  2. 查询该功能项的版本列表
- **预期结果**: 版本记录存在, 包含版本号和变更类型
- **验证方式**: 数据库检查: `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT version, change_type FROM version_records WHERE node_id='<NODE_ID>';"`

### TP-007: F6 添加竞品参考

- **Feature**: F6 竞品参考
- **AC**: AC1, AC2
- **优先级**: P0
- **前置条件**: 已有功能项节点
- **操作步骤**:
  1. 写入竞品参考维度记录
  2. 查询该功能项的维度记录, 筛选 dimension_type = 'competitor_ref'
- **预期结果**: 竞品参考记录存在且内容正确
- **验证方式**: 数据库检查

### TP-008: F7 添加问题记录

- **Feature**: F7 问题沉淀
- **AC**: AC1
- **优先级**: P0
- **前置条件**: 已有功能项节点
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/$PROJECT_ID/issues -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"<NODE_ID>","category":"bug","title":"测试问题","description":"E2E测试创建的问题"}'`
- **预期结果**: HTTP 200/201, 返回 issue id
- **验证方式**: 数据库检查: `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT id, category, title FROM issues LIMIT 5;"`

### TP-009: F8 查询关系图数据

- **Feature**: F8 模块关系图
- **AC**: AC1
- **优先级**: P0
- **前置条件**: 已有项目和节点
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/relations -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, 返回 `nodes` 数组和 `edges` 数组
- **验证方式**: API响应检查

### TP-010: F9 搜索返回结果

- **Feature**: F9 搜索
- **AC**: AC1, AC3
- **优先级**: P0
- **前置条件**: 已有包含内容的节点
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=推理服务&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, `total` > 0, `results` 数组非空, 每条结果包含 `breadcrumb` 数组
- **验证方式**: API响应检查

### TP-011: F10 项目统计数据

- **Feature**: F10 项目全景图
- **AC**: AC5
- **优先级**: P0
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/stats -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, 返回 `total_folders`, `total_files`, `avg_completion_percent` 等字段
- **验证方式**: API响应检查

### TP-012: F12 生成对比矩阵

- **Feature**: F12 功能对比矩阵
- **AC**: AC1
- **优先级**: P0
- **前置条件**: 已有项目和节点, AI Provider 已配置
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/comparison/generate -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_ids":["<NODE_ID_1>"],"competitor_ids":["<COMP_ID>"],"project_id":"'$PROJECT_ID'"}'`
- **预期结果**: HTTP 200, 返回对比表格数据 (或合理的错误说明 AI 未配置)
- **验证方式**: API响应检查

### TP-013: F13 触发需求分析

- **Feature**: F13 需求分析
- **AC**: AC2
- **优先级**: P0
- **前置条件**: 已有功能项节点
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze/requirement -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"<NODE_ID>","requirement_text":"新增GPU实例配额限制功能","analysis_level":"L1"}'`
- **预期结果**: HTTP 200, 返回分析结果 (SSE 流式 或 JSON)
- **验证方式**: API响应检查

### TP-014: F14 Feed Sources CRUD

- **Feature**: F14 行业动态
- **AC**: AC1
- **优先级**: P0
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/feed/sources -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"AWS Blog","url":"https://aws.amazon.com/blogs/machine-learning/feed/","type":"rss"}'`
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/feed/sources -H "Authorization: Bearer $TOKEN"`
- **预期结果**: 步骤1返回 200/201; 步骤2列表包含 "AWS Blog"
- **验证方式**: API响应检查

### TP-015: F16 生成快照

- **Feature**: F16 AI生成当前快照
- **AC**: AC1, AC2
- **优先级**: P0
- **前置条件**: 功能项有维度数据
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/snapshot/generate -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"<NODE_ID>","project_id":"'$PROJECT_ID'"}'`
- **预期结果**: HTTP 200, 返回快照 summary 和维度数据
- **验证方式**: API响应检查

### TP-016: F17 AI 导入分析

- **Feature**: F17 AI智能导入
- **AC**: AC2
- **优先级**: P0
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/import/ai-analyze -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","user_id":"'$USER_ID'","files":[{"name":"test.md","path":"test.md","content":"# GPU推理服务\n这是一个功能说明","format":"markdown"}]}'`
- **预期结果**: HTTP 200, 返回 `mapping_rows` 数组 (每行包含文件到模块/维度的映射建议)
- **验证方式**: API响应检查

### TP-017: F18 混合搜索可用

- **Feature**: F18 混合搜索
- **AC**: AC1
- **优先级**: P0
- **前置条件**: 已有数据
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=推理&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, 结果包含 `match_type` 字段 (keyword/semantic/both)
- **验证方式**: API响应检查

### TP-018: F19 导出项目

- **Feature**: F19 导入/导出
- **AC**: AC2
- **优先级**: P0
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/export/project -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'"}'`
- **预期结果**: HTTP 200, 返回导出内容 (Markdown 或 zip)
- **验证方式**: API响应检查

### TP-019: F20 查看团队列表

- **Feature**: F20 团队/空间
- **AC**: AC1
- **优先级**: P0
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT id, name FROM teams;"`
- **预期结果**: teams 表可查询, 返回 0 或多条团队记录
- **验证方式**: 数据库检查

### TP-020: F1 Health Check 基础可达

- **Feature**: F1 用户系统 (基础设施)
- **AC**: -
- **优先级**: P0
- **前置条件**: 服务已启动
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/health/`
- **预期结果**: HTTP 200, `{"status":"ok","version":"0.1.0","db_connected":true}`
- **验证方式**: API响应检查

---

## P1 功能测试（按 Feature 分组）

### F1 用户系统

### TP-021: F1 错误密码返回统一错误信息

- **Feature**: F1 用户系统
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 种子用户存在
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"cy@prism.dev","password":"wrongpassword"}'`
- **预期结果**: HTTP 401, 响应不暴露邮箱是否存在 (不区分"用户不存在"和"密码错误")
- **验证方式**: API响应检查

### TP-022: F1 不存在的邮箱返回统一错误信息

- **Feature**: F1 用户系统
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"nonexist@prism.dev","password":"admin123"}'`
- **预期结果**: HTTP 401, 与 TP-021 相同的错误信息格式
- **验证方式**: API响应检查 (对比 TP-021 的错误信息)

### TP-023: F1 /api/auth/me 返回当前用户信息

- **Feature**: F1 用户系统
- **AC**: AC4
- **优先级**: P1
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/auth/me -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, 返回 `{"id":"...","email":"cy@prism.dev","name":"CY","role":"platform_admin","status":"active"}`
- **验证方式**: API响应检查

### TP-024: F1 Refresh Token 续签

- **Feature**: F1 用户系统
- **AC**: AC7
- **优先级**: P1
- **前置条件**: 登录获取的 refresh_token
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/auth/refresh -H "Content-Type: application/json" -d '{"refresh_token":"<REFRESH_TOKEN>"}'`
- **预期结果**: HTTP 200, 返回新的 access_token
- **验证方式**: API响应检查

### TP-025: F1 退出登录清除 Refresh Token

- **Feature**: F1 用户系统
- **AC**: AC9
- **优先级**: P1
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/auth/logout -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"refresh_token":"<REFRESH_TOKEN>"}'`
  2. 用旧 refresh_token 尝试续签
- **预期结果**: 步骤1返回 200; 步骤2返回 401
- **验证方式**: API响应检查 + 数据库检查: `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT count(*) FROM refresh_tokens WHERE token='<REFRESH_TOKEN>';"`

### TP-026: F1 密码使用 bcrypt 哈希存储

- **Feature**: F1 用户系统
- **AC**: AC10
- **优先级**: P1
- **前置条件**: 种子用户存在
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT password_hash FROM users WHERE email='cy@prism.dev';"`
- **预期结果**: password_hash 以 `$2b$` 或 `$2a$` 开头 (bcrypt 格式)
- **验证方式**: 数据库检查

### TP-027: F1 管理员创建用户

- **Feature**: F1 用户系统
- **AC**: AC1, AC11
- **优先级**: P1
- **前置条件**: 当前用户为 platform_admin
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/auth/users -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"email":"viewer@prism.dev","password":"viewer123","name":"Viewer","role":"viewer"}'`
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/auth/users -H "Authorization: Bearer $TOKEN"`
- **预期结果**: 步骤1返回 200/201; 步骤2用户列表包含 viewer@prism.dev
- **验证方式**: API响应检查

### TP-028: F1 管理员禁用用户

- **Feature**: F1 用户系统
- **AC**: AC5, AC12
- **优先级**: P1
- **前置条件**: viewer@prism.dev 已创建
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X PATCH http://127.0.0.1:8001/api/auth/users/<VIEWER_USER_ID> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status":"disabled"}'`
  2. 用被禁用用户登录: `curl -s -X POST http://127.0.0.1:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"viewer@prism.dev","password":"viewer123"}'`
- **预期结果**: 步骤1返回 200; 步骤2返回 401/403 且提示"账号已被禁用"
- **验证方式**: API响应检查

### F2 项目管理

### TP-029: F2 创建项目自动写入维度配置

- **Feature**: F2 项目管理
- **AC**: AC3
- **优先级**: P1
- **前置条件**: 已登录
- **操作步骤**:
  1. 创建项目 (TP-003)
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/<NEW_PROJECT_ID>/settings -H "Authorization: Bearer $TOKEN"`
- **预期结果**: settings 包含 `dimension_configs` 数组 (product_analysis 模板应有 8 个维度), `hierarchy_labels` 为 ["产品线","模块","功能项"]
- **验证方式**: API响应检查

### TP-030: F2 项目列表显示正确指标

- **Feature**: F2 项目管理
- **AC**: AC5
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer $TOKEN"`
- **预期结果**: 每个项目卡片包含 `template_type`, `total_nodes`, `total_files`, `avg_completion`
- **验证方式**: API响应检查

### TP-031: F2 修改项目设置

- **Feature**: F2 项目管理
- **AC**: AC7, AC8
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X PATCH http://127.0.0.1:8001/api/projects/$PROJECT_ID/settings -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"hierarchy_labels":["系统","组件","功能"]}'`
  2. 重新获取 settings 验证更新
- **预期结果**: hierarchy_labels 变为 ["系统","组件","功能"]
- **验证方式**: API响应检查

### TP-032: F2 软删除项目

- **Feature**: F2 项目管理
- **AC**: AC15, AC16
- **优先级**: P1
- **前置条件**: E2E 测试项目已创建
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X DELETE http://127.0.0.1:8001/api/projects/<TEST_PROJECT_ID> -H "Authorization: Bearer $TOKEN"`
  2. 检查项目列表不再包含该项目
  3. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/deleted -H "Authorization: Bearer $TOKEN"`
- **预期结果**: 步骤1返回 200; 步骤2列表不含被删项目; 步骤3已删除列表包含该项目
- **验证方式**: API响应检查

### TP-033: F2 恢复已删除项目

- **Feature**: F2 项目管理
- **AC**: AC17
- **优先级**: P1
- **前置条件**: 项目已软删除
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/<TEST_PROJECT_ID>/restore -H "Authorization: Bearer $TOKEN"`
  2. 检查项目列表重新包含该项目
- **预期结果**: 步骤1返回 200; 步骤2列表包含恢复的项目
- **验证方式**: API响应检查

### TP-034: F2 彻底删除项目

- **Feature**: F2 项目管理
- **AC**: AC18
- **优先级**: P1
- **前置条件**: 项目已软删除
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X DELETE http://127.0.0.1:8001/api/projects/<TEST_PROJECT_ID>/permanent -H "Authorization: Bearer $TOKEN"`
  2. 数据库验证: `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT count(*) FROM projects WHERE id='<TEST_PROJECT_ID>';"`
- **预期结果**: 步骤1返回 200; 步骤2计数为 0
- **验证方式**: API响应 + 数据库检查

### TP-035: F2 项目成员邀请

- **Feature**: F2 项目管理
- **AC**: AC10
- **优先级**: P1
- **前置条件**: viewer 用户已创建
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/$PROJECT_ID/members -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"user_id":"<VIEWER_USER_ID>","role":"viewer"}'`
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/members -H "Authorization: Bearer $TOKEN"`
- **预期结果**: 步骤1返回 200/201; 步骤2成员列表包含 viewer
- **验证方式**: API响应检查

### TP-036: F2 修改成员角色

- **Feature**: F2 项目管理
- **AC**: AC10
- **优先级**: P1
- **前置条件**: viewer 已加入项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X PATCH http://127.0.0.1:8001/api/projects/$PROJECT_ID/members/<VIEWER_USER_ID> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"role":"editor"}'`
- **预期结果**: HTTP 200, 成员角色变更为 editor
- **验证方式**: API响应检查

### TP-037: F2 移除项目成员

- **Feature**: F2 项目管理
- **AC**: AC10
- **优先级**: P1
- **前置条件**: viewer 已加入项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X DELETE http://127.0.0.1:8001/api/projects/$PROJECT_ID/members/<VIEWER_USER_ID> -H "Authorization: Bearer $TOKEN"`
  2. 检查成员列表不再包含 viewer
- **预期结果**: 步骤1返回 200; 步骤2成员列表不含 viewer
- **验证方式**: API响应检查

### TP-038: F2 4种模板创建项目

- **Feature**: F2 项目管理
- **AC**: AC2, AC20
- **优先级**: P1
- **前置条件**: 已登录
- **操作步骤**:
  1. 分别用 `product_analysis`, `system_architecture`, `open_source_research`, `custom` 四种 template_type 创建项目
  2. 检查每个项目的 settings 返回的维度配置数量
- **预期结果**: product_analysis=8维度, system_architecture=6维度, open_source_research=9维度, custom=用户自选
- **验证方式**: API响应检查

### TP-039: F2 项目维度启用/禁用

- **Feature**: F2 项目管理
- **AC**: AC7, AC22
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. PATCH settings 禁用一个维度
  2. 验证 dimension_configs 中该维度 enabled=false
- **预期结果**: 维度配置更新成功
- **验证方式**: API响应检查

### F3 功能模块树

### TP-040: F3 树层级标签从配置读取

- **Feature**: F3 功能模块树
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/settings -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('hierarchy_labels'))"`
- **预期结果**: 返回 `["产品线", "模块", "功能项"]` (或项目配置的自定义标签)
- **验证方式**: API响应检查

### TP-041: F3 树节点完善度显示

- **Feature**: F3 功能模块树
- **AC**: AC4
- **优先级**: P1
- **前置条件**: 已有节点且有维度数据
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/tree-overview -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(n['name'], n['completion_percent']) for n in d['tree']]"`
- **预期结果**: 每个节点包含 `completion_percent` 字段 (0-100)
- **验证方式**: API响应检查

### TP-042: F3 选中文件夹节点返回概览

- **Feature**: F3 功能模块树
- **AC**: AC7, AC16
- **优先级**: P1
- **前置条件**: 已有文件夹节点 (如"推理服务")
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/tree-overview -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); folders=[n for n in d['tree'] if n['type']=='folder']; print(json.dumps(folders[0],indent=2,ensure_ascii=False)[:500])"`
- **预期结果**: 文件夹节点包含 children 数组, 以及 filled_dimensions/total_dimensions 统计
- **验证方式**: API响应检查

### TP-043: F3 节点支持多级深度

- **Feature**: F3 功能模块树
- **AC**: AC3
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. 检查已有树结构的深度层级
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/tree-overview -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
def max_depth(nodes,d=0):
    return max([max_depth(n.get('children',[]),d+1) for n in nodes]+[d]) if nodes else d
d=json.load(sys.stdin); print('max_depth:', max_depth(d['tree']))"`
- **预期结果**: 最大深度 >= 2 (产品线 -> 模块 -> 功能项)
- **验证方式**: API响应检查

### TP-044: F3 项目名称和类型 Badge

- **Feature**: F3 功能模块树
- **AC**: AC5
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('name'), d.get('template_type'))"`
- **预期结果**: 返回项目名称 "AI云平台竞品分析" 和类型 "product_analysis"
- **验证方式**: API响应检查

### F4 功能项档案页

### TP-045: F4 维度卡片数量从配置读取

- **Feature**: F4 功能项档案页
- **AC**: AC1, AC2
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. 获取项目维度配置: `curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/settings -H "Authorization: Bearer $TOKEN"`
  2. 统计 enabled=true 的维度数量
- **预期结果**: product_analysis 模板应有 8 个 enabled=true 的维度
- **验证方式**: API响应检查

### TP-046: F4 完善度计算正确

- **Feature**: F4 功能项档案页
- **AC**: AC8, AC9
- **优先级**: P1
- **前置条件**: 功能项 "创建推理服务" 有 5/8 维度填充
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/tree-overview -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
def find_node(nodes, name):
    for n in nodes:
        if n['name']==name: return n
        r=find_node(n.get('children',[]),name)
        if r: return r
d=json.load(sys.stdin); n=find_node(d['tree'],'创建推理服务'); print(n['filled_dimensions'], n['total_dimensions'], n['completion_percent'])"`
- **预期结果**: filled_dimensions=5, total_dimensions=8, completion_percent=62.5
- **验证方式**: API响应检查

### TP-047: F4 维度配置排序顺序

- **Feature**: F4 功能项档案页
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/settings -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(c['sort_order'], c['dimension_name']) for c in d['dimension_configs']]"`
- **预期结果**: dimension_configs 按 sort_order 递增排列
- **验证方式**: API响应检查

### TP-048: F4 面包屑路径正确

- **Feature**: F4 功能项档案页
- **AC**: AC5
- **优先级**: P1
- **前置条件**: 已有节点 "创建推理服务"
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=创建推理服务&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r['breadcrumb']) for r in d['results'] if '创建推理服务' in r.get('title','')]"`
- **预期结果**: breadcrumb 包含 ["AI云平台竞品分析", "私有云", "推理服务", "创建推理服务"]
- **验证方式**: API响应检查

### TP-049: F4 维度记录持久化到 JSONB

- **Feature**: F4 功能项档案页
- **AC**: AC13
- **优先级**: P1
- **前置条件**: 已有维度数据
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT node_id, dimension_type, jsonb_typeof(content) FROM dimension_records LIMIT 5;"`
- **预期结果**: content 列类型为 object/string (JSONB 存储)
- **验证方式**: 数据库检查

### F5 版本演进时间线

### TP-050: F5 版本记录包含变更类型

- **Feature**: F5 版本演进时间线
- **AC**: AC2, AC9
- **优先级**: P1
- **前置条件**: 版本记录存在
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT version, change_type, is_current, description FROM version_records LIMIT 10;"`
- **预期结果**: change_type 为 added/modified/deprecated/split/merged/migrated 之一
- **验证方式**: 数据库检查

### TP-051: F5 版本号唯一约束

- **Feature**: F5 版本演进时间线
- **AC**: AC6
- **优先级**: P1
- **前置条件**: 已有版本记录
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT conname FROM pg_constraint WHERE conrelid='version_records'::regclass AND contype='u';"`
- **预期结果**: 存在唯一约束 (version + node_id 组合唯一)
- **验证方式**: 数据库检查

### TP-052: F5 版本快照数据存储

- **Feature**: F5 版本演进时间线
- **AC**: AC5, AC7
- **优先级**: P1
- **前置条件**: 版本记录存在
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT version, snapshot_data IS NOT NULL as has_snapshot FROM version_records LIMIT 5;"`
- **预期结果**: snapshot_data 列存在 (可能为 null 如果未生成快照)
- **验证方式**: 数据库检查

### F7 问题沉淀

### TP-053: F7 问题分类字段

- **Feature**: F7 问题沉淀
- **AC**: AC1
- **优先级**: P1
- **前置条件**: issues 表存在
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='issues' ORDER BY ordinal_position;"`
- **预期结果**: 包含 category (bug/技术债/设计缺陷/性能), node_id, title, description 等字段
- **验证方式**: 数据库检查

### TP-054: F7 问题标签支持

- **Feature**: F7 问题沉淀
- **AC**: AC3
- **优先级**: P1
- **前置条件**: issues 表存在
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT column_name FROM information_schema.columns WHERE table_name='issues' AND column_name IN ('tags','labels');"`
- **预期结果**: 存在标签字段
- **验证方式**: 数据库检查

### F8 模块关系图

### TP-055: F8 关系类型支持

- **Feature**: F8 模块关系图
- **AC**: AC2
- **优先级**: P1
- **前置条件**: node_relations 表存在
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='node_relations' ORDER BY ordinal_position;"`
- **预期结果**: 包含 source_node_id, target_node_id, relation_type 字段
- **验证方式**: 数据库检查

### TP-056: F8 关系图数据包含节点和边

- **Feature**: F8 模块关系图
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/relations -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('nodes:', len(d.get('nodes',[])), 'edges:', len(d.get('edges',[])))"`
- **预期结果**: nodes 数组包含项目所有节点, edges 数组包含节点间关联
- **验证方式**: API响应检查

### F9 搜索

### TP-057: F9 搜索覆盖节点名称

- **Feature**: F9 搜索
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 节点 "推理服务" 存在
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=推理服务&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['total']); [print(r['type'], r['title']) for r in d['results'][:5]]"`
- **预期结果**: total > 0, 结果中包含 type=node 的 "推理服务"
- **验证方式**: API响应检查

### TP-058: F9 搜索结果带面包屑

- **Feature**: F9 搜索
- **AC**: AC3
- **优先级**: P1
- **前置条件**: 已有搜索结果
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=创建推理&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r.get('breadcrumb')) for r in d['results'][:3]]"`
- **预期结果**: 每条结果的 breadcrumb 数组非空, 包含从项目到功能项的路径
- **验证方式**: API响应检查

### TP-059: F9 搜索结果标注来源项目

- **Feature**: F9 搜索
- **AC**: AC7
- **优先级**: P1
- **前置条件**: 已有搜索结果
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=推理&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r.get('project_name')) for r in d['results'][:3]]"`
- **预期结果**: 每条结果包含 project_name 字段
- **验证方式**: API响应检查

### TP-060: F9 搜索结果包含项目ID过滤

- **Feature**: F9 搜索
- **AC**: AC6
- **优先级**: P1
- **前置条件**: 已有搜索结果
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=推理&user_id=$USER_ID&project_id=$PROJECT_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); projects=set(r.get('project_id') for r in d['results']); print(projects)"`
- **预期结果**: 所有结果的 project_id 等于指定的 PROJECT_ID
- **验证方式**: API响应检查

### TP-061: F9 空搜索返回空列表

- **Feature**: F9 搜索
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=ZZZZNOTEXIST999&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('total:', d['total'], 'results:', len(d['results']))"`
- **预期结果**: total=0, results=[]
- **验证方式**: API响应检查

### F10 项目全景图

### TP-062: F10 统计数据一致性

- **Feature**: F10 项目全景图
- **AC**: AC5
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/stats -H "Authorization: Bearer $TOKEN" | python3 -m json.tool`
  2. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT count(*) FILTER (WHERE node_type='folder') as folders, count(*) FILTER (WHERE node_type='file') as files FROM nodes WHERE project_id='$PROJECT_ID';"`
- **预期结果**: API 返回的 total_folders 和 total_files 与数据库计数一致
- **验证方式**: API响应 + 数据库交叉验证

### F12 功能对比矩阵

### TP-063: F12 对比结果编辑

- **Feature**: F12 功能对比矩阵
- **AC**: AC3
- **优先级**: P1
- **前置条件**: 已有对比记录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X PUT http://127.0.0.1:8001/api/comparison/<COMPARISON_ID> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"rows":[{"feature":"测试功能","our_product":"有","competitor_a":"无"}]}'`
- **预期结果**: HTTP 200, 对比数据更新成功
- **验证方式**: API响应检查

### TP-064: F12 对比结果导出

- **Feature**: F12 功能对比矩阵
- **AC**: AC5
- **优先级**: P1
- **前置条件**: 已有对比记录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/comparison/<COMPARISON_ID>/export -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 200, 返回导出内容
- **验证方式**: API响应检查

### TP-065: F12 回填到竞品参考

- **Feature**: F12 功能对比矩阵
- **AC**: AC6
- **优先级**: P1
- **前置条件**: 已有对比记录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/comparison/<COMPARISON_ID>/backfill -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"<NODE_ID>","competitor_id":"<COMP_ID>"}'`
- **预期结果**: HTTP 200, 竞品参考维度记录已创建/更新
- **验证方式**: API响应检查

### TP-066: F12 获取项目下对比列表

- **Feature**: F12 功能对比矩阵
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/$PROJECT_ID/comparison -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, 返回对比列表数组
- **验证方式**: API响应检查

### F13 需求分析

### TP-067: F13 L1 快速分析

- **Feature**: F13 需求分析
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 功能项有维度数据
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze/requirement -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","requirement_text":"新增GPU配额功能","analysis_level":"L1"}'`
- **预期结果**: HTTP 200, 返回分析结果 (影响范围/完整性/合理性)
- **验证方式**: API响应检查

### TP-068: F13 保存分析结果

- **Feature**: F13 需求分析
- **AC**: AC5
- **优先级**: P1
- **前置条件**: 已完成分析
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze/save -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","analysis_result":"测试分析结果"}'`
- **预期结果**: HTTP 200, 分析结果保存到需求分析维度
- **验证方式**: API响应检查

### TP-069: F13 生成测试点

- **Feature**: F13 需求分析
- **AC**: AC6
- **优先级**: P1
- **前置条件**: 已完成分析
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze/generate-test-points -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","analysis_result":"GPU配额限制功能需求分析"}'`
- **预期结果**: HTTP 200, 返回测试点列表
- **验证方式**: API响应检查

### TP-070: F13 保存测试点

- **Feature**: F13 需求分析
- **AC**: AC7
- **优先级**: P1
- **前置条件**: 已生成测试点
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze/save-test-points -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","test_points":[{"name":"测试点1","description":"验证配额限制","priority":"P0"}]}'`
- **预期结果**: HTTP 200, 测试点保存到测试分析维度
- **验证方式**: API响应检查

### TP-071: F13 通用分析端点

- **Feature**: F13 需求分析
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 功能项存在
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","content":"分析推理服务的扩缩容策略"}'`
- **预期结果**: HTTP 200, 返回分析结果
- **验证方式**: API响应检查

### F14 行业动态

### TP-072: F14 创建 Feed Source

- **Feature**: F14 行业动态
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/feed/sources -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"NVIDIA Blog","url":"https://blogs.nvidia.com/feed/","type":"rss"}'`
- **预期结果**: HTTP 200/201, 返回 source id
- **验证方式**: API响应检查

### TP-073: F14 Feed Source 列表

- **Feature**: F14 行业动态
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 已创建 source
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/feed/sources -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, 列表包含已创建的 source
- **验证方式**: API响应检查

### TP-074: F14 修改 Feed Source

- **Feature**: F14 行业动态
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 已创建 source
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X PUT http://127.0.0.1:8001/api/feed/sources/<SOURCE_ID> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"NVIDIA AI Blog","url":"https://blogs.nvidia.com/feed/","type":"rss"}'`
- **预期结果**: HTTP 200, source 名称已更新
- **验证方式**: API响应检查

### TP-075: F14 删除 Feed Source

- **Feature**: F14 行业动态
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 已创建 source
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X DELETE http://127.0.0.1:8001/api/feed/sources/<SOURCE_ID> -H "Authorization: Bearer $TOKEN"`
  2. 验证 source 列表不再包含该 source
- **预期结果**: 步骤1返回 200; 步骤2列表不含已删除 source
- **验证方式**: API响应检查

### TP-076: F14 获取 Feed Items

- **Feature**: F14 行业动态
- **AC**: AC4
- **优先级**: P1
- **前置条件**: 已有 feed source
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/feed/items -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, 返回 feed items 列表 (可能为空)
- **验证方式**: API响应检查

### F15 数据流转可视化

### TP-077: F15 活动日志表存在

- **Feature**: F15 数据流转可视化
- **AC**: AC4
- **优先级**: P1
- **前置条件**: 数据库就绪
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='analysis_tasks' ORDER BY ordinal_position;"`
- **预期结果**: analysis_tasks 表存在且包含 task_type, status 等字段
- **验证方式**: 数据库检查

### F16 AI 生成当前快照

### TP-078: F16 快照生成使用 snake_case

- **Feature**: F16 AI生成当前快照
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 功能项有维度数据
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/snapshot/generate -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","project_id":"'$PROJECT_ID'"}'`
- **预期结果**: HTTP 200 (非 422), 请求使用 snake_case 字段名
- **验证方式**: API响应检查 (验证 BUG-051 修复)

### TP-079: F16 快照保存使用正确结构

- **Feature**: F16 AI生成当前快照
- **AC**: AC3
- **优先级**: P1
- **前置条件**: 已生成快照
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/snapshot/save -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","project_id":"'$PROJECT_ID'","summary":"GPU推理服务快照","dimensions":[{"dimension_type_key":"description","content":"GPU推理服务描述"}]}'`
- **预期结果**: HTTP 200 (非 422), 使用 snake_case + dimensions 结构匹配后端 schema
- **验证方式**: API响应检查 (验证 BUG-052 修复)

### F17 AI 智能导入

### TP-080: F17 AI 分析包含 user_id

- **Feature**: F17 AI智能导入
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/import/ai-analyze -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","user_id":"'$USER_ID'","files":[{"name":"test.md","path":"test.md","content":"# 测试","format":"markdown"}]}'`
- **预期结果**: HTTP 200 (非 422), 包含 user_id 不被拒绝
- **验证方式**: API响应检查 (验证 BUG-054 修复方向)

### TP-081: F17 AI 分析响应包含 mapping_rows

- **Feature**: F17 AI智能导入
- **AC**: AC2
- **优先级**: P1
- **前置条件**: AI 分析已调用
- **操作步骤**:
  1. 检查 TP-080 的响应体
- **预期结果**: 响应包含 `mapping_rows` 字段 (非 `mappings`)
- **验证方式**: API响应检查 (验证 BUG-056)

### TP-082: F17 确认导入端点

- **Feature**: F17 AI智能导入
- **AC**: AC7
- **优先级**: P1
- **前置条件**: AI 分析完成, 有 session_id
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/import/ai-confirm -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"session_id":"<SESSION_ID>","project_id":"'$PROJECT_ID'","user_id":"'$USER_ID'","mapping_rows":[...]}'`
- **预期结果**: HTTP 200, 返回包含 `session_id` 字段的结果
- **验证方式**: API响应检查 (验证 BUG-059/BUG-060)

### TP-083: F17 撤销导入端点

- **Feature**: F17 AI智能导入
- **AC**: AC10
- **优先级**: P1
- **前置条件**: 已确认导入, 有 session_id
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/import/undo -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"session_id":"<SESSION_ID>","project_id":"'$PROJECT_ID'","user_id":"'$USER_ID'","created_node_ids":["<NODE_ID>"]}'`
- **预期结果**: HTTP 200, 导入的节点被删除
- **验证方式**: API响应检查 (验证 BUG-061)

### TP-084: F17 上传文件端点

- **Feature**: F17 AI智能导入
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/import/upload -H "Authorization: Bearer $TOKEN" -F "file=@/dev/null;filename=test.zip"`
- **预期结果**: HTTP 200 或 400 (合理错误, 非 500)
- **验证方式**: API响应检查

### F18 混合搜索

### TP-085: F18 搜索结果包含 match_type

- **Feature**: F18 混合搜索
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 有可搜索数据
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=推理服务&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r.get('match_type')) for r in d['results'][:5]]"`
- **预期结果**: match_type 为 keyword/semantic/both 之一
- **验证方式**: API响应检查

### TP-086: F18 语义搜索返回语义相关结果

- **Feature**: F18 混合搜索
- **AC**: AC3
- **优先级**: P1
- **前置条件**: embeddings 表有数据
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=GPU计算资源&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r['match_type'], r['title']) for r in d['results'][:5]]"`
- **预期结果**: 结果中包含 match_type=semantic 的语义相关结果 (如命中"推理服务"等)
- **验证方式**: API响应检查

### TP-087: F18 搜索结果包含 score

- **Feature**: F18 混合搜索
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 有搜索结果
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=推理&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r.get('score'), r['title']) for r in d['results'][:5]]"`
- **预期结果**: 每条结果包含 score 字段 (RRF 融合得分)
- **验证方式**: API响应检查

### TP-088: F18 降级到纯关键词搜索

- **Feature**: F18 混合搜索
- **AC**: AC4
- **优先级**: P1
- **前置条件**: pgvector 不可用或无 embedding 数据时
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/?q=推理" | python3 -c "import sys,json; d=json.load(sys.stdin); print('results:', len(d.get('results',[])))"`
- **预期结果**: HTTP 200, 降级搜索仍返回关键词匹配结果
- **验证方式**: API响应检查

### F19 导入/导出

### TP-089: F19 导出节点

- **Feature**: F19 导入/导出
- **AC**: AC2
- **优先级**: P1
- **前置条件**: 已有节点
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/export/nodes -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_ids":["619965eb-d7fb-4624-99fe-81fab5b2e24f"]}'`
- **预期结果**: HTTP 200, 返回 Markdown 格式的节点内容
- **验证方式**: API响应检查

### TP-090: F19 Markdown 导入

- **Feature**: F19 导入/导出
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 已有项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/import/markdown -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","content":"# 测试功能\n这是一个测试"}'`
- **预期结果**: HTTP 200, 返回导入结果
- **验证方式**: API响应检查

### F20 团队/空间

### TP-091: F20 团队表结构

- **Feature**: F20 团队/空间
- **AC**: AC1
- **优先级**: P1
- **前置条件**: 数据库就绪
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='teams' ORDER BY ordinal_position;"`
- **预期结果**: teams 表包含 id, name, description 等字段
- **验证方式**: 数据库检查

### TP-092: F20 团队成员表结构

- **Feature**: F20 团队/空间
- **AC**: AC3
- **优先级**: P1
- **前置条件**: 数据库就绪
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='team_members' ORDER BY ordinal_position;"`
- **预期结果**: team_members 表包含 team_id, user_id, role 等字段
- **验证方式**: 数据库检查

### 跨 Feature 测试

### TP-093: 端点尾部斜杠一致性

- **Feature**: 跨Feature
- **AC**: -
- **优先级**: P1
- **前置条件**: 服务运行
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/health && echo " /health"` 
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/health/ && echo " /health/"`
- **预期结果**: /health 返回 307, /health/ 返回 200 (已知行为, BUG-003 环境问题)
- **验证方式**: API响应检查

### TP-094: 所有 API 端点需要认证

- **Feature**: 跨Feature
- **AC**: F1 AC3
- **优先级**: P1
- **前置条件**: 无
- **操作步骤**:
  1. 逐个测试无 Token 访问:
  ```
  unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
  for ep in "/api/projects/" "/api/auth/me" "/api/auth/users" "/search/unified?q=test&user_id=x"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8001$ep")
    echo "$code $ep"
  done
  ```
- **预期结果**: 所有受保护端点返回 401 (除 /health/, /api/auth/login, /api/auth/refresh)
- **验证方式**: API响应检查

---

## P2 回归测试（基于 Bug 历史）

### TP-095: SQL 注入防护 (BUG-003 C1)

- **Feature**: F9 搜索
- **AC**: -
- **优先级**: P2
- **前置条件**: 搜索功能可用
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=' OR 1=1--&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print('total:', d.get('total',0))"`
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q='; DROP TABLE nodes;--&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN"`
- **预期结果**: 返回 200 且 total=0 (或正常空结果), 不触发 SQL 错误, nodes 表未受影响
- **验证方式**: API响应检查 + 数据库检查
- **关联 BUG**: BUG-003 C1 (search API 曾用 f-string 直拼 SQL)

### TP-096: 搜索参数化验证 - 代码审查 (BUG-003 C1)

- **Feature**: F9 搜索
- **AC**: -
- **优先级**: P2
- **前置条件**: 代码可读
- **操作步骤**:
  1. 审查 `api/services/search.py` 和 `api/services/hybrid_search.py`, 确认无 f-string SQL 拼接
- **预期结果**: 所有 SQL 查询使用参数化变量传递, 无 f-string 拼接
- **验证方式**: 代码审查
- **关联 BUG**: BUG-003 C1

### TP-097: 项目创建失败时不静默成功 (BUG-003 C3)

- **Feature**: F2 项目管理
- **AC**: -
- **优先级**: P2
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"","template_type":"invalid_type","user_id":"'$USER_ID'"}'`
- **预期结果**: HTTP 400/422, 返回明确错误信息 (非 200 成功)
- **验证方式**: API响应检查
- **关联 BUG**: BUG-003 C3 (project 创建 DB 失败时曾静默成功)

### TP-098: DB 错误返回 503 而非 404 (BUG-003 H3)

- **Feature**: F1 用户系统
- **AC**: -
- **优先级**: P2
- **前置条件**: 代码可读
- **操作步骤**:
  1. 审查 `api/routers/auth.py`, 确认 DB 异常处理返回 503
- **预期结果**: DB 连接失败时返回 503 Service Unavailable, 而非 404/401
- **验证方式**: 代码审查
- **关联 BUG**: BUG-003 H3

### TP-099: N+1 查询修复验证 (BUG-003 H1/H2)

- **Feature**: F2 项目管理 / F9 搜索
- **AC**: -
- **优先级**: P2
- **前置条件**: 代码可读
- **操作步骤**:
  1. 审查 `api/services/project_stats.py` 和 `api/services/project_crud.py`, 确认使用 group_by 聚合
  2. 审查 `api/services/search.py`, 确认使用 outerjoin
- **预期结果**: 无循环内逐条查 DB 的 N+1 模式
- **验证方式**: 代码审查
- **关联 BUG**: BUG-003 H1, H2

### TP-100: 未登录重定向 (BUG-020)

- **Feature**: F1 用户系统
- **AC**: AC3
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8001/api/projects/`
- **预期结果**: HTTP 401 (非 500 白屏)
- **验证方式**: API响应检查
- **关联 BUG**: BUG-020 (首页未登录曾抛异常白屏)

### TP-101: 搜索面包屑包含节点自身名称 (BUG-039)

- **Feature**: F9 搜索
- **AC**: AC3
- **优先级**: P2
- **前置条件**: 有搜索结果
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=创建推理服务&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r['breadcrumb']) for r in d['results'] if '创建推理服务' in r.get('title','')]"`
- **预期结果**: breadcrumb 末尾包含节点自身名称 "创建推理服务"
- **验证方式**: API响应检查
- **关联 BUG**: BUG-039 (面包屑曾缺少节点自身名称)

### TP-102: 非 UUID user_id 不导致 500 (BUG-040)

- **Feature**: F9 搜索
- **AC**: -
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8001/search/unified?q=test&user_id=not-a-uuid" -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200 (空结果) 或 422 (参数校验失败), 非 500
- **验证方式**: API响应检查
- **关联 BUG**: BUG-040 (非UUID的user_id曾导致500)

### TP-103: F13 需求分析字段对齐 - analysis_level (BUG-049)

- **Feature**: F13 需求分析
- **AC**: AC2
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze/requirement -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","requirement_text":"测试","analysis_level":"L2"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 200 (非 422), 字段名 analysis_level 被正确接收
- **验证方式**: API响应检查
- **关联 BUG**: BUG-049 (前端曾发 level 而非 analysis_level)

### TP-104: F13 测试点生成 schema 正确 (BUG-050)

- **Feature**: F13 需求分析
- **AC**: AC6
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze/generate-test-points -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","analysis_result":"测试分析结果"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 200 (非 422), 使用 node_id + analysis_result 字段
- **验证方式**: API响应检查
- **关联 BUG**: BUG-050 (前端曾发 requirement_text + affected_modules)

### TP-105: F16 快照生成使用 snake_case (BUG-051)

- **Feature**: F16 AI生成当前快照
- **AC**: AC2
- **优先级**: P2
- **前置条件**: 功能项存在
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/snapshot/generate -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","project_id":"'$PROJECT_ID'"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 200 (非 422), snake_case 字段名被接受
- **验证方式**: API响应检查
- **关联 BUG**: BUG-051 (前端曾发 camelCase nodeId)

### TP-106: F16 快照保存 dimensions 结构正确 (BUG-052)

- **Feature**: F16 AI生成当前快照
- **AC**: AC3
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/snapshot/save -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","project_id":"'$PROJECT_ID'","summary":"test","dimensions":[{"dimension_type_key":"description","content":"test"}]}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 200 (非 422), dimensions 使用 DimensionSaveItem 结构
- **验证方式**: API响应检查
- **关联 BUG**: BUG-052 (前端曾发 selectedDimensions 不匹配后端 schema)

### TP-107: F17 AI 分析文件字段使用 name/path (BUG-055)

- **Feature**: F17 AI智能导入
- **AC**: AC2
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/import/ai-analyze -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"project_id":"'$PROJECT_ID'","user_id":"'$USER_ID'","files":[{"name":"test.md","path":"docs/test.md","content":"# 测试","format":"markdown"}]}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(type(d))"`
- **预期结果**: 后端正确读取 name 和 path 字段 (非 file_name/file_path)
- **验证方式**: API响应检查
- **关联 BUG**: BUG-055 (前端曾发 file_name/file_path)

### TP-108: F17 AI 确认导入字段名对齐 (BUG-059)

- **Feature**: F17 AI智能导入
- **AC**: AC7
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. 审查后端 `api/routers/import_.py` 确认请求字段名:
     - ai-confirm 端点期望: session_id, project_id, user_id, mapping_rows
     - undo 端点期望: session_id, project_id, user_id, created_node_ids
- **预期结果**: 后端 Pydantic schema 字段名与上述一致
- **验证方式**: 代码审查
- **关联 BUG**: BUG-059, BUG-061

### TP-109: F17 导入端点认证检查 (BUG-062)

- **Feature**: F17 AI智能导入
- **AC**: -
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. 无 Token 访问导入端点:
  ```
  unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
  for ep in "/api/import/ai-analyze" "/api/import/ai-confirm" "/api/import/undo"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://127.0.0.1:8001$ep" -H "Content-Type: application/json" -d '{}')
    echo "$code $ep"
  done
  ```
- **预期结果**: 所有导入端点返回 401 (非 200/422)
- **验证方式**: API响应检查
- **关联 BUG**: BUG-062 (前端曾绕过 Server Action 直接 fetch)

### TP-110: F18 语义搜索面包屑不为空 (BUG-063)

- **Feature**: F18 混合搜索
- **AC**: AC5
- **优先级**: P2
- **前置条件**: 有语义搜索结果
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=GPU计算&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r['match_type'], r.get('breadcrumb')) for r in d['results'][:5]]"`
- **预期结果**: match_type=semantic 的结果也包含非空 breadcrumb
- **验证方式**: API响应检查
- **关联 BUG**: BUG-063 (语义搜索结果曾 breadcrumb=None)

### TP-111: F18 Issue 搜索列名正确 (BUG-064)

- **Feature**: F18 混合搜索
- **AC**: -
- **优先级**: P2
- **前置条件**: 代码可读
- **操作步骤**:
  1. 审查 `api/services/hybrid_search.py`, 确认 Issue 搜索使用 `i.category` 而非 `i.type`
- **预期结果**: 无 `i.type` 引用, 全部使用 `i.category`
- **验证方式**: 代码审查
- **关联 BUG**: BUG-064 (SQL 曾引用不存在的列 i.type)

### TP-112: 搜索 API search_mode 字段传递 (BUG-066)

- **Feature**: F18 混合搜索
- **AC**: -
- **优先级**: P2
- **前置条件**: 代码可读
- **操作步骤**:
  1. 审查 `api/schemas/search.py` 的 `SearchResponse` schema, 确认是否包含 `search_mode` 字段
- **预期结果**: SearchResponse 包含 `search_mode: str` 字段
- **验证方式**: 代码审查
- **关联 BUG**: BUG-066 (search_mode 曾被 Pydantic 过滤)

### TP-113: F12 对比生成使用 UUID (BUG-045)

- **Feature**: F12 功能对比矩阵
- **AC**: AC1
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. 审查 `api/routers/comparison.py` 的 generate 端点 schema, 确认请求字段为 node_ids: List[UUID], competitor_ids: List[UUID]
- **预期结果**: 使用 UUID-based 请求 (非 feature_name/competitors: string[])
- **验证方式**: 代码审查
- **关联 BUG**: BUG-045 (前端曾发 feature_name + competitors string[])

### TP-114: F12 对比导出使用 path param (BUG-046)

- **Feature**: F12 功能对比矩阵
- **AC**: AC5
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. 确认导出 URL 格式: `GET /api/comparison/{comparison_id}/export` (非 query param)
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/openapi.json | python3 -c "import sys,json; d=json.load(sys.stdin); print([p for p in d['paths'] if 'export' in p and 'comparison' in p])"`
- **预期结果**: 导出 URL 使用 path parameter `{comparison_id}` (非 query param `?project_id=`)
- **验证方式**: OpenAPI schema 检查
- **关联 BUG**: BUG-046

### TP-115: F12 高亮使用 score 字段 (BUG-048)

- **Feature**: F12 功能对比矩阵
- **AC**: AC4
- **优先级**: P2
- **前置条件**: 代码可读
- **操作步骤**:
  1. 审查前端对比组件, 确认高亮逻辑使用 `ComparisonCell.score` 而非 `ComparisonCell.highlight`
- **预期结果**: 高亮判断基于 score 字段
- **验证方式**: 代码审查
- **关联 BUG**: BUG-048

### TP-116: F13 保存分析使用 analysis_result: str (BUG-043)

- **Feature**: F13 需求分析
- **AC**: AC5
- **优先级**: P2
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/analyze/save -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"node_id":"619965eb-d7fb-4624-99fe-81fab5b2e24f","analysis_result":"测试分析JSON字符串"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 200 (非 422), analysis_result 为 str 类型 (非 { layers } 对象)
- **验证方式**: API响应检查
- **关联 BUG**: BUG-043 (前端曾发 { layers } 对象)

---

## P3 边界测试

### TP-117: 空数据 - 新项目无节点

- **Feature**: F3 功能模块树
- **AC**: -
- **优先级**: P3
- **前置条件**: 新建空项目
- **操作步骤**:
  1. 创建新项目, 不添加任何节点
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/<EMPTY_PROJECT_ID>/tree-overview -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, tree=[] (空数组), 非 500
- **验证方式**: API响应检查

### TP-118: 空数据 - 新项目无版本

- **Feature**: F5 版本演进时间线
- **AC**: -
- **优先级**: P3
- **前置条件**: 新功能项
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT count(*) FROM version_records WHERE node_id='<NEW_NODE_ID>';"`
- **预期结果**: count=0, 无版本记录时 API 返回空列表而非错误
- **验证方式**: 数据库检查

### TP-119: 空数据 - 搜索无匹配

- **Feature**: F9 搜索
- **AC**: -
- **优先级**: P3
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=xyznonexistent123&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN"`
- **预期结果**: HTTP 200, `{"query":"xyznonexistent123","total":0,"results":[]}`
- **验证方式**: API响应检查

### TP-120: 权限 - Viewer 不能创建项目

- **Feature**: F2 项目管理
- **AC**: AC11
- **优先级**: P3
- **前置条件**: viewer 用户已创建
- **操作步骤**:
  1. 用 viewer 账号登录获取 Token
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer $VIEWER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Unauthorized","template_type":"custom","user_id":"<VIEWER_ID>"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 403 (非 200/201)
- **验证方式**: API响应检查

### TP-121: 权限 - Viewer 不能 PATCH 项目

- **Feature**: F2 项目管理
- **AC**: AC11
- **优先级**: P3
- **前置条件**: viewer 用户已加入项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X PATCH http://127.0.0.1:8001/api/projects/$PROJECT_ID -H "Authorization: Bearer $VIEWER_TOKEN" -H "Content-Type: application/json" -d '{"name":"Hacked"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 403 (非 200)
- **验证方式**: API响应检查

### TP-122: 权限 - Viewer 不能 DELETE 项目

- **Feature**: F2 项目管理
- **AC**: AC11
- **优先级**: P3
- **前置条件**: viewer 用户已加入项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X DELETE http://127.0.0.1:8001/api/projects/$PROJECT_ID -H "Authorization: Bearer $VIEWER_TOKEN" -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 403 (非 200)
- **验证方式**: API响应检查

### TP-123: 权限 - Viewer 不能添加成员

- **Feature**: F2 项目管理
- **AC**: AC11
- **优先级**: P3
- **前置条件**: viewer 用户已加入项目
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/$PROJECT_ID/members -H "Authorization: Bearer $VIEWER_TOKEN" -H "Content-Type: application/json" -d '{"user_id":"<SOME_ID>","role":"editor"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 403 (非 200/201)
- **验证方式**: API响应检查

### TP-124: 输入 - 超长项目名称

- **Feature**: F2 项目管理
- **AC**: -
- **优先级**: P3
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"'$(python3 -c "print('A'*10000)")'","template_type":"custom","user_id":"'$USER_ID'"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 400/422 (参数校验失败), 或 200 截断处理, 非 500
- **验证方式**: API响应检查

### TP-125: 输入 - 特殊字符项目名称

- **Feature**: F2 项目管理
- **AC**: -
- **优先级**: P3
- **前置条件**: 已登录
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s -X POST http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name":"<script>alert(1)</script>","template_type":"custom","user_id":"'$USER_ID'"}' -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 200 (名称原样存储) 或 400 (拒绝), 非 500. 如果存储, 后续读取时应转义
- **验证方式**: API响应检查

### TP-126: 输入 - 空字符串搜索

- **Feature**: F9 搜索
- **AC**: -
- **优先级**: P3
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s "http://127.0.0.1:8001/search/unified?q=&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 200 (空结果) 或 422 (参数校验), 非 500
- **验证方式**: API响应检查

### TP-127: 输入 - 不存在的项目 ID

- **Feature**: F2 项目管理
- **AC**: -
- **优先级**: P3
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/00000000-0000-0000-0000-000000000000 -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 404 (非 500)
- **验证方式**: API响应检查

### TP-128: 输入 - 非 UUID 格式的项目 ID

- **Feature**: F2 项目管理
- **AC**: -
- **优先级**: P3
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/not-a-uuid -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 422 (参数校验失败), 非 500
- **验证方式**: API响应检查

### TP-129: 删除 - 软删除项目后 API 行为

- **Feature**: F2 项目管理
- **AC**: AC16
- **优先级**: P3
- **前置条件**: 项目已软删除
- **操作步骤**:
  1. 软删除项目后尝试访问该项目的 tree-overview
  2. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/<DELETED_ID>/tree-overview -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 404 (项目已删除), 非 200
- **验证方式**: API响应检查

### TP-130: 认证 - 过期 Token 被拒绝

- **Feature**: F1 用户系统
- **AC**: AC6
- **优先级**: P3
- **前置条件**: 一个已知过期的 JWT
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid" -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 401 (Token 无效/过期)
- **验证方式**: API响应检查

### TP-131: 认证 - 无效格式 Token

- **Feature**: F1 用户系统
- **AC**: AC6
- **优先级**: P3
- **前置条件**: 无
- **操作步骤**:
  1. `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY && curl -s http://127.0.0.1:8001/api/projects/ -H "Authorization: Bearer not_a_jwt" -o /dev/null -w "%{http_code}"`
- **预期结果**: HTTP 401 (非 500)
- **验证方式**: API响应检查

### TP-132: 并发 - 多个搜索请求不互相干扰

- **Feature**: F9 搜索
- **AC**: -
- **优先级**: P3
- **前置条件**: 服务运行
- **操作步骤**:
  1. 并发发送 5 个不同搜索请求:
  ```
  unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
  for q in "推理" "扩缩" "配额" "镜像" "GPU"; do
    curl -s "http://127.0.0.1:8001/search/unified?q=$q&user_id=$USER_ID" -H "Authorization: Bearer $TOKEN" -o /dev/null -w "%{http_code} $q\n" &
  done
  wait
  ```
- **预期结果**: 所有请求返回 200, 无 500
- **验证方式**: API响应检查

### TP-133: 数据库 - 表关系完整性

- **Feature**: 跨Feature
- **AC**: -
- **优先级**: P3
- **前置条件**: 数据库就绪
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT count(*) FROM nodes WHERE project_id NOT IN (SELECT id FROM projects);"`
- **预期结果**: count=0 (无孤儿节点)
- **验证方式**: 数据库检查

### TP-134: 数据库 - 20 张表全部存在

- **Feature**: 跨Feature
- **AC**: -
- **优先级**: P3
- **前置条件**: 数据库就绪
- **操作步骤**:
  1. `PGPASSWORD=prism_dev_2026 psql -h 127.0.0.1 -U prism -d prism -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"`
- **预期结果**: count=20
- **验证方式**: 数据库检查

---

## 附录: 测试数据清理

测试执行后需清理的数据:
- E2E 测试项目: DELETE /api/projects/<test_project_id>/permanent
- 测试用户 viewer@prism.dev: PATCH status=disabled 或 DELETE
- 测试 Feed Source: DELETE /api/feed/sources/<source_id>

## 附录: Bug 覆盖矩阵

| BUG ID | 测试点 | 验证方式 |
|--------|--------|---------|
| BUG-003 C1 | TP-095, TP-096 | API + 代码审查 |
| BUG-003 C3 | TP-097 | API |
| BUG-003 H1/H2 | TP-099 | 代码审查 |
| BUG-003 H3 | TP-098 | 代码审查 |
| BUG-020 | TP-100 | API |
| BUG-039 | TP-101 | API |
| BUG-040 | TP-102 | API |
| BUG-043 | TP-116 | API |
| BUG-045 | TP-113 | 代码审查 |
| BUG-046 | TP-114 | OpenAPI schema |
| BUG-048 | TP-115 | 代码审查 |
| BUG-049 | TP-103 | API |
| BUG-050 | TP-104 | API |
| BUG-051 | TP-105 | API |
| BUG-052 | TP-106 | API |
| BUG-055 | TP-107 | API |
| BUG-059 | TP-108 | 代码审查 |
| BUG-061 | TP-108 | 代码审查 |
| BUG-062 | TP-109 | API |
| BUG-063 | TP-110 | API |
| BUG-064 | TP-111 | 代码审查 |
| BUG-066 | TP-112 | 代码审查 |
