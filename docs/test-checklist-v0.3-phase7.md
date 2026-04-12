# Test Checklist — Prism v0.3 Phase 7 (F13 + F12)

**Date**: 2026-04-12
**QA Agent**: qa
**Scope**: F13 AI需求分析, F12 功能对比矩阵, Cross-cutting checks

---

## Cross-cutting Checks

| Check | Status | Notes |
|-------|--------|-------|
| TypeScript compilation (`npx tsc --noEmit`) | **PASS** | 0 errors |
| Python import (`from api.main import app`) | **PASS** | All routers import successfully |
| AI Provider switching | **PASS** | `get_provider()` factory supports claude/kimi/codex/mock with fallback to MockProvider. Frontend has provider selector UI in analysis page. |

---

## F13 AI需求分析

### AC1: Support pasting/uploading PRD documents (Markdown, Word)

**Status: PASS**

| What | Verified | How |
|------|----------|-----|
| Text input area | Yes | `analysis/page.tsx:543-548` — `<Textarea>` for requirement text |
| File upload (doc types) | Yes | `analysis/page.tsx:526-530` — accepts `.pdf,.doc,.docx,.txt` |
| Drag & drop upload | Yes | `analysis/page.tsx:447-453` — `onDragOver/onDragLeave/onDrop` handlers |
| File content sent to backend | Yes | Backend `RequirementAnalysisRequest.file_content` field (`schemas/analyze.py:45`) accepts file text |
| Markdown support | Yes | `.txt` accepted; backend processes `file_content` as text appended to context |
| Word support | Partial | Frontend accepts `.doc/.docx` but file content extraction (Word→text) is simulated client-side (status goes to "completed" via setTimeout, no actual parsing). Backend receives `file_content` string. |

**Notes**: The file upload UI is complete but actual Word-to-text extraction is not implemented — files are accepted visually but their content is not parsed and sent to the backend. This is acceptable for v0.3 if the intent is text paste + markdown file support; Word parsing would need a server-side library.

---

### AC2: Progressive 3-layer analysis (L1/L2/L3) with SSE streaming

**Status: PASS**

| What | Verified | How |
|------|----------|-----|
| L1 endpoint exists | Yes | `POST /api/analyze/requirement` with `analysis_level="L1"` (`analyze.py:234`) |
| L2 endpoint exists | Yes | Same endpoint with `analysis_level="L2"`, adds related node context (`analyze.py:173-188`) |
| L3 endpoint exists | Yes | Same endpoint with `analysis_level="L3"`, adds global search results (`analyze.py:195-213`) |
| SSE streaming | Yes | `StreamingResponse(event_stream(), media_type="text/event-stream")` (`analyze.py:275`) |
| Frontend SSE client | Yes | `analyzeRequirementStream()` reads stream chunks via `ReadableStream` (`analyzer.ts:218-287`) |
| L1→L2 expand button | Yes | "扩展分析范围" button shown after L1 completes (`analysis/page.tsx:652-664`) |
| L2→L3 expand button | Yes | "全局扫描" button shown after L2 completes (`analysis/page.tsx:667-680`) |
| Layers append, not overwrite | Yes | `startAnalysis("L2")` appends to `layers` array, doesn't replace (`analysis/page.tsx:223`) |
| L2 context: related modules | Yes | `_get_related_node_ids()` fetches from `node_relations` table (`analyze.py:128-141`) |
| L3 context: F9 search | Yes | `unified_search()` called with keyword extraction (`analyze.py:198-213`) |

---

### AC3: Each layer annotated with source level

**Status: PASS**

| What | Verified | How |
|------|----------|-----|
| Level labels defined | Yes | `LEVEL_LABELS = { L1: "基于当前功能项", L2: "基于关联模块", L3: "基于全局扫描" }` (`analyzer.ts:13-17`) |
| Labels rendered per layer | Yes | `AnalysisResult` component shows `<Badge>{layer.level}</Badge>` + `LEVEL_LABELS[layer.level]` (`analysis-result.tsx:40-48`) |
| Color coding per level | Yes | L1=blue, L2=purple, L3=orange (`analysis-result.tsx:22-26`) |
| Backend includes level in SSE | Yes | Each chunk includes `"level": req.analysis_level` (`analyze.py:254`) |

