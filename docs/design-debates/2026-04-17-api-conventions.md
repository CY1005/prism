# 2026-04-17 API 规约设计辩论

> **主题**：Prism 后端加新接口时，该按什么套路来？
> **产出**：`docs/architecture/api-conventions.md`（主规约）+ `api-conventions-debt.md`（存量债务）
> **意外发现**：一个真实的安全漏洞（DEBT-001），当天修复
> **参与角色**：Designer Agent（提方案）+ Reviewer Agent（挑刺）+ CY（定案）

---

## 先说人话：为什么要做这件事

Prism 已经有 20 个功能、11 个后端路由模块。每次加新接口，AI 都要重新猜"这个接口该叫什么、参数该传什么、错误怎么返回"。

**问题**：没有统一约定 → 每个接口风格不一样 → 前端要写 N 套适配代码 → 测试要测 N 套组合。

**举个你能立刻共鸣的例子**：

> 假设测试同学接到任务："测一下项目列表翻页"。
> 你打开 Swagger，发现：
> - `/api/projects` 用 `?limit=20` 翻页
> - `/api/issues` 用 `?page=2&pageSize=10` 翻页
> - `/api/search` 用 `?offset=20&limit=20` 翻页
>
> 同一个"翻页"功能，三套参数。你的测试用例要维护 3 套 fixture，一旦改动就要改 3 个地方。这就是**没有规约的代价**，不是开发问题，是**全链路认知负担**。

这次辩论就是要在 Prism 还不至于失控前，把这些约定写死。

---

## 谁在辩论

| 角色 | 职责 | 视角 |
|---|---|---|
| **Designer Agent** | 起草 V1 草案 | "我读完代码后认为应该这样定" |
| **Reviewer Agent** | 挑刺 / sign-off | 双重身份：①今天我要改现有功能，能用吗？②3 个月后我要加 F21 新功能，够用吗？|
| **主控 Claude（小七）** | 协调 + 最终落笔 | 展示辩论给 CY 看，不直接裁决 |
| **CY** | 决策者 | 最终拍板 |

**为什么两个 Agent 对垒**：一个 Agent 要么会漏洞（缺乏挑刺视角），要么过度设计（没人拦着）。两个 Agent 各有立场，才能逼出好方案。

---

## Round 1：Designer 起草 V1（6 条规则）

Designer 读完 `api/routers/` 下所有现有路由、`web/src/actions/` 下所有 Server Action、`docs/architecture/error-codes.md` 错误码规约后，产出 V1。

每条规则按"**现状→候选→决策→为什么→主动砍掉**"五段式。这里用人话复述：

### 规则一：翻页怎么写？
- **现状**：只有一个地方用了翻页（activity-log），其他列表全量返回。
- **候选**：
  - A. `?page=1&pageSize=20`（前端友好）
  - B. `?offset=0&limit=20`（数据库原生）
  - C. `?cursor=xxx`（适合无限滚动 feed）
- **决策**：选 A。
- **为什么**：Prism 单人工具，单项目数据 <1000 条，不会有"深分页性能问题"。选前端最好写的那个。
- **砍掉**：不做 cursor 分页（没有无限滚动场景），不加 `total_pages`/`has_next_page` 字段（前端自己能算）。

### 规则二：URL 路径怎么起名？
- **决策**：保持现状。
  - 资源集合用复数（`/projects` 不是 `/project`）
  - 操作型路径用动词+名词（`/import`、`/export`）
  - **不加 `/v1/` 前缀**
- **为什么不加版本号**：Prism 是单人工具，没有多版本并行需求。加了是噪音。
- **砍掉**：路径里禁止出现 HTTP 动词（不能有 `/getProject`、`/createNode`，用 GET/POST 方法表达）。

### 规则三：字段名命名（三层 case）
这条最绕，但最重要。

```
数据库（snake_case）    →   FastAPI（snake_case）   →   前端 JS（camelCase）
created_at                  created_at                  createdAt
project_id                  project_id                  projectId
```

- **Drizzle ORM 自动帮你转换** DB ↔ JS 层。
- **FastAPI 保持 snake_case**，不改。
- **前端调 FastAPI 时**，必须手动把 `projectId` 改成 `project_id`。

### 规则四：删除是真删还是假删？
- **projects 软删**：打个"死亡时间戳" `deletedAt`，记录还在，只是查询时过滤掉。可以恢复。
- **其他资源（nodes、issues）物理删**：DELETE SQL 直接删行，不可恢复。
- **为什么 projects 特殊**：误删整个项目代价太高，留恢复口。子资源（节点、问题）随项目走，不需要独立恢复。

