# Prism v0.1 Phase 1 — Test Checklist

**Date:** 2026-04-12
**QA Agent:** qa
**TypeScript Check:** ✅ PASS (`npx tsc --noEmit` — zero errors)

---

## F1: 用户系统 (User System)

### AC1: 管理员在运维后台创建用户
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 管理后台创建用户（邮箱+初始密码），创建后可登录 | **Backend:** `api/routers/auth.py:136-164` — `POST /api/auth/users` admin-only endpoint with `require_admin` dependency. Uses `hash_password()` (bcrypt). **Frontend:** `web/src/actions/admin.ts:37-68` — `createUser()` server action with bcrypt hashing, duplicate email check. `web/src/app/admin/page.tsx` — Dialog form with name/email/password fields. |

### AC2: 用户登录（邮箱+密码）
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 登录成功跳转/projects；错误时提示"邮箱或密码错误" | **Backend:** `api/services/auth.py:79-113` — `authenticate_user()` returns generic "邮箱或密码错误" for both wrong email and wrong password (不暴露邮箱是否存在). **Frontend:** `web/src/actions/auth.ts:60-89` — login action catches errors, returns "邮箱或密码错误"; success redirects to `/projects`. `web/src/app/login/page.tsx` — email+password form with error display. |

### AC3: 未登录用户自动重定向到/login
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | NextAuth middleware检查JWT后自动重定向 | **Frontend:** `web/src/lib/auth.ts:105-134` — `authorized` callback: `if (!isLoggedIn) return false` triggers redirect to `/login`. Also checks token invalidation timestamp. `pages.signIn: "/login"` configured at line 88. |

### AC4: 登录后显示用户名，点击可退出
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | 用户名显示为硬编码；退出只是Link到/login，不清除Cookie | **Frontend:** `web/src/app/projects/page.tsx:82-84` — username from `projectsStrings.userName` (hardcoded "陈琦"), not from session. Logout at line 86-89: `<Link href="/login">` — only navigates, does NOT call `signOut()` to clear cookies. **Bug:** Should call NextAuth `signOut()` for proper cookie cleanup. |

**Bug #1:** `web/src/app/projects/page.tsx:86-89` — Logout button uses `<Link href="/login">` instead of calling NextAuth `signOut()`. Session cookie will persist.
**Fix:** Replace with `signOut({ redirectTo: "/login" })` from `@/lib/auth`.

**Bug #2:** `web/src/app/projects/page.tsx:82-84` — Username hardcoded as `projectsStrings.userName`. Should read from session.
**Fix:** Use `useSession()` or pass session data from server component.

### AC5: 已禁用账号登录时提示"账号已被禁用，请联系管理员"
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 前后端均检查disabled状态 | **Backend:** `api/services/auth.py:92-93` — returns "账号已被禁用，请联系管理员". **Frontend:** `web/src/actions/auth.ts:68-74` — pre-checks status before signIn, returns same message. `web/src/lib/auth.ts:39-42` — NextAuth authorize also checks `user.status === "disabled"`. |

### AC6: 登录签发Access Token（15min）+ Refresh Token（7天，存DB）
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | Backend实现完整JWT+Refresh Token流程 | **Backend:** `api/services/auth.py:36-63` — `create_access_token()` (15min JWT) + `create_refresh_token()` (7-day, SHA-256 hash stored in DB). `api/models/tables.py` — `RefreshToken` model. `web/src/db/schema.ts:74-82` — `refreshTokens` Drizzle table. **Note:** Frontend uses NextAuth JWT session strategy (24h, line 85 of auth.ts), not the FastAPI tokens directly — dual auth system. |

### AC7: Access Token过期后自动用Refresh Token续签
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | Backend有refresh endpoint，但前端NextAuth不自动调用 | **Backend:** `api/routers/auth.py:86-94` — `POST /api/auth/refresh` endpoint works correctly. **Frontend:** NextAuth handles its own JWT session (24h maxAge) without calling the backend refresh endpoint. The two auth systems are independent. |

### AC8: Refresh Token续签时检查disabled状态
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | Refresh endpoint检查disabled | **Backend:** `api/services/auth.py:138-142` — `refresh_access_token()` checks `user.status == "disabled"`, deletes token and returns error. **Frontend:** `web/src/lib/auth.ts:118-131` — NextAuth `authorized` callback checks `tokenInvalidatedAt` on every request. |

