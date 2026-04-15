---
name: dev-closed-loop
description: 开发闭环协议——每次开发任务自动执行的沉淀、反思、改进流程
trigger: 每次开发任务开始/结束时
related_bugs: []
last_updated: 2026-04-15
---

# 开发闭环协议（每次开发自动执行）

> 融合 Hermes Skills 闭环 + Google SRE Blameless Postmortem + Toyota Kata + DevEx 三维度 + 日本 YWT 振返り法 + Preflight Checklist。
> 目标：遇到的每个问题都能自动沉淀、反思根因、回流到系统、量化改进。

## Phase 0: Preflight Checklist（开始开发前）

每次开发任务启动前，跑完以下检查：

```
□ 读过 engineering-notes.md？（已知陷阱不要重踩）
□ AC（验收标准）写清楚了？（没有 AC 不写代码）
□ 涉及哪些文件？列出影响范围
□ 检索 bug-log：有没有同区域的历史 Bug？
□ 如果涉及前后端联调：Contract-first 定义了？
```

来源：航空业 Preflight Checklist——飞行员不论经验多丰富，每次起飞都必须跑检查清单。

## Phase 1: 触发条件（何时启动沉淀）

以下任一情况发生时，**必须**执行沉淀流程：
- 修复了一个 Bug（不论大小）
- 同一文件编辑 >3 次才解决问题
- 发现文档/注释与实际行为不一致
- 使用了一个之前没用过的模式或 workaround
- `tsc --noEmit` 或测试失败后调试修复

## Phase 2: 沉淀流程（5 步）

```
① 记录现象 → ② Blameless 5 Whys → ③ 归类模式 → ④ 回流更新 → ⑤ 验证闭环
```

**① 记录现象**：在 `docs/testing/bugs/bug-log.md` 追加条目
- 现象是什么？报错信息？
- 在哪个文件、哪一行？

**② Blameless 5 Whys**：问"什么机制允许了这个错误"，不问"我犯了什么错"

来源：Google SRE —— "You can't fix people, but you can fix systems and processes."

```
- Why 1: 为什么报错？→ 字段名不匹配
- Why 2: 为什么不匹配？→ 前端用 camelCase，后端用 snake_case
- Why 3: 什么机制允许了这个不匹配通过？→ 没有 Contract-first 检查
- Why 4: 为什么流程里没有这个检查？→ 没人加过
- 系统性根因: 开发流程缺少前后端 Schema 对齐步骤
- 系统性修复: 在 Preflight Checklist 增加"联调前 Schema 对齐"检查项
```

**③ 归类模式**：这个问题属于哪个已知模式？
- 检查 `web/engineering-notes.md` 是否有类似规则
- 如果是新模式 → 新增规则
- 如果是已有模式的变体 → 补充到已有规则
- 标注来源：`[首次出现] / [模式 #N 变体] / [与 BUG-XXX 同源]`

**④ 回流更新**：根据根因类型路由到对应文件

| 根因类型 | 回流到 | 更新内容 |
|----------|--------|----------|
| 代码模式陷阱 | `web/engineering-notes.md` | 新增/补充规则 |
| 开发流程缺失 | `CLAUDE.md` Preflight Checklist | 新增检查项 |
| 架构设计问题 | `docs/adr/` | 新增或修订 ADR |
| AI 生成代码通病 | `CLAUDE.md` 禁止的模式 | 新增禁止项 |
| 跨会话知识 | `~/.claude/memory/` | 新增 Memory 条目 |

**⑤ 验证闭环**：
- 回流的规则下次会被自动读取吗？（在 CLAUDE.md / engineering-notes 中？）
- 写一个断言：如果未来同样的问题再出现，哪条规则应该拦住它？

## Phase 3: 反思模板

```markdown
## BUG-XXX: [一句话描述]

- **日期**: YYYY-MM-DD
- **严重度**: Critical / High / Medium / Low
- **状态**: 已修复

### 现象
[报错信息 / 异常行为]

### Blameless 5 Whys
- Why 1: [直接原因]
- Why 2: [为什么直接原因会发生]
- Why 3: [什么机制允许了这个错误通过]
- Why 4: [为什么该机制不存在/失效]
- **系统性根因**: [一句话：流程/工具/规范层面的缺失]
- **系统性修复**: [改进流程/工具/规范的具体动作]

### 修复
[具体代码改动]

### 回流
- [ ] engineering-notes.md 已更新（规则 #N）
- [ ] CLAUDE.md 已更新（如涉及流程/规范变更）
- [ ] Preflight Checklist 已更新（如需新增检查项）
- [ ] Memory 已更新（如涉及跨会话知识）

### 模式分类
[首次出现 / 已有模式 #N 的变体 / 与 BUG-XXX 同源]
```

## Phase 4: Post-flight YWT（开发结束时）

来源：日本能率協会 JMAC 的 YWT 振返り法——从经验出发的个人成长反思。

每次开发任务完成后，花 2 分钟回答：
- **Y**（やった / 做了什么）：这次完成了什么功能 / 修了什么 Bug？
- **W**（わかった / 领悟了什么）：从中理解了什么**原理**？（不是"学了什么 API"，是"理解了什么设计取舍"）
- **T**（つぎ / 下次做什么）：下次开发前要改变什么**行为**？

如果 W 中有值得沉淀的内容 → 写入 engineering-notes.md 或 Memory。

## Phase 5: Kata 审计（每 10 个 Bug 或每个版本结束时）

来源：Toyota Kata 改善型——用数据驱动的持续改善，不靠感觉。

```
① 把握现状：统计 bug-log 最近 10 个 Bug 的模式分布
   - 类型A（前后端不匹配）: N 个，占 X%
   - 类型B（空状态）: N 个，占 X%
   - 类型C（AI 生成代码问题）: N 个，占 X%

② 设定目标状态：Top 1 模式在下 10 个 Bug 中占比降低 50%

③ 识别障碍：什么阻止了目标达成？
   - 是规则没写？→ 补规则
   - 是规则写了但没执行？→ 强化 Preflight Checklist
   - 是规则执行了但不够？→ 考虑自动化

④ 实验验证：执行改进，用下一批 Bug 数据验证效果

⑤ 清理过时规则：engineering-notes 中不再适用的规则标记 [DEPRECATED] 或删除
```

## 认知负荷控制

来源：DevEx 框架（ACM Queue）——降低认知负荷是提升开发效率的最有效手段。

- **Preflight 降低启动负荷**：不用"记住"要检查什么，跑清单就行
- **engineering-notes 降低编码负荷**：已知陷阱不用"想起来"，读文件就行
- **反思模板降低沉淀负荷**：不用"想怎么写"，填模板就行
- **CLAUDE.md 降低上下文负荷**：每次新对话自动加载，不用重复交代背景
