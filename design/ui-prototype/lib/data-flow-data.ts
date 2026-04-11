// F15 数据流转可视化 mock data

export interface ProcessingFile {
  id: string
  filename: string
  status: "completed" | "processing" | "pending"
  splitCount: number
  assignedModule: string
  splitItems?: string[]
}

export interface FlowLogEntry {
  id: string
  timestamp: string
  message: string
  type: "info" | "success" | "warning" | "ai"
}

export interface FlowStats {
  label: string
  value: string | number
  icon: string
}

export interface SankeyNode {
  name: string
  type: "file" | "module" | "dimension"
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

export interface ImportHistory {
  id: string
  timestamp: string
  source: string
  summary: string
  filesCount: number
  featuresCount: number
  status: "completed" | "failed" | "partial"
}

export const dataFlowStrings = {
  pageTitle: "数据流转",
  importProgress: "导入进度",
  flowSummary: "流转汇总",
  importHistory: "导入历史",
  currentFile: "当前处理",
  totalProgress: "总进度",
  realtimeLog: "实时日志",
  statsImported: "导入文件",
  statsSplit: "拆分功能项",
  statsRelations: "创建关联",
  statsModules: "归入模块",
  flowDiagram: "流转全景",
  aiAnalysisFlow: "AI 分析流",
}

// 当前导入任务
export const currentImportSource = "Gemini平台知识库.zip"
export const currentImportProgress = 67
export const currentImportProcessed = 8
export const currentImportTotal = 12

export const processingFiles: ProcessingFile[] = [
  {
    id: "f1",
    filename: "推理服务概述.md",
    status: "completed",
    splitCount: 4,
    assignedModule: "推理服务",
    splitItems: ["创建推理服务", "推理服务列表", "推理服务详情", "推理服务监控"],
  },
  {
    id: "f2",
    filename: "模型管理.md",
    status: "completed",
    splitCount: 3,
    assignedModule: "模型管理",
    splitItems: ["模型上传", "模型版本管理", "模型格式转换"],
  },
  {
    id: "f3",
    filename: "资源配额说明.docx",
    status: "completed",
    splitCount: 2,
    assignedModule: "配额管理",
    splitItems: ["配额分配", "配额监控"],
  },
  {
    id: "f4",
    filename: "自动扩缩容.md",
    status: "completed",
    splitCount: 3,
    assignedModule: "推理服务",
    splitItems: ["扩缩容策略", "定时扩缩容", "扩缩容历史"],
  },
  {
    id: "f5",
    filename: "GPU拼卡方案.md",
    status: "completed",
    splitCount: 2,
    assignedModule: "推理服务",
    splitItems: ["拼卡配置", "拼卡监控"],
  },
  {
    id: "f6",
    filename: "API网关配置.md",
    status: "completed",
    splitCount: 3,
    assignedModule: "API网关",
    splitItems: ["路由管理", "流量控制", "鉴权配置"],
  },
  {
    id: "f7",
    filename: "运维监控.md",
    status: "completed",
    splitCount: 2,
    assignedModule: "运维管理",
    splitItems: ["资源监控", "告警配置"],
  },
  {
    id: "f8",
    filename: "计费规则.md",
    status: "processing",
    splitCount: 3,
    assignedModule: "计费模块",
    splitItems: ["计费策略", "账单管理", "费用预估"],
  },
  {
    id: "f9",
    filename: "数据集管理.md",
    status: "pending",
    splitCount: 0,
    assignedModule: "",
  },
  {
    id: "f10",
    filename: "微调训练.md",
    status: "pending",
    splitCount: 0,
    assignedModule: "",
  },
  {
    id: "f11",
    filename: "评估报告.md",
    status: "pending",
    splitCount: 0,
    assignedModule: "",
  },
  {
    id: "f12",
    filename: "平台管理后台.md",
    status: "pending",
    splitCount: 0,
    assignedModule: "",
  },
]

export const flowLogs: FlowLogEntry[] = [
  { id: "log-1", timestamp: "14:32:01", message: "开始解压 Gemini平台知识库.zip ...", type: "info" },
  { id: "log-2", timestamp: "14:32:03", message: "发现 12 个文件，开始逐个处理", type: "info" },
  { id: "log-3", timestamp: "14:32:05", message: "推理服务概述.md → 拆分为 4 个功能项 → 归入「推理服务」模块", type: "success" },
  { id: "log-4", timestamp: "14:32:08", message: "模型管理.md → 拆分为 3 个功能项 → 归入「模型管理」模块", type: "success" },
  { id: "log-5", timestamp: "14:32:11", message: "资源配额说明.docx → 拆分为 2 个功能项 → 归入「配额管理」模块", type: "success" },
  { id: "log-6", timestamp: "14:32:14", message: "自动扩缩容.md → 拆分为 3 个功能项 → 归入「推理服务」模块", type: "success" },
  { id: "log-7", timestamp: "14:32:15", message: "[AI] 检测到「自动扩缩容」与「推理服务 > 创建推理服务」存在关联，已自动创建 depends_on 关系", type: "ai" },
  { id: "log-8", timestamp: "14:32:17", message: "GPU拼卡方案.md → 拆分为 2 个功能项 → 归入「推理服务」模块", type: "success" },
  { id: "log-9", timestamp: "14:32:20", message: "API网关配置.md → 拆分为 3 个功能项 → 归入「API网关」模块", type: "success" },
  { id: "log-10", timestamp: "14:32:22", message: "[AI] 检测到「API网关 > 路由管理」与「推理服务 > 创建推理服务」存在 related_to 关系", type: "ai" },
  { id: "log-11", timestamp: "14:32:24", message: "运维监控.md → 拆分为 2 个功能项 → 归入「运维管理」模块", type: "success" },
  { id: "log-12", timestamp: "14:32:27", message: "正在处理 计费规则.md ...", type: "info" },
  { id: "log-13", timestamp: "14:32:28", message: "[AI] 计费规则.md 内容较复杂，预计拆分为 3 个功能项", type: "ai" },
]

export const flowSummaryStats: FlowStats[] = [
  { label: "导入文件", value: 12, icon: "file" },
  { label: "拆分功能项", value: 28, icon: "split" },
  { label: "创建关联", value: 15, icon: "link" },
  { label: "归入模块", value: 7, icon: "folder" },
]

// Sankey 数据 - 文件 → 模块 → 维度
export const sankeyNodes: SankeyNode[] = [
  // 文件节点
  { name: "推理服务概述.md", type: "file" },
  { name: "自动扩缩容.md", type: "file" },
  { name: "GPU拼卡方案.md", type: "file" },
  { name: "模型管理.md", type: "file" },
  { name: "API网关配置.md", type: "file" },
  { name: "资源配额说明.docx", type: "file" },
  { name: "运维监控.md", type: "file" },
  { name: "计费规则.md", type: "file" },
  { name: "其他 (4)", type: "file" },
  // 模块节点
  { name: "推理服务", type: "module" },
  { name: "模型管理", type: "module" },
  { name: "API网关", type: "module" },
  { name: "配额管理", type: "module" },
  { name: "运维管理", type: "module" },
  { name: "计费模块", type: "module" },
  { name: "其他模块", type: "module" },
  // 维度节点
  { name: "功能描述", type: "dimension" },
  { name: "技术实现", type: "dimension" },
  { name: "接口定义", type: "dimension" },
  { name: "需求分析", type: "dimension" },
]

export const sankeyLinks: SankeyLink[] = [
  // 文件 → 模块
  { source: "推理服务概述.md", target: "推理服务", value: 4 },
  { source: "自动扩缩容.md", target: "推理服务", value: 3 },
  { source: "GPU拼卡方案.md", target: "推理服务", value: 2 },
  { source: "模型管理.md", target: "模型管理", value: 3 },
  { source: "API网关配置.md", target: "API网关", value: 3 },
  { source: "资源配额说明.docx", target: "配额管理", value: 2 },
  { source: "运维监控.md", target: "运维管理", value: 2 },
  { source: "计费规则.md", target: "计费模块", value: 3 },
  { source: "其他 (4)", target: "其他模块", value: 6 },
  // 模块 → 维度
  { source: "推理服务", target: "功能描述", value: 5 },
  { source: "推理服务", target: "技术实现", value: 4 },
  { source: "模型管理", target: "功能描述", value: 2 },
  { source: "模型管理", target: "接口定义", value: 1 },
  { source: "API网关", target: "技术实现", value: 2 },
  { source: "API网关", target: "接口定义", value: 1 },
  { source: "配额管理", target: "功能描述", value: 1 },
  { source: "配额管理", target: "需求分析", value: 1 },
  { source: "运维管理", target: "功能描述", value: 1 },
  { source: "运维管理", target: "技术实现", value: 1 },
  { source: "计费模块", target: "功能描述", value: 2 },
  { source: "计费模块", target: "需求分析", value: 1 },
  { source: "其他模块", target: "功能描述", value: 4 },
  { source: "其他模块", target: "技术实现", value: 2 },
]

export const importHistory: ImportHistory[] = [
  {
    id: "h1",
    timestamp: "2026-04-11 14:32",
    source: "Gemini平台知识库.zip",
    summary: "导入 12 个文件，拆分为 28 个功能项，归入 7 个模块",
    filesCount: 12,
    featuresCount: 28,
    status: "completed",
  },
  {
    id: "h2",
    timestamp: "2026-04-10 16:45",
    source: "推理服务PRD-v2.3.docx",
    summary: "导入 1 个文件，拆分为 6 个功能项，更新「推理服务」模块",
    filesCount: 1,
    featuresCount: 6,
    status: "completed",
  },
  {
    id: "h3",
    timestamp: "2026-04-09 10:20",
    source: "竞品分析-ModelArts.md",
    summary: "导入 1 个文件，生成 12 条竞品对比记录",
    filesCount: 1,
    featuresCount: 12,
    status: "completed",
  },
  {
    id: "h4",
    timestamp: "2026-04-08 09:15",
    source: "API文档合集.zip",
    summary: "导入 5 个文件，2 个解析失败（格式不支持）",
    filesCount: 5,
    featuresCount: 8,
    status: "partial",
  },
]

export const aiAnalysisFlowMessage = "分析结果已保存到 推理服务/创建推理服务 的需求分析维度，生成了 6 条测试点"
