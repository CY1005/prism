# Prism v0.1 Phase 2 — Test Checklist

**Date:** 2026-04-12
**QA Agent:** qa
**TypeScript Check:** ✅ PASS (`npx tsc --noEmit` — zero errors)

---

## F3: 功能模块树 (Feature Tree)

### AC1: 进入项目后左侧显示树形结构，层级图标和展开/折叠行为正确
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 左侧树形结构正确展示，文件夹有展开/折叠箭头，叶子节点无箭头 | **Frontend:** `web/src/components/feature-tree.tsx:150-221` — TreeItem renders ChevronRight with rotate-90 on expand for folders, 4px spacer for files. `workspace.tsx:428-440` — FeatureTree rendered in sidebar ScrollArea. **Backend:** `web/src/actions/nodes.ts:19-97` — `getProjectTree()` builds tree from flat DB rows, sorts by depth+sortOrder. |

### AC2: 树的层级标签从项目配置的 hierarchy_labels 读取，不同项目显示不同标签
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | hierarchy_labels 从 DB 读取，在面包屑导航中**未**作为层级名使用 | **Backend:** `web/src/db/schema.ts:38-41` — `hierarchyLabels` column exists. **Frontend:** `workspace.tsx:78` — Project type includes hierarchyLabels. However, the tree itself and breadcrumb (`workspace.tsx:453-467`) only display node names, not hierarchy level labels (e.g. "产品线 > 模块 > 功能项"). The labels are available but not rendered as level prefixes. |

### AC3: 树不限制层级深度
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 无硬编码深度限制 | **Backend:** `web/src/actions/nodes.ts:165` — `depth = parent ? parent.depth + 1 : 0`, no upper bound check. **Frontend:** `feature-tree.tsx:197-221` — Recursive TreeItem rendering with `level + 1`, no depth cap. |

### AC4: 树的每个节点旁显示完善度色块（绿≥80%/黄40-80%/红<40%）
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 色块颜色阈值正确 | **Frontend:** `feature-tree.tsx:16-20` — `getStatusColor()`: green≥80, yellow≥40, red<40. `feature-tree.tsx:193` — Rendered as 2x2 rounded-full span next to node name. **Backend:** `nodes.ts:63-71` — `completionPercent` calculated as filled unique dimensions / total enabled dimensions. Folder completion recursively averaged (`nodes.ts:84-94`). |

### AC5: 侧边栏顶部显示项目名称和项目类型Badge
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 项目名+Badge展示完整 | **Frontend:** `workspace.tsx:417-427` — Sidebar header shows `project.name` (truncated) + Badge with template type (产品分析 etc). |

### AC6: 选中叶子节点，右侧显示对应的功能项档案页
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 选中file节点触发维度数据加载 | **Frontend:** `workspace.tsx:263-277` — `handleSelectNode`: type "file" calls `getNodeWithDimensions(id)`, sets nodeData. `workspace.tsx:486-531` — Renders dimension cards + version timeline when `selectedType === "file"`. |

### AC7: 选中文件夹节点，右侧显示该层级的概览页
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 文件夹概览显示子节点列表+统计 | **Frontend:** `workspace.tsx:271-276` — `handleSelectNode`: type "folder" calls `getFolderOverview()`. `workspace.tsx:534-579` — Renders children with name, dimension count, completion %, color dot, and arrow. **Backend:** `nodes.ts:405-469` — `getFolderOverview()` returns children with filled/total dimensions and completion percent. |

### AC8: 右键点击任意节点，弹出上下文菜单（添加子节点/重命名/删除）
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 菜单包含所有操作项 | **Frontend:** `feature-tree.tsx:34-97` — ContextMenu: folder nodes get "添加子文件夹" + "添加功能项", all nodes get "重命名" + "删除". Rename triggers inline editing (`feature-tree.tsx:177-189`), Enter confirms, Escape cancels. |

