# Prism v3 — v0 修改提示词

> 使用方式：直接复制下方分隔线以下的全部内容，粘贴到 v0 的对话框中
> 如果 v0 一次处理不完，可以按页面拆分发送

---

基于当前项目进行以下修改。Prism 从"AI云平台竞品分析工具"升级为"通用项目知识棱镜"，支持不同类型的项目（产品分析、系统架构、研究平台、自定义），每种项目类型有不同的知识维度组合和层级标签。保持现有的设计风格和组件库不变。所有文字使用中文。

## 一、修改项目列表页 /projects/page.tsx

1. 把项目卡片从3个改为4个，2行2列网格布局（grid-cols-2）。

2. 每个项目卡片左上角加一个项目类型 Badge，用 variant="outline" 小号字体：

3. 4个项目数据改为：
```
{
  id: "1",
  title: "AI云平台竞品分析",
  type: "产品分析",
  typeColor: "blue",
  description: "系统性分析AI云平台行业竞品设计与技术",
  stats: [
    { value: 3, label: "产品线" },
    { value: 42, label: "模块" },
    { value: "58%", label: "完善度" }
  ],
  lastUpdated: "2小时前",
  members: ["陈", "王", "李"]
},
{
  id: "2",
  title: "OpenClaw",
  type: "系统架构",
  typeColor: "green",
  description: "个人AI陪伴系统，Telegram+Claude全栈",
  stats: [
    { value: 4, label: "系统层" },
    { value: 15, label: "组件" },
    { value: "45%", label: "完善度" }
  ],
  lastUpdated: "昨天",
  members: ["陈"]
},
{
  id: "3",
  title: "MappingStudio",
  type: "研究平台",
  typeColor: "purple",
  description: "AI驱动的科技公司研究报告平台",
  stats: [
    { value: 5, label: "模块" },
    { value: 23, label: "功能" },
    { value: "30%", label: "完善度" }
  ],
  lastUpdated: "3天前",
  members: ["陈", "张"]
},
{
  id: "4",
  title: "Prism",
  type: "自定义",
  typeColor: "orange",
  description: "用Prism分析Prism，dogfooding验证",
  stats: [
    { value: 3, label: "阶段" },
    { value: 12, label: "模块" },
    { value: "20%", label: "完善度" }
  ],
  lastUpdated: "刚刚",
  members: ["陈", "M"]
}
```

4. 每个卡片的三个数字指标的 label 不再固定，改为从 stats 数组动态渲染。

## 二、新增"新建项目弹窗"页面 /projects/new/page.tsx

创建一个新页面模拟新建项目弹窗的内容（不用真弹窗，直接做成独立页面）：

1. 顶部：标题"新建项目"，右上角有返回项目列表的链接。

2. 上半部分：项目名称输入框 + 项目描述输入框。

3. 下半部分标题"选择模板"，4个模板选择卡片横排（grid-cols-4），每个卡片：
   - 高度相同，padding 充分
   - 顶部：模板名称（字号大）
   - 中间：一句话描述（text-muted-foreground）
   - 下面"层级结构"小标题 + 文字（如"产品线 → 模块 → 功能项"）
   - 再下面"预设维度"小标题 + 一组小 Badge 标签排列展示维度名称
   - 第一个卡片默认选中状态（蓝色边框 border-primary）

4. 四个模板数据：

模板1 —— 产品竞品分析
- 描述：适合分析竞品产品设计与技术实现
- 层级：产品线 → 模块 → 功能项
- 维度（8个）：功能描述、用户场景、技术实现、设计决策、工程经验、测试分析、需求分析、竞品参考

模板2 —— 系统架构项目
- 描述：适合记录系统设计与架构演进
- 层级：系统层 → 组件 → 功能
- 维度（6个）：功能描述、接口规范、设计决策、工程经验、部署配置、测试分析

模板3 —— 研究平台项目
- 描述：适合数据产品和研究工具项目
- 层级：应用层 → 模块 → 功能
- 维度（7个）：功能描述、用户场景、设计决策、工程经验、质量指标、成本分析、测试分析

模板4 —— 自定义
- 描述：自由选择维度组合和层级名称
- 层级：自定义
- 维度：显示文字"创建后在项目设置中配置"

5. 底部：取消按钮（链接回 /projects）+ 创建项目按钮（primary）

## 三、新增 OpenClaw 项目全景图 /projects/2/page.tsx

复制现有的 /projects/[id]/page.tsx 结构，但数据完全不同：

1. 面包屑："我的项目 > OpenClaw"

2. 顶部4个统计卡片：系统层 4个 / 组件 15个 / 功能 38个 / 完善度 45%

3. 产品线树状图改为系统层树状图，层级标签不同：
   - 消息层（完善度60%）
     - Telegram Bridge（55%）
     - 消息队列（70%）
   - 路由层（完善度50%）
     - FastAPI Router（55%）
     - 意图识别（40%）
   - 技能层（完善度40%）
     - 日报技能（60%）
     - 健康打卡（45%）
     - 学习复盘（30%）
     - 面试练习（25%）
   - 记忆层（完善度35%）
     - 核心记忆（50%）
     - 工作记忆（40%）
     - 长期记忆（25%）

