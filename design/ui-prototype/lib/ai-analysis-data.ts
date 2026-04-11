// F13 AI需求分析 - 渐进式披露 mock data

export interface AnalysisFinding {
  id: string
  dimension: string
  content: string
  severity: "critical" | "warning" | "info"
  source: "基于当前功能项" | "基于关联模块" | "基于全局扫描"
}

export interface KnownIssue {
  id: string
  type: string
  title: string
  description: string
  source: "基于当前功能项" | "基于关联模块" | "基于全局扫描"
}

export interface AffectedModule {
  name: string
  relation: "direct" | "depends_on" | "related_to" | "indirect"
  level: 1 | 2 | 3
  highlighted: boolean
}

export interface TestPoint {
  id: string
  description: string
  priority: "P0" | "P1" | "P2"
  source: string
  checked: boolean
}

export const aiAnalysisStrings = {
  pageTitle: "AI 需求分析",
  inputPlaceholder: "粘贴需求文本，或上传 Markdown / Word 文档...\n\n例如：推理服务支持滚动更新策略，在不中断服务的情况下，支持模型版本的平滑切换...",
  analyzeButton: "分析",
  analyzingText: "AI 分析中",
  expandL2: "扩展分析范围",
  expandL3: "全局扫描",
  generateTestPoints: "生成测试点",
  batchImport: "一键录入",
  l1Title: "快速分析",
  l2Title: "关联模块分析",
  l3Title: "全局扫描结果",
  impactTitle: "影响范围",
  completenessTitle: "完整性评估",
  reasonabilityTitle: "合理性评估",
  userPerspectiveTitle: "用户视角",
  knownIssuesTitle: "已知问题",
  testPointsTitle: "生成测试点",
  affectedModulesTitle: "受影响模块",
}

// L1 快速分析结果
export const l1Findings: AnalysisFinding[] = [
  {
    id: "l1-1",
    dimension: "功能描述",
    content: "滚动更新需明确最小可用副本数（minAvailable），当前需求未定义更新过程中的最低服务保障",
    severity: "critical",
    source: "基于当前功能项",
  },
  {
    id: "l1-2",
    dimension: "功能描述",
    content: "需定义滚动更新的触发条件：仅模型版本变更，还是包含配置变更",
    severity: "warning",
    source: "基于当前功能项",
  },
  {
    id: "l1-3",
    dimension: "技术实现",
    content: "滚动更新期间的流量切换策略未说明，建议明确是否采用蓝绿部署或金丝雀发布",
    severity: "critical",
    source: "基于当前功能项",
  },
  {
    id: "l1-4",
    dimension: "技术实现",
    content: "GPU 显存预加载策略需考虑，新版本模型加载期间可能导致显存峰值",
    severity: "warning",
    source: "基于当前功能项",
  },
]

export const l1KnownIssues: KnownIssue[] = [
  {
    id: "ki-1",
    type: "技术债",
    title: "GPU资源泄漏",
    description: "当前版本在服务实例销毁时存在 GPU 显存未完全释放的问题（Issue #2847），滚动更新会频繁触发实例创建/销毁，可能加剧此问题",
    source: "基于当前功能项",
  },
  {
    id: "ki-2",
    type: "技术债",
    title: "健康检查超时",
    description: "大模型加载时间可能超过默认健康检查超时（30s），导致滚动更新误判实例不健康",
    source: "基于当前功能项",
  },
]

export const l1Completeness = [
  { text: "更新触发条件已描述", passed: true },
  { text: "更新过程中服务可用性保障", passed: false },
  { text: "回滚机制已定义", passed: false },
  { text: "更新进度可观测", passed: true },
  { text: "异常场景处理未覆盖", passed: false },
]

export const l1Reasonability = [
  { text: "与 Kubernetes 滚动更新机制兼容", passed: true as const },
  { text: "实现复杂度可控，可复用现有部署框架", passed: true as const },
  { text: "GPU 资源调度需特殊处理，与 CPU 服务滚动更新有本质差异", passed: "warning" as const },
]