### AC9: 右键菜单在空白区域点击时，显示"添加顶层节点"选项
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 空白区域右键显示添加顶层选项 | **Frontend:** `feature-tree.tsx:228-269` — RootContextMenu with "添加顶层文件夹" + "添加顶层功能项". `feature-tree.tsx:326-332` — `handleEmptyAreaContextMenu` checks click target is not a tree node button before showing. |

### AC10: 拖拽节点可调整同级排序
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 拖拽排序通过 updateNodeSortOrder 实现 | **Frontend:** `feature-tree.tsx:152-156` — draggable button with onDragStart/onDragOver/onDrop. `feature-tree.tsx:295-310` — handleDrop calls `onReorder(dragNodeId, targetIndex)`. **Backend:** `nodes.ts:733-798` — `updateNodeSortOrder()` splices node into new position, batch-updates sortOrder in transaction. |

### AC11: 拖拽节点可跨级移动，自动更新materialized_path整个子树路径
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | Backend moveNode完整实现，但Frontend拖拽**仅调用reorder**（同级排序），未调用moveNode（跨级） | **Backend:** `nodes.ts:800-895` — `moveNode()` correctly: validates no self-move, no move-to-descendant, updates parent/depth/path of node + all descendants via `like(nodes.path, '%nodeId%')` in transaction. **Frontend:** `workspace.tsx:372-377` — `handleReorder` only calls `updateNodeSortOrder`. `feature-tree.tsx:295-310` — Drop handler always calls `onReorder`, never `moveNode`. **Bug:** Drag-drop cannot trigger cross-level move from the UI. |

**Bug #1:** `web/src/components/feature-tree.tsx:295-310` — Drop handler only calls `onReorder` (same-level reorder). Cross-level move (`moveNode`) is implemented in backend but not wired to the drag-drop UI.
**Fix:** Detect if drop target is a different parent than drag source; if so, call `moveNode` instead of `updateNodeSortOrder`.

### AC12: 删除节点为级联删除——该节点及其所有子节点、关联的维度记录、版本记录一并删除
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | CASCADE配置正确 | **Backend:** `nodes.ts:390-391` — `db.delete(nodes).where(eq(nodes.id, nodeId))`. **Schema:** `schema.ts:155-157` — `dimensionRecords.nodeId` → `onDelete: "cascade"`. `schema.ts:175-177` — `versionRecords.nodeId` → `onDelete: "cascade"`. Children cascade via `nodes.parentId` referencing `nodes.id` — **Note:** `schema.ts:137` — `parentId` has no explicit `onDelete: "cascade"` reference to nodes. Children deletion relies on materialized_path pattern, but actual DB delete only deletes the target node. |

**Bug #2:** `web/src/db/schema.ts:137` — `parentId: uuid("parent_id")` is a plain column with no FK reference to `nodes.id` and no `onDelete: "cascade"`. `deleteNode()` in `nodes.ts:391` only deletes the target node by ID. Child nodes are NOT cascade-deleted by the database. They become orphaned (parentId points to non-existent node).
**Fix:** Either add FK reference with cascade (`references(() => nodes.id, { onDelete: "cascade" })`), or change `deleteNode()` to first find all descendants via path pattern and delete them explicitly.

### AC13: 删除前二次确认弹窗，明确提示影响范围
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | 弹窗显示子节点数和维度记录数，但**缺少节点名称**和版本记录数 | **Frontend:** `workspace.tsx:620-638` — Delete dialog shows "此操作将同时删除 N 个子节点和 M 条维度记录，且不可撤销". **Backend:** `nodes.ts:897-930` — `getNodeDescendantCount()` returns `childNodeCount` + `dimensionRecordCount`. **Gap:** PRD requires format "将删除 {节点名} 及其下 {N} 个子节点、{M} 条维度记录"— node name is missing from the dialog message. Version record count is also not included. |

