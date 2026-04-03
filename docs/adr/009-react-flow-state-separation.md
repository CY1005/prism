# ADR-009: React Flow 视图状态与业务数据分离

## Status: Accepted

## Context

Prism 使用 React Flow 渲染模块关系图。React Flow 内部维护大量视图状态（节点位置、缩放、viewport、选中态）。如果把这些视图状态和业务数据混在一起存到数据库，会导致数据模型污染。

来源：GPT Review 指出"数据库存业务真相，不要直接把 React Flow 的视图状态当业务模型"。

## Decision

**数据库只存业务真相：**
- 节点实体（node 表）：id、name、parent_id、type、metadata
- 节点关联（node_relation 表）：source、target、relation_type

**前端负责视图状态：**
- 节点在画布上的 x/y 位置
- 缩放级别、viewport 偏移
- 折叠/展开状态
- 临时选中态、hover 态

**如果需要持久化布局：**
- 用单独的 `layout_preferences` 字段或表，不混入 node 表的核心字段
- 这是"用户偏好"，不是"业务数据"

## Consequences

- **好处**：数据模型干净，业务查询不被视图字段干扰
- **代价**：每次打开关系图需要重新计算布局（或从偏好中恢复）
- **实现**：React Flow 的 `onNodesChange` 事件更新 Zustand，不触发数据库写入
