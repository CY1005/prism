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
    completion: 75,
    featureCount: 9,
    features: [
      { id: "f1-1", name: "创建推理服务", completion: 62, itemCount: 18 },
      { id: "f1-2", name: "自动扩缩容", completion: 90, itemCount: 12 },
      { id: "f1-3", name: "路由管理", completion: 68, itemCount: 9 },
      { id: "f1-4", name: "副本管理", completion: 70, itemCount: 14 },
      { id: "f1-5", name: "拼卡管理", completion: 45, itemCount: 11 },
    ],
  },
  {
    id: "m2",
    name: "业务管理",
    completion: 55,
    featureCount: 23,
    features: [
      { id: "f2-1", name: "业务空间配额", completion: 62, itemCount: 15 },
      { id: "f2-2", name: "业务申请审批", completion: 55, itemCount: 12 },
      { id: "f2-3", name: "业务资源监控", completion: 48, itemCount: 10 },
    ],
  },
  {
    id: "m3",
    name: "用户权限与空间管理",
    completion: 60,
    featureCount: 20,
    features: [
      { id: "f3-1", name: "RBAC权限模型", completion: 72, itemCount: 14 },
      { id: "f3-2", name: "用户管理", completion: 68, itemCount: 13 },
      { id: "f3-3", name: "空间权限", completion: 55, itemCount: 10 },
      { id: "f3-4", name: "组织架构", completion: 45, itemCount: 8 },
    ],
  },
  {
    id: "m4",
    name: "GPU管理",
    completion: 70,
    featureCount: 8,
    features: [
      { id: "f4-1", name: "GPU列表与监控", completion: 70, itemCount: 12 },
      { id: "f4-2", name: "虚拟GPU管理", completion: 55, itemCount: 10 },
      { id: "f4-3", name: "国产芯片适配", completion: 40, itemCount: 8 },
    ],
  },
  {
    id: "m5",
    name: "任务提交-通用能力",
    completion: 50,
    featureCount: 28,
    features: [
      { id: "f5-1", name: "资源申请策略", completion: 58, itemCount: 16 },
      { id: "f5-2", name: "任务模板管理", completion: 52, itemCount: 14 },
      { id: "f5-3", name: "环境变量配置", completion: 45, itemCount: 10 },
      { id: "f5-4", name: "数据集挂载", completion: 42, itemCount: 12 },
    ],
  },
  {
    id: "m6",
    name: "开发环境",
    completion: 65,
    featureCount: 15,
    features: [
      { id: "f6-1", name: "Notebook环境", completion: 75, itemCount: 14 },
      { id: "f6-2", name: "SSH远程连接", completion: 68, itemCount: 10 },
      { id: "f6-3", name: "代码编辑器", completion: 52, itemCount: 8 },
    ],
  },
  {
    id: "m7",
    name: "统计报表与系统管理",
    completion: 35,
    featureCount: 39,
    features: [
      { id: "f7-1", name: "资源使用报表", completion: 42, itemCount: 16 },
      { id: "f7-2", name: "用户行为统计", completion: 35, itemCount: 12 },
      { id: "f7-3", name: "系统配置管理", completion: 30, itemCount: 14 },
      { id: "f7-4", name: "审计日志", completion: 28, itemCount: 10 },
    ],
  },
  {
    id: "m8",
    name: "资源总览与监控",
    completion: 80,
    featureCount: 23,
    features: [
      { id: "f8-1", name: "资源仪表盘", completion: 88, itemCount: 18 },
      { id: "f8-2", name: "集群健康状态", completion: 82, itemCount: 14 },
      { id: "f8-3", name: "告警规则配置", completion: 72, itemCount: 12 },
    ],
  },
  {
    id: "m9",
    name: "离线训练",
    completion: 55,
    featureCount: 11,
    features: [
      { id: "f9-1", name: "训练任务管理", completion: 65, itemCount: 15 },
      { id: "f9-2", name: "分布式训练", completion: 50, itemCount: 12 },
      { id: "f9-3", name: "超参调优", completion: 48, itemCount: 8 },
    ],
  },
  {
    id: "m10",
    name: "空间管理与统计",
    completion: 45,
    featureCount: 20,
    features: [
      { id: "f10-1", name: "空间资源统计", completion: 52, itemCount: 14 },
      { id: "f10-2", name: "成员管理", completion: 48, itemCount: 10 },
      { id: "f10-3", name: "空间配置", completion: 38, itemCount: 8 },
    ],
  },
]

export const panoramaStats = {
  totalModules: "27",
  totalFeatures: "376",
  avgCompletion: "56%",
  lastUpdate: "2026-04-11 14:30",
}
