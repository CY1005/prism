# Prism VibeCoding 工作流

> 融合：IDAKE 五步循环 + Harness Engineering + SE 3.0 五大理论 + Prism 实战经验
> 适用：Prism v0.1→v1.x 全版本开发
> 核心命题：不是"AI 写代码快不快"，而是"怎么构建一个环境让 AI 可靠地产出正确代码"

---

## 一、全局架构：三层嵌套循环

```
外循环（版本级）：v0.1 → v0.2 → v0.3 → v0.4 → v1.x
  │
  ├── 中循环（Phase 级）：Phase 1 → Phase 2 → Phase 3 ...
  │     │
  │     └── 内循环（功能级）：Spec → Build → Break → Fix → Evolve
  │
  └── 贯穿机制：Harness（上下文恢复 + Doom Loop 检测 + 知识回流）
```

**对应 SE 3.0 理论映射：**
- 外循环 = 复杂性科学的"涌现"——每个版本是一次有序涌现
- 中循环 = 控制论的"反馈闭环"——Phase 结束时校正方向
- 内循环 = 信息论的"降熵"——每轮 IDAKE 减少不确定性
- 贯穿机制 = 学习理论的"经验积累"——知识在循环间传递不丢失

---

## 二、内循环：单功能 IDAKE 五步（每天的节奏）

### Step 1: Spec（定义"做对了长什么样"）

**输入**：PRD 中对应功能的 AC 列表
**产出**：该功能的验收标准 + 边界场景

| 动作 | 说明 | 工具 |
|------|------|------|
| 读 PRD AC | 从 `Prism-PRD-v1.0.md` 提取该功能的 AC 列表 | Claude Code 读文件 |
| 读测试点 | 从 `Prism-v0.x-测试点.md` 提取对应测试点 | Claude Code 读文件 |
| 读 engineering-notes | 检查是否有该领域的已知陷阱 | 10 秒扫一遍 |
| 写 Phase checklist | `docs/test-checklist-v0.x-phaseN.md` 骨架 | Claude Code 生成 |

**规则**：
- 3-10 条 AC 是甜区，超过 10 条就拆功能
- AC 用"动作→结果"格式，不用 Given-When-Then
- **不写 AC 不开始写代码**

### Step 2: Build（AI 生成代码）

**输入**：AC 列表 + 现有代码上下文
**产出**：可编译的功能代码

| 动作 | 说明 | 工具 |
|------|------|------|
| 读 harness-progress.md | 10 秒恢复上下文 | session 开始第一件事 |
| 按功能纵切 | 一个功能从 DB schema → Server Action → 前端页面做完 | Claude Code |
| 每个子功能 build 一次 | `cd web && npx tsc --noEmit`，不攒到最后 | 终端 |
| 参考原型代码 | 从 `design/ui-prototype/` 搬运布局和交互模式 | Claude Code 读+改 |

**规则**：
- **禁止 asChild prop**（engineering-notes #1）
- **每个 renderer 首行做数据校验**（engineering-notes #2）
- **Drizzle text() 用类型断言**（engineering-notes #4）
- AI 生成代码编译报错 → 先怀疑"API 是否已变更"，不让 AI 反复修不存在的 API
- 80% 代码 AI 生成可用，20% 需要修类型和 API 兼容性

### Step 3: Break（CY 验证，找出 AI 做错的）

**输入**：Step 2 产出的代码 + AC 列表
**产出**：Bug 列表 + 测试清单标注

| 动作 | 说明 | 工具 |
|------|------|------|
| tsc 检查 | `npx tsc --noEmit`，类型错误全清 | 终端 |
| 逐条 AC 验证 | 对照 checklist 逐条标 ✅/⚠️/❌ | 浏览器 + curl |
| 空状态测试 | 最容易漏测的场景（v0.0.1 唯一 bug 来源） | 手动 |
| 安全检查 | SQL 注入、认证绕过、密码明文、权限越权 | curl + 代码审查 |
| 记录 bug | 写入 `docs/bug-log.md`（BUG-xxx 格式） | Claude Code |

**规则**：
- **逐条对照 AC，不要"看看差不多就行"**
- 发现 bug 立即记录，不要"等会儿再说"
- Break 阶段 CY 是对手不是帮手——目标是找到 AI 做错的

### Step 4: Fix（修复 + 回归）

**输入**：Bug 列表
**产出**：修复后代码 + 回归验证

| 动作 | 说明 | 工具 |
|------|------|------|
| AI 修复 | 把 bug 描述+file:line 给 Claude Code | Claude Code |
| CY 再验 | 修复后重新跑 Break 的失败 case | 浏览器 + curl |
| 回归检查 | 确认修复不引入新问题 | tsc + 已通过 AC 重测 |
| Doom Loop 检测 | 同一文件编辑 >6 次 → 停下换思路 | harness 自动监控 |

