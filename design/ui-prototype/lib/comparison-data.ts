export interface ComparisonCell {
  text: string
  highlight: string | null
}

export interface ComparisonRow {
  dimension: string
  ourProduct: ComparisonCell
  aws: ComparisonCell
  aliyun: ComparisonCell
  isCustom?: boolean
}

export const comparisonData = {
  selectedFeature: "创建推理服务",
  competitors: [
    { id: "aws", name: "AWS SageMaker" },
    { id: "aliyun", name: "阿里PAI" },
  ],
  defaultDimensions: ["功能覆盖度", "技术方案差异", "用户体验差异"],
  comparisonTable: [
    {
      dimension: "功能覆盖",
      ourProduct: { text: "CPU/GPU物理卡/虚拟卡三类选择", highlight: null },
      aws: { text: "Instance Type隐式选GPU", highlight: null },
      aliyun: { text: "GPU型号+规格族", highlight: null },
    },
    {
      dimension: "GPU 支持",
      ourProduct: { text: "NVIDIA/昇腾/海光/寒武纪", highlight: "green" },
      aws: { text: "仅NVIDIA", highlight: "red" },
      aliyun: { text: "NVIDIA/昇腾", highlight: null },
    },
    {
      dimension: "资源配置",
      ourProduct: { text: "实例规格选择或自定义", highlight: null },
      aws: { text: "预定义实例类型", highlight: null },
      aliyun: { text: "规格族+自定义", highlight: null },
    },
    {
      dimension: "虚拟化",
      ourProduct: { text: "GPU共享调度+显存隔离", highlight: "green" },
      aws: { text: "无原生vGPU", highlight: "red" },
      aliyun: { text: "cGPU", highlight: null },
    },
    {
      dimension: "扩缩容",
      ourProduct: { text: "手动+定时+HPA", highlight: null },
      aws: { text: "Application Auto Scaling", highlight: "green" },
      aliyun: { text: "弹性ESS", highlight: null },
    },
  ] as ComparisonRow[],
  aiGeneratedTable: [
    {
      dimension: "功能覆盖度",
      ourProduct: { text: "支持CPU/GPU/vGPU三种推理资源类型，覆盖在线推理和批量推理", highlight: "green" },
      aws: { text: "Real-time/Batch/Serverless/Async四种推理模式，覆盖最全", highlight: "green" },
      aliyun: { text: "在线推理+离线推理，支持EAS弹性推理服务", highlight: null },
    },
    {
      dimension: "技术方案差异",
      ourProduct: { text: "基于K8s Deployment，自研GPU虚拟化调度器，支持多芯片架构", highlight: "green" },
      aws: { text: "SageMaker Endpoint，基于EC2实例，Inferentia自研芯片加速", highlight: null },
      aliyun: { text: "基于K8s + Fluid加速框架，PAI-Blade优化推理引擎", highlight: null },
    },
    {
      dimension: "用户体验差异",
      ourProduct: { text: "表单式创建，3步完成，但参数配置项较多（12项）", highlight: null },
      aws: { text: "SDK/Console双入口，Console流程清晰但步骤多（5步）", highlight: null },
      aliyun: { text: "向导式创建，集成模型选择，4步完成", highlight: null },
    },
    {
      dimension: "GPU 支持",
      ourProduct: { text: "NVIDIA/昇腾/海光/寒武纪，四厂商适配", highlight: "green" },
      aws: { text: "NVIDIA GPU + AWS Inferentia/Trainium自研芯片", highlight: null },
      aliyun: { text: "NVIDIA/昇腾双厂商", highlight: "red" },
    },
    {
      dimension: "虚拟化能力",
      ourProduct: { text: "GPU共享调度+显存隔离，支持vGPU粒度到0.1卡", highlight: "green" },
      aws: { text: "无原生vGPU，依赖Multi-Model Endpoint实现资源共享", highlight: "red" },
      aliyun: { text: "cGPU容器级GPU隔离，支持显存和算力双维度", highlight: null },
    },
  ] as ComparisonRow[],
  conclusions: [
    { type: "advantage" as const, text: "多厂商GPU支持范围最广（4家 vs AWS仅NVIDIA）" },
    { type: "advantage" as const, text: "原生虚拟GPU能力" },
    { type: "disadvantage" as const, text: "扩缩容能力弱于AWS（缺少预测性扩缩容）" },
    { type: "disadvantage" as const, text: "无Spot/竞价实例降本方案" },
  ],
}
