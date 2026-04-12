"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Bell, ChevronRight, LogOut, Settings, Shield, Upload, FolderUp, Plus, Loader2, FileUp, LayoutTemplate } from "lucide-react"
import { ImportCSVModal } from "@/components/import-csv-modal"
import { GlobalSearchBar } from "@/components/global-search-bar"
import { TreemapView } from "@/components/treemap-view"
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
import { detailStrings, recentUpdates } from "@/lib/project-detail-data"
import { openclawStrings, openclawRecentUpdates } from "@/lib/openclaw-data"
import { getProjectStats, getProjectTreeOverview, type ProjectStats, type TreeNodeOverview } from "@/services/project-stats"
import { getPanoramaData, getProjectStats as getPanoramaStats } from "@/actions/panorama"
import { useProjectRole } from "@/contexts/project-role-context"

function getStatusColor(percent: number) {
  if (percent >= 80) return "bg-green-500"
  if (percent >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

/** Transform top-level tree nodes into the layers visualization format */
function treeToLayers(tree: TreeNodeOverview[]) {
  return tree.map((node) => ({
    name: node.name,
    completion: Math.round(node.completion_percent),
    modules: node.children.map((child) => ({
      name: child.name,
      completion: Math.round(child.completion_percent),
    })),
  }))
}

export default function ProjectOverviewPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { isViewer } = useProjectRole()
  const [isEmptyProject, setIsEmptyProject] = useState(projectId === "3")
  const [csvModalOpen, setCsvModalOpen] = useState(false)
  const [realStats, setRealStats] = useState<ProjectStats | null>(null)
  const [realTree, setRealTree] = useState<TreeNodeOverview[] | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [treeLoading, setTreeLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeSubTab, setActiveSubTab] = useState<"treemap" | "tree">("treemap")
  const [panoramaData, setPanoramaData] = useState<Awaited<ReturnType<typeof getPanoramaData>> | null>(null)
  const [panoramaLoading, setPanoramaLoading] = useState(true)
  const [panoramaStats, setPanoramaStatsData] = useState<{
    totalModules: number
    totalFeatures: number
    avgCompletion: number
    lastUpdatedAt: Date | null
  } | null>(null)

  useEffect(() => {
    setStatsLoading(true)
    getProjectStats(projectId).then((r) => {
      setStatsLoading(false)
      if (r.ok) setRealStats(r.data)
      else setApiError(r.error)
    })

    setTreeLoading(true)
    getProjectTreeOverview(projectId).then((r) => {
      setTreeLoading(false)
      if (r.ok) setRealTree(r.data.tree)
      else setApiError((prev) => prev ?? r.error)
    })

    // Load panorama data
    setPanoramaLoading(true)
    getPanoramaData(projectId).then((r) => {
      setPanoramaLoading(false)
      setPanoramaData(r)
    })

    getPanoramaStats(projectId).then((r) => {
      if (r.success) setPanoramaStatsData(r.data)
    })
  }, [projectId])

  const isOpenClaw = projectId === "2"
  const strings = isOpenClaw ? openclawStrings : detailStrings

  // Stats: real data only; show loading/error states in render
  const statsData = realStats
    ? {
        line1: `${realStats.total_folders} 个`,
        line2: `${realStats.total_folders + realStats.total_files} 个`,
        line3: `${realStats.total_files} 个`,
        line4: `${Math.round(realStats.avg_completion_percent)}%`,
        avgPercent: Math.round(realStats.avg_completion_percent),
      }
    : null

  // Layers: use real tree data when available
  const layers = realTree ? treeToLayers(realTree) : null

  // Recent updates: no real API yet — TODO: replace with real API when available
  const updates = isOpenClaw ? openclawRecentUpdates : recentUpdates

  const projectTypeBadge = isOpenClaw
    ? { label: "系统架构", color: "border-green-200 text-green-700 bg-green-50" }
    : { label: "产品分析", color: "border-blue-200 text-blue-700 bg-blue-50" }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <GlobalSearchBar />
        <div className="flex items-center gap-4">
          <Link href="/admin" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
            <Shield className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href={`/projects/${projectId}/settings`} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-sm">{strings.userInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{strings.userName}</span>
          </div>
          <Link href="/login" className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Link>
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
        <Link href={`/projects/${projectId}/relation-graph`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          关系图
        </Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          设置
        </Link>
      </div>

      {apiError && (
        <div className="mx-6 mt-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          数据加载失败：{apiError}
        </div>
      )}

      <div className="flex items-center gap-4 px-6 py-4">
        <div className="grid grid-cols-4 gap-4 flex-1">
          {statsLoading && !isEmptyProject ? (
            <div className="col-span-4 flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载统计数据中...
            </div>
          ) : (
            <>
              <Card className="border-border/60 p-4 shadow-sm">
                <span className="text-2xl font-bold text-foreground">
                  {isEmptyProject ? "0" : (statsData?.line1 ?? "—")}
                </span>
                <p className="text-sm text-muted-foreground">{strings.productLine}</p>
              </Card>
              <Card className="border-border/60 p-4 shadow-sm">
                <span className="text-2xl font-bold text-foreground">
                  {isEmptyProject ? "0" : (statsData?.line2 ?? "—")}
                </span>
                <p className="text-sm text-muted-foreground">{strings.modules}</p>
              </Card>
              <Card className="border-border/60 p-4 shadow-sm">
                <span className="text-2xl font-bold text-foreground">
                  {isEmptyProject ? "0" : (statsData?.line3 ?? "—")}
                </span>
                <p className="text-sm text-muted-foreground">{strings.features}</p>
              </Card>
              <Card className="border-border/60 p-4 shadow-sm">
                <span className="text-2xl font-bold text-foreground">
                  {isEmptyProject ? "0%" : (statsData?.line4 ?? "—")}
                </span>
                <p className="text-sm text-muted-foreground">{strings.avgCompletion}</p>
                <Progress value={isEmptyProject ? 0 : (statsData?.avgPercent ?? 0)} className="mt-2 h-2" />
              </Card>
            </>
          )}
        </div>
        {isViewer ? (
          <span
            title="查看者无编辑权限"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium opacity-50 cursor-not-allowed"
          >
            <Upload className="h-4 w-4" />
            <span>导入数据</span>
          </span>
        ) : (
          <Link href={`/projects/${projectId}/import`} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-accent transition-colors">
            <Upload className="h-4 w-4" />
            <span>导入数据</span>
          </Link>
        )}
      </div>

      {/* Sub-tabs: 全景图 / 关系图 */}
      <div className="flex items-center gap-4 px-6 pb-4">
        <button
          onClick={() => setActiveSubTab("treemap")}
          className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
            activeSubTab === "treemap"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          全景图
        </button>
        <Link
          href={`/projects/${projectId}/relation-graph`}
          className="text-sm font-medium pb-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
        >
          关系图
        </Link>
        <button
          onClick={() => setActiveSubTab("tree")}
          className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
            activeSubTab === "tree"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          树形视图
        </button>
      </div>

      <div className="flex flex-1 gap-6 px-6 pb-6">
        {isEmptyProject && !treeLoading && (realTree === null || realTree.length === 0) ? (
          <>
            <ImportCSVModal
              projectId={projectId}
              open={csvModalOpen}
              onOpenChange={(open) => {
                setCsvModalOpen(open)
                if (!open) {
                  setTreeLoading(true)
                  getProjectTreeOverview(projectId).then((r) => {
                    setTreeLoading(false)
                    if (r.ok) {
                      setRealTree(r.data.tree)
                      if (r.data.tree.length > 0) setIsEmptyProject(false)
                    }
                  })
                }
              }}
            />
            <Card className="flex-1 border-border/60 p-6 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center text-center max-w-lg">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                  <FolderUp className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">开始构建你的知识库</h2>
                <p className="text-sm text-muted-foreground mb-8">
                  选择一种方式初始化项目结构，快速搭建你的知识体系
                </p>
                <div className="grid grid-cols-3 gap-4 w-full">
                  <Link
                    href={`/projects/${projectId}/product-lines/private-cloud`}
                    className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">手动创建</p>
                      <p className="text-xs text-muted-foreground mt-0.5">逐步添加节点</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => !isViewer && setCsvModalOpen(true)}
                    disabled={isViewer}
                    title={isViewer ? "查看者无编辑权限" : undefined}
                    className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-5 text-center hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <FileUp className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">CSV 导入</p>
                      <p className="text-xs text-muted-foreground mt-0.5">批量导入结构</p>
                    </div>
                  </button>
                  <button
                    disabled
                    title="即将推出"
                    className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-5 text-center opacity-50 cursor-not-allowed"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">模板初始化</p>
                      <p className="text-xs text-muted-foreground mt-0.5">即将推出</p>
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          </>
        ) : activeSubTab === "treemap" ? (
          <Card className="flex-1 border-border/60 p-6 shadow-sm">
            {panoramaLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载全景图数据中...
              </div>
            ) : panoramaData?.success && panoramaData.data.length > 0 ? (
              <TreemapView projectId={projectId} initialData={panoramaData.data} />
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                暂无全景图数据
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex-1 border-border/60 p-6 shadow-sm">
            {treeLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载结构数据中...
              </div>
            ) : layers && layers.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                暂无结构数据
              </div>
            )}
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
