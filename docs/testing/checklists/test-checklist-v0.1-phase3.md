# Prism v0.1 Phase 3 — Test Checklist

**Date:** 2026-04-12
**QA Agent:** qa
**TypeScript Check:** ✅ PASS (`npx tsc --noEmit` — zero errors)

---

## F11: 冷启动支持（zip导入+引导）

### AC1: 上传zip文件后，系统解压并展示文件树，预览每个文件内容
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 4步向导：上传→预览→映射→确认。上传zip后自动解压，左侧显示文件树，右侧显示文件内容预览。 | **Backend:** `api/routers/import_.py:16-41` — POST `/api/import/upload` accepts zip file, validates .zip extension + 50MB limit + non-empty. `api/services/import_handler.py:13-76` — `extract_and_parse_zip()` extracts to temp dir, walks files, builds tree structure `{files: [...], tree: {name, type, children}}`. **Runtime test:** `curl -F file=@test-import.zip` returns 5 files with correct tree (数据流/3 files, 用户与空间/认证/1 file, 用户与空间/计费/1 file). Non-.zip extension → "仅支持 .zip 文件" (400). Corrupt zip → "无效的 zip 文件" (400). **Frontend:** `web/src/app/projects/[projectId]/import/import-wizard.tsx:261-306` — `handleUpload()` calls `uploadZip()` server action, stores parsed files and tree, auto-selects first file for preview, advances to step 1. `import-wizard.tsx:522-583` — Step 1 renders left panel file tree (`FileTreeItem` component, recursive, expandable folders) + right panel content preview (`<pre>` with file content). |

### AC2: 支持 Markdown(.md)、CSV、纯文本格式解析
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 三种格式均有专用解析逻辑，不支持的格式静默跳过。 | **Backend:** `api/services/import_handler.py:105-124` — `_parse_file()` dispatches by extension: `.md` → `_read_text_file(fmt="markdown")`, `.csv` → `_read_csv_file()`, `.txt`/`.text` → `_read_text_file(fmt="text")`, others → `return None` (skip). `import_handler.py:127-144` — Text/MD files read as UTF-8 with GBK fallback. `import_handler.py:147-168` — CSV files additionally parsed with `csv.reader` to extract row/column counts. Files >1MB silently skipped (line 112-113). **Runtime test:** edge-case-import.zip (5 files) → API returns 4 parsed files: empty-file.md (format=markdown, size=0), plain-note.txt (format=text), sample-data.csv (format=csv, rows=4, columns=3), valid-doc.md (format=markdown). `.jpg` file silently skipped ✅. **Frontend:** `import-wizard.tsx:209-218` — `formatBadgeColor()` renders distinct badge colors: markdown=blue, csv=green, text=gray. |

### AC3: 用户手动指定文件→模块的映射关系，确认后批量创建功能项
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | Step 2映射表支持逐行+批量操作，Step 3确认后调用`confirmImport`批量创建节点+维度记录。 | **Frontend:** `import-wizard.tsx:586-744` — Step 2 mapping table: checkbox select/deselect, file name, format badge, size, target module dropdown (from project tree folders), dimension dropdown. Bulk actions bar (lines 589-627): toggle all, bulk set target module, bulk set dimension. `import-wizard.tsx:372-417` — `handleConfirm()` filters selected rows, builds `ImportItem[]`, calls `confirmImport(projectId, items)`. **Server Action:** `web/src/actions/import.ts:94-187` — `confirmImport()`: auth+permission check, iterates items, resolves parent node, calculates depth/path/sortOrder, inserts node as "file" type, optionally creates dimension record with content. Returns `{imported: N, errors: [...]}`. **Page:** `web/src/app/projects/[projectId]/import/page.tsx:19-35` — `collectFolders()` flattens project tree to get all folder nodes as mapping targets. |

### AC4: 空模块不显示空白，而是显示引导页（"从这里开始"+ 建议录入步骤）
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 空文件夹显示引导卡片，含"从这里开始"标题、说明文案、两个操作按钮和建议步骤。 | **Frontend:** `web/src/app/projects/[projectId]/workspace.tsx:677-708` — When `folderChildren.length === 0`: renders dashed-border Card with BookOpen icon, "从这里开始" heading (line 680), description "这个模块还没有内容。你可以手动添加功能项，或导入已有文档快速填充。" (line 682), two buttons: "添加功能项" (onClick → `handleAddChild`) + "导入文档" (Link to `/projects/${project.id}/import`) (lines 685-697), and numbered step suggestions (lines 698-707): 1) 添加功能项 2) 为每个功能项填写维度信息 3) 逐步完善，构建完整知识图谱。 |

### AC5: 首次创建项目后，引导用户选一个模块先填完，完成后展示全景视图（Aha Moment）
| Status | Description | Evidence |
|--------|------------|----------|
| ⚠️ Partial | 导入完成后有引导Banner，但缺少"首次创建项目"检测逻辑和填完后自动跳转全景视图。 | **Frontend:** `workspace.tsx:265-301` — Aha Moment通过URL参数`?imported=true&topModule=...&count=...`触发，自动导航到导入最多的模块并显示Banner。但这只在导入完成时触发，**不是**"首次创建项目"时触发。**缺失：** 1) 没有检测是否为首次创建的项目（如空项目检测）。2) 没有"填完一个模块后自动展示全景视图"的逻辑——全景视图页面存在(`/overview/page.tsx`)但没有从workspace自动跳转的触发条件。PRD要求的是：首次创建→引导填一个模块→完成后展示全景视图，当前实现只覆盖了"导入后引导到模块"这一步。 |

