export interface ActivityRecord {
  id: string
  user: string
  userInitial: string
  action: string
  actionType: "create" | "edit" | "delete" | "import"
  target: string
  targetLink: string
  path: string
  time: string
}

export const actionTypeConfig = {
  create: { label: "创建", color: "text-green-600" },
  edit: { label: "编辑", color: "text-blue-600" },
  delete: { label: "删除", color: "text-red-600" },
  import: { label: "导入", color: "text-purple-600" },
}

export interface ActivityGroup {
  label: string
  records: ActivityRecord[]
}

export const activityGroups: ActivityGroup[] = [
  {
    label: "今天",
    records: [
      { id: "1", user: "陈玥", userInitial: "陈", action: "编辑了", actionType: "edit", target: "\"创建推理服务\" 的功能描述", targetLink: "/", path: "推理服务 > 创建推理服务", time: "14:32" },
      { id: "2", user: "陈玥", userInitial: "陈", action: "添加了", actionType: "create", target: "\"路由管理\" 的竞品参考", targetLink: "/", path: "推理服务 > 路由管理", time: "13:15" },
      { id: "3", user: "王工", userInitial: "王", action: "编辑了", actionType: "edit", target: "\"自动扩缩容\" 的技术实现", targetLink: "/", path: "推理服务 > 自动扩缩容", time: "11:28" },
      { id: "4", user: "陈玥", userInitial: "陈", action: "创建了功能项", actionType: "create", target: "\"拼卡管理\"", targetLink: "/", path: "GPU管理 > 拼卡管理", time: "10:05" },
    ],
  },
  {
    label: "昨天",
    records: [
      { id: "5", user: "李工", userInitial: "李", action: "添加了", actionType: "create", target: "\"GPU管理\" 的工程经验", targetLink: "/", path: "基础设施 > GPU管理", time: "16:45" },
      { id: "6", user: "陈玥", userInitial: "陈", action: "导入了", actionType: "import", target: "12 个功能项", targetLink: "/", path: "批量操作", time: "15:00" },
      { id: "7", user: "王工", userInitial: "王", action: "删除了", actionType: "delete", target: "\"临时测试模块\"", targetLink: "/", path: "基础设施", time: "09:30" },
    ],
  },
  {
    label: "2026-04-08",
    records: [
      { id: "8", user: "陈玥", userInitial: "陈", action: "添加了", actionType: "create", target: "\"监控告警\" 的设计决策", targetLink: "/", path: "运维支撑 > 监控告警", time: "17:20" },
      { id: "9", user: "陈玥", userInitial: "陈", action: "创建了项目", actionType: "create", target: "\"AI云平台竞品分析\"", targetLink: "/projects/1", path: "项目创建", time: "09:00" },
    ],
  },
]
