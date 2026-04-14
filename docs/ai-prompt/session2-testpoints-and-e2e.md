# Session 2: 生成测试点 + 执行端到端测试

> 使用方式：Session 1 完成后，新开 Claude Code session，粘贴下方 ``` 内的全部内容
> 前置条件：Session 1 已完成（bug已修 + 服务已启动）
> 3个Agent顺序执行：QA设计(opus) → 测试执行(sonnet) → 测试分析(opus)
> 预估：300-400次工具调用，$25-35

---

```
Create a team with 3 agents to generate test points and execute E2E tests for Prism.

## 项目上下文（所有 agent 必读）

项目目录: /root/cy/prism
PRD: docs/Prism-PRD-v1.0.md（F1-F20 完整需求）
Bug历史: docs/testing/bug-log.md（67+个bug记录）
环境状态: docs/testing/env-status.md（Session 1 产出）
已有测试点: docs/Prism-v0.1-测试点.md, docs/Prism-v0.2-测试点.md, docs/Prism-v0.3-测试点.md, docs/Prism-v1.x-测试点.md
已有测试清单: docs/testing/test-checklist-*.md
环境:
  - 前端: http://localhost:3001
  - 后端 API: http://localhost:8001
  - 数据库: postgres://prism:prism_dev_2026@127.0.0.1:5432/prism

## 执行顺序（严格顺序，不可并行）

1. Agent 1 先执行，产出 docs/testing/e2e-test-points.md
2. Agent 1 完成后通知 Agent 2 开始
3. Agent 2 执行测试，每发现 FAIL 通知 Agent 3
4. Agent 3 实时分析失败，全部完成后写总结

## Agent 1 — QA测试设计 (model: opus)

你负责基于 PRD 和 bug 历史为 F1-F20 生成端到端测试点。

### 开始前

1. 确认服务可用: curl -s http://localhost:8001/health（期望 200）
2. 如果服务不可用，先排查并启动:
   - cd /root/cy/prism && docker compose up -d
   - cd api && uvicorn main:app --reload --host 0.0.0.0 --port 8001 &
   - cd web && PORT=3001 npm run dev &

### 必读文档

1. docs/Prism-PRD-v1.0.md — 完整阅读 F1-F20 的所有 AC（验收条件）
2. docs/testing/bug-log.md — 所有 bug 的模式，重点关注契约漂移、类型不匹配、认证绕过
3. docs/testing/test-checklist-*.md — 已验证过的内容（避免重复）
4. docs/testing/env-status.md — 当前环境状态和已知限制

### 测试点生成——分层策略

**P0 冒烟测试（约20个）**: 每个 Feature 的核心链路能走通
  - F1: 登录 → 拿到token → 访问受保护页面
  - F2: 创建项目 → 项目出现在列表
  - F3: 创建模块 → 创建功能项 → 树中可见
  - F4: 编辑维度内容 → 保存 → 刷新后内容还在
  - F5: 添加版本 → 时间线显示
  - ...每个 Feature 1-2个核心链路
  - 验证方式: curl API + 检查响应

**P1 功能测试（约100-150个）**: 每个 AC 对应1个测试点
  - 直接从 PRD 的 AC 列表转化
  - 每个测试点: 前置条件 / 操作步骤 / 预期结果
  - 验证方式: curl API + psql 数据库检查

**P2 回归测试（约20个）**: 基于 bug 历史
  - 高频模式回归:
    - 契约漂移: 前端请求 body 字段名是否和后端 Pydantic schema 完全对齐
    - SQL 注入: 搜索/过滤参数是否参数化（非 f-string 拼接）
    - 认证绕过: 所有端点是否经过 auth 中间件
    - asChild 回归: 检查是否残留 asChild prop
  - 每个回归测试点必须引用对应的 BUG-ID
  - 验证方式: 读代码 + curl 验证

**P3 边界测试（约15个）**: 高风险边界
  - 空数据: 新项目无节点/无版本/无竞品时的 API 响应
  - 权限: viewer 尝试 POST/PATCH/DELETE 操作
  - 输入: 超长文本、特殊字符、空字符串
  - 删除: 软删除项目后相关 API 的行为