### 规则五：排序和筛选怎么写？
- **排序**：写死在代码里，不让前端传参数控制。
- **筛选**：用 query param，一个字段一个参数（`?status=open&category=bug`）。
- **为什么不让前端控制排序**：暴露 sort_by 参数意味着要给所有候选字段加索引、处理 SQL 注入风险，不值得。

### 规则六：新加一个接口要走几步？

**Server Action 5 步走**：
1. 认证（是否登录）
2. 鉴权（是否有这个项目的权限）
3. 输入校验（参数对不对）
4. 业务逻辑（调 Service 层）
5. 返回 `ActionResult<T>`（成功或失败）

**FastAPI 4 步走**：
1. Pydantic 定义输入
2. `require_user` 依赖注入做认证
3. `check_permission` 做鉴权
4. 错误不泄露（禁止 `detail=str(e)`）

---

## Round 2：Reviewer 挑刺

Reviewer 带双重视角硬核审查。对每条规则打标：
- ✅ **同意**（签收）
- ⚠️ **质疑**（能用但有问题）
- ❌ **反对**（必须改）

结果：3 个 ❌ + 8 个 ⚠️ + 少量 ✅。

这里挑 3 个最要命的问题用场景说清楚：

### 🚨 问题 1：真实的安全漏洞（规则六 ❌）

Reviewer 读 `api/routers/export.py` 发现：**两个导出端点完全没有登录检查**。

代码实锤（修复前）：
```python
@router.post("/nodes", response_model=ExportNodesResponse)
def export_nodes_endpoint(
    req: ExportNodesRequest,
    db: Session = Depends(get_db),  # 只有数据库依赖，没有用户依赖
):
```

**用测试能共鸣的场景**：

> 想象你正在测 Prism 的"导出节点为 Markdown"功能。正常流程：登录 → 选节点 → 点导出 → 下载文件。
>
> 现在你切到黑盒测试视角，试试**不登录**直接调接口：
>
> ```bash
> # 不带任何 token
> curl -X POST http://prism.cn/api/export/project \
>   -H "Content-Type: application/json" \
>   -d '{"project_id": "任何项目ID"}'
> ```
>
> **应该返回**：401 Unauthorized
> **实际返回**：200 OK + 整个项目的 zip 压缩包
>
> 这相当于：公司内部 Wiki 的登录页是摆设，任何人知道 URL 都能拖走全部文档。

**为什么这是规约必须管的事**：
规约第六条白纸黑字写了"所有 FastAPI 端点默认需要登录"，但代码里现成的端点就违反了。如果规约定了但不修现有代码，那规约等于空谈。

### ⚠️ 问题 2：字段转换裸奔（规则三 ❌）

**场景**：你写一个新的 Server Action 调 FastAPI。

```typescript
// 前端 Server Action
const res = await fetch('/api/export/nodes', {
  method: 'POST',
  body: JSON.stringify({
    projectId: '123',    // 写错了！应该是 project_id
    nodeIds: ['a', 'b'], // 写错了！应该是 node_ids
  }),
});
```

FastAPI 那边：
```python
class ExportNodesRequest(BaseModel):
    project_id: UUID
    node_ids: list[UUID]
```

**预期**：Pydantic 校验失败，报 422 参数错误。
**实际**：如果 Pydantic 字段是 `Optional`，Pydantic 静默接受 `None`，接口返回 200。
**后果**：接口返回 200，但是**什么都没做**。

**用测试能共鸣的场景**：

> 你跑接口自动化。断言 `status == 200` 通过。
> 但实际上后端拿到的 `project_id = None`，查数据库查了个空，返回空结果。
> 你的测试用例判"断言成功"——**但业务逻辑根本没跑**。
>
> 这种 bug 最坏：没有报错、没有日志、没有异常。只有用户发现"我点了导出怎么没反应"才会被上报。

**Reviewer 的担心**：Prism 现有的 3 个 Server Action（`export.ts`、`analyze.ts`、`import-ai.ts`）都在**手写** snake_case 字段名，全靠开发者自觉。Designer 的 V1 规约只说"Drizzle 自动转"——但**前端调 FastAPI 这段路径 Drizzle 根本管不到**，是规约的盲点。

### ⚠️ 问题 3：issues 筛选空洞（规则五 ❌）

**场景**：产品经理说"给 issues 列表加筛选，我想只看 bug，不看 tech_debt"。

你今天就要写这个接口。规约告诉你：
> "筛选用扁平 query param"

