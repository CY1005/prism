"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  Search, Bell, ChevronRight, LogOut, Settings, Shield, ArrowLeft,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"
import { panoramaModules, panoramaStats, type PanoramaModule } from "@/lib/panorama-data"

function getCompletionColor(percent: number) {
  if (percent >= 80) return "bg-emerald-50 border-emerald-200/60 hover:border-emerald-300"
  if (percent >= 40) return "bg-amber-50/70 border-amber-200/60 hover:border-amber-300"
  return "bg-rose-50/70 border-rose-200/60 hover:border-rose-300"
}

function getCompletionTextColor(percent: number) {
  if (percent >= 80) return "text-emerald-600"
  if (percent >= 40) return "text-amber-600"
  return "text-rose-500"
}

function getCompletionDot(percent: number) {
  if (percent >= 80) return "bg-emerald-400"
  if (percent >= 40) return "bg-amber-400"
  return "bg-rose-400"
}

// Calculate relative sizes for treemap simulation
function getBlockSize(count: number, total: number) {
  const ratio = count / total
  if (ratio >= 0.2) return "col-span-2 row-span-2"
  if (ratio >= 0.13) return "col-span-2 row-span-1"
  return "col-span-1 row-span-1"
}

export default function PanoramaTreemapPage() {
  const params = useParams()
  const projectId = params.id as string
  const [selectedModule, setSelectedModule] = useState<PanoramaModule | null>(null)

  const totalFeatures = panoramaModules.reduce((sum, m) => sum + m.featureCount, 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <Link href="/search" className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={detailStrings.searchPlaceholder} className="pl-9 cursor-pointer" readOnly />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href="/admin"><Shield className="h-4 w-4 text-muted-foreground" /></Link></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/projects/${projectId}/settings`}><Settings className="h-4 w-4 text-muted-foreground" /></Link></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Bell className="h-4 w-4 text-muted-foreground" /></Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-muted text-sm">{detailStrings.userInitials}</AvatarFallback></Avatar>
            <span className="text-sm text-foreground">{detailStrings.userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href="/login"><LogOut className="h-4 w-4 text-muted-foreground" /></Link></Button>
        </div>
      </header>

      <div className="px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/projects">{detailStrings.myProjects}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
            <BreadcrumbItem><BreadcrumbLink href={`/projects/${projectId}`}>{detailStrings.projectName}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
            {selectedModule ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" onClick={(e) => { e.preventDefault(); setSelectedModule(null) }}>
                    全景图
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
                <BreadcrumbItem><BreadcrumbPage>{selectedModule.name}</BreadcrumbPage></BreadcrumbItem>
              </>
            ) : (
              <BreadcrumbItem><BreadcrumbPage>全景图</BreadcrumbPage></BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">概览</Link>
        <Link href={`/projects/${projectId}/panorama`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">全景图</Link>
        <Link href={`/projects/${projectId}/product-lines/private-cloud`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">产品线</Link>
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">需求工作台</Link>
        <Link href={`/projects/${projectId}/ai-analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">AI需求分析</Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">竞品对比</Link>
        <Link href={`/projects/${projectId}/relation-graph`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">关系图</Link>
        <Link href={`/projects/${projectId}/data-flow`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">数据流转</Link>
        <Link href={`/projects/${projectId}/feed`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">行业动态</Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />设置
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <Card className="border-border/60 p-4 shadow-sm">
          <span className="text-2xl font-bold text-foreground">{panoramaStats.totalModules}</span>
          <p className="text-sm text-muted-foreground">模块总数</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-sm">
          <span className="text-2xl font-bold text-foreground">{panoramaStats.totalFeatures}</span>
          <p className="text-sm text-muted-foreground">功能项总数</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-sm">
          <span className="text-2xl font-bold text-foreground">{panoramaStats.avgCompletion}</span>
          <p className="text-sm text-muted-foreground">平均完善度</p>
          <Progress value={61} className="mt-2 h-2" />
        </Card>
        <Card className="border-border/60 p-4 shadow-sm">
          <span className="text-2xl font-bold text-foreground">{panoramaStats.lastUpdate}</span>
          <p className="text-sm text-muted-foreground">最近更新</p>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 pb-4">
        {selectedModule && (
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setSelectedModule(null)}>
            <ArrowLeft className="h-3.5 w-3.5" />
            返回模块视图
          </Button>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>面积 = 功能项数量</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-rose-100 border border-rose-300" />完善度 &lt; 40%</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-100 border border-amber-300" />40% - 80%</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 border border-emerald-300" />完善度 &gt; 80%</span>
        </div>
      </div>

      {/* Treemap */}
      <div className="flex-1 px-6 pb-6">
        <Card className="border-border/60 shadow-sm p-4 min-h-[500px]">
          {selectedModule ? (
            /* Feature-level treemap */
            <div className="grid grid-cols-4 auto-rows-[120px] gap-3 h-full">
              {selectedModule.features.map((feature) => {
                const totalItems = selectedModule.features.reduce((sum, f) => sum + f.itemCount, 0)
                const sizeClass = getBlockSize(feature.itemCount, totalItems)
                return (
                  <div
                    key={feature.id}
                    className={`${sizeClass} ${getCompletionColor(feature.completion)} rounded-lg border-2 p-4 cursor-pointer transition-all flex flex-col justify-between`}
                  >
                    <div>
                      <h4 className="font-medium text-foreground text-sm">{feature.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{feature.itemCount} 个知识项</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${getCompletionTextColor(feature.completion)}`}>
                        {feature.completion}%
                      </span>
                      <span className={`h-2 w-2 rounded-full ${getCompletionDot(feature.completion)}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Module-level treemap */
            <div className="grid grid-cols-5 auto-rows-[140px] gap-3 h-full">
              {panoramaModules.map((module) => {
                const sizeClass = getBlockSize(module.featureCount, totalFeatures)
                return (
                  <div
                    key={module.id}
                    className={`${sizeClass} ${getCompletionColor(module.completion)} rounded-lg border-2 p-5 cursor-pointer transition-all flex flex-col justify-between hover:shadow-md`}
                    onClick={() => setSelectedModule(module)}
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{module.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{module.featureCount} 个功能项</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-2xl font-bold ${getCompletionTextColor(module.completion)}`}>
                          {module.completion}%
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        点击展开
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