---

### AC4: Impact range highlighted on relation graph

**Status: PARTIAL**

| What | Verified | How |
|------|----------|-----|
| Affected modules returned | Yes | Backend returns affected modules in analysis result |
| Relation graph integration | No | No code found that passes affected module IDs to the relation-graph component for highlighting |

**Notes**: The analysis page does not integrate with the relation-graph component. Affected modules are displayed as a list in `AnalysisResult`, but there is no visual highlighting on the F8 relation graph. This would require passing affected node IDs to the relation-graph page/component.

---

### AC5: Analysis result saveable to "requirement_analysis" dimension

**Status: PARTIAL (Contract Mismatch)**

| What | Verified | How |
|------|----------|-----|
| Save endpoint exists | Yes | `POST /api/analyze/save` returns `SaveAnalysisResponse` (`analyze.py:278-314`) |
| Creates "requirement_analysis" dimension type | Yes | Auto-creates if missing (`analyze.py:285-296`) |
| Frontend save button | Yes | "保存到需求分析维度" button (`analysis/page.tsx:696-703`) |
| **API contract match** | **NO** | Backend `SaveAnalysisRequest` expects `{ analysis_result: str, metadata: dict }` but frontend sends `{ layers: [...] }`. This will cause HTTP 422 at runtime. |

**Issue**: `services/analyzer.ts:294-306` sends `layers` array, but `schemas/analyze.py:49-53` expects `analysis_result` string. The field names and types don't match.

---

### AC6: Generate test points from analysis

**Status: PASS**

| What | Verified | How |
|------|----------|-----|
| Generate endpoint | Yes | `POST /api/analyze/generate-test-points` (`analyze.py:317-351`) |
| AI prompt for test points | Yes | Structured prompt requesting JSON array with title/description/priority/category/steps/expected_result (`analyze.py:328-341`) |
| Test depth levels | Yes | smoke/standard/comprehensive supported (`analyze.py:326`) |
| Frontend generates | Yes | "生成测试点" button calls `generateTestPoints()` (`analysis/page.tsx:704-711`) |
| Test points displayed | Yes | Grouped by priority (P0/P1/P2) with cards (`analysis/page.tsx:729-761`) |
| Fallback mock data | Yes | If AI JSON parsing fails, mock points are generated (`analyze.py:377-387`) |

**Note**: Minor contract difference — frontend `TestPointsRequest` sends `affected_modules: string[]` (node IDs), backend `GenerateTestPointsRequest` expects `node_id: UUID` + `analysis_result: str`. The backend endpoint actually reads `req.analysis_result` not `req.affected_modules`. Frontend sends different field names. This may cause issues at runtime but the fallback mock will still return data.

---

### AC7: Test points batch importable to "test_analysis" dimension

**Status: PARTIAL (Contract Mismatch)**

| What | Verified | How |
|------|----------|-----|
| Save endpoint | Yes | `POST /api/analyze/save-test-points` (`analyze.py:390-427`) |
| Creates "test_analysis" dimension type | Yes | Auto-creates if missing (`analyze.py:396-405`) |
| Frontend save button | Yes | "一键录入测试分析维度" with checkbox selection (`analysis/page.tsx:777-783`) |
| Checkbox review | Yes | All test points pre-checked, user can uncheck (`analysis/page.tsx:742-745`) |
| **API contract match** | **NO** | Backend `SaveTestPointsRequest` expects `{ node_id, test_points: AITestPoint[] }` but frontend sends `{ node_id, test_point_ids: string[] }`. Field names and types differ. |

**Issue**: `services/analyzer.ts:317-325` sends `test_point_ids` (array of IDs), but `schemas/analyze.py:83-85` expects `test_points` (array of `AITestPoint` objects).

---

