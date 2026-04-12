# Test Checklist — v0.2 Phase 4 (F6 + F7)

**Date:** 2026-04-12
**Reviewer:** QA Agent
**TypeScript Check:** `npx tsc --noEmit` — 0 errors

---

## F7: 问题沉淀 (Issues)

### AC1: 添加问题（选分类+填描述）
**Status: ✅ PASS**

- Schema: `issues` 表包含 `category`(text, NOT NULL), `description`(text, NOT NULL), `tags`(jsonb) — `schema.ts:222-235`
- Backend: `createIssue()` 验证 category 在 `["bug","tech_debt","design_flaw","performance"]` 内，验证 description 非空，验证 nodeId 归属 — `actions/issues.ts:23-68`
- Frontend: `AddIssueDialog` 提供 Select 选择分类（4种，含图标+中文标签），Textarea 填写描述，submit 时检查 description 非空 — `issue-card.tsx:241-353`
- 集成: workspace.tsx 功能项档案页有"添加问题"按钮，弹出 AddIssueDialog，保存后刷新列表 — `workspace.tsx:531-549`

### AC2: 问题自动归入功能项 + 按分类关联维度
**Status: ✅ PASS (前端) / ⚠️ BUG (后端)**

- 前端映射正确 (`issue-card.tsx:72-77`):
  - bug → `test_analysis`
  - tech_debt → `engineering_exp`
  - design_flaw → `design_decision`
  - performance → `tech_impl`
- workspace.tsx 导入的是 `issue-card.tsx` 的 `CATEGORY_DIMENSION_MAP`，维度卡片过滤逻辑正确 — `workspace.tsx:774`
- **BUG-001**: `actions/issues.ts:16-21` 的 `CATEGORY_DIMENSION_MAP` 使用了错误的维度 key：
  - `tech_debt: "engineering_experience"` 应为 `"engineering_exp"`
  - `performance: "technical_implementation"` 应为 `"tech_impl"`
  - 实际 seed 数据中的 key 是 `engineering_exp` 和 `tech_impl`（`seed.ts:42-44`）
  - **影响**: 当前该 map 未被前端消费（前端用 issue-card.tsx 自己的），但若后端逻辑未来引用此 map 会产生映射失败。**严重度: Low（当前无功能影响，但应修复以保持一致性）**

### AC3: 标签筛选
**Status: ✅ PASS**

- 添加标签: AddIssueDialog 支持输入标签（回车或点击"添加"），可删除已添加标签 — `issue-card.tsx:247-339`
- 筛选: IssueList 收集所有标签，渲染为可点击 Badge，点击切换 tagFilter 状态，filtered 列表按 tagFilter 过滤 — `issue-card.tsx:111-137`
- issues 页面: 支持按分类筛选（Select 下拉），调用 `getIssuesByCategory` — `issues/page.tsx:63-85`

### AC4: 维度卡片底部展示关联问题
**Status: ✅ PASS**

- workspace.tsx 每个维度卡片内计算 `dimIssues`（按 CATEGORY_DIMENSION_MAP 过滤），在维度内容下方用 `<Separator>` + `<IssueList>` 展示 — `workspace.tsx:772-807`
- `showAddButton={false}` 避免维度卡片内出现多余的添加按钮

### AC5: 问题归入功能项（nodeId 关联）
**Status: ✅ PASS**

- Schema: `issues.nodeId` 可选 FK → `nodes.id`, onDelete: "set null" — `schema.ts:227-229`
- `createIssue()` 接受 `nodeId` 参数，workspace 中传入当前选中的 `nodeData.node.id` — `workspace.tsx:534`
- `getIssuesByNode()` 按 projectId + nodeId 查询 — `actions/issues.ts:138-146`
- issues 页面中 `createIssue(projectId, null, data)` 传 null nodeId，支持项目级问题 — `issues/page.tsx:93`

---

## F6: 竞品参考 (Competitor References)

### AC1: 从全局竞品列表选择竞品，填写结构化模板
**Status: ✅ PASS**

- `AddReferenceDialog` 提供 Select 下拉选择已有竞品，支持"新建"按钮内联创建竞品 — `competitor-reference-card.tsx:260-303`
- 新建竞品调用 `onCreateCompetitor`，workspace 中接入 `createCompetitor` action — `workspace.tsx:555-563`
- 结构化模板字段完整（见 AC3）

### AC2: 同一功能项多条竞品参考
**Status: ✅ PASS**

- Schema: `competitor_references` 表无 unique 约束（nodeId + competitorId 组合），同一 nodeId 可有多条记录 — `schema.ts:254-268`
- `CompetitorReferenceList` 渲染 `references` 数组，无数量限制 — `competitor-reference-card.tsx:68-167`
- `getReferencesByNode()` 返回所有匹配记录 — `competitor-references.ts:120-132`

