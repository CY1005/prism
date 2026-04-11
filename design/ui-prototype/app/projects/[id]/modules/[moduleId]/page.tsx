"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Bug,
  Wrench,
  PenTool,
  Zap,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { moduleDetailData, type IssueType } from "@/lib/module-data"
import { detailStrings } from "@/lib/project-detail-data"
import { treeData } from "@/lib/tree-data"
import { FeatureTree } from "@/components/feature-tree"
import { cn } from "@/lib/utils"

function getStatusDotColor(status: "green" | "yellow" | "red") {
  switch (status) {
    case "green":
      return "bg-green-500"
    case "yellow":
      return "bg-yellow-500"
    case "red":
      return "bg-red-500"
  }
}

function getCoverageColor(coverage: "有" | "无" | "部分") {
  switch (coverage) {
    case "有":
      return "bg-green-100 text-green-700"
    case "无":
      return "bg-red-100 text-red-700"
    case "部分":
      return "bg-yellow-100 text-yellow-700"
  }
}

function getIssueIcon(type: IssueType) {
  switch (type) {
    case "bug":
      return <Bug className="h-4 w-4 text-red-500" />
    case "tech-debt":
      return <Wrench className="h-4 w-4 text-orange-500" />
    case "design-flaw":
      return <PenTool className="h-4 w-4 text-purple-500" />
    case "performance":
      return <Zap className="h-4 w-4 text-blue-500" />
  }
}

function getIssueTypeLabel(type: IssueType) {
  switch (type) {
    case "bug":
      return "Bug"
    case "tech-debt":
      return "技术债"
    case "design-flaw":
      return "设计缺陷"
    case "performance":
      return "性能"
  }
}

function getIssueTypeBadgeClass(type: IssueType) {
  switch (type) {
    case "bug":
      return "bg-red-50 text-red-700 border-red-200"
    case "tech-debt":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "design-flaw":
      return "bg-purple-50 text-purple-700 border-purple-200"
    case "performance":
      return "bg-blue-50 text-blue-700 border-blue-200"
  }
}

