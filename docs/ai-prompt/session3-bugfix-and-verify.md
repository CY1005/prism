# Session 3: 修复 E2E 测试发现的 Bug + 回归验证

> 使用方式：Session 2 完成后，新开 Claude Code session，粘贴下方 ``` 内的全部内容
> 前置条件：Session 2 已完成（e2e-test-results.md + bug-log.md 已就绪）
> 2个Agent顺序执行：修复(sonnet) → 验证(sonnet)
> 预估：200-300次工具调用，$10-18

---

```
Create a team with 2 agents to fix E2E bugs and verify fixes for Prism.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md
Bug详情: docs/testing/bug-log.md（BUG-068 ~ BUG-082，含精确 file:line）
测试结果: docs/testing/e2e-test-results.md（155个测试点执行结果）
测试点: docs/testing/e2e-test-points.md（含具体 curl 命令）
环境:
  - 前端: http://localhost:3001
  - 后端 API: http://localhost:8001
  - 数据库: postgres://prism:prism_dev_2026@127.0.0.1:5432/prism
  - **所有 curl/psql 命令前必须**: `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY`
  - API 端点需要尾部斜杠

## 执行顺序（严格顺序，不可并行）

1. Agent 1 按优先级修复全部 bug
2. Agent 1 完成后通知 Agent 2
3. Agent 2 重新执行所有之前 FAIL 的测试点，验证修复

## Agent 1 — Bug 修复 (model: sonnet)

你负责按 Critical → High → Medium → Low 顺序修复 BUG-068 ~ BUG-082。

### 开始前

1. 确认服务可用:
   ```
   unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
   curl -s http://127.0.0.1:8001/health/
   ```
2. 如果不可用，先启动:
   ```
   cd /root/cy/prism && docker compose up -d
   cd /root/cy/prism && PYTHONPATH=/root/cy/prism uvicorn api.main:app --host 0.0.0.0 --port 8001 > /tmp/api.log 2>&1 &
   cd /root/cy/prism/web && PORT=3001 npm run dev > /tmp/web.log 2>&1 &
   ```
3. 必读 docs/testing/bug-log.md 中 BUG-068 ~ BUG-082 的完整根因分析

### 修复顺序和方案

#### 批次 1：Critical 安全漏洞（2个，预估15分钟）

**BUG-075: /search/unified 无认证保护**
- 文件: `api/routers/search.py:127`
- 方案: 给 `search_unified` 添加 `user: User = Depends(require_user)`，用 `str(user.id)` 替代 query 参数 `user_id`
- 验证: `curl -s http://127.0.0.1:8001/search/unified/?q=test` 应返回 401

**BUG-076: Viewer 可创建项目**
- 文件: `api/routers/projects.py:57-67`
- 方案: 在 `create_new_project` 中添加角色检查，viewer 返回 403
- 验证: 用 viewer token 调用 POST /api/projects/ 应返回 403

#### 批次 2：High 核心功能（3个，预估45分钟）

**BUG-068: version_records 表缺少列**
- 方案: 手动执行 ALTER TABLE 添加 change_type/snapshot_data/mode 列
  ```
  psql postgres://prism:prism_dev_2026@127.0.0.1:5432/prism -c "
    ALTER TABLE version_records ADD COLUMN IF NOT EXISTS change_type VARCHAR(50) DEFAULT 'feature_added';
    ALTER TABLE version_records ADD COLUMN IF NOT EXISTS snapshot_data JSONB DEFAULT '{}';
    ALTER TABLE version_records ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'manual';
  "
  ```
- 验证: psql 查询确认列已存在

**BUG-069: 无节点 CRUD 端点**
- 文件: 新建 `api/routers/nodes.py`
- 方案: 实现 POST/PATCH/DELETE 节点端点，注册到 `api/main.py`
- 参考: 现有 `api/models/tables.py` 中 Node 模型定义
- 端点设计:
  - POST /api/projects/{project_id}/nodes/ — 创建节点（需 name, parent_id, node_type）
  - PATCH /api/projects/{project_id}/nodes/{node_id} — 修改节点
  - DELETE /api/projects/{project_id}/nodes/{node_id} — 删除节点