这一句话**回答不了**：
- 参数叫什么？`?category=bug`？`?type=bug`？`?filter=bug`？
- 筛选值是什么？`bug`？`BUG`？`1`（枚举 id）？
- 多选怎么传？`?category=bug,tech_debt`？`?category=bug&category=tech_debt`？

**三个开发者写三种，测试要测 N 套组合**。

**Reviewer 的诉求**：规约不应该只定义"模式"，具体的 issues 筛选参数名和枚举值必须写死。

---

## Round 3：Designer 回应（敢反驳 = 有原则）

Designer 收到 Reviewer 的 19 条质疑，**逐条分三类回应**：
- 🟢 **接受**（确实是盲点）
- 🟡 **部分接受**（问题真实，但 Reviewer 的方案过度）
- 🔴 **反对**（Reviewer 踩了"用不到的就不做"陷阱）

### Designer 接受的（6 条）

这些确实是 V1 漏掉的。都补进 V2：

1. **export 无认证漏洞** → 专门拆一个 `api-conventions-debt.md` 文件记录"存量违规"，DEBT-001 标 P0 必须修
2. **字段转换缺层** → 补规则：「禁止 `{...camelCaseObj}` 展开，必须显式写 `{ project_id: projectId }` 字面量」
3. **issues 筛选参数** → 补 §5.2 具体参数表（`?node_id=&category=&sort_by=created_at&sort_dir=desc`）
4. **category 枚举值** → 从 `schema.ts` 第 231 行对齐：`'bug' | 'tech_debt' | 'design_flaw' | 'performance'`
5. **read Action 和 mutate Action 的区别** → 补 §6.1 表格区分（写操作必须 ActionResult，读操作可以裸 throw）
6. **deleteNode 级联语义** → 新加规则四约定：「删节点必须级联删子孙，FastAPI 和前端必须一致」

### Designer 坚持反对的（5 条）

这是辩论最精彩的部分——Designer 敢说"你说的不对"。

**反对 1：`issues.node_id` 悬挂？不，是故意设计**

Reviewer 担心：删节点后，挂在该节点上的 issues 的 `node_id` 字段会指向不存在的节点，变成"悬挂外键"。

Designer 查 `web/src/db/schema.ts` 第 228 行：
```typescript
nodeId: uuid("node_id").references(() => nodes.id, {
  onDelete: "set null",   // ← 这里
}),
```

**用人话说**：删了节点后，issues 的 `node_id` 字段会自动变成 `NULL`。**这是有意的业务设计**——像你删了公司员工账号，但他写过的评论保留着，署名变成"已删除用户"。不是 bug 是 feature。

Reviewer 在后续的 sign-off 阶段**大方承认错误**："我没查代码就下结论，承认错误。"

**反对 2：未来要做批量导入，不加 cursor 分页会挂？**

Reviewer 担心：F21 自学习功能会批量导入几千条节点，offset 分页性能不行。

Designer 的反驳：
> 批量导入的**结果**是"成功 N 条、失败 M 条、失败原因"——这是**一次性操作反馈**，不是用户翻页浏览。它根本不是分页场景，它是批量操作结果结构。

**用人话说**：
- 翻页 = "我想看第 50 页的内容"（用户主动翻）
- 批量结果 = "我刚刚导入了 1000 条，告诉我成了多少失败多少"（操作完一次展示）

这两个场景需要不同的响应结构。V2 新增 §6.4 专门定义批量操作响应：
```typescript
{
  success_count: number,
  failure_count: number,
  failures: [{ index, reason }]
}
```

**反对 3：多字段排序？小题大做**

Reviewer 担心：F21 要做看板（kanban），按优先级×状态组合排序，没有多字段排序会挂。

Designer：
> issues 单项目最多 100 条。**前端拿到所有数据后在内存里排序**完全够用。后端加 multi-sort 要改接口契约、写测试、维护索引，收益小到可忽略。

**用人话说**：你在淘宝首页看 50 个商品，按"价格低到高"再按"销量高到低"排序——是淘宝服务器排的吗？不是，是你手机自己排的。数据量小的场景，前端内存排序最便宜。

**反对 4 & 5**：公开访问槽、SSE 流式端点 → 都是"功能没排期就先占坑"，违反 YAGNI。需要时单独做 ADR。

### 存量违规怎么办？

Reviewer 发现多处现存代码违反规约（`projects.py` 的 `detail=str(e)`、`export.py` 无认证、`knowledge_items` 无乐观锁）。

Designer 的处理：**分离"应然"和"已然"**——
- `api-conventions.md`（主规约）= 应然：从现在起新代码必须这样写
- `api-conventions-debt.md`（债务文件）= 已然：已知违规，分级记录、给出修复方案、标优先级

