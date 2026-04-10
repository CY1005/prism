# ADR-006: TanStack Query（服务端）+ Zustand（UI 状态），职责严格分离

## Status: Accepted

## Context

Prism 前端需要管理两类状态：
1. 服务端数据（节点树、维度记录、项目列表）— 需要缓存、失效、乐观更新
2. UI 交互状态（React Flow 画布、侧边栏开关、选中节点、筛选条件）— 纯本地

GPT Review 指出："单人项目最容易把数据放乱，不要同一份实体两边都存。"

## Decision

- **TanStack Query**：管所有服务端数据的 fetch / cache / invalidation
- **Zustand**：管纯前端交互状态

**严格边界：**

| 数据 | 放哪 | 示例 |
|------|------|------|
| 从 DB 来的 | TanStack Query | 节点列表、维度记录、项目成员 |
| 纯前端的 | Zustand | 选中节点ID、侧边栏展开、React Flow viewport |
| 派生的 | 不存，实时计算 | 完善度百分比、筛选后的列表 |

**禁止：** 把 TanStack Query 缓存的数据再复制一份到 Zustand。

## Alternatives

| 方案 | 否决原因 |
|------|----------|
| 只用 Zustand | 服务端缓存/失效要手动管理，代码量大 |
| 只用 TanStack Query | 管不了 React Flow 画布等纯 UI 状态 |
| Redux Toolkit | 样板代码多，对单人项目过重 |
| React Context | 大规模状态性能差 |

## Consequences

- **好处**：职责清晰，不会数据分裂
- **代价**：要守住纪律，每次加状态先问"这是服务端数据还是 UI 状态"
- **执行机制**：Code Review 时（自审）检查 Zustand store 中是否混入了应由 TanStack Query 管理的实体数据
