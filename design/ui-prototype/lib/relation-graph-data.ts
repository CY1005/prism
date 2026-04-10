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

export type RelationType = "depends_on" | "related_to" | "conflicts_with"

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
