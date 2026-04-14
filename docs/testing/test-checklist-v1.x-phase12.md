# Phase 12 Test Checklist — F19 Import/Export + F20 Teams/Spaces

**Date**: 2026-04-14
**Tester**: QA Agent
**Status**: PASS (all AC verified)

---

## F19: Import/Export

### AC1: Import Markdown files/zip (复用 F11/F17)

| # | Check | Result |
|---|-------|--------|
| 1 | `/api/import/markdown` endpoint exists in `api/routers/import_.py:230` | PASS |
| 2 | Accepts `.md` file upload, rejects non-`.md` | PASS (line 237 checks extension) |
| 3 | Parses using `parse_markdown_content()` from exporter module | PASS (line 253 calls it) |
| 4 | Returns `{files, features, tree}` compatible with `/upload` format | PASS |
| 5 | Import page has "Markdown 导入" tab (`import-page-client.tsx:84-93`) | PASS |
| 6 | `MarkdownImport` component (`import-page-client.tsx:134`) handles single .md file | PASS |

### AC2: Export selected nodes as Markdown with all dimensions

| # | Check | Result |
|---|-------|--------|
| 1 | `POST /api/export/nodes` endpoint exists (`api/routers/export.py:34`) | PASS |
| 2 | `ExportNodesRequest` schema: `{project_id: UUID, node_ids: list[UUID]}` | PASS |
| 3 | `export_nodes()` loads nodes + dimension records + dimension types | PASS |
| 4 | Exported Markdown format: `# {node.name}` + `## {dim_type.name}` + content + `---` | PASS |
| 5 | Export button on feature page (`workspace.tsx:841`, `handleExportNode`) | PASS |
| 6 | Frontend action `exportNodes()` sends correct payload to backend | PASS |

### AC3: Batch export project/product-line as zip

| # | Check | Result |
|---|-------|--------|
| 1 | `POST /api/export/project` endpoint exists (`api/routers/export.py:57`) | PASS |
| 2 | `ExportProjectRequest` schema: `{project_id: UUID, product_line_id?: UUID}` | PASS |
| 3 | Returns StreamingResponse with `application/zip` media type | PASS |
| 4 | Zip directory structure mirrors module hierarchy (`exporter.py:163-193`) | PASS |
| 5 | Export project button in settings tab (`settings/page.tsx:805-831`) | PASS |
| 6 | Export module as ZIP (`workspace.tsx:437`, `handleExportModule`) | PASS |
| 7 | Frontend converts zip binary to base64 for server action transport | PASS |

### AC4: Exported Markdown can be re-imported (format roundtrip)

| # | Check | Result |
|---|-------|--------|
| 1 | Export format uses `# feature_name`, `## dimension_name` | PASS (`exporter.py:27-31`) |
| 2 | `parse_markdown_content()` exists (`exporter.py:198-274`) | PASS |
| 3 | Parser handles h1 → feature, h2 → dimension, `---` → separator | PASS |
| 4 | `/api/import/markdown` uses `parse_markdown_content()` for re-import | PASS (`import_.py:253`) |
| 5 | Roundtrip: export format is parseable by import logic | PASS (same function used) |

---

## F20: Teams/Spaces

### AC1: Create team + assign projects to team

| # | Check | Result |
|---|-------|--------|
| 1 | `teams` table exists in DB with columns: id, name, description, owner_id, created_at | PASS (verified via SQL) |
| 2 | `team_members` table exists with: id, team_id, user_id, role, joined_at | PASS (verified via SQL) |
| 3 | Drizzle schema matches DB (`web/src/db/schema.ts:376-402`) | PASS |
| 4 | SQLAlchemy models match (`api/models/tables.py:350-372`) | PASS |
| 5 | `createTeam()` server action exists (`web/src/actions/teams.ts:70`) | PASS |
| 6 | Creator auto-added as admin member | PASS (line 93-97) |
| 7 | Team CRUD: `getTeams`, `getTeamById`, `createTeam`, `updateTeam`, `deleteTeam` | PASS |
| 8 | Projects assignable to teams via `projects.teamId` FK | PASS (DB column verified) |
| 9 | `getTeamProjects()` queries by `projects.teamId` | PASS (line 476-483) |
| 10 | Teams list page at `/teams` | PASS |
| 11 | Team detail page at `/teams/[teamId]` | PASS |

### AC2: Personal projects can migrate to team (no data loss)

| # | Check | Result |
|---|-------|--------|
| 1 | `migrateProjectToTeam()` action exists (`web/src/actions/teams.ts:422`) | PASS |
| 2 | Only updates `teamId` + `updatedAt`, no other fields touched | PASS (line 460-462) |
| 3 | Supports null teamId (migrate back to personal) | PASS (line 425 accepts `string | null`) |
| 4 | Validates user is team member before migration | PASS (line 439-455) |
| 5 | Requires admin project access | PASS (line 429) |
| 6 | UI: "迁移到团队" tab in project settings (`settings/page.tsx:834-895`) | PASS |
| 7 | Team selector dropdown in migrate UI | PASS (line 848-860) |
| 8 | Confirmation dialog before migration | PASS (line 875-893) |

### AC3: Team members can view projects (reuse F1 permission model)

| # | Check | Result |
|---|-------|--------|
| 1 | Team member list with roles displayed (`[teamId]/page.tsx:298-365`) | PASS |
| 2 | Roles: admin / member (team level) | PASS (`teamMembers.role` default "member") |
| 3 | Role change UI (owner-only, `[teamId]/page.tsx:329-341`) | PASS |
| 4 | Permission model: admin/editor/viewer from `projectMembers` table reused | PASS (same table, same roles) |
| 5 | `inviteMember()` / `removeMember()` / `updateMemberRole()` actions exist | PASS |
| 6 | Only owner or admin can invite/remove members | PASS (checked in each action) |

---

## Cross-cutting Verification

| # | Check | Result |
|---|-------|--------|
| 1 | `npx tsc --noEmit` passes with zero errors | PASS |
| 2 | `PYTHONPATH=. python3 -c "from api.main import app"` succeeds | PASS |
| 3 | Export router registered at `/api/export` in `main.py:79` | PASS |
| 4 | API contract: frontend `exportNodes()` payload matches `ExportNodesRequest` | PASS |
| 5 | API contract: frontend `exportProject()` payload matches `ExportProjectRequest` | PASS |
| 6 | Teams server actions use Drizzle directly (no FastAPI needed) | PASS |
| 7 | DB schema (Drizzle) ↔ SQLAlchemy models aligned for teams/team_members | PASS |

---

## Bugs Found

None. All acceptance criteria verified.