### 输出格式

每个测试点:
```
### TP-{序号}: {测试点名称}

- **Feature**: F{N} {Feature名}
- **AC**: AC{N}（如适用）
- **优先级**: P0/P1/P2/P3
- **前置条件**: {需要什么数据/状态}
- **操作步骤**:
  1. {具体的curl命令或操作}
  2. ...
- **预期结果**: {具体的响应状态码/body字段/数据库值}
- **验证方式**: API响应检查 / 数据库检查 / 代码审查
```

### 输出文件

写入 docs/testing/e2e-test-points.md

文件开头写统计摘要:
- 总测试点数
- 按优先级分布: P0 / P1 / P2 / P3
- 按 Feature 分布: F1~F20 各几个

### 质量要求

1. 每个测试点必须可执行——操作步骤写成 curl 命令或 psql 查询
2. 预期结果必须可观测——具体的状态码、字段值、行数
3. 不生成重复测试点——先读已有 test-checklist，跳过已覆盖的
4. P2 回归测试点必须引用 BUG-ID
5. 不要写"验证功能正常"这种模糊描述

### 完成后

通知 Agent 2: "测试点已就绪，共 N 个，文件: docs/testing/e2e-test-points.md"

规则:
- 只写 docs/testing/e2e-test-points.md
- 不改任何代码

## Agent 2 — 测试执行 (model: sonnet)

等 Agent 1 通知后开始。你负责按 e2e-test-points.md 逐条执行测试。

### 开始前

1. 读完 docs/testing/e2e-test-points.md
2. 确认服务可用:
   - curl -s http://localhost:8001/health
   - curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login
3. 获取登录 token（后续所有需认证的请求都用这个）:
   ```
   TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@prism.dev","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")
   ```

### 执行顺序

1. 先执行全部 P0（冒烟测试）
   - P0 全部 PASS → 继续 P1
   - P0 有阻塞性 FAIL（服务不可用/登录失败/核心CRUD崩溃）→ 停止，通知 Agent 3
2. P1（功能测试）
3. P2（回归测试）
4. P3（边界测试）

### 执行方式

- **API测试**: curl 调用后端端点，检查响应状态码和 body
- **数据库验证**: psql 查询验证数据写入
  ```
  psql postgres://prism:prism_dev_2026@127.0.0.1:5432/prism -c "SQL语句"
  ```
- **契约验证**: 读前端 action/service 文件的请求字段，对比后端 Pydantic schema
- **前端页面**: curl 检查响应码（无浏览器环境，不做UI交互测试）

### 记录格式

每条测试执行后立即写入 docs/testing/e2e-test-results.md:

文件开头:
```
# E2E 测试执行结果

- 执行日期: 2026-04-14
- 环境: localhost (API:8001 / Web:3001 / DB:5432)
- 测试点来源: docs/testing/e2e-test-points.md
```

结果表:
```
## P0 冒烟测试

| TP-ID | 测试点名称 | 结果 | 备注 |
|-------|-----------|------|------|
| TP-001 | F1登录成功 | PASS | 200, access_token 返回 |
| TP-002 | F2创建项目 | FAIL | 500, error: template not found |
```

每完成一个优先级的测试，输出阶段性统计:
```
### P0 统计: 18/20 PASS, 2 FAIL, 0 SKIP
```

### 发现 FAIL 时

1. 在结果表备注列写简要描述（状态码 + 错误信息）
2. 通知 Agent 3: "TP-{ID} FAIL: {一句话描述}"
3. 继续执行下一个测试点（不要停下来修 bug）

### 完成后

在 e2e-test-results.md 末尾写总统计:
```
## 总计
- 总测试点: N
- PASS: X (Y%)
- FAIL: X (Y%)
- SKIP: X (Y%)
- 新发现问题: X 个（详见 Agent 3 分析）
```

通知 Agent 3: "全部测试执行完毕"

