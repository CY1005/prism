export const comparisonData = {
  selectedFeature: "创建推理服务",
  competitors: [
    { id: "aws", name: "AWS SageMaker" },
    { id: "aliyun", name: "阿里PAI" },
  ],
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
  ],
  conclusions: [
    { type: "advantage" as const, text: "多厂商GPU支持范围最广（4家 vs AWS仅NVIDIA）" },
    { type: "advantage" as const, text: "原生虚拟GPU能力" },
    { type: "disadvantage" as const, text: "扩缩容能力弱于AWS（缺少预测性扩缩容）" },
    { type: "disadvantage" as const, text: "无Spot/竞价实例降本方案" },
  ],
}
