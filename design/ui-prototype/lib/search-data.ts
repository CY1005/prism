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
  resultsFound: "找到 10 条结果",
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
  {
    title: "GPU调度基于Kubernetes device plugin",
    breadcrumb: "AI云平台竞品分析 → 平台运维管控 → GPU管理 → GPU列表与监控",
    path: "平台运维管控 > GPU管理 > GPU列表与监控",
    textBefore: "...GPU调度基于",
    highlight: "Kubernetes device plugin",
    textAfter: "，支持NVIDIA/华为昇腾/海光DCU...",
    badge: "技术实现",
    type: "dimension",
  },
  {
    title: "配额管理",
    breadcrumb: "AI云平台竞品分析 → 平台运维管控 → 用户权限与空间管理 → 配额管理",
    path: "平台运维管控 > 用户权限与空间管理 > 配额管理",
    textBefore: "...支持按空间维度设置",
    highlight: "GPU/CPU/内存配额",
    textAfter: "，含软硬限制策略...",
    badge: "功能描述",
    type: "feature",
  },
  {
    title: "配额超分率计算不包含虚拟GPU",
    breadcrumb: "AI云平台竞品分析 → 平台运维管控 → 资源组管理 → 配额超分率",
    path: "平台运维管控 > 资源组管理 > 配额超分率",
    textBefore: "超分率统计仅计算物理GPU，vGPU实例被排除导致数据失真",
    highlight: "",
    textAfter: "",
    badge: "设计缺陷",
    type: "issue",
    issueKind: "设计缺陷",
  },
  {
    title: "离线训练任务提交",
    breadcrumb: "AI云平台竞品分析 → 算法研发与训练 → 离线训练 → 离线训练任务提交",
    path: "算法研发与训练 > 离线训练 > 离线训练任务提交",
    textBefore: "...用户选择镜像、数据集和",
    highlight: "GPU资源",
    textAfter: "后提交训练任务到调度队列...",
    badge: "功能描述",
    type: "feature",
  },
  {
    title: "Orion vGPU虚拟化方案",
    breadcrumb: "AI云平台竞品分析 → 算法研发与训练 → 推理服务 → 创建推理服务",
    path: "算法研发与训练 > 推理服务 > 创建推理服务",
    textBefore: "...采用Orion vGPU方案实现",
    highlight: "GPU虚拟化",
    textAfter: "，支持显存池化和算力隔离...",
    badge: "技术实现",
    type: "dimension",
  },
]
