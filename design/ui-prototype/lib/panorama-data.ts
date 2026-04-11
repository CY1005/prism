export interface PanoramaFeature {
  id: string
  name: string
  completion: number
  itemCount: number
}

export interface PanoramaModule {
  id: string
  name: string
  completion: number
  featureCount: number
  features: PanoramaFeature[]
}

export const panoramaModules: PanoramaModule[] = [
  {
    id: "m1",
    name: "推理服务",
    completion: 85,
    featureCount: 5,
    features: [
      { id: "f1-1", name: "创建推理服务", completion: 92, itemCount: 18 },
      { id: "f1-2", name: "自动扩缩容", completion: 78, itemCount: 12 },
      { id: "f1-3", name: "路由管理", completion: 88, itemCount: 9 },
      { id: "f1-4", name: "模型版本管理", completion: 85, itemCount: 14 },
      { id: "f1-5", name: "推理监控", completion: 82, itemCount: 11 },
    ],
  },
  {
    id: "m2",
    name: "训练服务",
    completion: 60,
    featureCount: 3,
    features: [
      { id: "f2-1", name: "训练任务管理", completion: 72, itemCount: 15 },
      { id: "f2-2", name: "分布式训练", completion: 55, itemCount: 20 },
      { id: "f2-3", name: "超参调优", completion: 53, itemCount: 8 },
    ],
  },
  {
    id: "m3",
    name: "运维管理",
    completion: 35,
    featureCount: 7,
    features: [
      { id: "f3-1", name: "配额管理", completion: 42, itemCount: 10 },
      { id: "f3-2", name: "监控告警", completion: 38, itemCount: 16 },
      { id: "f3-3", name: "日志管理", completion: 30, itemCount: 12 },
      { id: "f3-4", name: "审计日志", completion: 25, itemCount: 7 },
      { id: "f3-5", name: "备份恢复", completion: 28, itemCount: 9 },
      { id: "f3-6", name: "升级管理", completion: 40, itemCount: 6 },
      { id: "f3-7", name: "故障诊断", completion: 35, itemCount: 11 },
    ],
  },
  {
    id: "m4",
    name: "用户与空间",
    completion: 75,
    featureCount: 4,
    features: [
      { id: "f4-1", name: "用户管理", completion: 90, itemCount: 13 },
      { id: "f4-2", name: "空间管理", completion: 78, itemCount: 10 },
      { id: "f4-3", name: "角色权限", completion: 68, itemCount: 14 },
      { id: "f4-4", name: "组织架构", completion: 64, itemCount: 8 },
    ],
  },
  {
    id: "m5",
    name: "数据与资产",
    completion: 70,
    featureCount: 3,
    features: [
      { id: "f5-1", name: "数据集管理", completion: 82, itemCount: 11 },
      { id: "f5-2", name: "模型仓库", completion: 65, itemCount: 16 },
      { id: "f5-3", name: "镜像管理", completion: 63, itemCount: 9 },
    ],
  },
  {
    id: "m6",
    name: "GPU管理",
    completion: 55,
    featureCount: 4,
    features: [
      { id: "f6-1", name: "GPU调度策略", completion: 62, itemCount: 14 },
      { id: "f6-2", name: "GPU监控", completion: 58, itemCount: 10 },
      { id: "f6-3", name: "虚拟化管理", completion: 48, itemCount: 12 },
      { id: "f6-4", name: "资源池管理", completion: 52, itemCount: 8 },
    ],
  },
  {
    id: "m7",
    name: "集群管理",
    completion: 45,
    featureCount: 3,
    features: [
      { id: "f7-1", name: "集群部署", completion: 55, itemCount: 13 },
      { id: "f7-2", name: "集群调度", completion: 42, itemCount: 11 },
      { id: "f7-3", name: "节点管理", completion: 38, itemCount: 9 },
    ],
  },
]

export const panoramaStats = {
  totalModules: "7",
  totalFeatures: "29",
  avgCompletion: "61%",
  lastUpdate: "2026-04-11 14:30",
}
