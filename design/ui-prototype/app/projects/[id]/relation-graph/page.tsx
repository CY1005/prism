"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  Search, Bell, ChevronRight, ChevronDown, LogOut, Settings, Shield, Plus, X, Layers, LayoutGrid,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"
import {
  moduleNodes, moduleEdges, moduleFeatures, featureEdges,
  graphNodes, graphEdges, relationTypeConfig, type RelationType,
} from "@/lib/relation-graph-data"

function getStatusColor(percent: number) {
  if (percent >= 80) return "bg-green-500"
  if (percent >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

type ViewMode = "module" | "feature"

export default function RelationGraphPage() {
  const params = useParams()
  const projectId = params.id as string
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("module")
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [filters, setFilters] = useState<Record<RelationType, boolean>>({
    depends_on: true,
    related_to: true,
    conflicts_with: true,
  })

  const toggleFilter = (type: RelationType) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  // Module view data
  const filteredModuleEdges = moduleEdges.filter((e) => filters[e.type])
  const selectedModuleData = moduleNodes.find((n) => n.id === selectedNode)
  const selectedModuleEdges = selectedNode
    ? moduleEdges.filter((e) => e.from === selectedNode || e.to === selectedNode)
    : []
  const selectedModuleFeatures = selectedNode && moduleFeatures[selectedNode]
    ? moduleFeatures[selectedNode]
    : []

  // Feature view data (legacy flat graph)
  const filteredEdges = graphEdges.filter((e) => filters[e.type])
  const selectedFeatureNodeData = graphNodes.find((n) => n.id === selectedNode)
  const selectedFeatureNodeEdges = selectedNode
    ? graphEdges.filter((e) => e.from === selectedNode || e.to === selectedNode)
    : []

  // Expanded module feature-level relations
  const expandedModuleFeatures = expandedModule && moduleFeatures[expandedModule]
    ? moduleFeatures[expandedModule]
    : []
  const expandedFeatureEdges = expandedModule
    ? featureEdges.filter((e) => {
        const features = moduleFeatures[expandedModule] || []
        const featureIds = features.map(f => f.id)
        return featureIds.includes(e.from) || featureIds.includes(e.to)
      })
    : []

  // Stats
  const totalModules = moduleNodes.length
  const totalModuleEdges = moduleEdges.length

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
            <BreadcrumbItem><BreadcrumbPage>关系图</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">全景图</Link>
        <Link href={`/projects/${projectId}/product-lines/private-cloud`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">产品线</Link>
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">需求工作台</Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">竞品对比</Link>
        <Link href={`/projects/${projectId}/relation-graph`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">关系图</Link>
        <Link href={`/projects/${projectId}/insights`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">行业动态</Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />设置
        </Link>
      </div>

      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">模块关系图</h2>
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "module" ? "default" : "ghost"}
              size="sm"
              className="rounded-none gap-1.5 h-8"
              onClick={() => { setViewMode("module"); setSelectedNode(null); setExpandedModule(null) }}
            >
              <Layers className="h-3.5 w-3.5" />
              模块视图
            </Button>
            <Button
              variant={viewMode === "feature" ? "default" : "ghost"}
              size="sm"
              className="rounded-none gap-1.5 h-8"
              onClick={() => { setViewMode("feature"); setSelectedNode(null); setExpandedModule(null) }}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              功能项视图
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(Object.entries(relationTypeConfig) as [RelationType, typeof relationTypeConfig.depends_on][]).map(([type, config]) => (
            <Button
              key={type}
              variant={filters[type] ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => toggleFilter(type)}
            >
              <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
              {config.label}
            </Button>
          ))}
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />添加关联</Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-6 pb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {viewMode === "module" ? (
            <>
              <span>{totalModules} 个模块</span>
              <span>·</span>
              <span>{totalModuleEdges} 条关联</span>
              <span>·</span>
              <span>点击模块查看功能项级关系</span>
            </>
          ) : (
            <>
              <span>{graphNodes.length} 个节点</span>
              <span>·</span>
              <span>{graphEdges.length} 条关联</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" className="stroke-blue-400" strokeWidth="2" /></svg>
            <span>depends_on (依赖)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" className="stroke-muted-foreground" strokeWidth="2" strokeDasharray="4 2" /></svg>
            <span>related_to (相关)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" className="stroke-red-400" strokeWidth="2" /></svg>
            <span>conflicts_with (冲突)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 px-6 pb-6">
        {viewMode === "module" ? (
          /* ============ MODULE VIEW ============ */
          <>
            <Card className="flex-1 border-border/60 shadow-sm relative overflow-hidden" style={{ minHeight: 500 }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {filteredModuleEdges.map((edge, i) => {
                  const fromNode = moduleNodes.find((n) => n.id === edge.from)
                  const toNode = moduleNodes.find((n) => n.id === edge.to)
                  if (!fromNode || !toNode) return null
                  const config = relationTypeConfig[edge.type]
                  const isHighlighted = selectedNode && (edge.from === selectedNode || edge.to === selectedNode)
                  return (
                    <line
                      key={i}
                      x1={`${fromNode.x + 4}%`}
                      y1={`${fromNode.y + 2}%`}
                      x2={`${toNode.x + 4}%`}
                      y2={`${toNode.y + 2}%`}
                      className={config.stroke}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      strokeDasharray={edge.type === "related_to" ? "6 3" : undefined}
                      opacity={selectedNode ? (isHighlighted ? 1 : 0.15) : 0.6}
                    />
                  )
                })}
              </svg>

              {moduleNodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute rounded-lg border bg-card px-3 py-2 shadow-sm cursor-pointer transition-all hover:border-primary/60 ${
                    selectedNode === node.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                  } ${selectedNode && selectedNode !== node.id ? "opacity-40" : ""}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 2 }}
                  onClick={() => {
                    setSelectedNode(selectedNode === node.id ? null : node.id)
                    setExpandedModule(null)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${getStatusColor(node.completion)}`} />
                    <span className="text-xs font-medium whitespace-nowrap">{node.name}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {node.featureCount} 个功能项
                  </div>
                </div>
              ))}
            </Card>

            {/* Module Detail Panel */}
            {selectedModuleData && (
              <Card className="w-[320px] border-border/60 shadow-sm p-4 shrink-0 overflow-y-auto" style={{ maxHeight: 600 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{selectedModuleData.name}</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">完善度</span>
                    <span className="font-medium">{selectedModuleData.completion}%</span>
                  </div>
                  <Progress value={selectedModuleData.completion} className="h-2" />
                </div>
                <Separator className="mb-4" />

                {/* Module Relations */}
                <h4 className="text-sm font-medium mb-3">模块关联 ({selectedModuleEdges.length})</h4>
                <div className="space-y-2 mb-4">
                  {selectedModuleEdges.map((edge, i) => {
                    const config = relationTypeConfig[edge.type]
                    const otherNodeId = edge.from === selectedNode ? edge.to : edge.from
                    const otherNode = moduleNodes.find((n) => n.id === otherNodeId)
                    const direction = edge.from === selectedNode ? "\u2192" : "\u2190"
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className={`text-xs ${config.color}`}>{config.label}</Badge>
                        <span className="text-muted-foreground">{direction}</span>
                        <span>{otherNode?.name}</span>
                      </div>
                    )
                  })}
                </div>

                <Separator className="mb-4" />

                {/* Feature Items */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">功能项 ({selectedModuleFeatures.length})</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setExpandedModule(expandedModule === selectedNode ? null : selectedNode)}
                  >
                    {expandedModule === selectedNode ? "收起关系" : "展开关系"}
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedModuleFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center gap-2 text-sm border border-border/60 rounded-md p-2">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getStatusColor(feature.completion)}`} />
                      <span className="flex-1 text-xs">{feature.name}</span>
                      <span className="text-xs text-muted-foreground">{feature.completion}%</span>
                    </div>
                  ))}
                </div>

                {/* Feature-level relations when expanded */}
                {expandedModule === selectedNode && expandedFeatureEdges.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <h4 className="text-sm font-medium mb-3">功能项跨模块关系 ({expandedFeatureEdges.length})</h4>
                    <div className="space-y-2">
                      {expandedFeatureEdges.map((edge, i) => {
                        const config = relationTypeConfig[edge.type]
                        // Find feature names
                        let fromName = edge.from
                        let toName = edge.to
                        for (const features of Object.values(moduleFeatures)) {
                          const f = features.find(f => f.id === edge.from)
                          if (f) fromName = f.name
                          const t = features.find(f => f.id === edge.to)
                          if (t) toName = t.name
                        }
                        return (
                          <div key={i} className="text-xs border border-border/60 rounded-md p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Badge variant="outline" className={`text-[10px] ${config.color}`}>{config.label}</Badge>
                              {edge.label && <span className="text-muted-foreground">{edge.label}</span>}
                            </div>
                            <div className="text-muted-foreground">
                              {fromName} → {toName}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                <Separator className="my-4" />
                <Button className="w-full" size="sm">查看档案</Button>
              </Card>
            )}
          </>
        ) : (
          /* ============ FEATURE VIEW (legacy) ============ */
          <>
            <Card className="flex-1 border-border/60 shadow-sm relative overflow-hidden" style={{ minHeight: 500 }}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {filteredEdges.map((edge, i) => {
                  const fromNode = graphNodes.find((n) => n.id === edge.from)
                  const toNode = graphNodes.find((n) => n.id === edge.to)
                  if (!fromNode || !toNode) return null
                  const config = relationTypeConfig[edge.type]
                  const isHighlighted = selectedNode && (edge.from === selectedNode || edge.to === selectedNode)
                  return (
                    <line
                      key={i}
                      x1={`${fromNode.x + 3}%`}
                      y1={`${fromNode.y + 2}%`}
                      x2={`${toNode.x + 3}%`}
                      y2={`${toNode.y + 2}%`}
                      className={config.stroke}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      strokeDasharray={edge.type === "related_to" ? "6 3" : undefined}
                      opacity={selectedNode ? (isHighlighted ? 1 : 0.15) : 0.6}
                    />
                  )
                })}
              </svg>

              {graphNodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute rounded-lg border bg-card px-3 py-2 shadow-sm cursor-pointer transition-all hover:border-primary/60 ${
                    selectedNode === node.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                  } ${selectedNode && selectedNode !== node.id ? "opacity-40" : ""}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%`, zIndex: 2 }}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${getStatusColor(node.completion)}`} />
                    <span className="text-xs font-medium whitespace-nowrap">{node.name}</span>
                  </div>
                </div>
              ))}
            </Card>

            {selectedFeatureNodeData && (
              <Card className="w-[280px] border-border/60 shadow-sm p-4 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{selectedFeatureNodeData.name}</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">完善度</span>
                    <span className="font-medium">{selectedFeatureNodeData.completion}%</span>
                  </div>
                  <Progress value={selectedFeatureNodeData.completion} className="h-2" />
                </div>
                <Separator className="mb-4" />
                <h4 className="text-sm font-medium mb-3">关联 ({selectedFeatureNodeEdges.length})</h4>
                <div className="space-y-2">
                  {selectedFeatureNodeEdges.map((edge, i) => {
                    const config = relationTypeConfig[edge.type]
                    const otherNodeId = edge.from === selectedNode ? edge.to : edge.from
                    const otherNode = graphNodes.find((n) => n.id === otherNodeId)
                    const direction = edge.from === selectedNode ? "\u2192" : "\u2190"
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className={`text-xs ${config.color}`}>{config.label}</Badge>
                        <span className="text-muted-foreground">{direction}</span>
                        <span>{otherNode?.name}</span>
                      </div>
                    )
                  })}
                </div>
                <Separator className="my-4" />
                <Button className="w-full" size="sm">查看档案</Button>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
