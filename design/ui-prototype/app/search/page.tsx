"use client"

import Link from "next/link"
import { Search, Bell, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const searchStrings = {
  userName: "陈琦",
  userInitials: "陈",
  projectScope: "项目范围",
  dimensionType: "维度类型",
  resultsFound: "跨 2 个项目找到 3 条结果",
}

const searchResults = [
  {
    project: "AI云平台",
    projectColor: "blue",
    title: "拼卡管理",
    path: "私有云 > 推理服务 > 拼卡管理",
    textBefore: "...支持多块",
    highlight: "GPU",
    textAfter: "拼卡组成虚拟大显存...",
    badge: "功能描述",
    link: "/",
  },
  {
    project: "AI云平台",
    projectColor: "blue",
    title: "创建推理服务",
    path: "私有云 > 推理服务 > 创建推理服务",
    textBefore: "...",
    highlight: "GPU调度",
    textAfter: "基于Kubernetes device plugin...",
    badge: "技术实现",
    link: "/",
  },
  {
    project: "OpenClaw",
    projectColor: "green",
    title: "消息路由",
    path: "路由层 > FastAPI Router > 消息路由",
    textBefore: "...路由层根据消息类型和上下文分发到对应skill处理器...",
    highlight: "",
    textAfter: "",
    badge: "功能描述",
    link: "/openclaw",
  },
]

const projectColorMap: Record<string, string> = {
  blue: "border-blue-200 text-blue-700 bg-blue-50",
  green: "border-green-200 text-green-700 bg-green-50",
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            defaultValue="GPU调度"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-sm">{searchStrings.userInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{searchStrings.userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/login">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex gap-6 p-6">
        <div className="w-[220px] space-y-6">
          {/* Project Scope */}
          <div>
            <h4 className="text-sm font-medium mb-2">{searchStrings.projectScope}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="project-1" defaultChecked />
                <label htmlFor="project-1" className="text-sm">AI云平台竞品分析</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="project-2" defaultChecked />
                <label htmlFor="project-2" className="text-sm">OpenClaw</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="project-3" />
                <label htmlFor="project-3" className="text-sm">MappingStudio</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="project-4" />
                <label htmlFor="project-4" className="text-sm">Prism</label>
              </div>
            </div>
          </div>

          {/* Dimension Type */}
          <div>
            <h4 className="text-sm font-medium mb-2">{searchStrings.dimensionType}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="dim-desc" defaultChecked />
                <label htmlFor="dim-desc" className="text-sm">功能描述</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="dim-tech" defaultChecked />
                <label htmlFor="dim-tech" className="text-sm">技术实现</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="dim-exp" />
                <label htmlFor="dim-exp" className="text-sm">工程经验</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="dim-decision" />
                <label htmlFor="dim-decision" className="text-sm">设计决策</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="dim-api" />
                <label htmlFor="dim-api" className="text-sm">接口规范</label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">{searchStrings.resultsFound}</p>

          {searchResults.map((result, index) => (
            <Card key={index} className="border-border/60 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={cn("text-xs", projectColorMap[result.projectColor])}>
                  {result.project}
                </Badge>
                <Link href={result.link} className="text-sm font-medium text-primary cursor-pointer hover:underline">
                  {result.title}
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">{result.path}</p>
              <p className="text-sm mt-2">
                {result.textBefore}
                {result.highlight && <mark className="bg-yellow-100 px-0.5 rounded">{result.highlight}</mark>}
                {result.textAfter}
              </p>
              <Badge variant="secondary" className="mt-2">{result.badge}</Badge>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