- 验证: POST 创建节点返回 201，GET tree-overview 中可见新节点

**BUG-070: Issues 列名不一致 + 无 CRUD**
- 文件: `api/models/tables.py:248`、`api/services/hybrid_search.py:256,264`
- 方案:
  1. DB: ALTER TABLE issues RENAME COLUMN type TO category（统一到 ORM 定义）
  2. 新建 `api/routers/issues.py`，实现 issues CRUD
  3. 确认 hybrid_search.py 中 i.category 引用与 DB 一致
- 验证: POST /api/projects/{id}/issues/ 返回 201

#### 批次 3：Medium（7个，预估45分钟）

**BUG-071: settings 不返回 hierarchy_labels**
- 文件: `api/schemas/settings.py:17-29`、`api/routers/settings.py:58-93`
- 方案: schema 添加 hierarchy_labels 字段，GET 返回它，PATCH 更新它

**BUG-072: open_source_research 模板无维度配置**
- 方案: 插入种子数据
  ```
  psql ... -c "INSERT INTO project_templates (template_key, name, dimension_keys) VALUES ('open_source_research', 'Open Source Research', ARRAY[...]) ON CONFLICT DO NOTHING;"
  ```
  或在 project_crud.py 中添加 fallback 默认维度

**BUG-073: PATCH dimension_configs enabled 不生效**
- 文件: `api/routers/settings.py`
- 方案: 新增 PATCH /api/projects/{project_id}/dimension-configs/{config_id} 端点

**BUG-074: 搜索无阈值**
- 文件: `api/services/hybrid_search.py`
- 方案: 语义搜索 SQL 添加 `WHERE similarity > 0.3` 阈值过滤

**BUG-077: 非 UUID 500 → 422**
- 文件: `api/routers/projects.py:79`
- 方案: 将 project_id 参数类型改为 `uuid.UUID`，让 FastAPI 自动 422

**BUG-078: 软删除后 tree-overview 200 → 404**
- 文件: `api/services/project_stats.py:19,72`
- 方案: 查询添加 `.filter(Project.deleted_at.is_(None))`

**BUG-080: 导入端点无认证**
- 文件: `api/routers/import_.py:63,156,199`
- 方案: 三个端点添加 `Depends(require_user)`，用 user.id 替代 body 中的 user_id

#### 批次 4：Low（3个，预估15分钟）

**BUG-079: Markdown 导入过严**
- 文件: `api/services/exporter.py:198-228`
- 方案: 无 h1 标题时将整个文件视为一个功能项

**BUG-081: auth 无 503**
- 文件: `api/routers/auth.py:62-94`
- 方案: 添加 OperationalError 捕获，返回 503

**BUG-082: 前端 highlight → score**
- 文件: `web/src/lib/comparison-data.ts:10-36`
- 方案: highlight 字段替换为 score（green→1, red→-1, null→0）

### 每个 bug 修复后

1. 如果改了后端代码，等 uvicorn 热重载完成（看 /tmp/api.log 出现 "Application startup complete"）
2. 运行一个快速验证（curl 或 psql）确认修复生效
3. 如果验证不通过，立即排查，不要跳到下一个

### 完成后

通知 Agent 2: "全部 15 个 bug 已修复，请开始验证"
通知 team lead: "修复完成，已修复 BUG-068 ~ BUG-082 共 15 个 bug"

规则:
- 可以修改 api/ 和 web/src/ 下的代码
- 可以执行 psql 命令修改数据库
- 不修改 docs/ 下的文件
- 每修一个 bug 做一次快速验证

## Agent 2 — 回归验证 (model: sonnet)

等 Agent 1 通知后开始。你负责重新执行所有之前 FAIL 的测试点，验证修复效果。

### 开始前

1. 读 docs/testing/e2e-test-results.md，提取所有 FAIL 的 TP-ID 列表
2. 读 docs/testing/e2e-test-points.md，找到对应的 curl 命令
3. 确认服务可用并获取 token:
   ```
   unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY
   curl -s http://127.0.0.1:8001/health/
   TOKEN=$(curl -s -X POST http://127.0.0.1:8001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"cy@prism.dev","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
   ```

