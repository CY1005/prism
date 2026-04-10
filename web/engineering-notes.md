# Prism 工程经验记录

> 每次开发遇到的坑和经验，下次开发前先读这个文件。

---

## #1 shadcn/ui v4 + Radix 不支持 asChild

**场景**：在 CollapsibleTrigger、DropdownMenuTrigger、Button 上用 `asChild` prop
**报错**：`Property 'asChild' does not exist on type 'IntrinsicAttributes & Props<unknown>'`
**根因**：Next.js 15 + 最新 shadcn/ui (2025+) 使用的 Radix 版本移除了 `asChild`，改用 `Slot` 或直接渲染
**解法**：
- CollapsibleTrigger：直接在 `<CollapsibleTrigger>` 上加 className，不套 Button
- DropdownMenuTrigger：不用 `asChild`，改用自定义右键菜单（原生 onContextMenu + fixed div）
- Button：不用 `asChild`，用 Link 包 Button 或 Button 包 Link

**规则**：本项目中**禁止使用 asChild prop**，所有需要组合的场景用替代方案。

---

## #2 维度内容 Renderer 必须做防御性检查

**场景**：切换到没有维度记录的空节点时，`renderDimensionContent` 崩溃
**报错**：`Cannot read properties of undefined (reading 'map')` — `scenarios.map()` 对 undefined 调用
**根因**：`user_scenario` renderer 假设 `content.scenarios` 一定是数组，但实际上：
1. 空节点没有记录，不会调用 renderer（不是这个原因）
2. 真实原因：`useTransition` 期间旧的 nodeData 还在渲染，新数据还没到，但 UI 已经更新了 selectedId → 导致渲染了错误的数据组合
**解法**：每个 case 分支的 renderer 开头加 `if (!Array.isArray(xxx)) return fallback`

**规则**：所有 `renderDimensionContent` 的 case 分支，**第一行必须校验数据格式**，不能假设 content 的结构。

---

## #3 create-next-app 生成的项目有自己的 .git

**场景**：`npx create-next-app` 在 prism 仓库内创建了 `web/` 目录，`web/.git` 导致 git 把它当 submodule
**报错**：`warning: adding embedded git repository: web`
**解法**：创建后立即 `rm -rf web/.git`，再 `git add web/`

**规则**：在已有 git 仓库内用脚手架工具创建子项目后，**第一件事删掉子项目的 .git 目录**。

---

## #4 Drizzle 的 text 类型列返回 string 不是联合类型

**场景**：schema 里 `type: text("type").notNull().default("folder")` 返回 `string`，但 TreeNode 接口要 `"folder" | "file"`
**报错**：`Type 'string' is not assignable to type '"folder" | "file"'`
**解法**：在 page.tsx 里用 `as import("@/components/feature-tree").TreeNode[]` 断言

**规则**：Drizzle 的 `text()` 列返回的永远是 `string`，如果组件需要联合类型，**在数据传入组件前做类型断言**，不要在 schema 层面解决。

---

## #5 drizzle-kit push 不读 .env.local

**场景**：`npx drizzle-kit push` 报 `Either connection "url" or "host", "database" are required`
**根因**：drizzle-kit CLI 不会自动加载 `.env.local`，只读 `.env`
**解法**：手动传环境变量 `DATABASE_URL=... npx drizzle-kit push`

**规则**：运行 drizzle-kit 命令时，**必须用环境变量前缀或配置 dotenv**，不能依赖 Next.js 的 .env.local 自动加载。

---

## #6 Docker PostgreSQL 端口只绑定 127.0.0.1

**场景**：docker-compose.yml 里端口配置
**做法**：`"127.0.0.1:5432:5432"` 而非 `"5432:5432"`
**原因**：PRD 安全策略要求开发阶段数据库不暴露外部端口

**规则**：所有本地服务端口映射**必须加 127.0.0.1 前缀**。

---

## #7 右键菜单用原生实现，不用 Radix ContextMenu

**场景**：需要树节点右键弹出操作菜单
**尝试**：先用 shadcn DropdownMenu + asChild → 失败（#1）
**最终方案**：自定义 ContextMenu 组件：
- `onContextMenu` 事件获取坐标
- `useState` 存储 `{x, y, node}` 
- 渲染 fixed 定位的 div
- 点击外部关闭（mousedown listener）

**规则**：本项目的右键菜单**用原生实现**（onContextMenu + fixed div），不用 Radix 的 ContextMenu 组件。

---

## 开发环境速查

```bash
# 启动数据库
cd /root/cy/prism && docker compose up -d

# 启动开发服务器
cd /root/cy/prism/web && PORT=3001 npm run dev

# 运行 migration
DATABASE_URL=postgres://prism:prism_dev_2026@127.0.0.1:5432/prism npx drizzle-kit push

# 运行 seed
DATABASE_URL=postgres://prism:prism_dev_2026@127.0.0.1:5432/prism npx tsx src/db/seed.ts

# 查看数据库
docker exec prism-db-1 psql -U prism

# 重置数据库（危险）
docker compose down -v && docker compose up -d
# 然后重新 push + seed
```
