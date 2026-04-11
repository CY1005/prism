export const searchStrings = {
  productLine: "产品线",
  opsManagement: "平台运维管控",
  algorithmTraining: "算法研发与训练",
  moduleLabel: "模块",
  inferenceService: "推理服务",
  trainingService: "训练服务",
  dimensionType: "维度类型",
  engineeringExp: "工程经验",
  techImpl: "技术实现",
  designDecision: "设计决策",
  resultsFound: "找到 5 条结果",
  funcDescription: "功能描述",
  userName: "陈琦",
  userInitials: "陈",
}

export type SearchResultType = "feature" | "dimension" | "issue"
export type IssueKind = "bug" | "技术债" | "设计缺陷" | "性能"

export interface SearchResultItem {
  title: string
  breadcrumb: string
  path: string
  textBefore: string
  highlight: string
  textAfter: string
  badge: string
  type: SearchResultType
  issueKind?: IssueKind
}

export const searchResults: SearchResultItem[] = [
  {
    title: "拼卡管理",
    breadcrumb: "AI云平台竞品分析 → 算法研发与训练 → 推理服务 → 拼卡管理",
    path: "算法研发与训练 > 推理服务 > 拼卡管理",
    textBefore: "...支持多块GPU",
    highlight: "拼卡",
    textAfter: "组成虚拟大显存...",
    badge: "功能描述",
    type: "feature",
  },
  {
    title: "创建推理服务",
    breadcrumb: "AI云平台竞品分析 → 算法研发与训练 → 推理服务 → 创建推理服务",
    path: "算法研发与训练 > 推理服务 > 创建推理服务",
    textBefore: "...NUMA亲和性问题：",
    highlight: "拼卡",
    textAfter: "后推理延迟反而增大...",
    badge: "工程经验",
    type: "dimension",
  },
  {
    title: "GPU拼卡后推理延迟增大",
    breadcrumb: "AI云平台竞品分析 → 算法研发与训练 → 推理服务 → 拼卡管理",
    path: "算法研发与训练 > 推理服务 > 拼卡管理",
    textBefore: "NUMA亲和性未处理导致跨socket GPU通信延迟增加50%",
    highlight: "",
    textAfter: "",
    badge: "bug",
    type: "issue",
    issueKind: "bug",
  },
  {
    title: "GPU调度策略",
    breadcrumb: "AI云平台竞品分析 → 平台运维管控 → GPU管理 → GPU调度策略",
    path: "平台运维管控 > GPU管理 > GPU调度策略",
    textBefore: "...",
    highlight: "拼卡",
    textAfter: "场景下调度器需感知NUMA拓扑...",
    badge: "技术实现",
    type: "dimension",
  },
  {
    title: "调度器缺少拓扑感知能力",
    breadcrumb: "AI云平台竞品分析 → 平台运维管控 → GPU管理 → GPU调度策略",
    path: "平台运维管控 > GPU管理 > GPU调度策略",
    textBefore: "当前调度器不感知NUMA拓扑，GPU分配可能跨socket",
    highlight: "",
    textAfter: "",
    badge: "技术债",
    type: "issue",
    issueKind: "技术债",
  },
]
