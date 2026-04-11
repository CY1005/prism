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
  X,
  Sparkles,
  Loader2,
  Pencil,
  ArrowDownToLine,
  Plus,
  Info,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { detailStrings } from "@/lib/project-detail-data"
import { comparisonData } from "@/lib/comparison-data"
import { cn } from "@/lib/utils"

function getCellHighlightClass(highlight: string | null) {
  if (highlight === "green") return "bg-green-50"
  if (highlight === "red") return "bg-red-50"
  return ""
}

export default function ComparisonPage() {
  const params = useParams()
  const projectId = params.id as string
  const [aiGenerated, setAiGenerated] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [customDimensions, setCustomDimensions] = useState<string[]>(
    comparisonData.defaultDimensions
  )

  const handleAiGenerate = () => {
    setAiLoading(true)
    // Simulate AI generation delay
    setTimeout(() => {
      setAiLoading(false)
      setAiGenerated(true)
    }, 2000)
  }

  const handleAddDimension = () => {
    setCustomDimensions(prev => [...prev, `自定义维度 ${prev.length + 1}`])
  }

  const tableData = aiGenerated ? comparisonData.aiGeneratedTable : comparisonData.comparisonTable

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
              <BreadcrumbPage>竞品对比</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">概览</Link>
        <Link href={`/projects/${projectId}/panorama`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">全景图</Link>
        <Link href={`/projects/${projectId}/product-lines/private-cloud`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">产品线</Link>
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">需求工作台</Link>
        <Link href={`/projects/${projectId}/ai-analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">AI需求分析</Link>
        <Link href={`/projects/${projectId}/comparison`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">竞品对比</Link>
        <Link href={`/projects/${projectId}/relation-graph`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">关系图</Link>
        <Link href={`/projects/${projectId}/data-flow`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">数据流转</Link>
        <Link href={`/projects/${projectId}/feed`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">行业动态</Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          设置
        </Link>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Control Card */}
          <Card className="border-border/60 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">竞品对比</h2>
              <Button
                onClick={handleAiGenerate}
                disabled={aiLoading}
                className="gap-2"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI 生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    AI 生成对比
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-4 items-end mt-4">
              <div>
                <Label className="text-sm mb-1 block">选择功能</Label>
                <Select defaultValue={comparisonData.selectedFeature}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="创建推理服务">创建推理服务</SelectItem>
                    <SelectItem value="自动扩缩容">自动扩缩容</SelectItem>
                    <SelectItem value="拼卡管理">拼卡管理</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1 block">对比竞品</Label>
                <div className="flex gap-1">
                  {comparisonData.competitors.map((competitor) => (
                    <Badge key={competitor.id} variant="secondary" className="gap-1">
                      {competitor.name}
                      <button className="hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm">+ 添加竞品</Button>
              <Button size="sm" variant="outline">生成对比</Button>
            </div>

            {/* Dimension columns config */}
            <div className="mt-4 pt-4 border-t border-border/60">
              <Label className="text-sm mb-2 block">对比维度</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {customDimensions.map((dim, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {dim}
                    <button
                      className="hover:text-foreground"
                      onClick={() => setCustomDimensions(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleAddDimension}>
                  <Plus className="h-3 w-3" />
                  添加对比维度
                </Button>
              </div>
            </div>
          </Card>

          {/* AI Generation Banner */}
          {aiGenerated && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
              <Info className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm text-blue-700">
                AI已基于已有知识和联网搜索生成对比结果，请review后确认
              </span>
            </div>
          )}

          {/* Loading State */}
          {aiLoading && (
            <Card className="border-border/60 shadow-sm p-12 mb-6">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">AI 正在分析竞品信息并生成对比结果...</p>
              </div>
            </Card>
          )}

          {/* Comparison Table */}
          {!aiLoading && (
            <TooltipProvider>
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium w-28">对比维度</TableHead>
                      <TableHead className="font-medium">本产品（私有云）</TableHead>
                      <TableHead className="font-medium">AWS SageMaker</TableHead>
                      <TableHead className="font-medium">阿里 PAI</TableHead>
                      {aiGenerated && <TableHead className="font-medium w-16">操作</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.dimension}</TableCell>
                        <TableCell
                          className={cn(
                            getCellHighlightClass(row.ourProduct.highlight),
                            "relative group"
                          )}
                          onMouseEnter={() => setHoveredCell(`${index}-our`)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {row.ourProduct.text}
                          {hoveredCell === `${index}-our` && (
                            <button className="absolute top-1 right-1 p-1 rounded hover:bg-muted">
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </button>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            getCellHighlightClass(row.aws.highlight),
                            "relative group"
                          )}
                          onMouseEnter={() => setHoveredCell(`${index}-aws`)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {row.aws.text}
                          {hoveredCell === `${index}-aws` && (
                            <button className="absolute top-1 right-1 p-1 rounded hover:bg-muted">
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </button>
                          )}
                        </TableCell>
                        <TableCell
                          className={cn(
                            getCellHighlightClass(row.aliyun.highlight),
                            "relative group"
                          )}
                          onMouseEnter={() => setHoveredCell(`${index}-ali`)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {row.aliyun.text}
                          {hoveredCell === `${index}-ali` && (
                            <button className="absolute top-1 right-1 p-1 rounded hover:bg-muted">
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </button>
                          )}
                        </TableCell>
                        {aiGenerated && (
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <ArrowDownToLine className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>将此行结论同步到该功能项的竞品参考卡片</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TooltipProvider>
          )}

          {/* Conclusion Card */}
          {!aiLoading && (
            <Card className="border-border/60 shadow-sm p-5 mt-6">
              <h3 className="font-medium mb-3">对比结论（AI 生成）</h3>
              <div className="space-y-2 text-sm">
                {comparisonData.conclusions.map((conclusion, index) => (
                  <p key={index}>
                    <span className={conclusion.type === "advantage" ? "text-green-500" : "text-yellow-500"}>
                      {conclusion.type === "advantage" ? "\u2705" : "\u26A0\uFE0F"}
                    </span>{" "}
                    {conclusion.type === "advantage" ? "优势：" : "劣势："}
                    {conclusion.text}
                  </p>
                ))}
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
