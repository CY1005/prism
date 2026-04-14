# v0 修复提示词：页面跳转关系

---

修复所有页面之间的跳转链接，确保原型中的导航关系正确。以下逐页说明需要修改的链接：

## 1. 项目全景图 /projects/[id]/page.tsx

树状图里的模块节点链接需要区分项目类型：

- AI云平台（projectId="1"）的模块节点：
  - 推理服务、训练服务等模块节点 → 链接到 `/projects/1/modules/inference-service`（模块概览页）
  - 如果当前数据结构不支持，至少链接到 `/projects/1/product-lines/private-cloud` 而不是 `"/"`

- OpenClaw（projectId="2"）的模块节点：
  - 各组件节点 → 链接到 `/openclaw`（OpenClaw功能档案页）

## 2. 模块概览页 /projects/[id]/modules/[moduleId]/page.tsx

功能项表格中每行的功能项名称链接（当前全部是 `href="/"`）：

- "创建推理服务" → `href="/"`（根路径就是AI云平台的功能档案页，保持不变）
- "自动扩缩容" → `href="/"`（同上，原型阶段共用一个详情页示例）
- "拼卡管理" → `href="/"`（同上）

这些保持 `"/"` 即可，但确保链接文字的样式是 `text-primary hover:underline`，让用户知道可以点击。

## 3. 首页功能档案页 /page.tsx（AI云平台详情页）

面包屑导航中间层级的链接需要修正：

当前面包屑：`AI云平台竞品分析 > 私有云 > 推理服务 > 创建推理服务`

修改链接：
- "AI云平台竞品分析" → `href="/projects/1"`（项目全景图）✅ 已正确
- "私有云" → `href="/projects/1/product-lines/private-cloud"`（产品线详情页）
- "推理服务" → `href="/projects/1/modules/inference-service"`（模块概览页）
- "创建推理服务" → 当前页，BreadcrumbPage 不需要链接 ✅

## 4. OpenClaw 功能档案页 /openclaw/page.tsx

面包屑导航中间层级的链接需要修正：

当前面包屑：`OpenClaw > 消息层 > Telegram Bridge > 消息收发`

修改链接：
- "OpenClaw" → `href="/projects/2"`（OpenClaw项目全景图）✅ 已正确
- "消息层" → `href="/projects/2"`（原型阶段暂时指向全景图）
- "Telegram Bridge" → `href="/projects/2"`（原型阶段暂时指向全景图）
- "消息收发" → 当前页，BreadcrumbPage 不需要链接 ✅

## 5. 搜索结果页 /search/page.tsx

搜索结果列表中每条结果的链接需要修正：

- 第1条"拼卡管理"（AI云平台）→ `href="/"`（AI云平台功能档案页）✅ 已正确
- 第2条"创建推理服务"（AI云平台）→ `href="/"`（同上）✅ 已正确
- 第3条"消息路由"（OpenClaw）→ `href="/openclaw"`（OpenClaw功能档案页）✅ 已正确

搜索结果的链接已经正确，不需要改。

## 6. 产品线详情页 /projects/[id]/product-lines/[plId]/page.tsx

模块卡片的链接当前是 `/projects/${projectId}/modules/${module.id}`，这是正确的。✅

但左侧树形导航的 FeatureTree 组件，点击叶子节点（功能项）时只触发 `setSelectedNode` 没有实际跳转。这在原型阶段可以接受，但建议：

- 点击树中的叶子节点（type="file"）时，除了高亮选中，也跳转到 `"/"`（功能档案页）

修改 FeatureTree 的 onSelect 回调，在产品线详情页中加入路由跳转：
```
当 onSelect 被调用且节点 type === "file" 时，使用 router.push("/") 跳转到功能档案页
```

## 7. 项目全景图的 Tab 导航一致性

确认所有带 Tab 导航的页面（全景图、产品线、需求分析、竞品对比）的 Tab 链接一致：

- 全景图 → `/projects/${projectId}` 
- 产品线/系统层 → `/projects/${projectId}/product-lines/private-cloud`（AI云平台）或 `/openclaw`（OpenClaw）
- 需求分析 → `/projects/${projectId}/analysis`
- 竞品对比 → `/projects/${projectId}/comparison`
- 设置 → `/projects/${projectId}/settings`

当前各页面的 Tab 导航已经一致 ✅，只需确认 OpenClaw 项目的"系统层" Tab 链接到 `/openclaw` 而不是 `/projects/2/product-lines/private-cloud`。

---

总结：实际需要修改的只有两处：
1. **/page.tsx 面包屑**：把"私有云"的链接改为 `/projects/1/product-lines/private-cloud`，把"推理服务"改为 `/projects/1/modules/inference-service`
2. **/openclaw/page.tsx 面包屑**：把"消息层"和"Telegram Bridge"的链接改为 `/projects/2`

其他链接在原型阶段都是合理的。