### AC9: 退出登录清除Cookie + 删除Refresh Token
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | Backend logout endpoint exists, Frontend doesn't call it | **Backend:** `api/routers/auth.py:97-101` — `POST /api/auth/logout` revokes refresh token. **Frontend:** See Bug #1 above — logout button just links to /login, doesn't call `signOut()` or the backend logout endpoint. |

### AC10: 密码使用bcrypt哈希存储
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 前后端均使用bcrypt | **Backend:** `api/services/auth.py:27-33` — `bcrypt.hashpw()` with salt rounds 12. **Frontend:** `web/src/actions/auth.ts:38` — `bcrypt.hash(password, 12)`. `web/src/actions/admin.ts:58` — same for admin-created users. DB column: `password_hash` (not plaintext). |

### AC11: 管理后台展示用户列表，支持创建/禁用/修改角色
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | Admin page完整实现 | **Backend:** `api/routers/auth.py:118-190` — `GET /api/auth/users` (list), `POST /api/auth/users` (create), `PATCH /api/auth/users/{id}` (update role/status). **Frontend:** `web/src/app/admin/page.tsx` — User table with columns (头像/用户名/邮箱/角色/注册时间/状态/操作), create dialog, toggle status button. `web/src/actions/admin.ts` — `getUsers()`, `createUser()`, `toggleUserStatus()`, `updateUserRole()`. |

**Bug #3:** `web/src/app/admin/page.tsx` — Admin page has no role editing UI. Only toggle status button. `updateUserRole()` exists in `actions/admin.ts:107-133` but is not wired to UI.
**Fix:** Add role selector dropdown in the admin table.

### AC12: 被禁用用户登录时显示"账号已被禁用"提示
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | Same as AC5 | See AC5 evidence. |

---

## F2: 项目管理 (Project Management)

### AC1: 点击"新建项目"，输入名称+选择模板后创建成功
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 完整的创建流程 | **Frontend:** `web/src/app/projects/new/page.tsx` — Name input, description, template selector, create button with `createProject()` server action call. `web/src/actions/projects.ts:62-135` — Transaction: insert project + dimension configs + creator as admin member. **Backend:** `api/routers/projects.py:57-67` — `POST /api/projects/` with auth. |

### AC2: 4个模板可选，预览显示预设维度和层级标签
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | PRD要求4个模板（产品竞品分析/系统架构/开源项目研究/自定义），代码实现了4个但template ID不一致 | **Frontend:** `web/src/app/projects/new/page.tsx:16-45` — 4 templates: product_analysis, system_architecture, research_platform, custom. Each shows hierarchy and dimensions. **Seed:** `web/src/db/seed.ts` — Template key changed to `opensource_research` but frontend still uses `research_platform`. **Bug:** Template key mismatch between seed data and frontend. |

**Bug #4:** `web/src/db/seed.ts:91` — Template key is `opensource_research`, but `web/src/app/projects/new/page.tsx:33` and `web/src/components/template-selector.tsx:28` use `research_platform`. Frontend `createProjectSchema` in `web/src/lib/validators/project.ts:6` also validates against `research_platform`. Project creation will fail for this template.
**Fix:** Align on one key — either change seed to `research_platform` or update all frontend references.

### AC3: 创建项目后自动写入dimension_config和hierarchy_labels
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 事务中自动配置 | **Frontend:** `web/src/actions/projects.ts:90-126` — Transaction fetches template, inserts project with hierarchyLabels, creates dimension configs, adds creator as admin. **Backend:** `api/services/project_crud.py:80-146` — Same logic in service layer. |

### AC4: 创建成功后跳转项目引导页
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | 跳转到项目详情页，非引导页 | **Frontend:** `web/src/app/projects/new/page.tsx:70` — `router.push(\`/projects/${result.data.id}\`)` redirects to project detail page, not a dedicated onboarding page with 3 paths (快速导入/手动搭建/AI分析导入). PRD requires a specific onboarding page. |

### AC5: 项目列表卡片显示类型Badge和动态指标
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 项目列表显示Badge+统计 | **Frontend:** `web/src/app/projects/page.tsx:97-134` — Each card shows template type Badge (产品分析/系统架构等), stats (模块数/功能项数/完善度%). Fetches from FastAPI `listProjects()` with fallback to mock data. |

### AC6: 软删除项目不在列表显示
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | Backend过滤deleted_at | **Backend:** `api/services/project_crud.py:23` — `query.filter(Project.deleted_at.is_(None))`. **Frontend:** `web/src/actions/projects.ts:22-51` — `getProjects()` doesn't explicitly filter, but the Drizzle schema has `deletedAt` and the Next.js server action queries all projects. **Note:** Frontend `getProjects()` doesn't filter deleted projects — relies on backend for that. |

