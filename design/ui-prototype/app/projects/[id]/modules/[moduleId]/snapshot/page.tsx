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
  Sparkles,
  Clock,
  Save,
  CheckCircle2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { snapshotData } from "@/lib/snapshot-data"
import { detailStrings } from "@/lib/project-detail-data"
import { treeData } from "@/lib/tree-data"
import { FeatureTree } from "@/components/feature-tree"

export default function SnapshotPage() {
  const params = useParams()
  const projectId = params.id as string
  const moduleId = params.moduleId as string

  const data = snapshotData
  const canGenerate = data.versionCount >= 3
  const [generated, setGenerated] = useState(true)
  const [summary, setSummary] = useState(data.summary)
  const [dimensionChecks, setDimensionChecks] = useState(
    data.dimensions.map((d) => d.checked)
  )

  function toggleDimension(index: number) {
    setDimensionChecks((prev) => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }

  const selectedCount = dimensionChecks.filter(Boolean).length

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
              <BreadcrumbLink href={`/projects/${projectId}/modules/${moduleId}`}>{data.moduleName}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>AI快照</BreadcrumbPage>
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
        <div className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground">功能树</h3>
          </div>
          <FeatureTree data={treeData} selectedId={moduleId} onSelect={() => {}} />
        </div>

        {/* Right Content */}
        <ScrollArea className="flex-1">
          <div className="flex gap-6 p-6">
            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
            {/* Feature Info Bar */}
            <Card className="border-border/60 shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">功能项:</span>
                    <span className="text-sm font-medium">{data.featureName}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">模块:</span>
                    <span className="text-sm font-medium">{data.moduleName}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">版本记录:</span>
                    <Badge variant="secondary">{data.versionCount}条</Badge>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          disabled={!canGenerate}
                          onClick={() => setGenerated(true)}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          生成当前快照
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canGenerate && (
                      <TooltipContent>
                        <p>需要至少3条版本记录才能生成快照</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            </Card>

            {generated && (
              <>
                {/* Summary Section */}
                <Card className="border-border/60 shadow-sm p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-medium">一句话概要</h3>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                      AI生成
                    </Badge>
                  </div>
                  <Textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                  <div className="flex justify-end mt-3">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Save className="h-3.5 w-3.5" />
                      保存概要
                    </Button>
                  </div>
                </Card>

                {/* Dimension Structured Output */}
                <Card className="border-border/60 shadow-sm p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-medium">按维度结构化输出</h3>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                        AI生成
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      已选中 {selectedCount}/{data.dimensions.length} 个维度
                    </span>
                  </div>

                  <Accordion type="multiple" defaultValue={["dim-0", "dim-1"]} className="space-y-3">
                    {data.dimensions.map((dim, index) => (
                      <AccordionItem
                        key={dim.dimension}
                        value={`dim-${index}`}
                        className="border border-border/60 rounded-lg px-4 overflow-hidden"
                      >
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="font-medium text-sm">{dim.dimension}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">
                            {dim.content}
                          </div>
                          <Separator className="mb-3" />
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`check-${index}`}
                              checked={dimensionChecks[index]}
                              onCheckedChange={() => toggleDimension(index)}
                            />
                            <label
                              htmlFor={`check-${index}`}
                              className="text-sm cursor-pointer select-none"
                            >
                              覆盖当前维度内容
                            </label>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" className="gap-1.5">
                    <Save className="h-4 w-4" />
                    保存概要
                  </Button>
                  <Button className="gap-1.5" disabled={selectedCount === 0}>
                    <CheckCircle2 className="h-4 w-4" />
                    按选中维度更新（{selectedCount}个）
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar - Version Timeline */}
          <Card className="w-[280px] shrink-0 border-border/60 shadow-sm p-5 self-start sticky top-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              版本时间线
            </h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-5">
                {data.versions.map((v, index) => (
                  <div key={v.version} className="flex gap-3 relative">
                    <div className="relative z-10 mt-1">
                      <div
                        className={`h-[14px] w-[14px] rounded-full border-2 ${
                          index === 0
                            ? "border-primary bg-primary/20"
                            : "border-border bg-card"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            v.type === "新增"
                              ? "border-green-200 text-green-700 bg-green-50"
                              : "border-blue-200 text-blue-700 bg-blue-50"
                          }`}
                        >
                          {v.version}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {v.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {v.summary}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{v.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
