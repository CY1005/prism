export interface SnapshotVersion {
  version: string
  type: "新增" | "修改"
  summary: string
  date: string
}

export interface DimensionSnapshot {
  dimension: string
  content: string
  checked: boolean
}

export interface SnapshotData {
  featureName: string
  moduleName: string
  versionCount: number
  summary: string
  versions: SnapshotVersion[]
  dimensions: DimensionSnapshot[]
}

export const snapshotData: SnapshotData = {
  featureName: "创建推理服务",
  moduleName: "推理服务",
  versionCount: 5,
  summary:
    "创建推理服务是平台核心功能，支持多框架模型一键部署为RESTful API端点，经历5个版本从单副本演进到支持滚动更新和自动扩缩容",
  versions: [
    {
      version: "v1.0",
      type: "新增",
      summary: "基础创建流程：选择模型、配置资源、单副本部署",
      date: "2024-03-15",
    },
    {
      version: "v1.6",
      type: "修改",
      summary: "新增GPU类型选择（A100/V100/T4），支持显存规格筛选",
      date: "2024-06-20",
    },
    {
      version: "v2.0",
      type: "修改",
      summary: "支持多副本部署，引入副本数配置和负载均衡策略",
      date: "2024-09-10",
    },
    {
      version: "v3.5",
      type: "修改",
      summary: "支持滚动更新策略，新增maxSurge/maxUnavailable配置",
      date: "2025-01-08",
    },
    {
      version: "v3.9",
      type: "修改",
      summary: "适配Orion vGPU调度，支持GPU资源碎片化利用",
      date: "2025-03-22",
    },
  ],
  dimensions: [
    {
      dimension: "功能描述",
      content:
        "创建推理服务允许用户将已注册的模型部署为在线推理端点。用户通过表单选择模型来源（模型仓库/自定义镜像）、GPU类型（A100-80G/V100-32G/T4-16G）、副本数量（1-10）及部署策略（滚动更新/重建）。系统自动生成Kubernetes Deployment和Service，暴露RESTful API端点。支持Orion vGPU虚拟化，可将单张物理GPU切分为多个虚拟GPU供不同服务共享。创建完成后自动进入健康检查流程，通过后服务状态变为Running。",
      checked: true,
    },
    {
      dimension: "技术实现",
      content:
        "底层基于Kubernetes Operator模式实现，自定义CRD InferenceService 封装Deployment+Service+Ingress。GPU调度通过Extended Resource机制实现，Orion vGPU场景下使用Device Plugin进行虚拟GPU分配。滚动更新基于Kubernetes原生Rolling Update策略，通过maxSurge和maxUnavailable参数控制更新节奏。服务发现通过Istio VirtualService实现，支持按权重的流量分配。健康检查使用gRPC Health Checking Protocol，超时30s，重试3次。",
      checked: true,
    },
    {
      dimension: "用户场景",
      content:
        "场景1：算法工程师完成模型训练后，需要快速验证模型效果，选择最小资源配置（1副本/T4）创建推理服务进行测试。场景2：业务上线前，运维工程师配置多副本（3-5副本）+ 滚动更新策略，确保服务高可用和零停机更新。场景3：GPU资源紧张时，管理员启用Orion vGPU，将A100切分为多个虚拟GPU，支持多个小模型共享物理卡。",
      checked: false,
    },
    {
      dimension: "设计决策",
      content:
        "决策1：选择Kubernetes Operator而非直接调用K8s API，原因是Operator支持声明式管理和自动故障恢复。决策2：v2.0引入多副本时曾考虑使用StatefulSet，最终选择Deployment+PVC，因为推理服务无状态，Deployment更适合快速扩缩。决策3：v3.9适配Orion vGPU采用Device Plugin而非修改调度器，降低对集群的侵入性。",
      checked: true,
    },
    {
      dimension: "工程经验",
      content:
        "踩坑1：v1.6上线GPU类型选择后，发现用户选择的GPU型号可能不在当前集群中存在，导致Pod长时间Pending。解决方案：创建前增加集群GPU资源预检查。踩坑2：滚动更新时如果新版本健康检查失败，会卡在中间状态。解决方案：增加更新超时机制（默认10分钟），超时自动回滚。踩坑3：Orion vGPU在某些CUDA版本下存在兼容性问题，需要维护兼容矩阵表。",
      checked: false,
    },
    {
      dimension: "测试分析",
      content:
        "核心测试点：1）各GPU类型的资源分配正确性验证；2）多副本场景下负载均衡的均匀性测试；3）滚动更新过程中的请求无损验证（零停机）；4）Orion vGPU切分后的显存隔离性测试；5）异常场景：GPU资源不足/镜像拉取失败/健康检查超时的错误处理。建议补充：混沌测试覆盖Pod被Kill后的自动恢复场景。",
      checked: true,
    },
  ],
}