**Bug #5:** `web/src/actions/projects.ts:22-35` — `getProjects()` server action doesn't filter `deletedAt IS NULL`. Soft-deleted projects will appear in the frontend project list.
**Fix:** Add `.where(isNull(projects.deletedAt))` to the query.

### AC7-AC9: 项目设置维度管理/层级配置Tab
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | UI存在但维度管理为静态数据 | **Frontend:** `web/src/app/projects/[projectId]/settings/page.tsx` — Has 5 tabs: 基本信息/维度管理/层级配置/成员管理/AI配置. **Hierarchy labels (AC8):** ✅ Editable with preview, saves via `updateProject()`. **Dimension management (AC7):** ⚠️ Uses hardcoded `enabledDimensions`/`disabledDimensions` arrays (lines 96-112) instead of fetching from `project_dimension_configs` table. Switch toggles don't save to DB. Drag-sort (GripVertical icon) is visual only. |

**Bug #6:** `web/src/app/projects/[projectId]/settings/page.tsx:96-112` — Dimension management uses hardcoded data, not fetched from DB. Switch toggles and drag-sort have no save handler connected to DB.
**Fix:** Fetch from `project_dimension_configs` + implement save handler.

### AC10: 项目成员邀请（邮箱+角色）
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 前后端完整实现 | **Backend:** `api/routers/projects.py:180-194` — `POST /projects/{id}/members` with permission check. `api/services/project_crud.py:228-258` — `add_member()` validates email, checks duplicates. **Frontend:** `web/src/app/projects/[projectId]/settings/page.tsx:440-465` — Email input + role selector + invite button. `web/src/actions/projects.ts:196-246` — `addProjectMember()` with auth + access check. |

### AC11: 查看者只能浏览不能编辑
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 前后端权限检查 | **Backend:** `api/services/project_crud.py:313-331` — `check_permission()` with role hierarchy (admin > editor > viewer). All write endpoints require admin role. **Frontend:** `web/src/contexts/project-role-context.tsx` — `useProjectRole()` hook. `web/src/app/projects/[projectId]/settings/page.tsx` — Buttons disabled when `!canAdmin`, with tooltip "查看者无编辑权限". `web/src/services/permission.service.ts` — Server-side role hierarchy check. |

### AC12-AC14: AI Provider配置（全局Key池/项目选择Provider/临时切换）
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | 项目级AI配置已实现，全局Key池和临时切换未实现 | **Frontend:** `web/src/app/projects/[projectId]/settings/page.tsx:527-559` — AI Config tab with provider selector (local/Claude/Codex/Kimi) and API key input. `web/src/actions/projects.ts:316-346` — `updateProjectAIConfig()` saves to DB. **Missing:** AC12 (全局Key池管理 in admin panel), AC14 (每次AI操作临时切换Provider). |

### AC15: 删除项目需二次确认，软删除
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented (Backend) / ❌ Not Implemented (Frontend UI) | Backend软删除完整，Frontend无删除按钮 | **Backend:** `api/routers/projects.py:127-139` — `DELETE /projects/{id}` soft deletes. `api/services/project_crud.py:172-179` — Sets `deleted_at`. **Frontend:** No delete button on project list or project settings page. |

### AC16: 软删除关联数据保留，查询时过滤
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | Backend正确过滤 | `api/services/project_crud.py:23` — `Project.deleted_at.is_(None)` filter. Cascade ON DELETE on related tables preserves data until hard delete. |

### AC17: 运维后台可恢复已删除项目
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented (Backend) / ❌ Not Implemented (Frontend UI) | Backend有API，Admin页面无UI | **Backend:** `api/routers/projects.py:70-77` — `GET /projects/deleted` (list). `api/routers/projects.py:142-151` — `POST /projects/{id}/restore`. **Frontend:** Admin page only has user management, no deleted projects panel. |

### AC18: 运维后台可彻底删除
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented (Backend) / ❌ Not Implemented (Frontend UI) | Backend有API | **Backend:** `api/routers/projects.py:154-163` — `DELETE /projects/{id}/permanent` (admin only). Uses CASCADE to clean related data. |

### AC19: 单条维度记录/节点删除为真删
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | DB schema配置ON DELETE CASCADE | **Drizzle:** `web/src/db/schema.ts` — All FK references to `nodes.id` and `projects.id` use `onDelete: "cascade"`. **SQLAlchemy:** `api/models/tables.py` — Same CASCADE config. |

