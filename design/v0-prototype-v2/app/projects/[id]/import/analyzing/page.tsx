"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  Check,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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

const analysisMessages = [
  "正在解析 平台功能全景-R3.9.3.md... 识别到 27 个功能模块",
  "正在分析 推理服务/副本与调度/双状态机.md... 归类为 技术实现",
  "正在解析 集群与GPU/GPU管理/Orion-vGPU.md... 归类为 技术实现",
  "正在分析 用户与空间/计费/支付宝对接.md... 归类为 技术实现",
  "正在识别跨模块引用关系...",
  "正在检测产品线差异标签...",
  "正在生成映射建议...",
]

export default function AnalyzingPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const currentStep = 3
  const [progress, setProgress] = useState(0)
  const [filesAnalyzed, setFilesAnalyzed] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => {
            router.push(`/projects/${projectId}/import/mapping`)
          }, 500)
          return 100
        }
        return prev + 2
      })
    }, 100)

    const filesInterval = setInterval(() => {
      setFilesAnalyzed((prev) => {
        if (prev >= 47) {
          clearInterval(filesInterval)
          return 47
        }
        return prev + 1
      })
    }, 100)

    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => {
        const next = prev + 1
        if (next < analysisMessages.length) {
          setMessages((msgs) => [...msgs, analysisMessages[next]])
        }
        return next
      })
    }, 700)

    // Initial message
    setMessages([analysisMessages[0]])

    return () => {
      clearInterval(progressInterval)
      clearInterval(filesInterval)
      clearInterval(messageInterval)
    }
  }, [router, projectId])

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
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    step.id === currentStep ? "text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-24 h-px mx-2 ${
                    step.id < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 pb-6 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center max-w-lg">
          {/* Spinner */}
          <div className="mb-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-foreground mb-4">
            AI 正在分析文件内容...
          </h2>

          {/* Progress Messages */}
          <div className="w-full h-32 mb-6 overflow-hidden">
            <div className="space-y-2">
              {messages.slice(-4).map((msg, index) => (
                <p
                  key={index}
                  className={`text-sm transition-opacity ${
                    index === messages.slice(-4).length - 1
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg}
                </p>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                已分析 {filesAnalyzed}/47 个文件
              </span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
