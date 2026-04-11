export interface ModuleData {
  id: string
  name: string
  featureCount: number
  completion: number
  dimensions: {
    name: string
    current: number
    total: number
  }[]
  lastUpdate: {
    user: string
    action: string
    time: string
  }
}

export interface ProductLineData {
  id: string
  name: string
  moduleCount: number
  featureCount: number
  avgCompletion: number
  modules: ModuleData[]
}

export const productLinesData: Record<string, ProductLineData> = {
  "ops-management": {
    id: "ops-management",
    name: "平台运维管控",
    moduleCount: 12,
    featureCount: 181,
    avgCompletion: 65,
    modules: [
      {
        id: "rp01-resource-overview",
        name: "资源总览与监控",
        featureCount: 23,
        completion: 80,
        dimensions: [
          { name: "功能描述", current: 20, total: 23 },
          { name: "用户场景", current: 18, total: 23 },
          { name: "平台技术", current: 15, total: 23 },
          { name: "设计决策", current: 14, total: 23 },
          { name: "工程经验", current: 16, total: 23 },
          { name: "测试分析", current: 12, total: 23 },
          { name: "需求分析", current: 10, total: 23 },
          { name: "竞品参考", current: 8, total: 23 },
        ],
        lastUpdate: {
          user: "陈玥",
          action: "更新了 资源仪表盘",
          time: "1小时前",
        },
      },
      {
        id: "gpu-management",
        name: "GPU管理",
        featureCount: 8,
        completion: 70,
        dimensions: [
          { name: "功能描述", current: 7, total: 8 },
          { name: "用户场景", current: 6, total: 8 },
          { name: "平台技术", current: 5, total: 8 },
          { name: "设计决策", current: 4, total: 8 },
          { name: "工程经验", current: 5, total: 8 },
          { name: "测试分析", current: 3, total: 8 },
          { name: "需求分析", current: 3, total: 8 },
          { name: "竞品参考", current: 4, total: 8 },
        ],
        lastUpdate: {
          user: "王工",
          action: "更新了 虚拟GPU管理",
          time: "3小时前",
        },
      },
      {
        id: "rp11-user-permission-space",
        name: "用户权限与空间管理",
        featureCount: 20,
        completion: 60,
        dimensions: [
          { name: "功能描述", current: 16, total: 20 },
          { name: "用户场景", current: 12, total: 20 },
          { name: "平台技术", current: 10, total: 20 },
          { name: "设计决策", current: 9, total: 20 },
          { name: "工程经验", current: 11, total: 20 },
          { name: "测试分析", current: 6, total: 20 },
          { name: "需求分析", current: 5, total: 20 },
          { name: "竞品参考", current: 7, total: 20 },
        ],
        lastUpdate: {
          user: "李工",
          action: "更新了 RBAC权限模型",
          time: "昨天",
        },
      },
      {
        id: "rp12-stats-system-management",
        name: "统计报表与系统管理",
        featureCount: 39,
        completion: 35,
        dimensions: [
          { name: "功能描述", current: 20, total: 39 },
          { name: "用户场景", current: 12, total: 39 },
          { name: "平台技术", current: 8, total: 39 },
          { name: "设计决策", current: 7, total: 39 },
          { name: "工程经验", current: 10, total: 39 },
          { name: "测试分析", current: 4, total: 39 },
          { name: "需求分析", current: 3, total: 39 },
          { name: "竞品参考", current: 5, total: 39 },
        ],
        lastUpdate: {
          user: "张工",
          action: "更新了 资源使用报表",
          time: "3天前",
        },
      },
      {
        id: "rp08-business-management",
        name: "业务管理",
        featureCount: 23,
        completion: 55,
        dimensions: [
          { name: "功能描述", current: 18, total: 23 },
          { name: "用户场景", current: 14, total: 23 },
          { name: "平台技术", current: 10, total: 23 },
          { name: "设计决策", current: 9, total: 23 },
          { name: "工程经验", current: 12, total: 23 },
          { name: "测试分析", current: 5, total: 23 },
          { name: "需求分析", current: 4, total: 23 },
          { name: "竞品参考", current: 6, total: 23 },
        ],
        lastUpdate: {
          user: "陈玥",
          action: "更新了 业务空间配额",
          time: "2天前",
        },
      },
    ],
  },
  "algorithm-training": {
    id: "algorithm-training",
    name: "算法研发与训练",
    moduleCount: 10,
    featureCount: 158,
    avgCompletion: 58,
    modules: [
      {
        id: "inference-service",
        name: "推理服务",
        featureCount: 9,
        completion: 75,
        dimensions: [
          { name: "功能描述", current: 9, total: 9 },
          { name: "用户场景", current: 7, total: 9 },
          { name: "平台技术", current: 6, total: 9 },
          { name: "设计决策", current: 5, total: 9 },
          { name: "工程经验", current: 6, total: 9 },
          { name: "测试分析", current: 4, total: 9 },
          { name: "需求分析", current: 3, total: 9 },
          { name: "竞品参考", current: 5, total: 9 },
        ],
        lastUpdate: {
          user: "陈玥",
          action: "更新了 创建推理服务",
          time: "2小时前",
        },
      },
      {
        id: "rp15-task-submit-general",
        name: "任务提交-通用能力",
        featureCount: 28,
        completion: 50,
        dimensions: [
          { name: "功能描述", current: 22, total: 28 },
          { name: "用户场景", current: 16, total: 28 },
          { name: "平台技术", current: 12, total: 28 },
          { name: "设计决策", current: 10, total: 28 },
          { name: "工程经验", current: 14, total: 28 },
          { name: "测试分析", current: 6, total: 28 },
          { name: "需求分析", current: 5, total: 28 },
          { name: "竞品参考", current: 7, total: 28 },
        ],
        lastUpdate: {
          user: "王工",
          action: "更新了 资源申请策略",
          time: "昨天",
        },
      },
      {
        id: "rp16-dev-environment",
        name: "开发环境",
        featureCount: 15,
        completion: 65,
        dimensions: [
          { name: "功能描述", current: 13, total: 15 },
          { name: "用户场景", current: 10, total: 15 },
          { name: "平台技术", current: 8, total: 15 },
          { name: "设计决策", current: 7, total: 15 },
          { name: "工程经验", current: 9, total: 15 },
          { name: "测试分析", current: 5, total: 15 },
          { name: "需求分析", current: 4, total: 15 },
          { name: "竞品参考", current: 6, total: 15 },
        ],
        lastUpdate: {
          user: "李工",
          action: "更新了 Notebook环境",
          time: "2天前",
        },
      },
      {
        id: "rp20-task-management-queue",
        name: "任务管理与排队",
        featureCount: 20,
        completion: 55,
        dimensions: [
          { name: "功能描述", current: 16, total: 20 },
          { name: "用户场景", current: 12, total: 20 },
          { name: "平台技术", current: 9, total: 20 },
          { name: "设计决策", current: 8, total: 20 },
          { name: "工程经验", current: 10, total: 20 },
          { name: "测试分析", current: 5, total: 20 },
          { name: "需求分析", current: 4, total: 20 },
          { name: "竞品参考", current: 6, total: 20 },
        ],
        lastUpdate: {
          user: "张工",
          action: "更新了 队列调度策略",
          time: "3天前",
        },
      },
      {
        id: "rp21-space-management-stats",
        name: "空间管理与统计",
        featureCount: 20,
        completion: 45,
        dimensions: [
          { name: "功能描述", current: 14, total: 20 },
          { name: "用户场景", current: 10, total: 20 },
          { name: "平台技术", current: 7, total: 20 },
          { name: "设计决策", current: 6, total: 20 },
          { name: "工程经验", current: 8, total: 20 },
          { name: "测试分析", current: 3, total: 20 },
          { name: "需求分析", current: 3, total: 20 },
          { name: "竞品参考", current: 4, total: 20 },
        ],
        lastUpdate: {
          user: "陈玥",
          action: "更新了 空间资源统计",
          time: "4天前",
        },
      },
    ],
  },
  "console": {
    id: "console",
    name: "控制台与运营后台",
    moduleCount: 3,
    featureCount: 22,
    avgCompletion: 45,
    modules: [
      {
        id: "rp23-console",
        name: "控制台",
        featureCount: 9,
        completion: 50,
        dimensions: [
          { name: "功能描述", current: 7, total: 9 },
          { name: "用户场景", current: 5, total: 9 },
          { name: "平台技术", current: 3, total: 9 },
          { name: "设计决策", current: 3, total: 9 },
          { name: "工程经验", current: 4, total: 9 },
          { name: "测试分析", current: 2, total: 9 },
          { name: "需求分析", current: 1, total: 9 },
          { name: "竞品参考", current: 2, total: 9 },
        ],
        lastUpdate: {
          user: "王工",
          action: "更新了 租户管理",
          time: "5天前",
        },
      },
      {
        id: "rp24-operations-backend",
        name: "运营管理后台",
        featureCount: 13,
        completion: 42,
        dimensions: [
          { name: "功能描述", current: 9, total: 13 },
          { name: "用户场景", current: 6, total: 13 },
          { name: "平台技术", current: 4, total: 13 },
          { name: "设计决策", current: 3, total: 13 },
          { name: "工程经验", current: 5, total: 13 },
          { name: "测试分析", current: 2, total: 13 },
          { name: "需求分析", current: 1, total: 13 },
          { name: "竞品参考", current: 2, total: 13 },
        ],
        lastUpdate: {
          user: "李工",
          action: "更新了 计费管理",
          time: "1周前",
        },
      },
      {
        id: "rp25-system-management",
        name: "系统管理",
        featureCount: 0,
        completion: 40,
        dimensions: [
          { name: "功能描述", current: 0, total: 0 },
          { name: "用户场景", current: 0, total: 0 },
          { name: "平台技术", current: 0, total: 0 },
          { name: "设计决策", current: 0, total: 0 },
          { name: "工程经验", current: 0, total: 0 },
          { name: "测试分析", current: 0, total: 0 },
          { name: "需求分析", current: 0, total: 0 },
          { name: "竞品参考", current: 0, total: 0 },
        ],
        lastUpdate: {
          user: "张工",
          action: "已合并至RP-24",
          time: "2周前",
        },
      },
    ],
  },
  "engineering": {
    id: "engineering",
    name: "工程部署",
    moduleCount: 2,
    featureCount: 15,
    avgCompletion: 40,
    modules: [
      {
        id: "rp26-architecture-network",
        name: "架构与网络",
        featureCount: 8,
        completion: 45,
        dimensions: [
          { name: "功能描述", current: 6, total: 8 },
          { name: "用户场景", current: 4, total: 8 },
          { name: "平台技术", current: 3, total: 8 },
          { name: "设计决策", current: 2, total: 8 },
          { name: "工程经验", current: 3, total: 8 },
          { name: "测试分析", current: 1, total: 8 },
          { name: "需求分析", current: 1, total: 8 },
          { name: "竞品参考", current: 2, total: 8 },
        ],
        lastUpdate: {
          user: "陈玥",
          action: "更新了 网络拓扑",
          time: "1周前",
        },
      },
      {
        id: "rp27-security-system-config",
        name: "安全对接与系统配置",
        featureCount: 7,
        completion: 35,
        dimensions: [
          { name: "功能描述", current: 4, total: 7 },
          { name: "用户场景", current: 3, total: 7 },
          { name: "平台技术", current: 2, total: 7 },
          { name: "设计决策", current: 1, total: 7 },
          { name: "工程经验", current: 2, total: 7 },
          { name: "测试分析", current: 1, total: 7 },
          { name: "需求分析", current: 0, total: 7 },
          { name: "竞品参考", current: 1, total: 7 },
        ],
        lastUpdate: {
          user: "王工",
          action: "更新了 LDAP对接",
          time: "2周前",
        },
      },
    ],
  },
}