**规则**：
- 同一 bug 修 >3 轮 → 记 pain-log，考虑绕过
- **卡住 2 小时就绕**，不死磕
- 防御性检查 > 精确类型（JSONB 数据没有编译期保证）

### Step 5: Evolve（知识回流）

**输入**：本次开发的经验
**产出**：更新的知识资产

| 动作 | 说明 | 文件 |
|------|------|------|
| 更新 harness-progress.md | 已完成/进行中/卡点/下一步 | `web/harness-progress.md` |
| 记录工程经验 | 新发现的陷阱和解法 | `web/engineering-notes.md` |
| 记录痛点 | 烦躁/手动绕过的场景 | `docs/pain-log.md` |
| 更新 bug-log | 本轮发现的 bug 和教训 | `docs/bug-log.md` |
| Git commit | 每个功能完成后提交 | git |

**规则**：
- engineering-notes 是最有价值的产出——下次开发前读 5 分钟省 2 小时
- pain-log 是 B 线项目（AI Code Quality Gate）的素材来源
- **每个版本 ≥5 条工程经验回流**（PRD 2.2 成功指标）

---

## 三、中循环：Phase 级节奏（每周的节奏）

### Phase 开始前

```
1. 读 PRD 对应版本章节，提取本 Phase 的功能列表
2. 读上一个 Phase 的 test-checklist，确认前置功能全绿
3. 从 agent-team-prompt-v0.1.md 提取本 Phase 的 Agent Team 提示词
4. 决定执行方式：
   - 简单 Phase（≤2 功能）→ 单 session，CY + Claude Code
   - 复杂 Phase（3+ 功能）→ Agent Team（4 agents：Backend/Frontend/QA/Budget）
```

### Phase 执行中

```
每个功能走完内循环（Spec→Build→Break→Fix→Evolve）
  ↓
QA Agent 或 CY 写 test-checklist
  ↓
所有 AC 标 ✅ → Phase 完成
有 ❌ → 回到 Fix，不进入下一个 Phase
```

### Phase 结束后

```
1. 架构检查：目录结构/依赖方向/schema migration 是否健康
2. 更新 harness-progress.md 到新版本号
3. Git tag（v0.x.y）
4. 回顾本 Phase 的 pain-log → 是否有值得做成 Quality Gate 检查项的
```

---

## 四、外循环：版本级节奏（每月的节奏）

### 版本规划

| 版本 | 功能 | Phase 数 | 预估 |
|------|------|---------|------|
| v0.1 MVP | F1-F5, F11 | 3 Phases | ~2 周 |
| v0.2 | F6-F10 | 3 Phases | ~2 周 |
| v0.3 | F12, F13, F15, F16 | 2 Phases | ~2 周 |
| v0.4 | F14, F17, F18 | 3 Phases | ~2 周 |
| v1.x | F19, F20 | 1 Phase | ~1 周 |

### 版本交付标准

```
□ 所有 Phase 的 test-checklist 无 ❌
□ tsc --noEmit = 0 错误
□ 本版本 engineering-notes ≥ 5 条
□ pain-log 有更新（有痛点说明在真正用）
□ bug-log 有更新（有 bug 说明在真正测）
□ harness-progress.md 版本号已更新
□ Git tag 已打
```

### 版本回顾

```
1. bug-log 聚类分析 → 哪类 bug 最多？能否自动化检测？
2. pain-log 聚类分析 → 哪个环节最痛？是否值得做工具？
3. engineering-notes 回顾 → 哪些规则可以变成 linter/CI 检查？
4. 效率数据 → 本版本各阶段耗时，与 v0.0.1 的 3h MVP 对比
```

---

## 五、贯穿机制：Harness

### 5.1 上下文恢复（Law 3: Context 退化）

```
每个 session：
  开始 → 读 harness-progress.md（10 秒恢复）
  结束 → 更新 harness-progress.md

harness-progress.md 格式：
  - 当前版本 + Phase
  - 已完成的功能列表
  - 进行中的功能 + 进度
  - 卡点和 blockers
  - 下一步
  - Pain log 摘要
  - Doom Loop 监控（各文件编辑次数）
```

### 5.2 Doom Loop 检测（Law 2: 不确定性）

```
自动监控：
  同一文件编辑 >6 次 → ⚠️ 停下来换思路
  同一 bug 修 >3 轮  → 记 pain-log，绕过
  Agent 停顿不动      → 检查是否有漏写的外部依赖
  总工具调用到阈值    → 优先完成核心 AC，跳过优化
```

### 5.3 知识回流（IDAKE Step 5: Evolve）

