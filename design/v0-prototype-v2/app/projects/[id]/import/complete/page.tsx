"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const steps = [
  { id: 1, name: "上传文件" },
  { id: 2, name: "文件预览" },
  { id: 3, name: "AI分析" },
  { id: 4, name: "确认映射" },
  { id: 5, name: "导入完成" },
]

const importDetails = [
  {
    type: "split",
    label: "拆分导入",
    content: "平台功能全景-R3.9.3.md → 27个模块的功能描述",
  },
  {
    type: "direct",
    label: "直接导入",
    content: "推理服务/副本与调度/双状态机.md → 推理服务/技术实现",
  },
  {
    type: "direct",
    label: "直接导入",
    content: "集群与GPU/GPU管理/Orion-vGPU.md → GPU管理/技术实现",
  },
  {
    type: "direct",
    label: "直接导入",
    content: "_组件/SeaweedFS.md → 存储管理/技术实现",
  },
  {
    type: "direct",
    label: "直接导入",
    content: "排查与运维/推理服务OOM.md → 推理服务/工程经验",
  },
  {
    type: "direct",
    label: "直接导入",
    content: "用户与空间/计费/支付宝对接.md → 计费管理/技术实现",
  },
  {
    type: "skip",
    label: "跳过",
    content: "README.md（无可导入内容）",
  },
  {
    type: "skip",
    label: "跳过",
    content: "_全景/Gemini平台Bug趋势.md（待确认）",
  },
  {
    type: "skip",
    label: "跳过",
    content: "_行业/竞品分析.md（多模块冲突）",
  },
  {
    type: "direct",
    label: "直接导入",
    content: "任务与训练/任务提交流程.md → 任务管理/功能描述",
  },
]

export default function CompletePage() {
  const params = useParams()
  const projectId = params.id as string
  const currentStep = 5
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
          Prism
        </Link>
        <Link href="/search" className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索功能、模块、标签..." className="pl-9 cursor-pointer" readOnly />
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
              <AvatarFallback className="bg-muted text-sm">陈</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">陈玥</span>
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
              <BreadcrumbLink href="/projects">我的项目</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}`}>AI云平台竞品分析</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>导入数据</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Progress Steps */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-0">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-500 text-white">
                  <Check className="h-4 w-4" />
                </div>
                <span
                  className={`text-xs mt-2 ${
                    step.id === currentStep ? "text-green-600 font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-24 h-px mx-2 bg-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-6 flex flex-col items-center">
        <div className="flex flex-col items-center text-center max-w-2xl w-full">
          {/* Success Icon */}
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-foreground mb-8">导入完成</h2>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 w-full mb-8">
            <Card className="border-border/60 p-4 text-center">
              <span className="text-2xl font-bold text-foreground">39</span>
              <p className="text-sm text-muted-foreground mt-1">成功导入文件</p>
              <p className="text-xs text-muted-foreground">→ 26个模块 / 377个功能项</p>
            </Card>
            <Card className="border-border/60 p-4 text-center">
              <span className="text-2xl font-bold text-foreground">15</span>
              <p className="text-sm text-muted-foreground mt-1">自动建立关联</p>
            </Card>
            <Card className="border-border/60 p-4 text-center">
              <span className="text-2xl font-bold text-muted-foreground">8</span>
              <p className="text-sm text-muted-foreground mt-1">跳过文件</p>
              <p className="text-xs text-muted-foreground">可展开查看原因</p>
            </Card>
          </div>

          {/* Details List */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between mb-2">
                <span className="text-sm font-medium">导入详情</span>
                {detailsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="border-border/60">
                <ScrollArea className="h-64">
                  <div className="p-4 space-y-2">
                    {importDetails.map((detail, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 py-2 text-sm"
                      >
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-xs ${
                            detail.type === "split"
                              ? "bg-blue-100 text-blue-700"
                              : detail.type === "direct"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {detail.label}
                        </span>
                        <span className="text-muted-foreground">{detail.content}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 mt-8">
            <Button asChild>
              <Link href={`/projects/${projectId}`}>查看项目全景图</Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="text-muted-foreground">
                撤销本次导入
              </Button>
              <span className="text-xs text-muted-foreground">可在30天内撤销</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
