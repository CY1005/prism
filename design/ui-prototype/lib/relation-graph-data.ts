export type RelationType = "depends_on" | "related_to" | "conflicts_with"

// Module-level nodes (7 modules)
export const moduleNodes = [
  { id: "m1", name: "推理服务", x: 20, y: 25, completion: 85, featureCount: 5 },
  { id: "m2", name: "训练服务", x: 50, y: 15, completion: 60, featureCount: 3 },
  { id: "m3", name: "数据管理", x: 78, y: 25, completion: 55, featureCount: 4 },
  { id: "m4", name: "模型管理", x: 35, y: 50, completion: 70, featureCount: 4 },
  { id: "m5", name: "资源管理", x: 65, y: 50, completion: 45, featureCount: 6 },
  { id: "m6", name: "运维管理", x: 20, y: 75, completion: 35, featureCount: 7 },
  { id: "m7", name: "用户权限", x: 65, y: 78, completion: 50, featureCount: 3 },
]

// Module-level edges
export const moduleEdges: { from: string; to: string; type: RelationType; label?: string }[] = [
  { from: "m1", to: "m4", type: "depends_on", label: "推理依赖模型" },
  { from: "m1", to: "m5", type: "depends_on", label: "推理需要资源" },
  { from: "m2", to: "m3", type: "depends_on", label: "训练依赖数据" },
  { from: "m2", to: "m5", type: "depends_on", label: "训练需要资源" },
  { from: "m2", to: "m4", type: "depends_on", label: "训练产出模型" },
  { from: "m4", to: "m3", type: "related_to", label: "模型关联数据" },
  { from: "m5", to: "m6", type: "related_to", label: "资源需要运维" },
  { from: "m6", to: "m5", type: "depends_on", label: "运维管理资源" },
  { from: "m7", to: "m5", type: "related_to", label: "权限控制资源" },
  { from: "m7", to: "m3", type: "related_to", label: "权限控制数据" },
  { from: "m1", to: "m2", type: "conflicts_with", label: "GPU资源竞争" },
  { from: "m5", to: "m7", type: "conflicts_with", label: "配额与权限冲突" },
]

// Feature-level nodes per module
export const moduleFeatures: Record<string, { id: string; name: string; completion: number }[]> = {
  m1: [
    { id: "f1-1", name: "创建推理服务", completion: 62 },
    { id: "f1-2", name: "自动扩缩容", completion: 90 },
    { id: "f1-3", name: "拼卡管理", completion: 45 },
    { id: "f1-4", name: "副本管理", completion: 70 },
    { id: "f1-5", name: "GPU调度策略", completion: 30 },
  ],
  m2: [
    { id: "f2-1", name: "提交训练任务", completion: 70 },
    { id: "f2-2", name: "训练监控", completion: 55 },
    { id: "f2-3", name: "分布式训练", completion: 55 },
  ],
  m3: [
    { id: "f3-1", name: "数据集管理", completion: 60 },
    { id: "f3-2", name: "数据预处理", completion: 50 },
    { id: "f3-3", name: "数据标注", completion: 40 },
    { id: "f3-4", name: "数据版本控制", completion: 65 },
  ],
  m4: [
    { id: "f4-1", name: "模型注册", completion: 75 },
    { id: "f4-2", name: "模型版本管理", completion: 70 },
    { id: "f4-3", name: "模型评估", completion: 55 },
    { id: "f4-4", name: "模型调度", completion: 45 },
  ],
  m5: [
    { id: "f5-1", name: "GPU管理", completion: 90 },
    { id: "f5-2", name: "存储管理", completion: 40 },
    { id: "f5-3", name: "镜像管理", completion: 55 },
    { id: "f5-4", name: "配额管理", completion: 35 },
    { id: "f5-5", name: "计费统计", completion: 25 },
    { id: "f5-6", name: "网络管理", completion: 30 },
  ],
  m6: [
    { id: "f6-1", name: "资源监控", completion: 45 },
    { id: "f6-2", name: "日志管理", completion: 40 },
    { id: "f6-3", name: "告警配置", completion: 35 },
    { id: "f6-4", name: "节点管理", completion: 30 },
    { id: "f6-5", name: "配额管理", completion: 35 },
    { id: "f6-6", name: "系统维护", completion: 25 },
    { id: "f6-7", name: "备份恢复", completion: 30 },
  ],
  m7: [
    { id: "f7-1", name: "用户管理", completion: 75 },
    { id: "f7-2", name: "角色权限", completion: 50 },
    { id: "f7-3", name: "审计日志", completion: 30 },
  ],
}

