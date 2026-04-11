export type FeedStatus = "pending" | "linked" | "ignored"

export interface FeedItem {
  id: string
  title: string
  source: string
  sourceColor: string
  date: string
  summary: string
  relatedFeatures: { module: string; feature: string }[]
  confidence: number
  status: FeedStatus
}

export interface RssSource {
  id: string
  name: string
  url: string
  enabled: boolean
  lastFetched: string
}

export const feedItems: FeedItem[] = [
  {
    id: "feed-1",
    title: "NVIDIA H200 GPU发布，推理性能提升2倍",
    source: "NVIDIA Blog",
    sourceColor: "border-green-200 text-green-700 bg-green-50",
    date: "2026-04-10",
    summary: "NVIDIA正式发布H200 GPU，基于Hopper架构，HBM3e显存带宽提升至4.8TB/s，大模型推理吞吐量相比H100提升2倍。对GPU调度策略和资源池管理方案有直接影响。",
    relatedFeatures: [
      { module: "GPU管理", feature: "GPU调度策略" },
    ],
    confidence: 92,
    status: "pending",
  },
  {
    id: "feed-2",
    title: "AWS SageMaker新增多模型端点支持",
    source: "AWS Blog",
    sourceColor: "border-orange-200 text-orange-700 bg-orange-50",
    date: "2026-04-09",
    summary: "SageMaker推出Multi-Model Endpoints增强版，支持在单个端点上部署数百个模型，按需加载/卸载，显著降低推理成本。值得参考其路由和调度机制设计。",
    relatedFeatures: [
      { module: "推理服务", feature: "创建推理服务" },
    ],
    confidence: 88,
    status: "linked",
  },
  {
    id: "feed-3",
    title: "Run:ai被NVIDIA收购后首次发布v3.0",
    source: "Run:ai Blog",
    sourceColor: "border-purple-200 text-purple-700 bg-purple-50",
    date: "2026-04-08",
    summary: "Run:ai v3.0引入全新的配额管理和公平调度算法，支持跨集群GPU虚拟化，动态配额借用机制可将GPU利用率提升40%。对配额管理功能有重要参考价值。",
    relatedFeatures: [
      { module: "运维管理", feature: "配额管理" },
    ],
    confidence: 85,
    status: "pending",
  },
  {
    id: "feed-4",
    title: "Kubernetes 1.31发布，增强GPU调度能力",
    source: "K8s Blog",
    sourceColor: "border-blue-200 text-blue-700 bg-blue-50",
    date: "2026-04-07",
    summary: "Kubernetes 1.31正式支持Dynamic Resource Allocation (DRA) GA版本，原生支持GPU拓扑感知调度和MIG分片。对集群调度模块的技术选型和实现方案有直接影响。",
    relatedFeatures: [
      { module: "集群管理", feature: "集群调度" },
    ],
    confidence: 78,
    status: "pending",
  },
  {
    id: "feed-5",
    title: "华为ModelArts推出一站式推理部署",
    source: "华为云Blog",
    sourceColor: "border-red-200 text-red-700 bg-red-50",
    date: "2026-04-06",
    summary: "ModelArts发布推理部署一体化方案，支持从模型训练到推理服务的全流程自动化，内置A/B测试和灰度发布能力。自动扩缩容策略值得对标分析。",
    relatedFeatures: [
      { module: "推理服务", feature: "自动扩缩容" },
    ],
    confidence: 82,
    status: "ignored",
  },
]

export const rssSources: RssSource[] = [
  { id: "rss-1", name: "NVIDIA Blog", url: "https://blogs.nvidia.com/feed", enabled: true, lastFetched: "2小时前" },
  { id: "rss-2", name: "AWS Blog", url: "https://aws.amazon.com/blogs/machine-learning/feed", enabled: true, lastFetched: "2小时前" },
  { id: "rss-3", name: "Run:ai Blog", url: "https://www.run.ai/blog/feed", enabled: true, lastFetched: "2小时前" },
  { id: "rss-4", name: "K8s Blog", url: "https://kubernetes.io/feed.xml", enabled: true, lastFetched: "3小时前" },
  { id: "rss-5", name: "华为云Blog", url: "https://bbs.huaweicloud.com/blogs/feed", enabled: false, lastFetched: "1天前" },
]

export const feedStatusConfig: Record<FeedStatus, { label: string; color: string }> = {
  pending: { label: "待确认", color: "border-yellow-200 text-yellow-700 bg-yellow-50" },
  linked: { label: "已关联", color: "border-green-200 text-green-700 bg-green-50" },
  ignored: { label: "已忽略", color: "border-gray-200 text-gray-500 bg-gray-50" },
}