4. 右侧最近更新：
   - "陈 修复了 技能层>日报技能 的cron报错 — 2天前"
   - "陈 更新了 记忆层>核心记忆 的接口规范 — 3天前"
   - "陈 新增了 路由层>FastAPI Router 的设计决策 — 5天前"

## 四、新增 OpenClaw 功能档案页 /openclaw/page.tsx

这是核心变化页面——展示系统架构类项目的档案页，维度数量和内容与产品分析类不同。

1. 左侧边栏：
   - 顶部：项目名"OpenClaw" + 一个小 Badge 显示"系统架构"（绿色 outline）+ 折叠按钮
   - 树形导航数据：
```
[
  {
    id: "message-layer", name: "消息层", type: "folder", completionPercent: 60,
    children: [
      {
        id: "telegram-bridge", name: "Telegram Bridge", type: "folder", completionPercent: 55,
        children: [
          { id: "msg-send-receive", name: "消息收发", type: "file", completionPercent: 67 },
          { id: "polling", name: "轮询机制", type: "file", completionPercent: 40 }
        ]
      },
      {
        id: "msg-queue", name: "消息队列", type: "folder", completionPercent: 70,
        children: [
          { id: "queue-manage", name: "队列管理", type: "file", completionPercent: 70 }
        ]
      }
    ]
  },
  {
    id: "router-layer", name: "路由层", type: "folder", completionPercent: 50,
    children: [
      {
        id: "fastapi-router", name: "FastAPI Router", type: "folder", completionPercent: 55,
        children: [
          { id: "msg-routing", name: "消息路由", type: "file", completionPercent: 60 },
          { id: "intent-detect", name: "意图识别", type: "file", completionPercent: 40 }
        ]
      }
    ]
  },
  {
    id: "skill-layer", name: "技能层", type: "folder", completionPercent: 40,
    children: [
      { id: "daily-report", name: "日报技能", type: "file", completionPercent: 60 },
      { id: "health-check", name: "健康打卡", type: "file", completionPercent: 45 }
    ]
  },
  {
    id: "memory-layer", name: "记忆层", type: "folder", completionPercent: 35,
    children: [
      { id: "core-memory", name: "核心记忆", type: "file", completionPercent: 50 },
      { id: "working-memory", name: "工作记忆", type: "file", completionPercent: 40 }
    ]
  }
]
```

2. 右侧主区域：
   - 面包屑："消息层 > Telegram Bridge > 消息收发"
   - 完善度："4/6 维度已填写 67%"（注意是6不是8）

   - 只有6个维度卡片（不是8个，这是关键区别）：

   卡片1「功能描述」展开：
   "通过 Telegram Bot API 的 getUpdates 长轮询接收用户消息，经消息队列转发至路由层处理，通过 sendMessage 返回AI响应。支持文本、图片、文件三种消息类型。"

   卡片2「接口规范」展开（这个维度在产品分析模板里不存在）：
   一个表格：
   | 方向 | 协议 | 端点 | 说明 |
   |------|------|------|------|
   | 入站 | HTTPS | api.telegram.org/bot{token}/getUpdates | 长轮询接收消息 |
   | 出站 | HTTP | localhost:8900/webhook/telegram | 转发至Router处理 |
   | 出站 | HTTPS | api.telegram.org/bot{token}/sendMessage | 返回响应给用户 |

   卡片3「设计决策」展开：
   - 背景："消息接收需要选择 Webhook 还是长轮询"
   - 决策："选择长轮询（getUpdates）"
   - 放弃的方案："Webhook 需要公网 HTTPS 域名和证书，当前服务器不具备条件"
   - 后果："消息延迟略高（1-2秒），但部署零依赖，适合个人服务器"

   卡片4「工程经验」展开：
   踩坑卡片样式（和现有的 NUMA 亲和性卡片风格一致）：
   标题："Telegram API 限流踩坑"
   内容："getUpdates 频率超过 30次/秒会被临时封禁 token。根因：轮询间隔设得太短。修复：间隔从 0.5秒 改为 2秒，增加 429 状态码自动退避。"
   标签：[踩坑] [API限流] [Telegram]

   卡片5「部署配置」展开（这个维度在产品分析模板里也不存在）：
   用一个和"平台侧技术"类似的卡片样式：
   标题："systemd 服务配置"
   内容："服务名 telegram-polling.service，开机自启（WantedBy=multi-user.target），异常退出 3秒后自动重启（RestartSec=3）。依赖 message-router.service 先启动。"
   标签：[systemd] [自动重启] [服务依赖]

   卡片6「测试分析」折叠状态：
   摘要："已记录 1 个测试场景"

