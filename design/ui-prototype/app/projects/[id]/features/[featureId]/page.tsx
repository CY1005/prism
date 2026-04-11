"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  PanelLeftClose,
  PanelLeft,
  FileText,
  Users,
  Server,
  GitBranch,
  Lightbulb,
  TestTube,
  ClipboardList,
  Building,
  ChevronRight,
  History,
  Plus,
  Bug,
  Wrench,
  PenTool,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FeatureTree } from "@/components/feature-tree"
import { Card } from "@/components/ui/card"
import { DimensionCard } from "@/components/dimension-card"
import { VersionTimeline } from "@/components/version-timeline"
import { treeData } from "@/lib/tree-data"
import { ToastNotification } from "@/components/toast-notification"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { testAnalysisData } from "@/lib/test-analysis-data"

// Version timeline data
const versionData = [
  {
    version: "v3.9.3",
    label: "当前版本",
    isCurrent: true,
    summary: "新增拼卡能力，支持多卡虚拟化共享",
    details:
      "本版本重点优化了多GPU场景下的资源利用效率，支持将单张物理GPU虚拟化为多个vGPU实例，并实现了跨节点的资源池化调度。",
  },
  {
    version: "v3.7",
    summary: "新增自动扩缩容，支持定时策略",
    details:
      "引入基于HPA的自动扩缩容能力，支持按CPU/GPU利用率、QPS等指标触发扩缩容，同时支持定时扩缩容策略配置。",
  },
  {
    version: "v1.6",
    summary: "首次上线：基础 GPU 类型选择",
    details: "产品首个正式版本，支持NVIDIA GPU的基础调度能力，包括型号选择和数量配置。",
  },
]

