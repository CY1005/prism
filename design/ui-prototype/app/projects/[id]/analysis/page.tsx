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
  AlertTriangle,
  CheckCircle,
  Scale,
  Users,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"

// Mock analysis result data
const mockAnalysisResult = {
  impactAnalysis: {
    direct: [
      { path: "推理服务 > 路由管理", reason: "需要新增路由规则配置" },
      { path: "推理服务 > 模型调度", reason: "调度策略需要适配新路由" },
    ],
    indirect: [
      { path: "推理服务 > 监控告警", reason: "需要新增路由相关指标" },
      { path: "API网关 > 流量控制", reason: "可能受路由变更影响" },
    ],
  },
  completenessCheck: [
    { text: "功能边界描述清晰", passed: true },
    { text: "异常场景已覆盖", passed: true },
    { text: "性能指标未明确", passed: false },
    { text: "缺少回滚方案", passed: false },
  ],
  reasonabilityEval: [
    { text: "需求与现有架构兼容", passed: true },
    { text: "实现复杂度可控", passed: true },
    { text: "建议参考竞品 A 的路由热更新方案", passed: "warning" as const },
  ],
  userPerspective: [
    {
      role: "运维人员",
      concerns: ["路由变更是否支持热更新？", "变更后如何快速回滚？"],
    },
    {
      role: "开发人员",
      concerns: ["新路由规则的 SDK 调用方式？", "是否兼容现有代码？"],
    },
    {
      role: "产品经理",
      concerns: ["用户感知的切换延迟？", "是否需要用户手动配置？"],
    },
  ],
}

export default function AnalysisPage() {
  const params = useParams()
  const projectId = params.id as string
  const [requirementText, setRequirementText] = useState("")
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = () => {
    if (!requirementText.trim()) return
    setIsAnalyzing(true)
    // Simulate API call
    setTimeout(() => {
      setIsAnalyzing(false)
      setIsAnalyzed(true)
    }, 1500)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <Link href="/search" className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={detailStrings.searchPlaceholder} className="pl-9 cursor-pointer" readOnly />
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

      {/* Breadcrumb */}
      <div className="px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">{detailStrings.myProjects}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}`}>{detailStrings.projectName}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>需求分析工作台</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          全景图
        </Link>
        <Link href={`/projects/${projectId}/product-lines/private-cloud`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          产品线
        </Link>
        <Link href={`/projects/${projectId}/analysis`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">
          需求工作台
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

      {/* Main Content - 50/50 Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Input Area */}
        <div className="w-1/2 border-r border-border p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-2">需求描述</h2>
          <Textarea
            className="flex-1 min-h-[300px] resize-none"
            placeholder="输入需求描述，AI 将分析影响范围和完整性..."
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
          />
          <Button 
            className="mt-4 w-fit" 
            onClick={handleAnalyze}
            disabled={!requirementText.trim() || isAnalyzing}
          >
            {isAnalyzing ? "分析中..." : "AI 分析"}
          </Button>
        </div>

        {/* Right Side - Analysis Results */}
        <div className="w-1/2 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {!isAnalyzed ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <p className="text-sm">输入需求后点击「AI 分析」查看结果</p>
                </div>
              ) : (
                <>
                  {/* Impact Analysis */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h3 className="font-medium">影响范围</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">直接影响</p>
                        <div className="space-y-2">
                          {mockAnalysisResult.impactAnalysis.direct.map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/10 shrink-0">直接</Badge>
                              <div>
                                <span className="text-sm font-medium">{item.path}</span>
                                <p className="text-xs text-muted-foreground">{item.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">间接影响</p>
                        <div className="space-y-2">
                          {mockAnalysisResult.impactAnalysis.indirect.map((item, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <Badge variant="secondary" className="shrink-0">间接</Badge>
                              <div>
                                <span className="text-sm font-medium">{item.path}</span>
                                <p className="text-xs text-muted-foreground">{item.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Completeness Check */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">完整性评估</h3>
                    </div>
                    <div className="space-y-2">
                      {mockAnalysisResult.completenessCheck.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span>{item.passed ? "\u2705" : "\u274C"}</span>
                          <span className={item.passed ? "text-foreground" : "text-muted-foreground"}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Reasonability Evaluation */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Scale className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-medium">合理性评估</h3>
                    </div>
                    <div className="space-y-2">
                      {mockAnalysisResult.reasonabilityEval.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span>{item.passed === true ? "\u2705" : item.passed === "warning" ? "\u26A0\uFE0F" : "\u274C"}</span>
                          <span className="text-foreground">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* User Perspective */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">用户视角评估</h3>
                    </div>
                    <div className="space-y-4">
                      {mockAnalysisResult.userPerspective.map((roleData, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium mb-2">{roleData.role}</p>
                          <ul className="space-y-1 pl-4">
                            {roleData.concerns.map((concern, cIndex) => (
                              <li key={cIndex} className="text-sm text-muted-foreground list-disc">
                                {concern}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Bottom Action Bar */}
          {isAnalyzed && (
            <div className="border-t border-border p-4 flex items-center justify-between bg-card">
              <Button variant="outline">保存分析结果</Button>
              <Button>生成测试点</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