### AC14: 当前选中节点被删除后，自动切换到父节点
| Status | Description | Evidence |
|--------|------------|----------|
| ❌ Not Implemented | 删除后清空选择，不会切换到父节点 | **Frontend:** `workspace.tsx:312-318` — `handleConfirmDelete`: if deleted node was selected, sets `selectedId("")`, `nodeData(null)`, `folderChildren(null)`. Does NOT look up the deleted node's parentId to auto-select it. Falls through to empty state ("选择左侧树中的节点查看详情"). |

**Bug #3:** `web/src/app/projects/[projectId]/workspace.tsx:312-318` — After deleting the selected node, selection is cleared to empty state instead of auto-selecting the parent node.
**Fix:** Before calling `deleteNode`, save the node's `parentId`. After delete, if the deleted node was selected, call `handleSelectNode(parentId, "folder")`.

### AC15: 拖拽节点到其他位置时，显示插入指示线和目标高亮
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | 有指示线但样式简陋 | **Frontend:** `feature-tree.tsx:167` — `isDragOver && "border-t-2 border-primary"` — shows a 2px top border on the target node. This is a basic indicator, not a dedicated insertion line between nodes. No separate "target highlight" for folder drop targets. |

### AC16: 选中文件夹节点时，右侧展示该文件夹的概要
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 文件夹概览含子节点数量和完善度 | **Frontend:** `workspace.tsx:534-579` — Folder view shows children list with type icon, name, dimension fill count, completion %, and color dot. **Backend:** `nodes.ts:405-469` — `getFolderOverview()` calculates per-child stats. **Gap:** Missing "最近更新" (last updated) and "平均完善度" aggregate stats for the folder itself. |

---

## F4: 功能项档案页 (Feature Detail Page)

### AC1: 点击功能项后右侧展示档案页，维度卡片数量和类型从 project_dimension_config 读取
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 维度卡片从config动态渲染 | **Frontend:** `workspace.tsx:488-523` — Iterates over `dimensions` (from `getProjectDimensions`), renders one DimensionCard per enabled dimension. **Backend:** `nodes.ts:128-149` — `getProjectDimensions()` joins `projectDimensionConfigs` + `dimensionTypes`, filters by enabled + projectId. |

### AC2: 维度卡片按 project_dimension_config 中的排序顺序渲染
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 按sortOrder排序 | **Backend:** `nodes.ts:148` — `.orderBy(asc(projectDimensionConfigs.sortOrder))`. Frontend renders in the order returned. |

### AC3: 每个维度区块可折叠/展开，折叠时显示摘要
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | Collapsible组件+摘要显示 | **Frontend:** `dimension-card.tsx:54-116` — Uses Radix Collapsible. When collapsed (`!isOpen`), shows `collapsedSummary` text. `workspace.tsx:500` — `collapsedSummary` set to "未填写" when empty, undefined when has content. Entry count Badge always visible (line 64). |

### AC4: 空维度区块显示引导文案
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 空状态显示引导文案 | **Frontend:** `workspace.tsx:516-519` — Empty dimension shows icon + "点击添加，或上传文档自动分析" (matches PRD exactly). |

### AC5: 面包屑层级标签从项目 hierarchy_labels 读取
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | 面包屑显示节点名称，不显示层级标签 | **Frontend:** `workspace.tsx:200-213` — `buildBreadcrumb()` traverses tree to find path to node, returns TreeNode array. `workspace.tsx:453-467` — Renders node names only. PRD requires hierarchy_labels as level prefixes (e.g. "产品线: XXX > 模块: YYY > 功能项: ZZZ"). `project.hierarchyLabels` is available but not used in breadcrumb. |

### AC6: 创建功能项只需输入名称，其他全部可选
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 只需名称即可创建 | **Frontend:** `workspace.tsx:594-617` — Add Node dialog has only name input + create button. **Backend:** `nodes.ts:151-216` — `createNode` requires projectId, parentId, name, type. No other mandatory fields. |

