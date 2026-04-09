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
  PanelLeftClose,
  PanelLeft,
  Folder,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { treeData } from "@/lib/tree-data"
import { productLinesData } from "@/lib/product-line-data"
import { detailStrings } from "@/lib/project-detail-data"
import { cn } from "@/lib/utils"

function getStatusColor(percent: number) {
  if (percent >= 80) return "bg-green-500"
  if (percent >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

function getDimensionBadgeStyle(current: number, total: number) {
  const ratio = current / total
  if (ratio >= 0.8) return "bg-green-50 text-green-700"
  if (ratio >= 0.4) return "bg-yellow-50 text-yellow-700"
  return "bg-red-50 text-red-700"
}

export default function ProductLineOverviewPage() {
  const params = useParams()
  const projectId = params.id as string
  const plId = params.plId as string
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedNode, setSelectedNode] = useState(plId)

  const productLine = productLinesData[plId] || productLinesData["private-cloud"]

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
          <Link href="/projects" className="font-semibold text-sidebar-foreground hover:text-primary transition-colors">Prism</Link>
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
              selectedId={selectedNode}
              onSelect={setSelectedNode}
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
            <Link href="/search" className="relative w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={detailStrings.searchPlaceholder} className="pl-9 cursor-pointer" readOnly />
            </Link>
          </div>
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-6 border-b border-border px-6">
          <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
            全景图
          </Link>
          <Link href={`/projects/${projectId}/product-lines/private-cloud`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">
            产品线
          </Link>
          <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
            需求分析
          </Link>
          <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
            竞品对比
          </Link>
          <div className="flex-1" />
          <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
            <Settings className="h-3.5 w-3.5" />
            设置
          </Link>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/projects/${projectId}`}>AI云平台竞品分析</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{productLine.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="border-border/60 p-4 shadow-sm">
                <span className="text-3xl font-bold text-foreground">{productLine.moduleCount}</span>
                <p className="text-sm text-muted-foreground">功能模块</p>
              </Card>
              <Card className="border-border/60 p-4 shadow-sm">
                <span className="text-3xl font-bold text-foreground">{productLine.featureCount}</span>
                <p className="text-sm text-muted-foreground">功能项</p>
              </Card>
              <Card className="border-border/60 p-4 shadow-sm">
                <span className="text-3xl font-bold text-primary">{productLine.avgCompletion}%</span>
                <Progress value={productLine.avgCompletion} className="mt-2 h-2" />
                <p className="text-sm text-muted-foreground mt-1">平均完善度</p>
              </Card>
            </div>

            {/* Module List */}
            <div className="space-y-3">
              {productLine.modules.map((module) => (
                <Link key={module.id} href={`/projects/${projectId}/modules/${module.id}`}>
                  <Card className="border-border/60 shadow-sm p-4 hover:border-primary/30 cursor-pointer transition-colors">
                    {/* Top Row */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                        <Folder className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{module.name}</span>
                      <div className="flex-1" />
                      <span className="text-sm text-muted-foreground">{module.featureCount}个功能项</span>
                      <span className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(module.completion))} />
                      <span className="text-sm font-medium text-foreground">{module.completion}%</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Dimension Tags */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {module.dimensions.map((dim) => (
                        <span
                          key={dim.name}
                          className={cn(
                            "text-xs px-2 py-0.5 rounded",
                            getDimensionBadgeStyle(dim.current, dim.total)
                          )}
                        >
                          {dim.name} {dim.current}/{dim.total}
                        </span>
                      ))}
                    </div>

                    {/* Last Update */}
                    <p className="mt-2 text-xs text-muted-foreground">
                      最近更新：{module.lastUpdate.user} {module.lastUpdate.action} — {module.lastUpdate.time}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