// Feature-level cross-module relations
export const featureEdges: { from: string; to: string; type: RelationType; label?: string }[] = [
  { from: "f1-1", to: "f4-4", type: "depends_on", label: "推理依赖模型调度" },
  { from: "f1-1", to: "f5-1", type: "depends_on", label: "创建时分配GPU" },
  { from: "f1-2", to: "f5-4", type: "depends_on", label: "扩容受配额限制" },
  { from: "f1-3", to: "f5-1", type: "depends_on", label: "拼卡依赖GPU管理" },
  { from: "f2-1", to: "f3-1", type: "depends_on", label: "训练依赖数据集" },
  { from: "f2-1", to: "f5-1", type: "depends_on", label: "训练需要GPU" },
  { from: "f2-1", to: "f4-1", type: "depends_on", label: "训练产出注册模型" },
  { from: "f2-2", to: "f6-1", type: "related_to", label: "训练监控复用资源监控" },
  { from: "f4-3", to: "f3-1", type: "related_to", label: "评估需要测试数据" },
  { from: "f5-1", to: "f6-4", type: "related_to", label: "GPU与节点关联" },
  { from: "f5-4", to: "f7-2", type: "conflicts_with", label: "配额与权限策略冲突" },
  { from: "f1-5", to: "f2-1", type: "conflicts_with", label: "GPU调度策略竞争" },
]

// Legacy flat graph nodes (kept for backward compat)
export const graphNodes = [
  { id: "1", name: "创建推理服务", x: 20, y: 30, completion: 85 },
  { id: "2", name: "自动扩缩容", x: 48, y: 15, completion: 70 },
  { id: "3", name: "路由管理", x: 35, y: 55, completion: 60 },
  { id: "4", name: "模型调度", x: 62, y: 38, completion: 45 },
  { id: "5", name: "监控告警", x: 78, y: 20, completion: 50 },
  { id: "6", name: "GPU管理", x: 12, y: 70, completion: 90 },
  { id: "7", name: "配额管理", x: 50, y: 72, completion: 35 },
  { id: "8", name: "用户管理", x: 82, y: 58, completion: 75 },
  { id: "9", name: "存储管理", x: 28, y: 88, completion: 40 },
  { id: "10", name: "镜像管理", x: 58, y: 88, completion: 55 },
  { id: "11", name: "API网关", x: 72, y: 75, completion: 30 },
  { id: "12", name: "计费统计", x: 88, y: 42, completion: 25 },
]

export const graphEdges: { from: string; to: string; type: RelationType }[] = [
  { from: "1", to: "3", type: "depends_on" },
  { from: "1", to: "4", type: "depends_on" },
  { from: "1", to: "6", type: "depends_on" },
  { from: "2", to: "5", type: "depends_on" },
  { from: "2", to: "7", type: "depends_on" },
  { from: "3", to: "11", type: "depends_on" },
  { from: "4", to: "6", type: "depends_on" },
  { from: "5", to: "12", type: "related_to" },
  { from: "6", to: "9", type: "related_to" },
  { from: "10", to: "9", type: "related_to" },
  { from: "7", to: "12", type: "related_to" },
  { from: "8", to: "7", type: "related_to" },
  { from: "11", to: "4", type: "related_to" },
  { from: "2", to: "3", type: "conflicts_with" },
  { from: "6", to: "7", type: "conflicts_with" },
]

export const relationTypeConfig = {
  depends_on: { label: "依赖", color: "text-blue-500", stroke: "stroke-blue-400", dotClass: "bg-blue-500" },
  related_to: { label: "相关", color: "text-muted-foreground", stroke: "stroke-muted-foreground", dotClass: "bg-muted-foreground" },
  conflicts_with: { label: "冲突", color: "text-red-500", stroke: "stroke-red-400", dotClass: "bg-red-500" },
}
