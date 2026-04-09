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
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
import { FeatureTree } from "@/components/feature-tree"
import { treeData } from "@/lib/tree-data"
import { moduleDetailData } from "@/lib/module-data"
import { detailStrings } from "@/lib/project-detail-data"
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

export default function ModuleOverviewPage() {
  const params = useParams()
  const projectId = params.id as string
  const moduleId = params.moduleId as string
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedNode, setSelectedNode] = useState(moduleId)
  const [sortBy, setSortBy] = useState("completion")

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
            {/* Breadcrumb and Badge */}
            <div className="flex items-center justify-between mb-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/projects/${projectId}`}>AI云平台竞品分析</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/projects/${projectId}/product-lines/private-cloud`}>{moduleData.productLineName}</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{moduleData.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
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

            <Card className="border-border/60 shadow-sm overflow-hidden">
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
                    <TableRow key={feature.id}>
                      <TableCell>
                        <Link href="/" className="text-primary hover:underline">
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
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}