export default function ModuleOverviewPage() {
  const params = useParams()
  const projectId = params.id as string
  const moduleId = params.moduleId as string
  const [sortBy, setSortBy] = useState("completion")
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createType, setCreateType] = useState<"product-line" | "module" | "feature">("module")
  const [createName, setCreateName] = useState("")
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })

  const moduleData = moduleDetailData[moduleId] || moduleDetailData["inference-service"]

  const sortedFeatures = [...moduleData.features].sort((a, b) => {
    switch (sortBy) {
      case "completion":
        return b.completion - a.completion
      case "update":
        return 0 // Keep original order for "update time" (already sorted)
      case "name":
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  // Get competitor refs and issues for selected feature
  const competitorRefs = selectedFeatureId && moduleData.competitorRefs
    ? moduleData.competitorRefs[selectedFeatureId] || []
    : []
  const featureIssues = selectedFeatureId && moduleData.featureIssues
    ? moduleData.featureIssues[selectedFeatureId] || []
    : []

  const selectedFeature = moduleData.features.find(f => f.id === selectedFeatureId)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <Link href="/search" className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={detailStrings.searchPlaceholder} className="pl-9 cursor-pointer" readOnly />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/admin">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/projects/${projectId}/settings`}>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-sm">{detailStrings.userInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{detailStrings.userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/login">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">{detailStrings.myProjects}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}`}>{detailStrings.projectName}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}/product-lines/ops-management`}>{moduleData.productLineName}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{moduleData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">概览</Link>
        <Link href={`/projects/${projectId}/panorama`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">全景图</Link>
        <Link href={`/projects/${projectId}/product-lines/ops-management`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">产品线</Link>
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">需求工作台</Link>
        <Link href={`/projects/${projectId}/ai-analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">AI需求分析</Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">竞品对比</Link>
        <Link href={`/projects/${projectId}/relation-graph`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">关系图</Link>
        <Link href={`/projects/${projectId}/data-flow`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">数据流转</Link>
        <Link href={`/projects/${projectId}/feed`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">行业动态</Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          设置
        </Link>
      </div>

      {/* Main Layout: Left Tree + Right Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Feature Tree */}
        <div className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto"
          onContextMenu={(e) => {
            e.preventDefault()
            setContextMenuPos({ x: e.clientX, y: e.clientY })
            setShowContextMenu(true)
          }}
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">功能树</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setCreateType("module"); setShowCreateModal(true) }}>
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
          <FeatureTree
            data={treeData}
            selectedId={selectedFeatureId || moduleId}
            onSelect={(id) => setSelectedFeatureId(id === selectedFeatureId ? null : id)}
          />
        </div>

        {/* Right-click Context Menu */}
        {showContextMenu && (
          <div
            className="fixed z-50 bg-card border border-border rounded-md shadow-lg py-1 w-44"
            style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
            onClick={() => setShowContextMenu(false)}
            onMouseLeave={() => setShowContextMenu(false)}
          >
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onClick={() => { setCreateType("product-line"); setShowCreateModal(true) }}>
              新建产品线
            </button>
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onClick={() => { setCreateType("module"); setShowCreateModal(true) }}>
              新建模块
            </button>
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted" onClick={() => { setCreateType("feature"); setShowCreateModal(true) }}>
              新建功能项
            </button>
            <Separator className="my-1" />
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted">重命名</button>
            <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-red-600">删除</button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
            <Card className="w-[420px] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">
                {createType === "product-line" ? "新建产品线" : createType === "module" ? "新建模块" : "新建功能项"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">名称</label>
                  <Input
                    placeholder={createType === "product-line" ? "如：平台运维管控、算法研发与训练" : createType === "module" ? "如：推理服务、训练服务" : "如：创建推理服务、自动扩缩容"}
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </div>
                {createType !== "product-line" && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {createType === "module" ? "所属产品线" : "所属模块"}
                    </label>
                    <Select defaultValue={createType === "module" ? "ops-management" : "inference-service"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {createType === "module" ? (
                          <>
                            <SelectItem value="ops-management">平台运维管控</SelectItem>
                            <SelectItem value="algorithm-training">算法研发与训练</SelectItem>
                            <SelectItem value="console">控制台与运营后台</SelectItem>
                            <SelectItem value="engineering">工程部署</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="inference-service">推理服务</SelectItem>
                            <SelectItem value="gpu-management">GPU管理</SelectItem>
                            <SelectItem value="rp01-resource-overview">资源总览与监控</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {createType === "feature" && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">引入版本</label>
                    <Input placeholder="如：v3.9.5" />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => { setShowCreateModal(false); setCreateName("") }}>取消</Button>
                  <Button onClick={() => { setShowCreateModal(false); setCreateName("") }}>创建</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Right Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-6">
            {/* Badge */}
            <div className="flex items-center justify-end mb-6">
              <Badge variant="secondary">
                {moduleData.featureCount}个功能项 · 完善度 {moduleData.avgCompletion}%
              </Badge>
            </div>

          {/* Dimension Coverage */}
          <Card className="border-border/60 shadow-sm p-5 mb-6">
            <h3 className="text-base font-medium mb-4">维度覆盖率</h3>
            <div className="space-y-3">
              {moduleData.dimensions.map((dim) => (
                <div key={dim.name} className="flex items-center gap-3">
                  <span className="text-sm w-16 text-right text-muted-foreground">{dim.name}</span>
                  <Progress value={dim.percent} className="flex-1 h-2" />
                  <span className="text-sm w-8 text-right font-medium">{dim.current}/{dim.total}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Feature List */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">功能项列表</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completion">按完善度排序</SelectItem>
                <SelectItem value="update">按更新时间</SelectItem>
                <SelectItem value="name">按名称</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/60 shadow-sm overflow-hidden mb-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">功能项</TableHead>
                  <TableHead className="font-medium">引入版本</TableHead>
                  <TableHead className="font-medium">完善度</TableHead>
                  <TableHead className="font-medium">维度状态</TableHead>
                  <TableHead className="font-medium">最近更新</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFeatures.map((feature) => (
                  <TableRow
                    key={feature.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedFeatureId === feature.id && "bg-primary/5"
                    )}
                    onClick={() => setSelectedFeatureId(
                      selectedFeatureId === feature.id ? null : feature.id
                    )}
                  >
                    <TableCell>
                      <Link
                        href={`/projects/${projectId}/features/${feature.id}`}
                        className={cn(
                          "font-medium hover:underline",
                          selectedFeatureId === feature.id ? "text-primary" : "text-foreground"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {feature.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{feature.version}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={feature.completion} className="w-20 h-2" />
                        <span className="text-xs">{feature.completion}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        {feature.dimensionStatus.map((status, index) => (
                          <span
                            key={index}
                            className={cn("h-1.5 w-1.5 rounded-full", getStatusDotColor(status))}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{feature.lastUpdate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* F6: Competitor Reference Card */}
          {selectedFeatureId && (
            <Card className="border-border/60 shadow-sm p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">
                  竞品参考
                  {selectedFeature && (
                    <span className="text-muted-foreground font-normal ml-2 text-sm">
                      - {selectedFeature.name}
                    </span>
                  )}
                </h3>
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  添加
                </Button>
              </div>

              {competitorRefs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无竞品参考数据，点击"添加"按钮开始录入
                </div>
              ) : (
                <div className="space-y-3">
                  {competitorRefs.map((ref) => (
                    <div
                      key={ref.id}
                      className="border border-border/60 rounded-lg p-4 hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{ref.name}</span>
                          <Badge variant="outline" className="text-xs">{ref.version}</Badge>
                          <Badge className={cn("text-xs", getCoverageColor(ref.coverage))}>
                            功能覆盖: {ref.coverage}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">技术方案: </span>
                          <span>{ref.techSummary}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">优劣势: </span>
                          <span>{ref.prosConsSummary}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* F7: Issue Panel */}
          {selectedFeatureId && (
            <Card className="border-border/60 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium">
                  关联问题
                  {selectedFeature && (
                    <span className="text-muted-foreground font-normal ml-2 text-sm">
                      - {selectedFeature.name}
                    </span>
                  )}
                  {featureIssues.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{featureIssues.length}</Badge>
                  )}
                </h3>
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  添加问题
                </Button>
              </div>

              {featureIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  暂无关联问题
                </div>
              ) : (
                <div className="space-y-2">
                  {featureIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-start gap-3 border border-border/60 rounded-lg p-3 hover:border-border transition-colors"
                    >
                      <div className="mt-0.5 shrink-0">
                        {getIssueIcon(issue.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{issue.title}</span>
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getIssueTypeBadgeClass(issue.type))}
                          >
                            {getIssueTypeLabel(issue.type)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {issue.description}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {issue.linkedDimension}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
