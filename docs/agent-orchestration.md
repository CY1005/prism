# Prism Agent 编排方案

> 融合 IDAKE 五步法 + Popsicle 牧羊犬（Pipeline DAG + Guard 门控 + Discussion 验收）

---

## 一、角色定义

| 角色 | 职责 | 对应 Popsicle 概念 |
|------|------|-------------------|
| **Orchestrator（主 session）** | 定模块顺序、写 Spec、派发任务、执行 Guard、判 Pass/Fail | Pipeline + Guard |
| **FE Agent（前端 builder）** | 按 Spec 实现前端代码 | Code Agent |
| **BE Agent（后端 builder）** | 按 Spec 实现后端代码 | Code Agent |
| **CY（人）** | 最终验收、方向决策 | Discussion 角色 |

---

## 二、单模块执行流程（Pipeline）

```
┌─────────────────────────────────────────────┐
│  Orchestrator: Spec 阶段                     │
│  ├── 定义 AC（验收标准 3-10 条）              │
│  ├── 定义 API 契约（如涉及前后端交互）         │
│  └── 拆分 FE/BE 子任务                       │
│       ↓                                      │
├─────────────────────────────────────────────┤
│  Build 阶段（FE/BE Agent 并行）              │
│  ├── FE Agent: 按 Spec 实现前端              │
│  └── BE Agent: 按 Spec 实现后端              │
│       ↓                                      │
├─────────────────────────────────────────────┤
│  Guard 阶段（Orchestrator 执行）              │
│  ├── 代码质量检查: lint / type check / build │
│  ├── AC 逐条验证: 功能是否符合 Spec          │
│  ├── 集成验证: 前后端联调（如适用）           │
│  └── 判定: Pass → 下一模块 / Fail → Fix     │
│       ↓                                      │
├─────────────────────────────────────────────┤
│  Fix 阶段（仅 Fail 时触发）                  │
│  ├── Orchestrator 定位问题，分派给对应 Agent  │
│  └── Agent 修复 → 重新 Guard                │
│       ↓                                      │
├─────────────────────────────────────────────┤
│  Report → CY                                │
│  ├── 本模块完成摘要                           │
│  ├── AC 通过/失败状态                         │
│  └── 下一模块预告                             │
└─────────────────────────────────────────────┘
```

---

## 三、模块切分与执行顺序（DAG）

基于依赖关系纵切，每个模块 FE/BE 可独立或并行：

```
M1: 后端结构规范化（纯BE，无FE依赖）
 ↓
M2: 后端 /analyze + /test-points API（纯BE，mock模式）
 ↓
M3: 前端 analyzer 调用层 + 分析结果展示（FE，依赖M2的API契约）
 ↓
M4: 前后端集成联调（FE+BE，E2E验证）
```

### M1: 后端结构规范化
- **范围**: BE only
- **Spec**: 三层分离(routers/services/schemas)、pytest骨架、health endpoint
- **Guard**: 项目能启动、pytest通过、/health返回正确

### M2: 后端分析 API
- **范围**: BE only
- **Spec**: POST /analyze + POST /test-points，mock模式
- **Guard**: curl测试返回符合契约schema的JSON、边界case(空输入→422)

### M3: 前端分析集成
- **范围**: FE only
- **Spec**: analyzer.ts调用层 + 分析结果展示页面
- **Guard**: 类型检查通过、build成功、mock API下UI渲染正常

### M4: 前后端集成
- **范围**: FE + BE
- **Spec**: docker compose up后全链路跑通
- **Guard**: E2E场景（输入需求→看到分析结果→生成测试点）

---

## 四、Guard 检查清单模板

每个模块的 Guard 阶段执行：

```
□ 代码编译/构建通过
□ 单元测试通过（如有）
□ AC-1: [具体验收标准] → Pass/Fail
□ AC-2: [具体验收标准] → Pass/Fail
□ AC-N: ...
□ 无安全漏洞引入
□ 无硬编码配置值
```

**门控规则**：
- 全部 AC Pass → 模块完成，进入下一个
- 任一 AC Fail → 进入 Fix 阶段，最多 2 轮 Fix
- Fix 2 轮仍 Fail → 记 pain-log，CY 决策是否绕过