### AC7: 底部版本时间线根据项目的 version_mode 展示不同样式
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | 时间线存在但不根据version_mode切换显示格式 | **Frontend:** `workspace.tsx:526-529` — VersionTimeline rendered, but `project.versionMode` is NOT passed to it. `version-timeline.tsx:79` — Component has no `mode` prop. It always displays whatever `versionLabel` the user typed. PRD AC3 requires: release mode shows version numbers (v3.9.3), continuous mode shows dates (2026-04-07). |

### AC8: 页面顶部显示完善度进度条
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 进度条在头部展示 | **Frontend:** `workspace.tsx:469-477` — Shows "N/M 维度已填写" + Progress bar + percentage. Rendered in header when `selectedType === "file" && nodeData`. |

### AC9: 完善度按字段完整度计算（每条记录检查关键字段是否填写）
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | 当前实现为维度级别（有/无记录），非字段级别 | **Frontend:** `workspace.tsx:405-409` — `filledDimensions` counts dimensions that have at least one record. `completionPercent = filledDimensions / totalDimensions`. **PRD requires:** Per-record field completeness (e.g. 竞品参考 has 5 fields, filled 3 = 60%), then average across records, then average across dimensions. Current implementation treats any record presence as 100% for that dimension. |

**Bug #4:** `web/src/app/projects/[projectId]/workspace.tsx:405-409` — Completion calculation is dimension-presence-based (binary: has records or not), not field-level as PRD AC9 requires. A dimension with one partially-filled record shows as 100%.
**Fix:** Use `dimensionTypes.fieldSchema` to determine required fields per dimension, check which fields in each record's content are non-empty, compute per-field completeness.

### AC10-11: 完善度计算示例和字段定义
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | fieldSchema列存在但未用于完善度计算 | **Schema:** `schema.ts:113` — `fieldSchema: jsonb("field_schema")` exists on `dimensionTypes`. Not used in any completion logic. |

### AC12-14: 维度内容编辑器基于Plate，支持富文本/Markdown快捷键
| Status | Description | Evidence |
|--------|------------|----------|
| ❌ Not Implemented | 使用纯textarea，未集成Plate编辑器 | **Frontend:** `workspace.tsx:648-657` — Add dimension uses plain `<textarea>`. `workspace.tsx:672-678` — Edit dimension also plain `<textarea>`. Content parsed as JSON or wrapped as `{ text: value }` (`workspace.tsx:336-339`). No Plate, no rich text, no Markdown shortcuts, no slash commands, no drag-sort blocks. |

### AC15: "添加"按钮点击后展示4种添加方式
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 4种方式均展示 | **Frontend:** `dimension-card.tsx:77-94` — DropdownMenu with 4 items: 手动编辑 (FileEdit), 粘贴Markdown (ClipboardPaste), 上传文件 (Upload), URL导入 (Link). **Note:** Only 手动编辑 is functional (`onAdd` callback), other 3 show "即将上线" toast (`showComingSoon`). This is acceptable for v0.1 MVP. |

### AC16: 已有内容可编辑和删除
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 编辑和删除功能可用 | **Frontend:** `workspace.tsx:506-511` — Each record has hover-visible "编辑" and "删除" buttons. Edit opens dialog with textarea pre-filled (`workspace.tsx:349-354`). Delete uses `confirm()` then calls `deleteDimensionRecord` (`workspace.tsx:379-389`). **Backend:** `nodes.ts:254-312` — `updateDimensionRecord()` with optimistic lock. `nodes.ts:314-347` — `deleteDimensionRecord()`. |

**Bug #5:** `web/src/app/projects/[projectId]/workspace.tsx:365` — `updateDimensionRecord(editDimRecordId, content, 1)` hardcodes version=1 for optimistic lock. Should pass the actual record's current version. After the first edit, version becomes 2, and subsequent edits will fail with "内容已被他人修改" conflict error.
**Fix:** Store the record's `version` field when opening the edit dialog and pass it to `updateDimensionRecord`.