export default function FeatureDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const featureId = params.featureId as string
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState(featureId || "create-inference")

  const completedDimensions = 5
  const totalDimensions = 8
  const completionPercent = Math.round((completedDimensions / totalDimensions) * 100)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          sidebarCollapsed ? "w-0 overflow-hidden" : "w-[280px]"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <Link href="/projects" className="font-semibold text-sidebar-foreground hover:text-primary transition-colors">AI云平台竞品分析</Link>
            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">产品分析</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarCollapsed(true)}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2">
            <FeatureTree
              data={treeData}
              selectedId={selectedFeature}
              onSelect={setSelectedFeature}
            />
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSidebarCollapsed(false)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/projects/${projectId}`}>AI云平台竞品分析</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/projects/${projectId}/product-lines/algorithm-training`}>算法研发与训练</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/projects/${projectId}/modules/inference-service`}>推理服务</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>创建推理服务</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {completedDimensions}/{totalDimensions} 维度已填写
            </span>
            <div className="flex items-center gap-2">
              <Progress value={completionPercent} className="h-2 w-24" />
              <span className="text-sm font-medium text-foreground">{completionPercent}%</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl space-y-4 p-6">
            {/* Template Indicator */}
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">产品竞品分析模板</Badge>
              <span className="text-xs text-muted-foreground">8 个维度 · 已填写 5 个</span>
            </div>

            {/* Card 1: 功能描述 */}
            <DimensionCard
              title="功能描述"
              icon={FileText}
              entryCount={1}
              defaultExpanded={true}
              onAdd={() => {}}
            >
              <p className="text-sm leading-relaxed text-foreground">
                {"支持按需选择 CPU、GPU 物理卡、GPU 虚拟卡三类资源配置任务。用户可根据实例规格卡上的资源量提示直接选择，也可由运维管理员在规格管理中自定义配置。"}
              </p>
            </DimensionCard>

            {/* Card 2: 用户使用场景 */}
            <DimensionCard
              title="用户使用场景"
              icon={Users}
              entryCount={2}
              defaultExpanded={true}
              onAdd={() => {}}
            >
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">角色</TableHead>
                      <TableHead className="font-medium">使用场景</TableHead>
                      <TableHead className="font-medium">用户侧技术栈</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">算法工程师</TableCell>
                      <TableCell>提交训练任务时选择 GPU 类型和数量</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant="outline">PyTorch</Badge>
                          <Badge variant="outline">TensorFlow</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">运维管理员</TableCell>
                      <TableCell>配置默认资源配额和实例规格</TableCell>
                      <TableCell>
                        <Badge variant="outline">平台管理控制台</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </DimensionCard>

            {/* Card 3: 技术实现 */}
            <DimensionCard
              title="技术实现"
              icon={Server}
              entryCount={2}
              defaultExpanded={true}
              onAdd={() => {}}
            >
              <div className="space-y-3">
                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <h4 className="text-sm font-medium text-foreground">GPU 调度机制</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    GPU 调度基于 Kubernetes device plugin，支持 NVIDIA / 华为昇腾 / 海光 DCU /
                    寒武纪 MLU
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary">Kubernetes</Badge>
                    <Badge variant="secondary">Device Plugin</Badge>
                    <Badge variant="secondary">多厂商支持</Badge>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/30 p-4">
                  <h4 className="text-sm font-medium text-foreground">虚拟 GPU 实现</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    虚拟 GPU 通过 GPU 共享调度器实现，支持显存隔离
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary">vGPU</Badge>
                    <Badge variant="secondary">显存隔离</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  参考标准：Volcano (CNCF孵化·华为主导) · KServe (K8s模型serving标准)
                </p>
              </div>
            </DimensionCard>

            {/* Card 4: 设计决策 */}
            <DimensionCard
              title="设计决策"
              icon={GitBranch}
              entryCount={1}
              defaultExpanded={true}
              onAdd={() => {}}
            >
              <div className="rounded-md border border-border p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
                    背景
                  </h4>
                  <p className="mt-1 text-sm text-foreground">
                    需要同时支持物理卡和虚拟卡的资源分配
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
                    决策
                  </h4>
                  <p className="mt-1 text-sm text-foreground">
                    统一资源模型，通过 type 字段区分物理卡/虚拟卡
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium uppercase text-destructive tracking-wider">
                    放弃的方案
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    物理卡和虚拟卡分成两套模型（否决原因：重复逻辑太多）
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
                    后果
                  </h4>
                  <p className="mt-1 text-sm text-foreground">
                    API 更简洁，但需要按类型做差异化校验
                  </p>
                </div>
              </div>
            </DimensionCard>

            {/* Card 5: 工程经验 */}
            <DimensionCard
              title="工程经验"
              icon={Lightbulb}
              entryCount={1}
              defaultExpanded={true}
              onAdd={() => {}}
            >
              <div className="rounded-md border border-border bg-amber-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">NUMA 亲和性问题</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      拼卡后推理延迟反而增大。根因：跨 NUMA 节点的显存访问。修复：调度器增加 NUMA
                      拓扑感知。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">踩坑</Badge>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">GPU</Badge>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">性能</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </DimensionCard>

            {/* Card 6: 测试分析 */}
            <DimensionCard
              title="测试分析"
              icon={TestTube}
              entryCount={2}
              collapsedSummary="已记录 2 个问题"
              defaultExpanded={true}
              onAdd={() => {}}
            >
              <div>
                {/* Sub-tabs */}
                <div className="flex gap-4 border-b mb-4">
                  <span className="text-primary border-b-2 border-primary pb-2 font-medium text-sm">
                    问题列表
                  </span>
                  <span className="text-muted-foreground text-sm pb-2">测试用例</span>
                </div>

                {/* Add Issue Button */}
                <div className="flex justify-end mb-3">
                  <Button variant="outline" size="sm">+ 记录问题</Button>
                </div>

                {/* Issues */}
                <div className="space-y-3">
                  {testAnalysisData.issues.map((issue) => (
                    <Card key={issue.id} className="border-border/60 p-4">
                      <div className="flex items-center gap-2">
                        <Badge className={issue.type === "Bug" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>
                          {issue.type}
                        </Badge>
                        <span className="font-medium text-sm">{issue.title}</span>
                        <div className="flex-1" />
                        <Badge variant="secondary">{issue.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{issue.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{issue.version}</Badge>
                        <span className="text-xs text-muted-foreground">发现于 {issue.foundDate}</span>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Separator and Test Cases */}
                <Separator className="my-4" />

                <h4 className="font-medium text-sm mb-1">测试用例</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  共 {testAnalysisData.testCases.total} 条（{testAnalysisData.testCases.aiGenerated} 条 AI 生成，{testAnalysisData.testCases.manual} 条手动）
                </p>

                <div className="rounded-md border overflow-hidden">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>测试用例</TableHead>
                        <TableHead className="w-16">来源</TableHead>
                        <TableHead className="w-14">优先级</TableHead>
                        <TableHead className="w-16">状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testAnalysisData.testCases.items.map((testCase) => (
                        <TableRow key={testCase.id}>
                          <TableCell>{testCase.id}</TableCell>
                          <TableCell>{testCase.name}</TableCell>
                          <TableCell>
                            <Badge className={testCase.source === "AI生成" ? "bg-blue-50 text-blue-700 text-xs" : "bg-gray-100 text-gray-700 text-xs"}>
                              {testCase.source}
                            </Badge>
                          </TableCell>
                          <TableCell>{testCase.priority}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "text-xs",
                              testCase.status === "通过" && "bg-green-50 text-green-700",
                              testCase.status === "失败" && "bg-red-50 text-red-700",
                              testCase.status === "未执行" && "bg-gray-100 text-gray-600"
                            )}>
                              {testCase.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </DimensionCard>

            {/* Card 7: 需求分析 (collapsed, empty) */}
            <DimensionCard
              title="需求分析"
              icon={ClipboardList}
              entryCount={0}
              collapsedSummary="未填写"
              defaultExpanded={false}
              onAdd={() => {}}
            >
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">点击添加，或上传需求文档自动分析</p>
              </div>
            </DimensionCard>

            {/* Card 8: 竞品参考 (collapsed) */}
            <DimensionCard
              title="竞品参考"
              icon={Building}
              entryCount={3}
              collapsedSummary="已对标 3 家竞品"
              defaultExpanded={false}
              onAdd={() => {}}
            >
              <p className="text-sm text-muted-foreground">竞品参考内容...</p>
            </DimensionCard>

            {/* F6: Competitor Reference Detail */}
            <Card className="border-border/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">竞品参考</h3>
                <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />添加</Button>
              </div>
              <div className="space-y-4">
                {/* Competitor 1: SageMaker */}
                <div className="rounded-md border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">Amazon SageMaker</span>
                    <Badge variant="outline" className="text-xs">v2.x</Badge>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">有</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    基于 SageMaker Inference Endpoints，支持多模型部署和自动扩缩容，GPU 实例通过 EC2 实例族选择。
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50/50 p-3">
                      <h5 className="text-xs font-medium text-green-700 mb-1">优势</h5>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>- 成熟的 ML Pipeline 生态</li>
                        <li>- 自动模型优化 (Neo)</li>
                      </ul>
                    </div>
                    <div className="rounded-md bg-red-50/50 p-3">
                      <h5 className="text-xs font-medium text-red-700 mb-1">劣势</h5>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>- 仅支持 AWS 生态</li>
                        <li>- 成本较高</li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* Competitor 2: Run:ai */}
                <div className="rounded-md border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">Run:ai</span>
                    <Badge variant="outline" className="text-xs">v2.16</Badge>
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs">部分</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    专注 GPU 编排和虚拟化，支持 GPU 分片和动态资源池化，基于 Kubernetes 原生调度扩展。
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50/50 p-3">
                      <h5 className="text-xs font-medium text-green-700 mb-1">优势</h5>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>- GPU 虚拟化领先</li>
                        <li>- K8s 原生集成</li>
                      </ul>
                    </div>
                    <div className="rounded-md bg-red-50/50 p-3">
                      <h5 className="text-xs font-medium text-red-700 mb-1">劣势</h5>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>- 仅专注调度层</li>
                        <li>- 不含推理serving能力</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* F7: Issue Panel */}
            <Card className="border-border/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">关联问题 <Badge variant="secondary">3</Badge></h3>
                <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />添加问题</Button>
              </div>
              <div className="space-y-3">
                {/* Issue 1: bug */}
                <div className="flex items-start gap-3 rounded-md border border-border p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 mt-0.5">
                    <Bug className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">bug</Badge>
                      <span className="text-sm font-medium">多副本创建时GPU资源未释放</span>
                    </div>
                    <p className="text-xs text-muted-foreground">来源维度：<span className="text-foreground">测试分析</span></p>
                  </div>
                </div>
                {/* Issue 2: 技术债 */}
                <div className="flex items-start gap-3 rounded-md border border-border p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 mt-0.5">
                    <Wrench className="h-3.5 w-3.5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">技术债</Badge>
                      <span className="text-sm font-medium">推理服务创建接口缺少参数校验</span>
                    </div>
                    <p className="text-xs text-muted-foreground">来源维度：<span className="text-foreground">工程经验</span></p>
                  </div>
                </div>
                {/* Issue 3: 设计缺陷 */}
                <div className="flex items-start gap-3 rounded-md border border-border p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 mt-0.5">
                    <PenTool className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs">设计缺陷</Badge>
                      <span className="text-sm font-medium">服务名称不支持中文导致用户困惑</span>
                    </div>
                    <p className="text-xs text-muted-foreground">来源维度：<span className="text-foreground">设计决策</span></p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Version Timeline Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-6">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">版本演进</h2>
              </div>
              <VersionTimeline versions={versionData} />
            </div>
          </div>
        </ScrollArea>
      </main>

      {/* Toast Notification */}
      <ToastNotification
        message="最近操作：已更新「创建推理服务」的技术实现维度 · 2分钟前"
        linkText="查看数据流转"
        linkHref={`/projects/${projectId}/data-flow`}
      />
    </div>
  )
}