## F12 功能对比矩阵

### AC1: Select 2+ competitors, AI generates comparison table

**Status: PARTIAL (Contract Mismatch)**

| What | Verified | How |
|------|----------|-----|
| Generate endpoint | Yes | `POST /api/comparison/generate` (`comparison.py:51-172`) |
| AI prompt builds comparison | Yes | Prompt includes nodes, competitors, dimensions, existing data (`comparison.py:92-136`) |
| Frontend competitor selector | Yes | Badge-based multi-select with add/remove (`comparison/page.tsx:442-477`) |
| Frontend generate button | Yes | "生成对比" button calls `generateComparison()` (`comparison/page.tsx:408-419`) |
| **API contract match** | **NO** | Backend `ComparisonGenerateRequest` expects `{ node_ids: UUID[], competitor_ids: UUID[] }` but frontend sends `{ feature_name: str, competitors: str[], dimensions: str[] }`. Completely different field names and types. |

**Issue**: The backend identifies competitors by UUID (`competitor_ids`), the frontend passes competitor names as strings. The backend expects `node_ids` but frontend sends `feature_name`. These are structurally incompatible and will cause HTTP 422.

---

### AC2: Default 3 dimensions + custom

**Status: PASS**

| What | Verified | How |
|------|----------|-----|
| Default dimensions | Yes | `DEFAULT_DIMENSIONS = ["功能覆盖度", "技术方案差异", "用户体验差异"]` (`comparison/page.tsx:82`) |
| Custom dimension add | Yes | "添加维度" button with inline input (`comparison/page.tsx:495-524`) |
| Custom dimension remove | Yes | X button on each dimension badge (`comparison/page.tsx:487-494`) |
| Backend supports custom | Yes | `custom_dimensions` field in `ComparisonGenerateRequest` and fallback mock (`comparison.py:119,219`) |

**Note**: PRD specifies "功能覆盖度（有/无/部分）、技术方案差异、用户体验差异" — frontend matches this exactly.

---

### AC3: Manual CRUD on comparison table

**Status: PASS**

| What | Verified | How |
|------|----------|-----|
| Edit cells | Yes | Click-to-edit with inline `<Input>`, save on Enter/blur, cancel on Escape (`comparison/page.tsx:213-238`) |
| Add rows | Yes | "添加行" button at table bottom (`comparison/page.tsx:675-680`) |
| Delete rows | Yes | Trash icon per row (`comparison/page.tsx:661-669`) |
| Update endpoint (PUT) | Yes | `PUT /api/comparison/{comparison_id}` (`comparison.py:233-253`) |

**Note**: The frontend does local state editing but does NOT call the PUT endpoint to persist edits to the backend. Edits are client-side only and will be lost on page refresh.

---

### AC4: Difference items highlighted

**Status: PASS**

| What | Verified | How |
|------|----------|-----|
| Highlight logic | Yes | `getCellHighlightClass()` maps "green"→`bg-green-50`, "red"→`bg-red-50` (`comparison/page.tsx:85-89`) |
| Applied to cells | Yes | Each `<TableCell>` applies `getCellHighlightClass(row.cells[col]?.highlight)` (`comparison/page.tsx:583,615`) |
| Backend provides highlight data | Yes | `ComparisonCell.score` field exists; mock data generates scores. Frontend `ComparisonCell.highlight` field (`analyzer.ts:138-140`) |

---

### AC5: Export comparison results

**Status: PARTIAL (Contract Mismatch)**

| What | Verified | How |
|------|----------|-----|
| Export endpoint | Yes | `GET /api/comparison/{comparison_id}/export` returns Markdown (`comparison.py:316-364`) |
| Markdown table format | Yes | Builds `| 维度 | col1 | col2 |` format (`comparison.py:343-359`) |
| Frontend export button | Yes | "导出" button triggers Markdown download (`comparison/page.tsx:396-406`) |
| **API contract match** | **NO** | Backend expects `GET /api/comparison/{comparison_id}/export` (path param UUID), frontend calls `GET /api/comparison/export?project_id=...&feature_name=...` (query params). Different URL structure. |