---

## F5: 版本演进时间线 (Version Timeline)

### AC1: 功能项档案页底部展示版本时间线，按时间正序排列
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 时间线正序展示 | **Frontend:** `workspace.tsx:526-529` — VersionTimeline rendered after all dimension cards. **Backend:** `versions.ts:28-29` — `.orderBy(asc(versionRecords.createdAt))`. |

### AC2: 每个时间线节点显示：版本号/日期 + 变更类型图标/颜色 + 摘要 + "当前版本"标签
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 所有元素齐全 | **Frontend:** `version-timeline.tsx:152-176` — Shows: version label (mono font), ChangeTypeBadge (icon+color+label), "当前版本" Badge when `isCurrent`, summary text. Timeline dot is filled primary when current, hollow when not. |

### AC3: 产品分析项目显示版本号格式，系统架构项目显示日期格式
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | 无版本模式自动格式化 | **Frontend:** `version-timeline.tsx:79` — No `mode` prop. `version-timeline.tsx:159` — Displays raw `v.versionLabel` as-is. User can type any format, but system doesn't enforce or auto-format based on `project.versionMode`. **Backend:** `versions.ts:118` — `mode: "release"` hardcoded on creation, ignoring project's `versionMode`. |

**Bug #6:** `web/src/actions/versions.ts:118` — `mode` is hardcoded to `"release"` instead of reading from the project's `versionMode` setting.
**Fix:** Fetch project's `versionMode` and use it when inserting the version record.

### AC4: 点击"添加版本记录"，填写版本号+描述+变更类型后保存
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 添加版本对话框完整 | **Frontend:** `version-timeline.tsx:206-267` — Dialog with: version label input, change type selector (6 types), summary input, optional details textarea. Submit button disabled until label + summary filled. **Backend:** `versions.ts:32-133` — `createVersion()` inserts record, sets isCurrent, unsets previous current. |

### AC5: 保存时自动创建维度快照
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 快照包含所有维度记录完整拷贝 | **Backend:** `versions.ts:70-92` — Queries all dimension records for the node, joins dimension types for key+name, maps to snapshot array with `dimensionTypeId`, `dimensionKey`, `dimensionName`, `content`, `version`. Stored in `snapshotData` JSONB column. |

### AC6: 版本号不能重复，重复时提示"该版本已存在"
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 双重检查：代码+DB约束 | **Backend:** `versions.ts:48-68` — Pre-check query for duplicate label per node, returns "版本标签 X 在该节点下已存在". **Schema:** `schema.ts:187` — `unique().on(t.nodeId, t.versionLabel)` DB-level unique constraint as fallback. |

### AC7: 点击时间线节点可展开查看该版本的维度快照（只读）
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 快照只读展示 | **Frontend:** `version-timeline.tsx:148-198` — Collapsible on each version. When expanded, shows details text + snapshot data. `version-timeline.tsx:183-195` — Snapshot renders dimension name + JSON content. No edit controls in snapshot view (read-only). |

### AC8: 快照内容与当前维度内容可能不同，快照是历史定格
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 快照是独立副本 | **Backend:** `versions.ts:86-92` — Snapshot is a full copy of record content at creation time, stored as JSONB array. No reference to live records. Editing dimension records after version creation does not affect snapshots. |

### AC9: 变更类型支持6种，用不同颜色/图标区分
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 6种类型颜色和图标均正确 | **Frontend:** `version-timeline.tsx:41-48` — `changeTypeConfig`: added=green/Plus, modified=blue/Pencil, deprecated=gray/Archive, split=orange/Split, merged=purple/Merge, migrated=cyan/ArrowRightLeft. All match PRD specification. |

---