### AC3: 结构化模板字段完整
**Status: ✅ PASS**

- Schema 字段: `version`(text), `featureCoverage`(text), `technicalApproach`(text), `prosAndCons`(jsonb: {pros:string[], cons:string[]}) — `schema.ts:263-266`
- AddReferenceDialog 包含: 竞品选择/新建、版本号、功能覆盖度(Textarea)、技术方案(Textarea)、优势列表(输入+回车)、劣势列表(输入+回车) — `competitor-reference-card.tsx:305-435`
- 竞品名称来自全局 competitors 实体，通过 competitorId 关联
- CompetitorReferenceList 展示全部字段: 竞品名称+版本 Badge、功能覆盖度、技术方案（带标签）、优势/劣势双列卡片（绿/红背景） — `competitor-reference-card.tsx:91-166`

### AC4: 编辑和删除
**Status: ✅ PASS**

- 编辑: hover 显示 Pencil 按钮 → `onEdit(ref)` → 设置 `editingRef` → 打开 AddReferenceDialog（预填数据）→ `handleAddRef` 检测 `editingRef` 存在则调用 `updateReference` — `workspace.tsx:574-575`
- 删除: hover 显示 Trash2 按钮 → `onDelete(refId)` → confirm 确认 → `deleteReference` — `workspace.tsx:585-594`
- Backend: `updateReference()` 更新指定字段，`deleteReference()` 删除记录，均有权限检查 — `competitor-references.ts:60-118`

### AC5: 竞品全局实体管理
**Status: ✅ PASS**

- Schema: `competitors` 表（项目级），含 name, website, description — `schema.ts:240-249`
- Backend: `createCompetitor`, `updateCompetitor`, `deleteCompetitor`, `getCompetitorsByProject` — `competitors.ts:1-114`
- 删除竞品时 cascade 删除关联的 competitor_references — `schema.ts:260` (onDelete: "cascade")
- Settings 页面: 新增"竞品管理"Tab，集成 `CompetitorManagement` 组件，支持添加/编辑/删除竞品 — `settings/page.tsx:66,290-301,592-601`
- CompetitorManagement: 列表展示（名称+链接+描述），hover 编辑/删除按钮，删除前 confirm 提醒 — `competitor-reference-card.tsx:438-621`
- 权限控制: `canAdmin` 控制按钮 disabled 状态

---

## Bug 列表

| ID | 严重度 | 模块 | 描述 |
|----|--------|------|------|
| BUG-001 | Low | actions/issues.ts | `CATEGORY_DIMENSION_MAP` 使用了与数据库不一致的维度 key（`engineering_experience`/`technical_implementation` 应为 `engineering_exp`/`tech_impl`）。当前无功能影响（前端使用 issue-card.tsx 的正确映射），但应修复保持一致性，避免未来后端引用时出错。 |

---

## 代码质量观察

1. **CATEGORY_DIMENSION_MAP 重复定义**: 存在于 `actions/issues.ts` 和 `issue-card.tsx` 两处，且内容不一致（BUG-001）。建议统一为单一真相源，前端从 shared 位置导入。
2. **权限检查完善**: 所有 action 均经过 `requireAuth()` + `checkProjectAccess()` 双层验证，前端 UI 通过 `canAdmin`/`isViewer` 控制按钮 disabled 状态。
3. **乐观更新未使用**: 所有写操作后都重新 fetch 数据（如 `getIssuesByNode`、`getReferencesByNode`），保证数据一致性但牺牲了部分 UX 流畅度。对于 MVP 阶段这是合理的。
4. **错误处理统一**: 使用 `ActionResult` + `actionError`/`actionSuccess` 模式，所有 action 有 try-catch 包裹。
5. **issues 页面加载方式**: `issues/page.tsx` 通过 4 次 `getIssuesByCategory` 并发调用加载全部问题，缺少 `getIssuesByProject` 的直接查询。功能正确但效率可优化。
6. **AddReferenceDialog 编辑时状态初始化**: `useState` 使用 `editingRef?.reference.xxx` 作为初始值，但 React 的 useState 初始值只在首次渲染时生效。通过 `resetForm` + Dialog `onOpenChange` 回调处理了此问题。
7. **ADR 一致性**: 代码实现与 ADR-011（竞品全局实体）和 ADR-012（问题独立实体+分类映射维度）的设计决策完全一致。

---

## 总结

| Feature | AC 总数 | ✅ Pass | ⚠️ Bug | ❌ Fail |
|---------|---------|---------|--------|---------|
| F7 问题沉淀 | 5 | 5 | 1 (BUG-001, Low) | 0 |
| F6 竞品参考 | 5 | 5 | 0 | 0 |
| **合计** | **10** | **10** | **1** | **0** |

所有 10 条 AC 功能实现完整，发现 1 个低严重度 bug（维度 key 不一致）。代码质量良好，权限控制和错误处理规范。