这是**债务管理思路**，不是回避问题。每条债务标 P0/P1/P2/P3，有修复方案，可追踪。

---

## Round 4：Reviewer Sign-off（4 次承认踩陷阱）

Reviewer 读完 V2 + debt 文件，对自己的 5 条反对重新打标：

| # | 原质疑 | 最终态度 |
|---|---|---|
| 1 | `issues.node_id` 悬挂 | 🟢 我错了，查代码后确认是故意设计 |
| 2 | F21 需要 cursor 分页 | 🟢 我错了，批量结果不是分页场景 |
| 3 | 多字段排序 | 🟢 我错了，小量级内存排序够 |
| 4 | 预留公开访问槽 | 🟢 我错了，未排期不做 |
| 5 | SSE 需要规范 | 🟢 我错了，单独 ADR 更干净 |

**4 次承认"踩了 YAGNI 陷阱"**——这是辩论最有价值的部分。

Reviewer 的最终判决：**⚠️ 有条件通过**
- **硬条件**：DEBT-001（export 无认证）必须修再发布
- **软条件**：§6.5 导出响应模式的切换依据改"单/多资源语义"（更稳定），而不是"文件大小"（阈值难维护）

---

## 当天发生了什么（时间线）

| 时刻 | 事件 | 产出 |
|---|---|---|
| 开始 | CY 问"有没有项目前置应该定义的东西" | 触发整套讨论 |
| 第 1 小时 | 主控写"设计决策框架"+ Prism 审计 | 知识库两篇 |
| 第 2 小时 | Designer V1 草案 | 6 条规则初稿 |
| 第 3 小时 | Reviewer 挑刺 | 3 ❌ + 8 ⚠️ |
| 第 3 小时 | Designer V2 + debt 文件 | `api-conventions.md` + `api-conventions-debt.md` |
| 第 4 小时 | Reviewer sign-off（承认 4 次 YAGNI 陷阱） | 有条件通过 |
| 第 4 小时 | CY 拍板"现在就修 DEBT-001" | 触发安全修复 |
| 第 4 小时 | 主控修代码 | `export.py` + `export.ts` 加认证 |
| 第 5 小时 | 全部 push 到 GitHub | 2 次 commit |

---

## 如果你是测试同学，这份辩论对你的意义

### 1. 辩论的三个阻塞项都有测试含义

- **安全漏洞（DEBT-001）**：这种"无认证接口"**必须列入安全测试检查清单**。以后每次发现新的 FastAPI 路由，第一件事就是 grep `require_user`。
- **字段转换裸奔**：这种 bug 是"接口 200 但没做事"的典型。**断言 status 不够，必须断言副作用**（比如数据库真的改了）。
- **规约不够具体**：如果规约只说"扁平 query param"不给具体枚举，**测试用例会爆炸**。这是规约质量问题，推规约补齐比单靠测试覆盖便宜。

### 2. YAGNI 陷阱对测试的启示

Reviewer 踩了 4 次陷阱——**都是"为未来担心"**：F21 会怎样、做协作时怎么办、分享链接怎么办。

测试圈常见的对应陷阱：
- "这个功能将来可能会扩展，我先写个通用测试框架"
- "未来可能用到的 case 我先写进去"
- "万一将来要支持批量，我先加批量测试"

**YAGNI 原则对测试同样适用**：现在的功能现在测，未来的需求未来做。

### 3. 两个 Agent 互相校验的模式，可以套到评审流程

一个人写用例 / 设计方案，另一个人带"找漏洞"的心态 review——**强制两个视角**，漏洞才能暴露出来。

单人容易：
- 看不见自己的盲点
- 陷入"我已经想过了"幻觉

多人互怼+留痕，是最便宜的质量保障。

---

## 最后说三句

1. **规约不是一次性完美的**：V1 → V2 → （未来 V3）。每次有新场景触发升级。
2. **辩论过程比结论值钱**：3 个月后回头看这份文档，能找到当时为什么选 A 不选 B。
3. **YAGNI 是防线，不是懒惰**："不做"要有底气，不是因为"懒得做"。Designer 的 5 次反对都守住了这条线。

---

## 相关文件

- 最终规约：[`docs/architecture/api-conventions.md`](../architecture/api-conventions.md)
- 存量债务：[`docs/architecture/api-conventions-debt.md`](../architecture/api-conventions-debt.md)
- 错误码规约（上位）：[`docs/architecture/error-codes.md`](../architecture/error-codes.md)
- 设计决策框架（方法论，知识库）：`ai-quality-engineering/06-成长/研究笔记/设计决策框架-约束下的选择.md`