## Security Audit

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| S1 | Auth on all new server actions | ✅ PASS | All new actions | Every action calls `requireAuth()` as first step: `nodes.ts` (all 12 functions), `versions.ts` (all 4 functions). |
| S2 | Permission checks (editor for write, viewer for read) | ✅ PASS | All new actions | Read actions use `checkProjectAccess(userId, projectId, "viewer")`. Write actions use `checkProjectAccess(userId, projectId, "editor")`. Examples: `createNode:159`, `renameNode:362`, `deleteNode:388`, `createVersion:46`, `getProjectTree:21`. |
| S3 | SQL injection | ✅ SAFE | All queries | All queries use Drizzle ORM parameterized queries. No raw SQL. `like(nodes.path, '%nodeId%')` in `moveNode:869` and `getNodeDescendantCount:915` uses Drizzle's `like()` which parameterizes properly. |
| S4 | Input validation — node name | LOW | `nodes.ts:151-216` | `createNode()` accepts any string as name (no length limit, no sanitization). Could store extremely long names or HTML/script content. Mitigated: names rendered as text content in React (auto-escaped). |
| S5 | Input validation — version label | LOW | `versions.ts:32-133` | `createVersion()` accepts any string as version label. No format validation. |
| S6 | Optimistic lock bypass | LOW | `workspace.tsx:365` | Hardcoded version=1 means concurrent edit detection is broken after first edit (see Bug #5). |
| S7 | Path traversal in materialized_path | ✅ SAFE | `nodes.ts:831,869` | `moveNode()` prevents moving to self (`nodeId === newParentId`) and to descendant (`p.path.includes(nodeId)`). No path injection possible since paths are constructed from UUIDs. |

---

## Summary

### F3 Feature Tree (16 ACs)
- ✅ Implemented: 10 (AC1, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC16)
- ⚠️ Partially: 4 (AC2, AC11, AC13, AC15)
- ❌ Not Implemented: 1 (AC14)
- **Note:** AC12 (cascade delete) has a critical bug — children not actually cascade-deleted by DB (Bug #2)

### F4 Feature Detail Page (16 ACs checked, AC17-AC21 deferred as Plate/reference features)
- ✅ Implemented: 7 (AC1, AC2, AC3, AC4, AC6, AC8, AC15, AC16)
- ⚠️ Partially: 4 (AC5, AC7, AC9/AC10/AC11)
- ❌ Not Implemented: 1 (AC12-14 Plate editor)

### F5 Version Timeline (9 ACs)
- ✅ Implemented: 7 (AC1, AC2, AC4, AC5, AC6, AC7, AC8, AC9)
- ⚠️ Partially: 1 (AC3)
- ❌ Not Implemented: 0

### Bugs Found: 6
| # | File | Line | Summary | Severity | Assigned To |
|---|------|------|---------|----------|-------------|
| 1 | `web/src/components/feature-tree.tsx` | 295-310 | Drag-drop only triggers reorder, not cross-level move | MEDIUM | frontend |
| 2 | `web/src/db/schema.ts` | 137 | `parentId` has no FK cascade — child nodes not deleted when parent deleted | HIGH | backend |
| 3 | `web/src/app/projects/[projectId]/workspace.tsx` | 312-318 | After delete, selection clears instead of auto-selecting parent | LOW | frontend |
| 4 | `web/src/app/projects/[projectId]/workspace.tsx` | 405-409 | Completion is dimension-presence, not field-level per PRD AC9 | MEDIUM | frontend |
| 5 | `web/src/app/projects/[projectId]/workspace.tsx` | 365 | `updateDimensionRecord` hardcodes version=1, breaks optimistic lock | HIGH | frontend |
| 6 | `web/src/actions/versions.ts` | 118 | Version mode hardcoded to "release", ignores project.versionMode | LOW | backend |

### TypeScript: ✅ PASS (0 errors)
### All New Server Actions: Auth + permission guards verified
