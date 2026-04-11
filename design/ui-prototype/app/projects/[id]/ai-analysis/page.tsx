"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useRef } from "react"
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
  FileText,
  Upload,
  Loader2,
  X,
  Zap,
  Radar,
  Globe,
  ChevronDown,
  ListChecks,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"
import { treeData } from "@/lib/tree-data"
import { FeatureTree } from "@/components/feature-tree"
import {
  aiAnalysisStrings,
  l1Findings,
  l1KnownIssues,
  l1Completeness,
  l1Reasonability,
  l1UserPerspective,
  l2Findings,
  l3Findings,
  affectedModules,
  generatedTestPoints,
} from "@/lib/ai-analysis-data"
import type { TestPoint, AffectedModule } from "@/lib/ai-analysis-data"
import { ToastNotification } from "@/components/toast-notification"

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-700 border-red-200"
    case "warning": return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "info": return "bg-blue-100 text-blue-700 border-blue-200"
    default: return "bg-muted text-muted-foreground"
  }
}

function getSeverityLabel(severity: string) {
  switch (severity) {
    case "critical": return "严重"
    case "warning": return "注意"
    case "info": return "建议"
    default: return severity
  }
}

function getRelationColor(relation: string) {
  switch (relation) {
    case "direct": return "bg-red-500"
    case "depends_on": return "bg-orange-500"
    case "related_to": return "bg-yellow-500"
    case "indirect": return "bg-blue-500"
    default: return "bg-muted"
  }
}

function getRelationLabel(relation: string) {
  switch (relation) {
    case "direct": return "直接影响"
    case "depends_on": return "依赖"
    case "related_to": return "关联"
    case "indirect": return "间接影响"
    default: return relation
  }
}

// Streaming dots animation component
function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-2">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
    </span>
  )
}