```
知识产出 → 存储位置：
  工程陷阱     → engineering-notes.md（下次 Build 前读）
  Bug 模式     → bug-log.md（下次 Break 时对照）
  痛点         → pain-log.md（B 线项目素材）
  架构决策     → docs/adr/（长期参考）
  测试清单     → docs/test-checklist-*.md（回归基线）

知识消费 → 消费时机：
  Session 开始 → harness-progress.md
  Build 开始前 → engineering-notes.md
  Break 开始前 → 对应版本测试点文件
  版本结束后   → bug-log + pain-log 聚类分析
```

### 5.4 架构护栏（Architecture Guardrails）

```
每个 Phase 结束检查：
  □ 目录结构是否符合约定（api/ web/ docs/ design/）
  □ 依赖方向是否正确（actions → db，不反过来）
  □ schema migration 是否干净（drizzle-kit push 无报错）
  □ 前后端 API contract 是否对齐（PAIN-001 教训）
  □ 新增文件是否在正确的"领地"内（防冲突）

自动化检查（逐步建设）：
  Phase 1: tsc --noEmit（类型安全）
  Phase 2: + OpenAPI schema diff（前后端契约）
  Phase 3: + 依赖方向 lint（架构规则）
```

---

## 六、Agent Team 模式（复杂 Phase）

### 何时用 Agent Team

| 条件 | 执行方式 |
|------|---------|
| Phase 含 ≤2 个功能 | CY + Claude Code 单 session |
| Phase 含 3+ 个功能 | Agent Team（4 agents） |
| 涉及前后端并行 | Agent Team（防契约漂移） |
| 纯文档/测试任务 | CY + Claude Code 单 session |

### Agent 分工

| Agent | 职责 | 领地 |
|-------|------|------|
| Backend | Schema + Server Actions + API | api/, web/src/db/, web/src/actions/ |
| Frontend | 页面 + 组件 + 交互 | web/src/app/, web/src/components/ |
| QA | 读代码 + tsc + curl 测试 + 写 checklist | docs/, tests/（只读代码） |
| Budget | 监控工具调用次数 + Doom Loop 预警 | 不写代码 |

### 契约对齐（PAIN-001 教训）

```
Agent Team 启动前必须做：
  1. Backend 先输出 API contract（端点 + 请求/响应 schema）
  2. Frontend 基于 contract 定义 TypeScript 类型
  3. QA 验证时逐字段比对，不只看 URL 和顶层字段名

或者（更简单）：
  1. Team Lead（CY）在分发任务前定义共享 API contract 文件
  2. 两个 Agent 都引用同一个 contract
```

---

## 七、当前状态 & 下一步

### 当前状态

```
版本：v0.0.1（Week 1 complete）
已完成：
  - 项目脚手架（Docker + PostgreSQL + Next.js 16 + shadcn/ui + Drizzle）
  - 8 张核心表 + 种子数据
  - F3/F4 基础实现（25/25 AC passing）
  - UI 原型 25 个页面（design/ui-prototype/）
  
缺失（那台机器有但未同步到 GitHub）：
  - F1 认证系统
  - F2 项目管理完整实现
  - F5 版本时间线
  - F11 zip 导入
  - v0.2-v0.3 的所有实现
```

### 下一步：恢复到可继续开发的状态

```
1. 确认 GitHub 代码是否是最新的（还是那台机器有更新的 9 个 commit？）
2. 如果 GitHub 不是最新 → 等那台机器恢复网络 push
3. 如果 GitHub 是最新 → 从当前代码继续：
   a. 启动 Docker + dev server
   b. 确认 F3/F4 还能跑
   c. 按 Phase 顺序继续 v0.1 剩余功能
```

---

## 八、面试怎么讲这个流程

**一句话**：
"我用 IDAKE 方法论驱动 AI 辅助开发——先写验收标准，再让 AI 生成代码，我作为 Breaker 对抗验证，踩坑经验回流到项目自身的知识库。Harness 机制解决 AI 的三个致命问题：上下文丢失、不确定性卡死、工作耗尽后停转。"

**追问"怎么保证 AI 代码质量"**：
"三层保障：(1) Spec 先行——不写 AC 不开始编码；(2) Builder-Breaker 对抗——AI 写我破，逐条 AC 验证+空状态+安全检查；(3) 架构护栏——每个 Phase 结束跑结构检查，防止代码腐化。实际数据：50 个 bug 全在 Break 阶段发现，其中 8 个是前后端契约漂移，倒逼我建立了 contract-first 机制。"

**追问"效率数据"**：
"v0.0.1 从零到可运行 MVP 骨架 3 小时，其中 AI 生成代码占 60 分钟，类型修复 30 分钟，Break 验证 20 分钟。核心发现：AI 代码 80% 可用，20% 需要修类型和 API 兼容性——问题不在 AI 能力，在 AI 训练数据和最新依赖版本的 gap。"
