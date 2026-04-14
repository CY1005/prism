# 提示词：补全 Prism 缺失前端页面

> 使用方式：新开 Claude Code session，cd /root/cy/prism，粘贴以下内容
> 前置：npm install 已完成
> 权限：settings.json 已配置 allow 通配符，无需手动确认

---

请帮我补全 Prism 项目缺失的前端页面。项目在 `/root/cy/prism/`。

## 当前状态（已完成 90%）

### 已有的 18 个页面（不要动这些）：
- `/login` `/register` `/admin` `/search` — 基础页面
- `/projects` `/projects/new` — 项目列表+创建
- `/projects/[projectId]` + `workspace.tsx` — 主工作区（树导航+维度卡片+版本+问题+竞品+关联）
- `/projects/[projectId]/overview` — 全景图 Tab（含 TreemapView）
- `/projects/[projectId]/analysis` — 需求工作台 Tab（847行，含AI分析L1/L2/L3）
- `/projects/[projectId]/comparison` — 竞品对比 Tab（737行，含AI对比矩阵）
- `/projects/[projectId]/relation-graph` — 关系图 Tab
- `/projects/[projectId]/settings` — 设置 Tab
- `/projects/[projectId]/issues` — 问题管理
- `/projects/[projectId]/modules/[moduleId]` — 模块详情
- `/projects/[projectId]/product-lines/[plId]` — 产品线
- `/projects/[projectId]/features/[featureId]` — 功能项档案
- `/projects/[projectId]/import` + `import-wizard.tsx` — 导入向导
- `/openclaw` `/feature` — 演示页面

### 已有的组件（不要重写）：
feature-tree, dimension-card, global-search-bar, version-timeline, relation-graph, competitor-reference-card, issue-card, analysis-result, snapshot-result, import-csv-modal, treemap-view, template-selector

### 已有的 14 个 Server Actions + 10 个 Services + 17 张数据库表

## 技术规则（必须遵守）

1. **禁止 asChild prop** — shadcn/ui v4 已移除。用 className 样式化，或 `<Link className={buttonVariants({variant:"ghost"})}>`
2. **数据校验首行** — `if (!Array.isArray(xxx)) return <FallbackView />`
3. **"use client"** — 所有新页面都是客户端组件
4. **路由参数名** — 用 `[projectId]` 不是 `[id]`，用 `[teamId]` 不是 `[id]`
5. **参考现有页面风格** — 读 `web/src/app/projects/[projectId]/overview/page.tsx` 作为布局参考

## 任务

### 任务 1：复制缺失的数据文件

从 `design/ui-prototype/lib/` 复制到 `web/src/lib/`，只复制 web 中不存在的：

```
activity-data.ts
insights-data.ts
feed-data.ts
data-flow-data.ts
snapshot-data.ts
panorama-data.ts
teams-data.ts
ai-analysis-data.ts
import-ai-data.ts
relation-graph-data.ts
```

复制后检查 import 路径是否正确（保持 `@/lib/` 前缀）。

### 任务 2：搬运 7 个缺失页面

从 `design/ui-prototype/app/` 搬运到 `web/src/app/`，逐个处理：

**搬运规则**：
1. 读 design 源文件全文
2. 复制到 web 目标路径
3. `params.id` → `params.projectId`（或 `params.teamId`）
4. 去除所有 `asChild` 用法，改为 className 或包裹方式
5. 检查 import 的组件和数据文件在 web 中是否存在，不存在则一并从 design 复制
6. 检查 Tab 导航是否为 7 个（全景图|产品线|需求工作台|竞品对比|关系图|行业动态|设置）

| # | 源文件 (design/ui-prototype/app/) | 目标文件 (web/src/app/) | 说明 |
|---|---|---|---|
| 1 | `projects/[id]/insights/page.tsx` | `projects/[projectId]/insights/page.tsx` | F14 行业动态 |
| 2 | `projects/[id]/activity/page.tsx` | `projects/[projectId]/activity/page.tsx` | F15 操作日志 |
| 3 | `projects/[id]/data-flow/page.tsx` | `projects/[projectId]/data-flow/page.tsx` | F15 数据流转 |
| 4 | `projects/[id]/modules/[moduleId]/snapshot/page.tsx` | `projects/[projectId]/modules/[moduleId]/snapshot/page.tsx` | F16 AI快照 |
| 5 | `projects/[id]/feed/page.tsx` | `projects/[projectId]/feed/page.tsx` | F14 动态Feed |
| 6 | `teams/page.tsx` | `teams/page.tsx` | F20 团队列表 |
| 7 | `teams/[id]/page.tsx` | `teams/[teamId]/page.tsx` | F20 团队详情 |

### 任务 3：增强 3 个现有页面

**3.1 搜索页增加语义搜索模式（F18）**

文件：`web/src/app/search/page.tsx`

读 `docs/v0-新增页面提示词.md` 第五节"搜索页增加语义搜索模式"的描述，在现有搜索页上增加：
- 搜索框右侧新增 Toggle 组（"关键词"默认选中 / "语义"），用 `<div className="flex rounded-md bg-muted p-0.5">` + 两个 Button 实现
- 切换到语义模式时 placeholder 变为"输入自然语言描述，AI 搜索语义相关内容..."
- 搜索结果卡片右上角增加"相关度 92%"Badge（`variant="outline"`），仅语义模式显示
- 添加 3 条语义搜索的模拟结果数据（搜"支付"命中"计费""结算""账单"）

**3.2 模块页增加导出按钮（F19）**

文件：`web/src/app/projects/[projectId]/modules/[moduleId]/page.tsx`

读 `docs/v0-新增页面提示词.md` 第六节描述，在标题栏右侧增加：
- "导出报告"按钮（`variant="outline" size="sm"`，Download 图标）
- 点击弹出 Dialog：导出范围 Checkbox 组 + 格式 Radio（Markdown/JSON）+ 包含子模块 Switch
- 点击导出显示 alert 或 console.log 模拟（不需要真实下载）

**3.3 统一 Tab 导航为 7 个**

检查以下页面的 Tab 导航，确保统一为 7 个：
```
全景图 (/overview) | 产品线 (/product-lines/default) | 需求工作台 (/analysis) | 竞品对比 (/comparison) | 关系图 (/relation-graph) | 行业动态 (/insights) | 设置 (/settings)
```

需要检查的页面：
- `overview/page.tsx`
- `analysis/page.tsx`
- `comparison/page.tsx`
- `relation-graph/page.tsx`
- `settings/page.tsx`
- `product-lines/[plId]/page.tsx`
- 以及所有新增的页面

如果某页面 Tab 数量不是 7 个或缺少"行业动态"，补上。

### 任务 4：验证

```bash
cd /root/cy/prism/web && npx tsc --noEmit
```

修复所有 TypeScript 错误。常见问题：
- import 的组件/数据文件不存在 → 从 design 复制或创建空导出
- `asChild` 报错 → 去除并用替代方案
- `params.id` 类型不匹配 → 改为 `params.projectId`

### 任务 5：提交

```bash
cd /root/cy/prism
git add web/src/
git commit -m "feat: 补全缺失前端页面（F14/F15/F16/F18/F19/F20）

- 搬运 7 个缺失页面：行业动态/操作日志/数据流转/AI快照/动态Feed/团队列表/团队详情
- 搜索页增加语义搜索模式 Toggle（F18）
- 模块页增加导出报告 Dialog（F19）
- 统一所有项目详情页 Tab 导航为 7 个
- 复制 10 个缺失的模拟数据文件

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin master
```

完成后列出所有创建和修改的文件清单。
