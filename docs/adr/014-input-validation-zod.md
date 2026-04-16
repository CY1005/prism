# ADR-014: Server Action 输入校验统一使用 Zod + defineAction 脚手架

## Status

Accepted

## Date

2026-04-17

## Context and Problem Statement

E2E 测试（155 点 100% 通过）和 Dogfooding 之外的静态扫描发现：Prism 共有 **109 个 Server Action**，但仅有 **2 个**（`auth.register` / `projects.create`）接入了 Zod schema 做入参校验，其余 **107 个（98%）裸奔**——无长度限制、无格式校验、无类型收紧。

DB 侧同样薄弱：66 个字段使用 PostgreSQL `text()` 无限长类型，`varchar(n)` 字段 0 个，**应用层和 DB 层两道防线都不挡**。

**可观察风险**：
- 任意已登录用户可通过 `createNode` 传 100MB 字符串爆 DB 空间
- 富文本/描述字段无 sanitize 和长度限制 → 潜在 XSS 面
- 无 email 格式校验的 `inviteMember` 可能触发 SMTP 错误
- 非 enum 类型字段（如 `type: "folder" | "file"`）实际运行时接受任意字符串

**方法论问题**：E2E 测试在正常用例下过了，但**等价类的非法/边界/超长分支完全没覆盖**——155 点覆盖率是"golden path 100%"而非"robustness 100%"。

## Decision Drivers

* AI 并行开发（多 Agent）天然容易漏校验——AC 里只写业务逻辑，很少强制入参约束
* 与 ADR（BUG-110 的错误码治理）方法论同构：选一个"工程防线"而不是靠 review
* 需要兼顾类型安全（编译期）+ 运行时校验（实际请求）
* TypeScript 生态已形成事实标准（Zod / Yup / Joi / io-ts 四选一）
* 渐进式迁移，不阻塞新功能开发

## Decision Outcome

**选定 Zod 作为唯一入参校验库，并建立 `defineAction(schema, handler)` 脚手架强制接入。**

### 为什么选 Zod（对比其他库）

| 维度 | Zod | Yup | Joi | io-ts |
|------|-----|-----|-----|-------|
| TS 类型推断 | ✅ `z.infer` 原生 | ⚠️ 有但弱 | ❌ 纯 JS | ✅ 但语法重 |
| 运行时性能 | 良好 | 良好 | 良好 | 偏慢 |
| 可组合性（schema 拼接/继承） | ✅ 优秀 | ✅ 良好 | ⚠️ 冗长 | ✅ 但难用 |
| 错误消息可定制（中文/业务） | ✅ 优秀 | ✅ 良好 | ✅ 良好 | ⚠️ 需手写 |
| 生态（Next.js / shadcn / TanStack）| ✅ 事实标准 | ⚠️ 被替换中 | ⚠️ 主要 Node 后端 | ⚠️ FP 小众 |
| 学习曲线 | 低 | 低 | 低 | 高（FP 风格） |
| 体积（min+gz）| ~13KB | ~17KB | ~145KB | ~18KB |

**关键差异化：**
1. `z.infer<typeof schema>` 让**类型和校验规则共用一份代码**，消除"schema 和 TS 类型两处维护"的漂移风险——这和 BUG-110 驱动的"单一真相源"方法论一致
2. Next.js 官方文档、shadcn/ui form 组件、Auth.js 全部以 Zod 为推荐示例，选它等于顺着主流生态走
3. Prism 已有 2 个 schema 在用 Zod（`registerSchema` / `createProjectSchema`），继续扩展而非引入新库

**否决的方案：**
- **Yup**：历史包袱重、类型推断弱、生态正在被 Zod 取代
- **Joi**：为 Node.js 后端设计，TS 生态匹配差
- **io-ts**：函数式编程风格，学习曲线陡，团队（单人）维护成本高
- **不用库，手写 if 判断**：已经在 `createTeam` 里这样做了，结果是"只判了非空没判长度"——**手写校验的漂移率比 AI 写业务代码更高**

### 脚手架设计：defineAction(schema, handler)

```ts
// lib/define-action.ts
export function defineAction<TSchema extends z.ZodTypeAny, TResult>(
  schema: TSchema,
  handler: (input: z.infer<TSchema>) => Promise<ActionResult<TResult>>,
) {
  return async (raw: unknown): Promise<ActionResult<TResult>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return actionError(
        new AppError(
          parsed.error.issues[0]?.message || "输入格式错误",
          "blocking",
          ErrorCode.VALIDATION_ERROR,
        ),
      );
    }
    return handler(parsed.data);
  };
}
```

**效果：**
- Action 签名强制从 `(a, b, c) => ...` 变成 `defineAction(schema, ({ a, b, c }) => ...)`
- 没 schema 过不了编译（TS 类型约束）
- 校验失败自动返回结构化 `VALIDATION_ERROR`，不再走到业务逻辑
- 前端拿到的 error message 是用户能看懂的中文（schema 里配置的）

### 渐进式迁移策略

**不做**：全量 109 个 Action 一次迁（3-5 天工程，阻塞其他学习）

**做**：
1. 建 helper + 迁 1 个样板 Action（`createNode`）作为模板
2. 按"用户直接输入写操作"的风险度挑 **10 个高风险 Action** 先补
3. 剩余 97 个：不强制迁，但新功能/修改时必须用 defineAction
4. CLAUDE.md 加规则 + Agent 提示词约束

**风险分级的 10 个 Action（P0）：**
- `createNode` / `updateNode` / `renameNode`（用户输入名称）
- `createTeam` / `inviteMember`（邮箱/名称）
- `createIssue` / `updateIssue`（描述字段）
- `createCompetitor` / `createCompetitorReference`
- `createDimensionRecord`（动态 content 字段）

### 和其他 ADR 的关系

- **ADR-BUG-110-followup**（错误码治理）：同一套"工程防线"方法论的第 2 次应用；`defineAction` 返回的错误复用 `ErrorCode.VALIDATION_ERROR`
- **ADR-012 Issue 实体**：Issue 的 description/tags 字段是 P0 必补清单
- **ADR-010 混合架构**：FastAPI 侧已用 Pydantic 做校验（Python 的 Zod 等价物），前端 Server Action 侧补上 Zod 等于两端对齐

## Consequences

**正面：**
- 类型系统成为 schema 合规的自动审查员
- 新 Action 必须过质量门（写不出裸奔代码）
- 用户错误消息从"操作失败"升级为"项目名称最多 100 字"等具体提示
- 给 Agent 的提示词有硬约束可引用

**负面 / 代价：**
- 97 个老 Action 保留短期裸奔状态（可接受，有 TODO 标记）
- Action 签名从"位置参数"变"对象参数"是 breaking change，调用方需同步修改
- 学习成本：所有 Agent 提示词必须理解 defineAction 模式

**验证：**
```bash
# schema 覆盖率
grep -rln "defineAction" web/src/actions | wc -l    # 目标：至少 10 / 初期
# tsc 零报错
cd web && npx tsc --noEmit
```

## 历史

- 2026-04-17：ADR 落地 + 10 个 P0 Action 迁移（BUG-111 驱动）
