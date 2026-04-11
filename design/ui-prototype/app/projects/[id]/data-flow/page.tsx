"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  FileText,
  FolderOpen,
  Link2,
  SplitSquareHorizontal,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"
import {
  dataFlowStrings,
  currentImportSource,
  currentImportProgress,
  currentImportProcessed,
  currentImportTotal,
  processingFiles,
  flowLogs,
  flowSummaryStats,
  sankeyNodes,
  sankeyLinks,
  importHistory,
  aiAnalysisFlowMessage,
} from "@/lib/data-flow-data"

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "processing":
      return <Loader2 className="h-4 w-4 text-primary animate-spin" />
    case "pending":
      return <Clock className="h-4 w-4 text-muted-foreground" />
    default:
      return null
  }
}

function getHistoryStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="outline" className="text-xs border-green-300 text-green-600">完成</Badge>
    case "failed":
      return <Badge variant="outline" className="text-xs border-red-300 text-red-600">失败</Badge>
    case "partial":
      return <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-600">部分成功</Badge>
    default:
      return null
  }
}

function getLogColor(type: string) {
  switch (type) {
    case "success": return "text-green-600"
    case "warning": return "text-yellow-600"
    case "ai": return "text-primary"
    default: return "text-muted-foreground"
  }
}

// CSS-simulated Sankey diagram
function SankeyDiagram() {
  // Group links by source type
  const fileToModule = sankeyLinks.filter(l => {
    const sourceNode = sankeyNodes.find(n => n.name === l.source)
    return sourceNode?.type === "file"
  })
  const moduleToDoc = sankeyLinks.filter(l => {
    const sourceNode = sankeyNodes.find(n => n.name === l.source)
    return sourceNode?.type === "module"
  })

  const files = sankeyNodes.filter(n => n.type === "file")
  const modules = sankeyNodes.filter(n => n.type === "module")
  const dimensions = sankeyNodes.filter(n => n.type === "dimension")

  // Compute totals for bar heights
  const fileTotals = files.map(f => ({
    ...f,
    total: fileToModule.filter(l => l.source === f.name).reduce((s, l) => s + l.value, 0),
  }))
  const moduleTotals = modules.map(m => ({
    ...m,
    total: moduleToDoc.filter(l => l.source === m.name).reduce((s, l) => s + l.value, 0),
  }))
  const dimTotals = dimensions.map(d => ({
    ...d,
    total: moduleToDoc.filter(l => l.target === d.name).reduce((s, l) => s + l.value, 0),
  }))

  const maxTotal = Math.max(
    ...fileTotals.map(f => f.total),
    ...moduleTotals.map(m => m.total),
    ...dimTotals.map(d => d.total),
  )

  const getBarHeight = (val: number) => Math.max(16, (val / maxTotal) * 48)

  const columnColors = {
    file: "bg-blue-400",
    module: "bg-emerald-400",
    dimension: "bg-purple-400",
  }

  return (
    <div className="mt-4">
      <div className="flex items-start justify-between gap-2">
        {/* Files column */}
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground mb-2 text-center font-medium">源文件</p>
          <div className="space-y-1">
            {fileTotals.map(f => (
              <div key={f.name} className="flex items-center gap-1.5">
                <div
                  className={`${columnColors.file} rounded-sm shrink-0`}
                  style={{ width: "6px", height: `${getBarHeight(f.total)}px` }}
                />
                <span className="text-[10px] text-foreground truncate">{f.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">({f.total})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow 1 */}
        <div className="flex items-center justify-center pt-8 px-1 shrink-0">
          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </div>

        {/* Modules column */}
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground mb-2 text-center font-medium">模块</p>
          <div className="space-y-1">
            {moduleTotals.map(m => (
              <div key={m.name} className="flex items-center gap-1.5">
                <div
                  className={`${columnColors.module} rounded-sm shrink-0`}
                  style={{ width: "6px", height: `${getBarHeight(m.total)}px` }}
                />
                <span className="text-[10px] text-foreground truncate">{m.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">({m.total})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arrow 2 */}
        <div className="flex items-center justify-center pt-8 px-1 shrink-0">
          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </div>

        {/* Dimensions column */}
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground mb-2 text-center font-medium">维度</p>
          <div className="space-y-1">
            {dimTotals.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div
                  className={`${columnColors.dimension} rounded-sm shrink-0`}
                  style={{ width: "6px", height: `${getBarHeight(d.total)}px` }}
                />
                <span className="text-[10px] text-foreground truncate">{d.name}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">({d.total})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DataFlowPage() {
  const params = useParams()
  const projectId = params.id as string
  const [showHistory, setShowHistory] = useState(false)

  const currentFile = processingFiles.find(f => f.status === "processing")
  const completedFiles = processingFiles.filter(f => f.status === "completed")
  const pendingFiles = processingFiles.filter(f => f.status === "pending")

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
              <BreadcrumbPage>{dataFlowStrings.pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          全景图
        </Link>
        <Link href={`/projects/${projectId}/product-lines/private-cloud`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          产品线
        </Link>
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          需求工作台
        </Link>
        <Link href={`/projects/${projectId}/ai-analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          AI 需求分析
        </Link>
        <Link href={`/projects/${projectId}/data-flow`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">
          数据流转
        </Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          竞品对比
        </Link>
        <Link href={`/projects/${projectId}/relation-graph`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          关系图
        </Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          设置
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Import Progress + Log */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Active Import Progress */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                {dataFlowStrings.importProgress}
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-xs">进行中</Badge>
              </h2>
              <span className="text-sm text-muted-foreground">{currentImportSource}</span>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">{dataFlowStrings.totalProgress}</span>
                <span className="text-sm font-medium">{currentImportProgress}% ({currentImportProcessed}/{currentImportTotal} 文件)</span>
              </div>
              <Progress value={currentImportProgress} className="h-2.5" />
            </div>

            {/* Current file being processed */}
            {currentFile && (
              <Card className="border-border/60 p-4 bg-primary/5 border-l-4 border-l-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  <span className="text-sm font-medium">{dataFlowStrings.currentFile}</span>
                </div>
                <div className="pl-6 space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">文件：</span>
                    <span className="font-medium">{currentFile.filename}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">拆分为</span>
                    <span className="font-medium text-primary"> {currentFile.splitCount} 个功能项</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">归入模块：</span>
                    <Badge variant="outline" className="text-xs">{currentFile.assignedModule}</Badge>
                  </p>
                </div>
              </Card>
            )}

            {/* File list (collapsible) */}
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2">
                {processingFiles.map(file => (
                  <div
                    key={file.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                      file.status === "processing"
                        ? "border-primary/40 bg-primary/5"
                        : file.status === "completed"
                        ? "border-green-200 bg-green-50/50"
                        : "border-border bg-muted/20"
                    }`}
                  >
                    {getStatusIcon(file.status)}
                    <span className="truncate flex-1">{file.filename}</span>
                    {file.status === "completed" && (
                      <span className="text-muted-foreground shrink-0">{file.splitCount} 项</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Log */}
          <div className="flex-1 flex flex-col">
            <div className="px-6 py-3 flex items-center justify-between border-b border-border">
              <h3 className="font-medium text-sm">{dataFlowStrings.realtimeLog}</h3>
              <Badge variant="secondary" className="text-xs">{flowLogs.length} 条</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-6 py-3 space-y-1 font-mono text-xs">
                {flowLogs.map(log => (
                  <div key={log.id} className={`flex gap-2 py-0.5 ${getLogColor(log.type)}`}>
                    <span className="text-muted-foreground shrink-0">[{log.timestamp}]</span>
                    {log.type === "ai" && <Sparkles className="h-3 w-3 text-primary shrink-0 mt-0.5" />}
                    <span>{log.message}</span>
                  </div>
                ))}
                {/* Blinking cursor */}
                <div className="flex gap-2 py-0.5 text-muted-foreground">
                  <span className="shrink-0">[14:32:29]</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right: Summary + Flow Diagram + History */}
        <div className="w-[420px] flex flex-col">
          {/* Stats Cards */}
          <div className="p-5 border-b border-border">
            <h3 className="font-medium mb-3">{dataFlowStrings.flowSummary}</h3>
            <div className="grid grid-cols-4 gap-3">
              {flowSummaryStats.map((stat, index) => {
                const icons = [
                  <FileText key="file" className="h-4 w-4 text-blue-500" />,
                  <SplitSquareHorizontal key="split" className="h-4 w-4 text-emerald-500" />,
                  <Link2 key="link" className="h-4 w-4 text-purple-500" />,
                  <FolderOpen key="folder" className="h-4 w-4 text-orange-500" />,
                ]
                return (
                  <Card key={index} className="border-border/60 p-3 shadow-sm text-center">
                    <div className="flex justify-center mb-1">{icons[index]}</div>
                    <span className="text-xl font-bold text-foreground">{stat.value}</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Sankey Flow Diagram */}
          <div className="p-5 border-b border-border">
            <h3 className="font-medium mb-1">{dataFlowStrings.flowDiagram}</h3>
            <p className="text-xs text-muted-foreground mb-2">文件 → 模块 → 维度 的流转全景</p>
            <SankeyDiagram />
          </div>

          {/* AI Analysis Flow */}
          <div className="px-5 py-4 border-b border-border">
            <Card className="border-primary/30 bg-primary/5 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-primary mb-0.5">{dataFlowStrings.aiAnalysisFlow}</p>
                  <p className="text-xs text-foreground">{aiAnalysisFlowMessage}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* History */}
          <div className="flex-1 flex flex-col">
            <button
              className="px-5 py-3 flex items-center justify-between border-b border-border hover:bg-muted/30 transition-colors"
              onClick={() => setShowHistory(!showHistory)}
            >
              <h3 className="font-medium text-sm flex items-center gap-2">
                {dataFlowStrings.importHistory}
                <Badge variant="secondary" className="text-xs">{importHistory.length}</Badge>
              </h3>
              {showHistory ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showHistory && (
              <ScrollArea className="flex-1">
                <div className="px-5 py-3 space-y-3">
                  {importHistory.map(item => (
                    <div key={item.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                        {getHistoryStatusBadge(item.status)}
                      </div>
                      <p className="text-sm font-medium mb-1">{item.source}</p>
                      <p className="text-xs text-muted-foreground">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