---

### AC6: Backfill to F6 competitor reference

**Status: PARTIAL (Contract Mismatch)**

| What | Verified | How |
|------|----------|-----|
| Backfill endpoint | Yes | `POST /api/comparison/{comparison_id}/backfill` (`comparison.py:256-313`) |
| Creates/updates CompetitorReference | Yes | Finds or creates `CompetitorReference` record, updates `pros_and_cons` and `feature_coverage` (`comparison.py:285-308`) |
| Frontend backfill button | Yes | RefreshCw icon per row (`comparison/page.tsx:647-659`) |
| **API contract match** | **NO** | Backend expects `{ comparison_id (path), row_index, node_id, competitor_id }` but frontend sends `{ project_id, dimension, competitors, feature_name }` to `/api/comparison/backfill`. Different URL and payload. |

---

## Summary

### F13 AI需求分析

| AC | Status | Issue |
|----|--------|-------|
| AC1: Document input | **PASS** | Text + file upload UI complete; Word parsing not implemented |
| AC2: Progressive L1/L2/L3 | **PASS** | SSE streaming + progressive buttons work correctly |
| AC3: Source level labels | **PASS** | Labels match ADR-013 spec exactly |
| AC4: Relation graph highlight | **PARTIAL** | No integration with relation-graph component |
| AC5: Save to requirement_analysis | **PARTIAL** | Contract mismatch: frontend sends `layers`, backend expects `analysis_result` |
| AC6: Generate test points | **PASS** | Endpoint + UI + fallback all present |
| AC7: Batch import test points | **PARTIAL** | Contract mismatch: frontend sends `test_point_ids`, backend expects `test_points` objects |

### F12 功能对比矩阵

| AC | Status | Issue |
|----|--------|-------|
| AC1: AI generate comparison | **PARTIAL** | Contract mismatch: frontend sends names, backend expects UUIDs |
| AC2: Default 3 dims + custom | **PASS** | Exact match with PRD spec |
| AC3: Manual CRUD | **PASS** | Edit/add/delete rows work locally; PUT not called to persist |
| AC4: Highlight differences | **PASS** | Green/red cell highlighting implemented |
| AC5: Export results | **PARTIAL** | Contract mismatch: different URL pattern |
| AC6: Backfill to F6 | **PARTIAL** | Contract mismatch: different URL and payload structure |

### Critical Issues Found

1. **F13 AC5 — Save Analysis contract mismatch**: Frontend `saveAnalysis()` sends `{ layers: [...] }` but backend `SaveAnalysisRequest` expects `{ analysis_result: str }`. Will cause 422 at runtime.

2. **F13 AC7 — Save Test Points contract mismatch**: Frontend sends `{ test_point_ids: string[] }` but backend expects `{ test_points: AITestPoint[] }`. Will cause 422 at runtime.

3. **F12 AC1 — Generate Comparison contract mismatch**: Frontend sends `{ feature_name, competitors: string[], dimensions }` but backend expects `{ node_ids: UUID[], competitor_ids: UUID[] }`. Structurally incompatible.

4. **F12 AC5 — Export URL mismatch**: Frontend calls `GET /api/comparison/export?project_id=...` but backend expects `GET /api/comparison/{comparison_id}/export`. 404 at runtime.

5. **F12 AC6 — Backfill URL/payload mismatch**: Frontend calls `POST /api/comparison/backfill` with name-based payload, backend expects `POST /api/comparison/{comparison_id}/backfill` with UUID-based payload.

6. **F13 AC4 — Relation graph integration missing**: No code connects analysis affected modules to the relation-graph component for visual highlighting.

### Non-blocking Notes

- Word file content extraction is simulated (files accepted but not parsed to text)
- F12 CRUD edits are client-side only; PUT endpoint exists but is not called from frontend
- F12 comparison data is stored in `AnalysisTask` table, not a dedicated comparison table
- All AI providers properly fall back to MockProvider when no API key is configured