### AC6: 首次导入完成后，系统自动定位到导入量最多的模块，弹出引导提示"试试完善这个模块的维度信息"
| Status | Description | Evidence |
|--------|------------|----------|
| ✅ Implemented | 导入完成后自动定位+Banner提示，文案准确。 | **Frontend:** `import-wizard.tsx:396-416` — `handleConfirm()`计算每个targetNodeId的导入数量，找出最多的`topModule`，redirect到`/projects/${projectId}?imported=true&topModule=${topModule}&count=${result.data.imported}`。`workspace.tsx:272-301` — `useEffect`读取URL参数，`findNode()`在树中查找topModule节点，调用`handleSelectNode()`自动选中并展开，`setImportBanner({count, moduleName})`。URL参数随即用`replaceState`清理（line 298）。`workspace.tsx:594-615` — Banner渲染：Sparkles图标 + "成功导入 N 个文件到「模块名」" + "试试完善这个模块的维度信息" + "知道了"关闭按钮。 |

---

## Security Audit

| # | Issue | Severity | Location | Detail |
|---|-------|----------|----------|--------|
| S1 | Auth on server actions | ✅ PASS | `import.ts` | `uploadZip()` calls `requireAuth()` (line 51). `confirmImport()` calls `requireAuth()` + `checkProjectAccess(userId, projectId, "editor")` (lines 99-100). |
| S2 | Zip path traversal | ✅ PASS | `import_handler.py:42-44` | Checks for `/` prefix and `..` in all zip entry filenames before extraction. Raises ValueError on unsafe paths. |
| S3 | File size limits | ✅ PASS | `import_.py:28-31`, `import_handler.py:112-113` | Upload capped at 50MB. Individual files >1MB silently skipped during parsing. |
| S4 | Zip bomb protection | ⚠️ LOW | `import_handler.py:40-46` | No check on total extracted size or file count. A zip with thousands of small files or deeply nested directories could consume excessive memory/disk in the temp directory. Mitigated by 50MB upload limit but extracted content could be larger due to compression. |
| S5 | Input validation — node name | ⚠️ LOW | `import.ts:150` | `nodeName` from import items accepted without length limit. Same issue as Phase 2 Bug #4 (node names). |
| S6 | SSRF in server action | ✅ SAFE | `import.ts:59` | `fetch("http://localhost:8001/api/import/upload")` is hardcoded to localhost, no user-controlled URL. |

---

## Bugs Found

| # | File | Line | Summary | Severity |
|---|------|------|---------|----------|
| 1 | `api/main.py` | — | FastAPI server not auto-reloading: import router registered in code but server started before file existed. Required manual restart to load `/api/import/upload` endpoint. **Resolved:** Server restarted, endpoint now returns 422 (missing file) as expected. | **RESOLVED** |
| 2 | `workspace.tsx` | 265-301 | AC5 partially implemented: no "first project" detection. Aha Moment only triggers on import redirect, not on first-time project entry. No auto-navigate to panorama view after filling first module. | **MEDIUM** |
| 3 | `import_handler.py` | 42-44 | Path traversal check uses `".." in info.filename` which could miss edge cases like encoded sequences. Consider using `os.path.normpath()` + prefix check or Python's `zipfile.Path` for stricter validation. | **LOW** |
| 4 | `import-wizard.tsx` | 97 | FileTreeItem `selectedFile` matches on `node.name` (just filename), not full path. If two files in different folders have the same name, selecting one will highlight both. | **LOW** |
| 5 | `import-wizard.tsx` | 288-294 | Initial mapping defaults all files to `folders[0]` (first folder) and `dimensions[0]` (first dimension). If project has no folders, `targetNodeId` defaults to `""` which will fail on confirm since parent lookup will fail. Edge case: new project with no tree. | **LOW** |

---

## Summary

### F11 Cold Start Support (6 ACs)
- ✅ Implemented: 4 (AC1, AC2, AC3, AC4, AC6)
- ⚠️ Partially: 1 (AC5 — missing first-project detection + panorama redirect)
- ❌ Not Implemented: 0

### Test Fixtures Prepared
- `/root/cy/prism/tests/fixtures/test-import.zip` — 5 real markdown files, 2-level folder structure
- `/root/cy/prism/tests/fixtures/edge-case-import.zip` — edge cases: empty .md, .csv, .txt, unsupported .jpg, valid .md

### Bugs Found: 5
| # | Summary | Severity | Assigned To |
|---|---------|----------|-------------|
| 1 | FastAPI server needs restart to load import router | BLOCKER | ops |
| 2 | AC5: No first-project detection or panorama redirect | MEDIUM | frontend |
| 3 | Zip path traversal check could be stricter | LOW | backend |
| 4 | File tree selection matches by name only, not path | LOW | frontend |
| 5 | Empty project (no folders) causes bad default mapping | LOW | frontend |

### TypeScript: ✅ PASS (0 errors)
### All New Server Actions: Auth + permission guards verified