export const l1UserPerspective = [
  {
    role: "运维人员",
    concerns: ["滚动更新过程中如何监控各实例状态？", "更新失败后自动回滚还是需要手动介入？"],
  },
  {
    role: "平台用户",
    concerns: ["更新期间 API 调用是否会出现短暂不可用？", "更新完成后需要重新建立连接吗？"],
  },
]

// L2 关联模块分析结果
export const l2Findings: AnalysisFinding[] = [
  {
    id: "l2-1",
    dimension: "副本管理",
    content: "滚动更新会临时创建额外副本，需与副本管理的上限校验联动，避免超出配额",
    severity: "critical",
    source: "基于关联模块",
  },
  {
    id: "l2-2",
    dimension: "副本管理",
    content: "副本管理的缩容逻辑需排除正在进行滚动更新的实例，防止更新中被意外缩容",
    severity: "warning",
    source: "基于关联模块",
  },
  {
    id: "l2-3",
    dimension: "自动扩缩容",
    content: "滚动更新期间应冻结自动扩缩容策略，避免扩缩容与滚动更新同时修改副本数导致冲突",
    severity: "critical",
    source: "基于关联模块",
  },
  {
    id: "l2-4",
    dimension: "自动扩缩容",
    content: "更新完成后需重新评估扩缩容基线，因新版本模型的资源消耗可能不同",
    severity: "info",
    source: "基于关联模块",
  },
]

// L3 全局扫描结果
export const l3Findings: AnalysisFinding[] = [
  {
    id: "l3-1",
    dimension: "配额管理",
    content: "滚动更新临时副本需计入配额使用量，否则可能出现配额超卖；更新完成后旧副本释放的配额需及时回收",
    severity: "critical",
    source: "基于全局扫描",
  },
  {
    id: "l3-2",
    dimension: "配额管理",
    content: "建议新增「滚动更新预留配额」配置项，允许管理员为滚动更新预留一定比例的 GPU 资源",
    severity: "info",
    source: "基于全局扫描",
  },
  {
    id: "l3-3",
    dimension: "计费模块",
    content: "滚动更新期间临时副本的计费规则需明确，避免用户被双倍收费",
    severity: "warning",
    source: "基于全局扫描",
  },
]

// 受影响模块图
export const affectedModules: AffectedModule[] = [
  { name: "推理服务", relation: "direct", level: 1, highlighted: true },
  { name: "滚动更新", relation: "direct", level: 1, highlighted: true },
  { name: "副本管理", relation: "depends_on", level: 2, highlighted: false },
  { name: "自动扩缩容", relation: "related_to", level: 2, highlighted: false },
  { name: "配额管理", relation: "indirect", level: 3, highlighted: false },
  { name: "计费模块", relation: "indirect", level: 3, highlighted: false },
  { name: "监控告警", relation: "related_to", level: 2, highlighted: false },
]

// 生成的测试点
export const generatedTestPoints: TestPoint[] = [
  {
    id: "tp-1",
    description: "发起滚动更新后，验证服务在整个更新过程中持续可用（请求成功率 >= 99.9%）",
    priority: "P0",
    source: "功能描述 + 完整性",
    checked: true,
  },
  {
    id: "tp-2",
    description: "滚动更新期间模拟新实例启动失败，验证自动回滚机制是否生效",
    priority: "P0",
    source: "异常场景",
    checked: true,
  },
  {
    id: "tp-3",
    description: "验证滚动更新期间 GPU 显存使用峰值不超过节点上限，无显存泄漏",
    priority: "P0",
    source: "技术债: GPU资源泄漏",
    checked: true,
  },
  {
    id: "tp-4",
    description: "滚动更新过程中触发自动扩缩容，验证扩缩容策略被正确冻结",
    priority: "P1",
    source: "关联模块: 自动扩缩容",
    checked: false,
  },
  {
    id: "tp-5",
    description: "验证滚动更新临时副本正确计入配额，更新完成后旧副本配额及时释放",
    priority: "P1",
    source: "全局扫描: 配额管理",
    checked: false,
  },
  {
    id: "tp-6",
    description: "大模型（加载时间 > 60s）场景下，验证健康检查超时配置是否自适应调整",
    priority: "P1",
    source: "技术债: 健康检查超时",
    checked: false,
  },
]
