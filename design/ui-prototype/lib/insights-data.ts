export interface Insight {
  id: string
  title: string
  tag: string
  tagColor: string
  date: string
  source: string
  summary: string
  linkedFeatures: string[]
}

export const insightsData: Insight[] = [
  { id: "1", title: "AWS SageMaker 发布多模型推理端点", tag: "产品发布", tagColor: "green", date: "2026-04-08", source: "AWS Blog", summary: "SageMaker 新增多模型推理端点功能，支持在单个端点上部署多个模型并自动路由请求，降低推理成本约 40%。", linkedFeatures: ["创建推理服务", "路由管理"] },
  { id: "2", title: "阿里 PAI 推出 GPU 拼卡调度方案", tag: "技术趋势", tagColor: "blue", date: "2026-04-05", source: "阿里云公众号", summary: "PAI 发布基于 MIG 的 GPU 拼卡调度方案，支持 A100/H100 多实例切分，单卡最多 7 个独立实例。", linkedFeatures: ["GPU管理"] },
  { id: "3", title: "Hugging Face 推出开源推理优化框架 TGI 2.0", tag: "技术趋势", tagColor: "blue", date: "2026-04-03", source: "Hugging Face Blog", summary: "TGI 2.0 支持推测解码、PagedAttention v2、动态批处理等特性，在 Llama 3 上吞吐量提升 3 倍。", linkedFeatures: ["模型调度"] },
  { id: "4", title: "Replicate 完成 4000 万美元 B 轮融资", tag: "融资收购", tagColor: "purple", date: "2026-03-28", source: "36kr", summary: "模型即服务平台 Replicate 完成 B 轮融资，主打 Serverless GPU 推理，目前支持超 1 万个开源模型。", linkedFeatures: [] },
  { id: "5", title: "Google Vertex AI 新增自动扩缩容策略配置", tag: "产品发布", tagColor: "green", date: "2026-03-25", source: "Google Cloud Blog", summary: "Vertex AI 推理端点支持自定义扩缩容策略，包括基于队列深度、GPU 利用率、自定义指标的多维度触发条件。", linkedFeatures: ["自动扩缩容", "监控告警"] },
  { id: "6", title: "Nvidia Triton 推理服务器性能优化白皮书", tag: "技术趋势", tagColor: "blue", date: "2026-03-20", source: "Nvidia Developer", summary: "Nvidia 发布 Triton Inference Server 最佳实践白皮书，覆盖模型并发、动态批处理、模型预热等优化策略。", linkedFeatures: ["创建推理服务", "模型调度"] },
  { id: "7", title: "MLOps 市场规模预测：2030 年达 450 亿美元", tag: "市场报告", tagColor: "orange", date: "2026-03-15", source: "Gartner", summary: "Gartner 最新报告预测全球 MLOps 市场将从 2026 年的 120 亿美元增长至 2030 年的 450 亿美元，CAGR 39%。", linkedFeatures: [] },
  { id: "8", title: "字节火山引擎推出推理加速服务", tag: "产品发布", tagColor: "green", date: "2026-03-10", source: "火山引擎官网", summary: "火山引擎推出基于自研芯片的推理加速服务，针对大语言模型场景优化，首 token 延迟降低 60%。", linkedFeatures: ["创建推理服务"] },
]

export const tagColors: Record<string, string> = {
  green: "border-green-200 text-green-700 bg-green-50",
  blue: "border-blue-200 text-blue-700 bg-blue-50",
  purple: "border-purple-200 text-purple-700 bg-purple-50",
  orange: "border-orange-200 text-orange-700 bg-orange-50",
}
