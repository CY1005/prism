"use client"

import { useState } from "react"
import Link from "next/link"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { DimensionCard } from "@/components/dimension-card"
import { VersionTimeline } from "@/components/version-timeline"
import { treeData } from "@/lib/tree-data"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState("create-inference")

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
          <Link href="/project" className="font-semibold text-sidebar-foreground hover:text-primary transition-colors">Prism</Link>
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
                  <BreadcrumbLink href="/projects/1">AI云平台竞品分析</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/projects/1">私有云</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/projects/1">推理服务</BreadcrumbLink>
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

            {/* Card 3: 平台侧技术 */}
            <DimensionCard
              title="平台侧技术"
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

            {/* Card 6: 测试分析 (collapsed) */}
            <DimensionCard
              title="测试分析"
              icon={TestTube}
              entryCount={2}
              collapsedSummary="已记录 2 个问题"
              defaultExpanded={false}
              onAdd={() => {}}
            >
              <p className="text-sm text-muted-foreground">测试分析内容...</p>
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
                <p className="mt-2 text-sm text-muted-foreground">点击添加需求分析</p>
              </div>
            </DimensionCard>

            {/* Card 8: 竞品参考 (collapsed) */}
            <DimensionCard
              title="竞品参考"
              icon={Building}
              entryCount={1}
              collapsedSummary="已参考 1 个竞品"
              defaultExpanded={false}
              onAdd={() => {}}
            >
              <p className="text-sm text-muted-foreground">竞品参考内容...</p>
            </DimensionCard>

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
    </div>
  )
}
