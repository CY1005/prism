"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  Search, Bell, ChevronRight, LogOut, Settings, Shield, Rss, Bot, Check, X, Eye, EyeOff, Link2, Plus, Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"
import { feedItems, rssSources, feedStatusConfig, type FeedItem, type FeedStatus } from "@/lib/feed-data"

export default function FeedPage() {
  const params = useParams()
  const projectId = params.id as string
  const [statusFilter, setStatusFilter] = useState<FeedStatus | "all">("all")
  const [items, setItems] = useState<FeedItem[]>(feedItems)
  const [showSources, setShowSources] = useState(false)

  const filtered = statusFilter === "all"
    ? items
    : items.filter((i) => i.status === statusFilter)

  const handleConfirmLink = (id: string) => {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, status: "linked" as FeedStatus } : item
    ))
  }

  const handleIgnore = (id: string) => {
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, status: "ignored" as FeedStatus } : item
    ))
  }

  const pendingCount = items.filter((i) => i.status === "pending").length

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
            <BreadcrumbItem><BreadcrumbPage>行业动态</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">概览</Link>
        <Link href={`/projects/${projectId}/panorama`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">全景图</Link>
        <Link href={`/projects/${projectId}/product-lines/ops-management`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">产品线</Link>
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">需求工作台</Link>
        <Link href={`/projects/${projectId}/ai-analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">AI需求分析</Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">竞品对比</Link>
        <Link href={`/projects/${projectId}/relation-graph`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">关系图</Link>
        <Link href={`/projects/${projectId}/data-flow`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">数据流转</Link>
        <Link href={`/projects/${projectId}/feed`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">行业动态</Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />设置
        </Link>
      </div>

      {/* AI Auto-search Indicator */}
      <div className="flex items-center justify-between px-6 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="h-4 w-4 text-primary" />
          <span>AI 基于项目知识库自动搜索，上次搜索时间：2小时前</span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">{pendingCount} 条待确认</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSources(!showSources)}>
          <Rss className="h-3.5 w-3.5" />
          {showSources ? "隐藏订阅源" : "管理订阅源"}
        </Button>
      </div>

      {/* RSS Sources Panel */}
      {showSources && (
        <div className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">RSS 订阅源</h3>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              添加订阅源
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {rssSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${source.enabled ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className="text-sm font-medium">{source.name}</span>
                  <span className="text-xs text-muted-foreground">{source.url}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">上次抓取：{source.lastFetched}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    {source.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">行业动态 Feed</h2>
          <Badge variant="secondary">{filtered.length} 条</Badge>
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FeedStatus | "all")}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待确认</SelectItem>
            <SelectItem value="linked">已关联</SelectItem>
            <SelectItem value="ignored">已忽略</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feed List */}
      <ScrollArea className="flex-1">
        <div className="px-6 pb-6 space-y-4">
          {filtered.map((item) => {
            const statusConf = feedStatusConfig[item.status]
            return (
              <Card key={item.id} className={`border-border/60 shadow-sm p-5 ${item.status === "ignored" ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-xs ${item.sourceColor}`}>
                      {item.source}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${statusConf.color}`}>
                      {statusConf.label}
                    </Badge>
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">{item.date}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>

                <Separator className="mb-3" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">AI 推荐关联：</span>
                    {item.relatedFeatures.map((rf, i) => (
                      <Badge key={i} variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
                        <Link2 className="h-3 w-3 mr-1" />
                        {rf.module} / {rf.feature}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs ml-1">
                      置信度 {item.confidence}%
                    </Badge>
                  </div>

                  {item.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 gap-1"
                        onClick={() => handleConfirmLink(item.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        确认关联
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-muted-foreground"
                        onClick={() => handleIgnore(item.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                        忽略
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