规则:
- 只读代码，不改代码
- 只写 docs/testing/e2e-test-results.md
- 发现 FAIL 通知 Agent 3，不要自己写 bug-log
- 环境问题（服务挂了）标注为 ENV-FAIL，不算 bug

## Agent 3 — 测试分析 (model: opus)

你在 Agent 2 执行测试期间待命。Agent 2 报告 FAIL 时，你分析根因。全部完成后写总结。

### 实时分析（Agent 2 每次报告 FAIL 时）

1. 读 Agent 2 报告的失败现象
2. 读对应的代码文件定位根因
3. 判断:
   - 是新 bug → 写 bug-log 条目
   - 是已知 bug 回归 → 标注 "回归: BUG-{原ID}"
   - 是环境问题 → 标注 ENV，不记 bug-log
4. 新 bug 定级: Critical / High / Medium / Low

### 新 bug 记录模板

追加到 docs/testing/bug-log.md，编号从 BUG-068 递增:

```
## BUG-{NNN}: {简短描述}

- **日期**: 2026-04-14
- **严重度**: Critical/High/Medium/Low
- **来源**: E2E测试 TP-{ID}
- **状态**: Open

### 现象
{Agent 2 报告的具体失败: 状态码、错误信息、请求/响应}

### 根因
{读代码后的精确定位，必须到 file:line}

### 修复建议
{具体修复方案}

### 受影响文件
- {文件路径:行号}
```

### 全部测试完成后——总结报告

Agent 2 通知"全部执行完毕"后，写 docs/testing/e2e-test-summary.md:

```
# Prism E2E 测试总结

## 执行概况
- 日期: 2026-04-14
- 总测试点: N
- 通过率: X%

## 按优先级

| 优先级 | 总数 | PASS | FAIL | SKIP | 通过率 |
|--------|------|------|------|------|--------|
| P0 | | | | | |
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |

## 按 Feature

| Feature | 总数 | PASS | FAIL | 通过率 | 阻塞性问题 |
|---------|------|------|------|--------|-----------|
| F1 用户系统 | | | | | |
| F2 项目管理 | | | | | |
| ... | | | | | |

## 新发现的 bug

| BUG-ID | 严重度 | Feature | 描述 |
|--------|--------|---------|------|
| BUG-068 | | | |
| ... | | | |

## 阻塞性问题（必须修复才能发布）
{列出所有 Critical + 影响核心链路的 High}

## 发布建议

### 可发布的 Feature（P0+P1 全部通过）
- F{N}: ...

### 需要返工的 Feature（有 Critical/High 未修复）
- F{N}: 问题是...

### 建议的下一步
1. ...
2. ...
```

### 规则

- 只读代码，不改代码
- 只写 docs/testing/ 下的文件:
  - docs/testing/bug-log.md（追加新 bug）
  - docs/testing/e2e-test-summary.md（最终总结）
- 新 bug 编号从 BUG-068 递增
- 根因分析必须精确到 file:line
- 环境问题标注 ENV，不记 bug-log

## 文件领地

| 文件 | Agent 1 (设计) | Agent 2 (执行) | Agent 3 (分析) |
|------|---------------|---------------|---------------|
| docs/testing/e2e-test-points.md | ✅ 写 | 👀 只读 | 👀 只读 |
| docs/testing/e2e-test-results.md | ❌ | ✅ 写 | 👀 只读 |
| docs/testing/e2e-test-summary.md | ❌ | ❌ | ✅ 写 |
| docs/testing/bug-log.md | ❌ | ❌ | ✅ 写 |
| web/src/ | 👀 只读 | 👀 只读 | 👀 只读 |
| api/ | 👀 只读 | 👀 只读 | 👀 只读 |

## 完成标准

- [ ] e2e-test-points.md: 测试点已生成（P0~P3全覆盖）
- [ ] e2e-test-results.md: 全部测试点有执行结果
- [ ] 每个 FAIL 都有 Agent 3 的根因分析
- [ ] 新 bug 全部记录到 bug-log.md
- [ ] e2e-test-summary.md: 包含通过率 + Feature维度统计 + 发布建议
- [ ] git commit: "test: E2E测试——测试点生成+执行+结果分析"
```