export default function AiAnalysisPage() {
  const params = useParams()
  const projectId = params.id as string
  const [requirementText, setRequirementText] = useState("推理服务支持滚动更新策略，允许用户在不中断服务的情况下更新模型版本，支持配置最大不可用副本数和滚动更新间隔。")
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisLevel, setAnalysisLevel] = useState<0 | 1 | 2 | 3>(1) // default show L1 results
  const [isExpandingL2, setIsExpandingL2] = useState(false)
  const [isExpandingL3, setIsExpandingL3] = useState(false)
  const [showTestPoints, setShowTestPoints] = useState(false)
  const [testPoints, setTestPoints] = useState<TestPoint[]>(generatedTestPoints)
  const [isGeneratingTests, setIsGeneratingTests] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedTreeId, setSelectedTreeId] = useState("create-inference")

  const hasContent = requirementText.trim() || uploadedFile

  const handleAnalyze = () => {
    if (!hasContent) return
    setIsAnalyzing(true)
    setAnalysisLevel(0)
    setShowTestPoints(false)
    setTimeout(() => {
      setIsAnalyzing(false)
      setAnalysisLevel(1)
    }, 2000)
  }

  const handleExpandL2 = () => {
    setIsExpandingL2(true)
    setTimeout(() => {
      setIsExpandingL2(false)
      setAnalysisLevel(2)
    }, 1500)
  }

  const handleExpandL3 = () => {
    setIsExpandingL3(true)
    setTimeout(() => {
      setIsExpandingL3(false)
      setAnalysisLevel(3)
    }, 1500)
  }

  const handleGenerateTestPoints = () => {
    setIsGeneratingTests(true)
    setTimeout(() => {
      setIsGeneratingTests(false)
      setShowTestPoints(true)
    }, 1500)
  }

  const handleToggleTestPoint = (id: string) => {
    setTestPoints(prev =>
      prev.map(tp => tp.id === id ? { ...tp, checked: !tp.checked } : tp)
    )
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const size = file.size < 1024 * 1024
      ? (file.size / 1024).toFixed(1) + " KB"
      : (file.size / (1024 * 1024)).toFixed(1) + " MB"
    setUploadedFile({ name: file.name, size })
  }

  const selectedCount = testPoints.filter(tp => tp.checked).length

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
              <BreadcrumbPage>{aiAnalysisStrings.pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">概览</Link>
        <Link href={`/projects/${projectId}/panorama`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">全景图</Link>
        <Link href={`/projects/${projectId}/product-lines/ops-management`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">产品线</Link>
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">需求工作台</Link>
        <Link href={`/projects/${projectId}/ai-analysis`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">AI需求分析</Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">竞品对比</Link>
        <Link href={`/projects/${projectId}/relation-graph`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">关系图</Link>
        <Link href={`/projects/${projectId}/data-flow`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">数据流转</Link>
        <Link href={`/projects/${projectId}/feed`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">行业动态</Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          设置
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Feature Tree */}
        <div className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto">
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-medium text-muted-foreground">功能树</h3>
          </div>
          <FeatureTree data={treeData} selectedId={selectedTreeId} onSelect={setSelectedTreeId} />
        </div>

        {/* Middle: Input + Results */}
        <div className="flex-1 flex flex-col border-r border-border">
          {/* Input Area */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">需求输入</h2>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.doc,.docx,.txt"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  上传文档
                </Button>
              </div>
            </div>

            <Textarea
              className="min-h-[120px] resize-none"
              placeholder={aiAnalysisStrings.inputPlaceholder}
              value={requirementText}
              onChange={(e) => setRequirementText(e.target.value)}
            />

            {uploadedFile && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1.5 py-1 px-2 text-xs">
                  <FileText className="h-3 w-3" />
                  <span className="max-w-[200px] truncate">{uploadedFile.name}</span>
                  <span className="text-muted-foreground">({uploadedFile.size})</span>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}

            <div className="flex items-center gap-3 mt-3">
              <Button onClick={handleAnalyze} disabled={!hasContent || isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    {aiAnalysisStrings.analyzingText}
                    <StreamingDots />
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-1.5" />
                    {aiAnalysisStrings.analyzeButton}
                  </>
                )}
              </Button>
              {isAnalyzing && (
                <span className="text-xs text-muted-foreground">AI 正在分析需求文本，识别影响范围...</span>
              )}
            </div>
          </div>

          {/* Results Area */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {analysisLevel === 0 && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Zap className="h-10 w-10 mb-4 text-muted-foreground/50" />
                  <p className="text-sm">输入需求后点击「分析」，AI 将渐进式展开分析</p>
                  <p className="text-xs mt-2 text-muted-foreground/70">L1 快速分析 → L2 关联模块 → L3 全局扫描</p>
                </div>
              )}

              {/* L1 Results */}
              {analysisLevel >= 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
                    <h3 className="font-semibold text-base">{aiAnalysisStrings.l1Title}</h3>
                    <Badge variant="outline" className="text-xs">基于当前功能项</Badge>
                  </div>

                  {/* Impact + Completeness */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h4 className="font-medium">{aiAnalysisStrings.impactTitle}</h4>
                    </div>
                    <div className="space-y-3">
                      {l1Findings.map(finding => (
                        <div key={finding.id} className="flex items-start gap-2">
                          <Badge className={`${getSeverityColor(finding.severity)} shrink-0 text-xs border`}>
                            {getSeverityLabel(finding.severity)}
                          </Badge>
                          <div>
                            <span className="text-sm font-medium">{finding.dimension}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{finding.content}</p>
                            <Badge variant="outline" className="text-[10px] mt-1 h-4 px-1.5">{finding.source}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Known Issues */}
                  <Card className="border-border/60 shadow-sm p-5 border-l-4 border-l-red-400">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h4 className="font-medium">{aiAnalysisStrings.knownIssuesTitle}</h4>
                      <Badge variant="destructive" className="text-xs">{l1KnownIssues.length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {l1KnownIssues.map(issue => (
                        <div key={issue.id} className="rounded-md border border-red-200 bg-red-50/50 p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs border-red-300 text-red-600">{issue.type}</Badge>
                            <span className="text-sm font-medium">{issue.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                          <Badge variant="outline" className="text-[10px] mt-1.5 h-4 px-1.5">{issue.source}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Completeness */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">{aiAnalysisStrings.completenessTitle}</h4>
                    </div>
                    <div className="space-y-2">
                      {l1Completeness.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span>{item.passed ? "\u2705" : "\u274C"}</span>
                          <span className={item.passed ? "text-foreground" : "text-muted-foreground"}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Reasonability */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Scale className="h-5 w-5 text-yellow-500" />
                      <h4 className="font-medium">{aiAnalysisStrings.reasonabilityTitle}</h4>
                    </div>
                    <div className="space-y-2">
                      {l1Reasonability.map((item, index) => (
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
                      <h4 className="font-medium">{aiAnalysisStrings.userPerspectiveTitle}</h4>
                    </div>
                    <div className="space-y-4">
                      {l1UserPerspective.map((roleData, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium mb-2">{roleData.role}</p>
                          <ul className="space-y-1 pl-4">
                            {roleData.concerns.map((concern, cIndex) => (
                              <li key={cIndex} className="text-sm text-muted-foreground list-disc">{concern}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Expand L2 button */}
                  {analysisLevel === 1 && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        onClick={handleExpandL2}
                        disabled={isExpandingL2}
                        className="gap-2"
                      >
                        {isExpandingL2 ? (
                          <>
                            扩展分析中
                            <StreamingDots />
                          </>
                        ) : (
                          <>
                            <Radar className="h-4 w-4" />
                            {aiAnalysisStrings.expandL2}
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* L2 Results */}
              {analysisLevel >= 2 && (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-bold">2</div>
                    <h3 className="font-semibold text-base">{aiAnalysisStrings.l2Title}</h3>
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">基于关联模块</Badge>
                  </div>

                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="space-y-3">
                      {l2Findings.map(finding => (
                        <div key={finding.id} className="flex items-start gap-2">
                          <Badge className={`${getSeverityColor(finding.severity)} shrink-0 text-xs border`}>
                            {getSeverityLabel(finding.severity)}
                          </Badge>
                          <div>
                            <span className="text-sm font-medium">{finding.dimension}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{finding.content}</p>
                            <Badge variant="outline" className="text-[10px] mt-1 h-4 px-1.5 border-orange-300 text-orange-600">{finding.source}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Expand L3 button */}
                  {analysisLevel === 2 && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        onClick={handleExpandL3}
                        disabled={isExpandingL3}
                        className="gap-2"
                      >
                        {isExpandingL3 ? (
                          <>
                            全局扫描中
                            <StreamingDots />
                          </>
                        ) : (
                          <>
                            <Globe className="h-4 w-4" />
                            {aiAnalysisStrings.expandL3}
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* L3 Results */}
              {analysisLevel >= 3 && (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-xs font-bold">3</div>
                    <h3 className="font-semibold text-base">{aiAnalysisStrings.l3Title}</h3>
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">基于全局扫描</Badge>
                  </div>

                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="space-y-3">
                      {l3Findings.map(finding => (
                        <div key={finding.id} className="flex items-start gap-2">
                          <Badge className={`${getSeverityColor(finding.severity)} shrink-0 text-xs border`}>
                            {getSeverityLabel(finding.severity)}
                          </Badge>
                          <div>
                            <span className="text-sm font-medium">{finding.dimension}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{finding.content}</p>
                            <Badge variant="outline" className="text-[10px] mt-1 h-4 px-1.5 border-blue-300 text-blue-600">{finding.source}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Extra spacing at bottom */}
              {analysisLevel >= 1 && <div className="h-4" />}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side: Module Diagram + Test Points */}
        <div className="w-[380px] flex flex-col">
          {/* Affected Modules Mini Diagram */}
          {analysisLevel >= 1 && (
            <div className="p-5 border-b border-border">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Radar className="h-4 w-4 text-muted-foreground" />
                {aiAnalysisStrings.affectedModulesTitle}
              </h3>
              <div className="space-y-3">
                {/* Level 1 modules */}
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-muted-foreground w-8 shrink-0">L1</div>
                  <div className="flex gap-2 flex-wrap">
                    {affectedModules.filter(m => m.level === 1).map(m => (
                      <div
                        key={m.name}
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                          m.highlighted
                            ? "border-red-300 bg-red-50 text-red-700"
                            : "border-border bg-card text-foreground"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${getRelationColor(m.relation)}`} />
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Connector */}
                <div className="flex items-center gap-2">
                  <div className="w-8" />
                  <div className="flex gap-4 pl-4">
                    <div className="h-4 w-px bg-border" />
                    <div className="h-4 w-px bg-border" />
                  </div>
                </div>
                {/* Level 2 modules */}
                {analysisLevel >= 2 && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-muted-foreground w-8 shrink-0">L2</div>
                      <div className="flex gap-2 flex-wrap">
                        {affectedModules.filter(m => m.level === 2).map(m => (
                          <div
                            key={m.name}
                            className="flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700"
                          >
                            <span className={`h-2 w-2 rounded-full ${getRelationColor(m.relation)}`} />
                            {m.name}
                            <span className="text-[10px] text-orange-500">({getRelationLabel(m.relation)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8" />
                      <div className="flex gap-4 pl-4">
                        <div className="h-4 w-px bg-border" />
                      </div>
                    </div>
                  </>
                )}
                {/* Level 3 modules */}
                {analysisLevel >= 3 && (
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] text-muted-foreground w-8 shrink-0">L3</div>
                    <div className="flex gap-2 flex-wrap">
                      {affectedModules.filter(m => m.level === 3).map(m => (
                        <div
                          key={m.name}
                          className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700"
                        >
                          <span className={`h-2 w-2 rounded-full ${getRelationColor(m.relation)}`} />
                          {m.name}
                          <span className="text-[10px] text-blue-500">({getRelationLabel(m.relation)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> 直接影响
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-orange-500" /> 依赖
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" /> 关联
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-blue-500" /> 间接影响
                </div>
              </div>
            </div>
          )}

          {/* Test Points */}
          {analysisLevel >= 1 && (
            <div className="flex-1 flex flex-col">
              {!showTestPoints ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                  <ListChecks className="h-10 w-10 mb-4 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground mb-4">基于分析结果生成测试点</p>
                  <Button onClick={handleGenerateTestPoints} disabled={isGeneratingTests}>
                    {isGeneratingTests ? (
                      <>
                        生成中
                        <StreamingDots />
                      </>
                    ) : (
                      <>
                        <ListChecks className="h-4 w-4 mr-1.5" />
                        {aiAnalysisStrings.generateTestPoints}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-muted-foreground" />
                      {aiAnalysisStrings.testPointsTitle}
                      <Badge variant="secondary" className="text-xs">{testPoints.length}</Badge>
                    </h3>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                      {testPoints.map(tp => (
                        <div
                          key={tp.id}
                          className="flex items-start gap-2.5 rounded-md border border-border p-3 hover:bg-muted/30 transition-colors"
                        >
                          <Checkbox
                            checked={tp.checked}
                            onCheckedChange={() => handleToggleTestPoint(tp.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{tp.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-4 px-1.5 ${
                                  tp.priority === "P0"
                                    ? "border-red-300 text-red-600"
                                    : tp.priority === "P1"
                                    ? "border-orange-300 text-orange-600"
                                    : "border-blue-300 text-blue-600"
                                }`}
                              >
                                {tp.priority}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{tp.source}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-border bg-card">
                    <Button className="w-full" disabled={selectedCount === 0}>
                      {aiAnalysisStrings.batchImport}
                      {selectedCount > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">{selectedCount} 条</Badge>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Empty state when no analysis */}
          {analysisLevel === 0 && !isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
              <Radar className="h-10 w-10 mb-4 text-muted-foreground/30" />
              <p className="text-sm text-center">分析完成后，此处将显示受影响模块和生成的测试点</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {analysisLevel >= 1 && (
        <ToastNotification
          message="分析结果已保存到 推理服务/创建推理服务 的需求分析维度"
          linkText="查看数据流转"
          linkHref={`/projects/${projectId}/data-flow`}
        />
      )}
    </div>
  )
}