### 验证范围

重新执行以下 FAIL 测试点（排除 ENV 和 TEST-DESIGN）:

**来自 BUG-075 (Critical)**: TP-094
**来自 BUG-076 (Critical)**: TP-120
**来自 BUG-068 (High)**: TP-006, TP-050, TP-051, TP-052
**来自 BUG-069 (High)**: TP-004
**来自 BUG-070 (High)**: TP-008, TP-053, TP-054, TP-111
**来自 BUG-071 (Medium)**: TP-029, TP-031, TP-040
**来自 BUG-072 (Medium)**: TP-038
**来自 BUG-073 (Medium)**: TP-039
**来自 BUG-074 (Medium)**: TP-061, TP-119
**来自 BUG-077 (Medium)**: TP-128
**来自 BUG-078 (Medium)**: TP-129
**来自 BUG-079 (Low)**: TP-090
**来自 BUG-080 (Medium)**: TP-109
**来自 BUG-081 (Low)**: TP-098
**来自 BUG-082 (Low)**: TP-115

另外，从 P0 冒烟测试中选 5 个之前 PASS 的测试点重新执行，确认无回归:
- TP-001 (登录)、TP-003 (创建项目)、TP-005 (维度编辑)、TP-010 (搜索)、TP-017 (混合搜索)

### 记录格式

写入 docs/testing/e2e-retest-results.md:

```
# E2E 回归验证结果

- 验证日期: {当天日期}
- 环境: localhost (API:8001 / Web:3001 / DB:5432)
- 目的: 验证 BUG-068 ~ BUG-082 修复效果

## 修复验证

| TP-ID | 测试点名称 | 关联BUG | 原结果 | 新结果 | 备注 |
|-------|-----------|---------|--------|--------|------|
| TP-094 | 所有端点需认证 | BUG-075 | FAIL | PASS/FAIL | |

## 回归检查（之前 PASS 的测试点）

| TP-ID | 测试点名称 | 原结果 | 新结果 | 备注 |
|-------|-----------|--------|--------|------|

## 统计

### 修复验证
- 总验证数: N
- 修复成功 (FAIL→PASS): X
- 修复失败 (仍FAIL): Y
- 修复率: Z%

### 回归检查
- 总检查数: 5
- 无回归 (仍PASS): X
- 回归 (PASS→FAIL): Y

### 修复后整体通过率
- 原通过率: 60.6% (94/155)
- 新通过率: X% (计算: 原PASS数 + 修复成功数 - 回归数) / 155
```

### 仍然 FAIL 的测试点

对每个仍然 FAIL 的测试点，写明:
- 具体错误信息
- 是修复不完整还是新问题

### 完成后

通知 team lead: "回归验证完成，修复率 X%，新通过率 Y%，回归 Z 个"

规则:
- 只读代码，不改代码
- 只写 docs/testing/e2e-retest-results.md
- ENV FAIL 的测试点（AI Provider 未配置）跳过，不重新执行

## 文件领地

| 文件 | Agent 1 (修复) | Agent 2 (验证) |
|------|---------------|---------------|
| api/**/*.py | ✅ 写 | 👀 只读 |
| web/src/**/* | ✅ 写 | 👀 只读 |
| docs/testing/e2e-retest-results.md | ❌ | ✅ 写 |
| docs/testing/*.md (其他) | ❌ | ❌ |
| 数据库 DDL/DML | ✅ 执行 | 👀 只读查询 |

## 完成标准

- [ ] BUG-068 ~ BUG-082 全部修复
- [ ] 每个修复有快速验证
- [ ] 所有之前 FAIL 的测试点重新执行
- [ ] 5 个 P0 冒烟测试无回归
- [ ] e2e-retest-results.md 包含修复率 + 回归检查 + 新通过率
- [ ] git commit: "fix: 修复BUG-068~082(E2E测试发现的14个bug) + 回归验证"
```
