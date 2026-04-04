export const analysisResultData = {
  impactAnalysis: {
    title: "影响范围分析",
    affectedModulesCount: 4,
    items: [
      { path: "推理服务 > 创建推理服务", type: "direct" as const },
      { path: "推理服务 > 拼卡管理", type: "direct" as const },
      { path: "运维管理 > 资源监控", type: "indirect" as const },
      { path: "统计报表 > 平台统计", type: "indirect" as const },
    ],
  },
  completenessCheck: {
    title: "完整性检查",
    items: [
      { text: "私有云场景已覆盖", passed: true },
      { text: "GPU类型差异已说明", passed: true },
      { text: "智算中心场景未提及", passed: false },
      { text: "开关状态下行为未定义", passed: false },
      { text: "定时扩缩容联动未说明", passed: false },
    ],
  },
  reasonabilityEval: {
    title: "合理性评价",
    status: "有妥协",
    description: "副本管理逻辑和现有自动扩缩容功能存在部分重叠，建议明确两者边界",
  },
  testPoints: {
    title: "测试点（AI 生成）",
    count: 12,
    items: [
      {
        id: 1,
        description: "拼卡开关开启后创建推理服务，GPU类型选择是否正确",
        priority: "P0" as const,
        relatedFeature: "创建推理服务",
      },
      {
        id: 2,
        description: "运行中修改拼卡配置，验证对已有任务无影响",
        priority: "P0" as const,
        relatedFeature: "拼卡管理",
      },
      {
        id: 3,
        description: "智算中心下相同操作是否一致",
        priority: "P1" as const,
        relatedFeature: "创建推理服务",
      },
      {
        id: 4,
        description: "定时扩缩容触发时拼卡参数是否正确传递",
        priority: "P1" as const,
        relatedFeature: "自动扩缩容",
      },
    ],
  },
}
