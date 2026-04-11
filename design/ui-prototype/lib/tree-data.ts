import type { TreeNode } from "@/components/feature-tree"

export const treeData: TreeNode[] = [
  {
    id: "ops-management",
    name: "平台运维管控",
    type: "folder",
    completionPercent: 65,
    children: [
      {
        id: "rp01-resource-overview",
        name: "RP-01 资源总览与监控",
        type: "folder",
        completionPercent: 80,
      },
      {
        id: "rp02-cluster-management",
        name: "RP-02 集群管理",
        type: "folder",
        completionPercent: 60,
      },
      {
        id: "rp03-node-management",
        name: "RP-03 节点管理",
        type: "folder",
        completionPercent: 55,
      },
      {
        id: "gpu-management",
        name: "RP-04 GPU管理",
        type: "folder",
        completionPercent: 70,
        children: [
          {
            id: "gpu-list-monitor",
            name: "GPU列表与监控",
            type: "file",
            completionPercent: 70,
          },
          {
            id: "vgpu-management",
            name: "虚拟GPU管理",
            type: "file",
            completionPercent: 55,
          },
          {
            id: "domestic-chip-adapt",
            name: "国产芯片适配",
            type: "file",
            completionPercent: 40,
          },
        ],
      },
      {
        id: "rp05-storage-management",
        name: "RP-05 存储管理",
        type: "folder",
        completionPercent: 60,
      },
      {
        id: "rp06-resource-group",
        name: "RP-06 资源组管理",
        type: "folder",
        completionPercent: 50,
      },
      {
        id: "rp07-system-service-log",
        name: "RP-07 系统服务与日志事件",
        type: "folder",
        completionPercent: 45,
      },
      {
        id: "rp08-business-management",
        name: "RP-08 业务管理",
        type: "folder",
        completionPercent: 55,
      },
      {
        id: "rp09-data-management-ops",
        name: "RP-09 数据管理-运维侧",
        type: "folder",
        completionPercent: 50,
      },
      {
        id: "rp10-image-model-management",
        name: "RP-10 镜像与模型管理",
        type: "folder",
        completionPercent: 60,
      },
      {
        id: "rp11-user-permission-space",
        name: "RP-11 用户权限与空间管理",
        type: "folder",
        completionPercent: 60,
      },
      {
        id: "rp12-stats-system-management",
        name: "RP-12 统计报表与系统管理",
        type: "folder",
        completionPercent: 35,
      },
    ],
  },
  {
    id: "algorithm-training",
    name: "算法研发与训练",
    type: "folder",
    completionPercent: 58,
    children: [
      {
        id: "rp13-workspace-project",
        name: "RP-13 空间工作台与项目管理",
        type: "folder",
        completionPercent: 60,
      },
      {
        id: "rp14-project-code-data",
        name: "RP-14 项目代码与数据管理",
        type: "folder",
        completionPercent: 55,
      },
      {
        id: "rp15-task-submit-general",
        name: "RP-15 任务提交-通用能力",
        type: "folder",
        completionPercent: 50,
      },
      {
        id: "rp16-dev-environment",
        name: "RP-16 开发环境",
        type: "folder",
        completionPercent: 65,
      },
      {
        id: "rp17-offline-training",
        name: "RP-17 离线训练",
        type: "folder",
        completionPercent: 55,
      },
      {
        id: "inference-service",
        name: "RP-18 推理服务",
        type: "folder",
        completionPercent: 75,
        children: [
          {
            id: "create-inference",
            name: "创建推理服务",
            type: "file",
            completionPercent: 62,
          },
          {
            id: "auto-scaling",
            name: "自动扩缩容",
            type: "file",
            completionPercent: 90,
          },
          {
            id: "replica-management",
            name: "副本管理",
            type: "file",
            completionPercent: 70,
          },
          {
            id: "route-management",
            name: "路由管理",
            type: "file",
            completionPercent: 68,
          },
        ],
      },
      {
        id: "rp19-result-model-data",
        name: "RP-19 结果模型与数据管理",
        type: "folder",
        completionPercent: 50,
      },
      {
        id: "rp20-task-management-queue",
        name: "RP-20 任务管理与排队",
        type: "folder",
        completionPercent: 55,
      },
      {
        id: "rp21-space-management-stats",
        name: "RP-21 空间管理与统计",
        type: "folder",
        completionPercent: 45,
      },
      {
        id: "rp22-platform-general",
        name: "RP-22 平台通用功能",
        type: "folder",
        completionPercent: 50,
      },
    ],
  },
  {
    id: "console",
    name: "控制台与运营后台",
    type: "folder",
    completionPercent: 45,
    children: [
      {
        id: "rp23-console",
        name: "RP-23 控制台",
        type: "folder",
        completionPercent: 50,
      },
      {
        id: "rp24-operations-backend",
        name: "RP-24 运营管理后台",
        type: "folder",
        completionPercent: 42,
      },
      {
        id: "rp25-system-management",
        name: "RP-25 系统管理",
        type: "folder",
        completionPercent: 40,
      },
    ],
  },
  {
    id: "engineering",
    name: "工程部署",
    type: "folder",
    completionPercent: 40,
    children: [
      {
        id: "rp26-architecture-network",
        name: "RP-26 架构与网络",
        type: "folder",
        completionPercent: 45,
      },
      {
        id: "rp27-security-system-config",
        name: "RP-27 安全对接与系统配置",
        type: "folder",
        completionPercent: 35,
      },
    ],
  },
]
