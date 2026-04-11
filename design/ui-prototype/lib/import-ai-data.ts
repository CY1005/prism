export interface FileTreeItem {
  name: string
  type: "file" | "folder"
  children?: FileTreeItem[]
  content?: string
}

export interface ImportMappingRow {
  id: string
  fileName: string
  splitResult: string
  recommendedModule: string
  recommendedDimension: string
  confidence: number
  selected: boolean
  conflict: boolean
  conflictMessage?: string
}

export interface ImportAIData {
  zipName: string
  totalItems: number
  selectedItems: number
  steps: { label: string; active: boolean; completed: boolean }[]
  fileTree: FileTreeItem[]
  mappingRows: ImportMappingRow[]
  availableModules: string[]
  availableDimensions: string[]
}

export const importAIData: ImportAIData = {
  zipName: "Gemini平台知识库.zip",
  totalItems: 28,
  selectedItems: 24,
  steps: [
    { label: "上传", active: false, completed: true },
    { label: "AI分析", active: false, completed: true },
    { label: "Review映射", active: true, completed: false },
    { label: "确认导入", active: false, completed: false },
  ],
  availableModules: [
    "推理服务",
    "训练服务",
    "GPU管理",
    "用户与空间",
    "模型仓库",
    "数据管理",
    "运维管理",
    "监控告警",
  ],
  availableDimensions: [
    "功能描述",
    "技术实现",
    "用户场景",
    "设计决策",
    "工程经验",
    "测试分析",
    "需求分析",
    "竞品参考",
  ],
  fileTree: [
    {
      name: "Gemini平台知识库",
      type: "folder",
      children: [
        {
          name: "平台功能全景.md",
          type: "file",
          content:
            "# Gemini平台功能全景\n\n## 推理服务\n- 创建推理服务\n- 自动扩缩容\n- 副本管理\n\n## 训练服务\n- 提交训练任务\n- 分布式训练\n\n## GPU管理\n- GPU调度策略\n- 拼卡管理\n\n## 用户与空间\n- 配额管理",
        },
        {
          name: "推理服务",
          type: "folder",
          children: [
            {
              name: "副本状态机.md",
              type: "file",
              content:
                "# 副本状态机\n\n## 状态流转\nPending → Scheduling → Running → Terminating\n\n## 异常状态\nFailed / OOMKilled / CrashLoopBackOff\n\n## 状态机实现\n基于Kubernetes Pod Phase + Container State组合判断...",
            },
            {
              name: "路由管理.md",
              type: "file",
              content:
                "# 路由管理\n\n## 概述\n推理服务路由管理基于Istio VirtualService实现\n\n## 路由策略\n- 权重路由\n- Header路由\n- 灰度发布",
            },
          ],
        },
        {
          name: "故障排查",
          type: "folder",
          children: [
            {
              name: "推理服务OOM.md",
              type: "file",
              content:
                "# 推理服务OOM排查\n\n## 常见原因\n1. 模型参数量超出GPU显存\n2. batch_size设置过大\n3. 内存泄漏\n\n## 排查步骤\n1. 检查nvidia-smi输出\n2. 查看Pod事件...",
            },
          ],
        },
        {
          name: "GPU调度策略.md",
          type: "file",
          content:
            "# GPU调度策略\n\n## 调度算法\n- Binpack（紧凑调度）\n- Spread（分散调度）\n\n## Orion vGPU\n虚拟化GPU资源切分...",
        },
        {
          name: "配额链路梳理.md",
          type: "file",
          content:
            "# 配额链路梳理\n\n## 配额层级\n平台 → 空间 → 用户\n\n## 配额类型\nGPU / CPU / Memory / Storage\n\n## 配额检查链路\n创建服务时的配额预检...",
        },
        {
          name: "竞品分析-SageMaker.md",
          type: "file",
          content:
            "# 竞品分析：AWS SageMaker\n\n## 推理服务对比\nSageMaker Endpoint vs Gemini推理服务...\n\n## 训练能力对比\nSageMaker Training Job vs Gemini训练任务...\n\n## 模型管理对比\nModel Registry对比...\n\n## 定价策略\nOn-Demand vs Spot Instance...",
        },
        {
          name: "运维手册.md",
          type: "file",
          content:
            "# 运维手册\n\n## GPU节点维护\n节点排水、GPU健康检查...\n\n## 服务巡检\n推理服务健康巡检脚本...\n\n## 应急预案\n集群故障应急处理流程...",
        },
      ],
    },
  ],
  mappingRows: [
    // 平台功能全景.md → splits into 8 items
    {
      id: "1",
      fileName: "平台功能全景.md",
      splitResult: "创建推理服务",
      recommendedModule: "推理服务",
      recommendedDimension: "功能描述",
      confidence: 95,
      selected: true,
      conflict: true,
      conflictMessage: "已存在同名功能项",
    },
    {
      id: "2",
      fileName: "平台功能全景.md",
      splitResult: "自动扩缩容",
      recommendedModule: "推理服务",
      recommendedDimension: "功能描述",
      confidence: 93,
      selected: true,
      conflict: false,
    },
    {
      id: "3",
      fileName: "平台功能全景.md",
      splitResult: "副本管理",
      recommendedModule: "推理服务",
      recommendedDimension: "功能描述",
      confidence: 92,
      selected: true,
      conflict: false,
    },
    {
      id: "4",
      fileName: "平台功能全景.md",
      splitResult: "提交训练任务",
      recommendedModule: "训练服务",
      recommendedDimension: "功能描述",
      confidence: 91,
      selected: true,
      conflict: false,
    },
    {
      id: "5",
      fileName: "平台功能全景.md",
      splitResult: "分布式训练",
      recommendedModule: "训练服务",
      recommendedDimension: "功能描述",
      confidence: 90,
      selected: true,
      conflict: false,
    },
    {
      id: "6",
      fileName: "平台功能全景.md",
      splitResult: "GPU调度策略",
      recommendedModule: "GPU管理",
      recommendedDimension: "功能描述",
      confidence: 92,
      selected: true,
      conflict: true,
      conflictMessage: "已存在同名功能项",
    },
    {
      id: "7",
      fileName: "平台功能全景.md",
      splitResult: "拼卡管理",
      recommendedModule: "GPU管理",
      recommendedDimension: "功能描述",
      confidence: 91,
      selected: true,
      conflict: false,
    },
    {
      id: "8",
      fileName: "平台功能全景.md",
      splitResult: "配额管理",
      recommendedModule: "用户与空间",
      recommendedDimension: "功能描述",
      confidence: 90,
      selected: true,
      conflict: false,
    },
    // 副本状态机.md
    {
      id: "9",
      fileName: "推理服务/副本状态机.md",
      splitResult: "副本管理 - 状态机实现",
      recommendedModule: "推理服务",
      recommendedDimension: "技术实现",
      confidence: 95,
      selected: true,
      conflict: false,
    },
    // 路由管理.md
    {
      id: "10",
      fileName: "推理服务/路由管理.md",
      splitResult: "路由管理",
      recommendedModule: "推理服务",
      recommendedDimension: "功能描述",
      confidence: 92,
      selected: true,
      conflict: false,
    },
    // 推理服务OOM.md
    {
      id: "11",
      fileName: "故障排查/推理服务OOM.md",
      splitResult: "创建推理服务 - OOM排查",
      recommendedModule: "推理服务",
      recommendedDimension: "工程经验",
      confidence: 88,
      selected: true,
      conflict: false,
    },
    // GPU调度策略.md
    {
      id: "12",
      fileName: "GPU调度策略.md",
      splitResult: "GPU调度策略 - 调度算法",
      recommendedModule: "GPU管理",
      recommendedDimension: "技术实现",
      confidence: 85,
      selected: true,
      conflict: false,
    },
    // 配额链路梳理.md
    {
      id: "13",
      fileName: "配额链路梳理.md",
      splitResult: "配额管理 - 链路梳理",
      recommendedModule: "用户与空间",
      recommendedDimension: "技术实现",
      confidence: 82,
      selected: true,
      conflict: false,
    },
    // 竞品分析-SageMaker.md → splits into 4
    {
      id: "14",
      fileName: "竞品分析-SageMaker.md",
      splitResult: "推理服务 - SageMaker对比",
      recommendedModule: "推理服务",
      recommendedDimension: "竞品参考",
      confidence: 78,
      selected: true,
      conflict: false,
    },
    {
      id: "15",
      fileName: "竞品分析-SageMaker.md",
      splitResult: "训练服务 - SageMaker对比",
      recommendedModule: "训练服务",
      recommendedDimension: "竞品参考",
      confidence: 75,
      selected: true,
      conflict: false,
    },
    {
      id: "16",
      fileName: "竞品分析-SageMaker.md",
      splitResult: "模型仓库 - SageMaker对比",
      recommendedModule: "模型仓库",
      recommendedDimension: "竞品参考",
      confidence: 72,
      selected: false,
      conflict: false,
    },
    {
      id: "17",
      fileName: "竞品分析-SageMaker.md",
      splitResult: "定价策略分析",
      recommendedModule: "运维管理",
      recommendedDimension: "竞品参考",
      confidence: 65,
      selected: false,
      conflict: false,
    },
    // 运维手册.md → splits into 3
    {
      id: "18",
      fileName: "运维手册.md",
      splitResult: "GPU节点维护",
      recommendedModule: "GPU管理",
      recommendedDimension: "工程经验",
      confidence: 68,
      selected: true,
      conflict: false,
    },
    {
      id: "19",
      fileName: "运维手册.md",
      splitResult: "推理服务巡检",
      recommendedModule: "推理服务",
      recommendedDimension: "工程经验",
      confidence: 65,
      selected: true,
      conflict: false,
    },
    {
      id: "20",
      fileName: "运维手册.md",
      splitResult: "集群应急预案",
      recommendedModule: "运维管理",
      recommendedDimension: "工程经验",
      confidence: 62,
      selected: false,
      conflict: false,
    },
  ],
}