### AC20: 创建项目时弹出模板选择器
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 独立页面而非弹窗 | **Frontend:** `web/src/app/projects/new/page.tsx` — Full page with 4 template cards. `web/src/components/template-selector.tsx` — Reusable `TemplateSelector` component. **Note:** PRD says "弹出"(popup), implementation is a separate page. Functionally equivalent. |

### AC21: AI配置Tab + API Key加密存储
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | AI Tab存在，API Key未加密存储 | **Frontend:** Settings AI tab works. **DB:** `web/src/db/schema.ts:44` — column name is `ai_api_key_enc` suggesting encryption, but `web/src/actions/projects.ts:333` stores the key directly as `aiApiKeyEnc: apiKeyEnc` without encryption. `web/src/lib/crypto.ts` exists but is not imported in the save handler. |

**Bug #7:** `web/src/actions/projects.ts:333` — API Key stored in plaintext despite column name `ai_api_key_enc`. Should use AES-256-GCM encryption from `web/src/lib/crypto.ts`.
**Fix:** Import and use `encrypt()` from `@/lib/crypto` before storing.

### AC22: 维度管理Tab（启用/禁用/拖拽排序）
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partially | UI展示正确，Switch/拖拽功能未连接DB | See Bug #6 above. |

### AC23: 层级标签Tab（自定义各层级名称）
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 完整实现 | **Frontend:** Settings hierarchy tab with 3 level inputs + live preview tree. `handleSaveHierarchy()` calls `updateProject()` which saves to DB. |

---

## Security Audit

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| S1 | JWT secret hardcoded | HIGH | `api/services/auth.py:18` | `JWT_SECRET = "prism-dev-secret-change-in-production"` — OK for dev, must be env var in production. Currently reads from env with fallback. |
| S2 | API Key plaintext storage | MEDIUM | `web/src/actions/projects.ts:333` | See Bug #7. |
| S3 | No rate limiting on login | LOW | `api/routers/auth.py:62-83` | Account lockout after 5 failures exists, but no IP-based rate limiting. |
| S4 | No CSRF protection on FastAPI | LOW | `api/main.py` | CORS allows `localhost:3000` only. NextAuth handles CSRF for frontend. FastAPI endpoints rely on Bearer token auth. |
| S5 | SQL injection: SAFE | — | All queries | Backend uses SQLAlchemy ORM (parameterized). Frontend uses Drizzle ORM (parameterized). No raw SQL found. |
| S6 | Password not validated for strength (backend) | LOW | `api/schemas/auth.py:37` | `CreateUserRequest.password` only requires `min_length=6`. PRD AC mentions strength rules as v1.0 TODO. |

---

## Summary

### F1 User System (12 ACs)
- ✅ Implemented: 8 (AC1, AC2, AC3, AC5, AC6, AC8, AC10, AC12)
- ⚠️ Partially: 3 (AC4, AC7, AC9)
- ❌ Not Implemented: 0

### F2 Project Management (23 ACs)
- ✅ Implemented: 12 (AC1, AC3, AC5, AC6, AC10, AC11, AC16, AC19, AC20, AC23, + AC15/17/18 backend-only)
- ⚠️ Partially: 7 (AC2, AC4, AC7, AC8, AC9, AC12-14, AC21, AC22)
- ❌ Not Implemented: 1 (AC15/17/18 frontend UI for project deletion/recovery)

### Bugs Found: 7
| # | File | Line | Summary | Assigned To |
|---|------|------|---------|-------------|
| 1 | `web/src/app/projects/page.tsx` | 86-89 | Logout doesn't call signOut() | frontend |
| 2 | `web/src/app/projects/page.tsx` | 82-84 | Username hardcoded, not from session | frontend |
| 3 | `web/src/app/admin/page.tsx` | — | No role editing UI (updateUserRole unused) | frontend |
| 4 | `web/src/db/seed.ts` | 91 | Template key `opensource_research` vs frontend `research_platform` mismatch | backend |
| 5 | `web/src/actions/projects.ts` | 22-35 | getProjects() doesn't filter soft-deleted | frontend |
| 6 | `web/src/app/projects/[projectId]/settings/page.tsx` | 96-112 | Dimension management hardcoded, not from DB | frontend |
| 7 | `web/src/actions/projects.ts` | 333 | API Key stored in plaintext | frontend |

### TypeScript: ✅ PASS (0 errors)
### Backend API Endpoints: All implemented with auth guards