3. 底部版本时间线：日期模式（不是版本号）
   - 2026-04-07（蓝色圆点，标注"最新"）— "修复 cron 报错，升级 router v2 架构"
   - 2026-03-28（灰色）— "新增人格记忆系统，支持多人格切换"
   - 2026-03-15（灰色）— "初始部署：基础消息收发 + 日报技能"

## 五、修改搜索页 /search/page.tsx

1. 搜索框默认值改为"GPU调度"。

2. 左侧筛选栏改为：
   - 第一组"项目范围"：4个复选框
     - AI云平台竞品分析（默认勾选）
     - OpenClaw（默认勾选）
     - MappingStudio（未勾选）
     - Prism（未勾选）
   - 第二组"维度类型"保留，但选项改为：功能描述（勾选）、技术实现（勾选）、工程经验（未勾选）、设计决策（未勾选）、接口规范（未勾选）
   - 删除原来的"产品线"和"模块"两组筛选

3. 搜索结果改为3条跨项目结果，每条结果标题前加一个来源项目的小 Badge：
   - Badge[AI云平台] + "拼卡管理" — 路径"私有云 > 推理服务 > 拼卡管理" — "...支持多块GPU拼卡组成虚拟大显存..." — 标签"功能描述"
   - Badge[AI云平台] + "创建推理服务" — 路径"私有云 > 推理服务 > 创建推理服务" — "...GPU调度基于Kubernetes device plugin..." — 标签"技术实现"
   - Badge[OpenClaw] + "消息路由" — 路径"路由层 > FastAPI Router > 消息路由" — "...路由层根据消息类型和上下文分发到对应skill处理器..." — 标签"功能描述"

4. 结果计数改为"跨 2 个项目找到 3 条结果"。

## 六、修改项目设置页 /projects/[id]/settings/page.tsx

左侧 Tab 从3个增加到5个：

1. 基本信息（原有，改动小）：
   - 增加一行只读字段"项目类型：产品竞品分析"（用 Badge 展示）

2. 维度管理（新增 Tab，设为默认选中高亮状态）：
   - 标题"维度管理"
   - 说明文字（text-muted-foreground）："配置本项目启用的知识维度和显示顺序"
   - 一个列表，每行是一个维度，样式类似表格但更松散：
     - 左侧：一个 Switch 开关组件
     - 维度图标（和档案页卡片用同一套图标）
     - 维度名称（font-medium）
     - 一句说明（text-muted-foreground text-sm）
     - 右侧：拖拽排序手柄图标（GripVertical）
   - 已启用的8个（开关打开状态）：
     - 功能描述 — "功能的核心说明"
     - 用户场景 — "谁在什么场景下使用"
     - 技术实现 — "平台侧的技术方案"
     - 设计决策 — "关键架构决策及取舍"
     - 工程经验 — "踩坑记录与最佳实践"
     - 测试分析 — "测试策略与问题记录"
     - 需求分析 — "需求拆解与影响范围"
     - 竞品参考 — "竞品功能对标分析"
   - 分隔线
   - 未启用的4个（开关关闭，整行文字颜色变淡）：
     - 接口规范 — "API接口与协议定义"
     - 部署配置 — "部署架构与运维配置"
     - 质量指标 — "准确率、延迟等量化指标"
     - 成本分析 — "资源成本与ROI分析"
   - 底部"保存"按钮

3. 层级配置（新增 Tab）：
   - 标题"层级标签配置"
   - 说明："自定义本项目的三层结构名称"
   - 3行，每行一个 Label + Input：
     - 第1层：输入框默认值"产品线"
     - 第2层：输入框默认值"模块"
     - 第3层：输入框默认值"功能项"
   - 右侧预览区（用一个小Card）：
     - 标题"预览"
     - 用缩进文字展示效果：
       📁 产品线
         📁 模块
           📄 功能项
   - 底部保存按钮

4. 成员管理（原有，不变）

5. AI配置（原有，不变）

## 七、修改现有首页档案页 /page.tsx

修改很小：
1. 左侧边栏顶部项目名"AI云平台竞品分析"旁边加一个小 Badge"产品分析"（蓝色 outline）
2. 卡片3标题从"平台侧技术"改为"技术实现"
3. 在卡片3的内容底部（两条技术记录之后），加一行小字（text-xs text-muted-foreground）：
   "参考标准：Volcano (CNCF孵化·华为主导) · KServe (K8s模型serving标准)"
4. 卡片7需求分析的引导文字从"点击添加需求分析"改为"点击添加，或上传需求文档自动分析"
5. 卡片8竞品参考的折叠摘要从"已参考 1 个竞品"改为"已对标 3 家竞品"

## 八、修改管理后台 /admin/page.tsx

左侧菜单从3个增加到4个，在"平台统计"和"全局配置"之间插入"维度类型管理"。

维度类型管理页面内容（点击该菜单时显示，默认仍显示用户管理）：
不需要实际实现切换，只要在菜单中能看到这个选项即可。

---

以上所有修改保持现有的设计风格、组件库、配色方案完全不变。新增页面复用现有的 Card、Badge、Table、Button、Input、Switch 等 shadcn/ui 组件。
