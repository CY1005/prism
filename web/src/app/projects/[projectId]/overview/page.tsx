"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Search, Bell, ChevronRight, LogOut, Settings, Shield, Upload, FolderUp, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings, productLines, recentUpdates, statsLabels } from "@/lib/project-detail-data"
import { openclawStrings, openclawSystemLayers, openclawRecentUpdates, openclawStatsLabels } from "@/lib/openclaw-data"
import { getProjectStats, getProjectTreeOverview, type ProjectStats, type TreeNodeOverview } from "@/services/project-stats"

function getStatusColor(percent: number) {
  if (percent >= 80) return "bg-green-500"
  if (percent >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export default function ProjectOverviewPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [isEmptyProject, setIsEmptyProject] = useState(projectId === "3")
  const [realStats, setRealStats] = useState<ProjectStats | null>(null)
  const [realTree, setRealTree] = useState<TreeNodeOverview[] | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    getProjectStats(projectId).then((r) => {
      if (r.ok) setRealStats(r.data)
      else setApiError(r.error)
    })
    getProjectTreeOverview(projectId).then((r) => {
      if (r.ok) setRealTree(r.data.tree)
      else setApiError(r.error)
    })
  }, [projectId])

  // Use different data based on project ID
  const isOpenClaw = projectId === "2"

  const strings = isOpenClaw ? openclawStrings : detailStrings
  // Use real stats if available, fallback to mock
  const stats = realStats
    ? {
        line1: `${realStats.total_folders} 个`,
        line2: `${realStats.total_folders + realStats.total_files} 个`,
        line3: `${realStats.total_files} 个`,
        line4: `${Math.round(realStats.avg_completion_percent)}%`,
      }
    : isOpenClaw ? openclawStatsLabels : statsLabels
  const layers = isOpenClaw ? openclawSystemLayers : productLines
  const updates = isOpenClaw ? openclawRecentUpdates : recentUpdates
  const projectTypeBadge = isOpenClaw
    ? { label: "系统架构", color: "border-green-200 text-green-700 bg-green-50" }
    : { label: "产品分析", color: "border-blue-200 text-blue-700 bg-blue-50" }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <Link href="/search" className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={strings.searchPlaceholder} className="pl-9 cursor-pointer" readOnly />
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
              <AvatarFallback className="bg-muted text-sm">{strings.userInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{strings.userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/login">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">{strings.myProjects}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-2">
                {strings.projectName}
                <Badge variant="outline" className={`text-xs ${projectTypeBadge.color}`}>
                  {projectTypeBadge.label}
                </Badge>
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}/overview`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">
          全景图
        </Link>
        <Link href={isOpenClaw ? `/openclaw` : `/projects/${projectId}/product-lines/private-cloud`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          {isOpenClaw ? "系统层" : "产品线"}
        </Link>
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          需求工作台
        </Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          竞品对比
        </Link>
        <Link href={`/projects/${projectId}/issues`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          问题沉淀
        </Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          设置
        </Link>
      </div>

      {apiError && (
        <div className="mx-6 mt-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-800">
          数据服务不可用，显示为缓存数据：{apiError}
        </div>
      )}

      <div className="flex items-center gap-4 px-6 py-4">
        <div className="grid grid-cols-4 gap-4 flex-1">
          <Card className="border-border/60 p-4 shadow-sm">
            <span className="text-2xl font-bold text-foreground">{isEmptyProject ? "0" : stats.line1}</span>
            <p className="text-sm text-muted-foreground">{strings.productLine}</p>
          </Card>
          <Card className="border-border/60 p-4 shadow-sm">
            <span className="text-2xl font-bold text-foreground">{isEmptyProject ? "0" : stats.line2}</span>
            <p className="text-sm text-muted-foreground">{strings.modules}</p>
          </Card>
          <Card className="border-border/60 p-4 shadow-sm">
            <span className="text-2xl font-bold text-foreground">{isEmptyProject ? "0" : stats.line3}</span>
            <p className="text-sm text-muted-foreground">{strings.features}</p>
          </Card>
          <Card className="border-border/60 p-4 shadow-sm">
            <span className="text-2xl font-bold text-foreground">{isEmptyProject ? "0%" : stats.line4}</span>
            <p className="text-sm text-muted-foreground">{strings.avgCompletion}</p>
            <Progress value={isEmptyProject ? 0 : (isOpenClaw ? 45 : 58)} className="mt-2 h-2" />
          </Card>
        </div>
        <Button variant="outline" className="h-auto py-3 px-4 flex items-center gap-2" asChild>
          <Link href={`/projects/${projectId}/import`}>
            <Upload className="h-4 w-4" />
            <span>导入数据</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-1 gap-6 px-6 pb-6">
        {isEmptyProject ? (
          <Card className="flex-1 border-border/60 p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center text-center max-w-md">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <FolderUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">从知识库开始</h2>
              <p className="text-sm text-muted-foreground mb-6">
                上传已有的知识库文件，AI 帮你自动整理成结构化知识
              </p>
              <div className="flex items-center gap-3">
                <Button asChild>
                  <Link href={`/projects/${projectId}/import`}>
                    <Upload className="h-4 w-4 mr-2" />
                    上传知识库（zip）
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => setIsEmptyProject(false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  手动创建模块
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 border-border/60 p-6 shadow-sm">
            <div className="flex gap-6">
              {layers.map((line) => (
                <div key={line.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
                    <span
                      className={`h-2 w-2 rounded-full ${getStatusColor(line.completion)}`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {line.name}
                    </span>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex flex-col gap-2">
                    {line.modules.map((module, index) => (
                      <div key={module.name} className="flex flex-col items-center">
                        {index > 0 && <div className="h-2 w-px bg-border" />}
                        <Link href={isOpenClaw ? "/openclaw" : "/"} className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${getStatusColor(module.completion)}`}
                          />
                          <span className="text-xs text-foreground">
                            {module.name}
                          </span>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="w-[280px] border-border/60 p-4 shadow-sm">
          <h3 className="mb-4 font-medium text-foreground">{strings.recentUpdates}</h3>
          <div className="space-y-0">
            {updates.map((update, index) => (
              <div key={index}>
                <div className="flex gap-3 py-3">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="bg-muted text-xs">
                      {update.user}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {update.user} {update.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{update.time}</p>
                  </div>
                </div>
                {index < updates.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
