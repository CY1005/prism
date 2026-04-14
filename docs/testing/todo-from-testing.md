# 测试发现的待办项

> 来源：2026-04-15 探索性测试 session
> 状态：未修复 / 需后续跟进的项

---

## 功能改进

- [ ] **API Key 全局管理**：当前每个项目各自存 API Key，改为用户级 Key 池（最多 20 个）+ 项目引用。涉及新建 `api_keys` 表、全局设置页、项目设置改下拉选择
- [ ] **Provider 列表单一真相源**：当前 `ai_provider.py`、`projects.ts validProviders`、`settings/page.tsx SelectItem` 三处各自维护。应提取为共享配置
- [ ] **错误提示中文化**：所有面向用户的报错需要中文 + 用户可理解 + 用户知道怎么改。services 层的 `HTTP ${status}` 和 `服务不可用: ${e.message}` 需要逐个改为具体的中文提示（不能批量替换，需要透出原始错误）

## 系统性代码质量问题

- [ ] **Server action 返回值未检查**（第一高频缺陷）：VibeCoding 生成的代码普遍写 `await action(); doNext()` 不检查 success。需要全局扫描所有 server action 调用方，补上返回值检查。已修的：注册(BUG-086)、设置保存(BUG-098)、添加节点。未修的：需全局排查
- [ ] **"use server" 文件导出规范**：Next.js 16 只允许导出 async function。需要 lint 规则或 CI 检查防止导出 const/interface/type

## 导入功能

- [ ] **导入预览滚动条**：已用 `position: absolute` 方案修复，但 inline style 和 Tailwind 混用不整洁，后续可统一
- [ ] **scroll-debug 测试页面清理**：`/projects/[projectId]/import/scroll-debug/page.tsx` 和 `/scroll-test/page.tsx` 是调试页面，需删除

## 测试改进（来自 test-gap-analysis.md）

- [ ] **P0**：所有需认证的功能从前端页面发起测试，不只测 API
- [ ] **P0**：框架升级后完整重跑 E2E + 打开每个页面验证无报错
- [ ] **P0**：文件上传测试点包含边界值（0 字节、1MB、文案标注上限）
- [ ] **P0**：设置保存测试覆盖"修改 → 保存 → 刷新 → 验证持久化"
- [ ] **P1**：补充 `/register` 页面 E2E 测试点
- [ ] **P1**：前端 → Server Action → 后端全链路测试
- [ ] **P1**：每个功能页面验证"从主页面能否导航到达"
- [ ] **P1**：涉及滚动的页面，测试数据超过一屏
- [ ] **P1**：功能测试包含 UX 维度（文案一致性、信息层级）

## 已修未提交的改动汇总

涉及文件（需 git commit）：
- `web/src/db/index.ts` — DB 单例
- `web/next.config.ts` — serverExternalPackages + bodySizeLimit
- `web/src/components/ui/button.tsx` — asChild 修复
- `web/src/app/register/register-form.tsx` — try-catch
- `web/src/app/projects/[projectId]/import/` — 滚动、标题、文案
- `web/src/components/ai-import-wizard.tsx` — 滚动、文案、认证
- `web/src/actions/issues.ts` — 去掉非 async 导出
- `web/src/actions/import-ai.ts` — 内部认证 header
- `web/src/actions/projects.ts` — deepseek 加入 validProviders
- `web/src/app/projects/[projectId]/settings/page.tsx` — deepseek 选项、保存反馈
- `web/src/app/projects/[projectId]/workspace.tsx` — 设置入口、节点创建错误处理
- `api/routers/auth.py` — 内部 token 认证
- `web/package.json` — @radix-ui/react-slot
