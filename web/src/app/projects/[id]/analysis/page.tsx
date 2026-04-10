"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useRef, useCallback } from "react"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Info,
  Type,
  FileText,
  ImagePlus,
  X,
  Loader2,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { analyzeRequirement, generateTestPoints, type AnalyzeResponse, type TestPointsResponse } from "@/services/analyzer"

// File upload types
interface UploadedFile {
  id: string
  file: File
  name: string
  size: string
  type: "document" | "image"
  status: "uploading" | "completed"
  previewUrl?: string
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}


export default function AnalysisPage() {
  const params = useParams()
  const projectId = params.id as string
  const [requirementText, setRequirementText] = useState("")
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [testPointsResult, setTestPointsResult] = useState<TestPointsResponse | null>(null)
  const [isGeneratingPoints, setIsGeneratingPoints] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const documentInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const MAX_DOCUMENTS = 3
  const MAX_IMAGES = 5

  // Check if there's any input content
  const hasContent = requirementText.trim() || uploadedFiles.length > 0 || uploadedImages.length > 0

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | null, type: "document" | "image") => {
    if (!files) return

    const currentCount = type === "document" ? uploadedFiles.length : uploadedImages.length
    const maxCount = type === "document" ? MAX_DOCUMENTS : MAX_IMAGES
    const allowedExtensions = type === "document"
      ? [".pdf", ".doc", ".docx", ".txt"]
      : [".png", ".jpg", ".jpeg"]

    const filesToAdd = Array.from(files).slice(0, maxCount - currentCount)

    filesToAdd.forEach((file) => {
      const extension = "." + file.name.split(".").pop()?.toLowerCase()
      if (!allowedExtensions.includes(extension)) return

      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type,
        status: "uploading",
        previewUrl: type === "image" ? URL.createObjectURL(file) : undefined,
      }

      if (type === "document") {
        setUploadedFiles((prev) => [...prev, newFile])
      } else {
        setUploadedImages((prev) => [...prev, newFile])
      }

      // Simulate upload completion
      setTimeout(() => {
        if (type === "document") {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === newFile.id ? { ...f, status: "completed" } : f))
          )
        } else {
          setUploadedImages((prev) =>
            prev.map((f) => (f.id === newFile.id ? { ...f, status: "completed" } : f))
          )
        }
      }, 800 + Math.random() * 500)
    })
  }, [uploadedFiles.length, uploadedImages.length])

  // Handle file removal
  const handleRemoveFile = (id: string, type: "document" | "image") => {
    if (type === "document") {
      setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
    } else {
      const file = uploadedImages.find((f) => f.id === id)
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl)
      }
      setUploadedImages((prev) => prev.filter((f) => f.id !== id))
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (!files.length) return

    // Determine file type based on extension
    const firstFile = files[0]
    const extension = "." + firstFile.name.split(".").pop()?.toLowerCase()

    if ([".pdf", ".doc", ".docx", ".txt"].includes(extension)) {
      handleFileUpload(files, "document")
    } else if ([".png", ".jpg", ".jpeg"].includes(extension)) {
      handleFileUpload(files, "image")
    }
  }, [handleFileUpload])

  const handleAnalyze = async () => {
    if (!hasContent) return
    setIsAnalyzing(true)
    setError(null)

    const result = await analyzeRequirement({
      project_id: projectId,
      requirement_text: requirementText,
    })

    setIsAnalyzing(false)

    if (result.ok) {
      setAnalysisResult(result.data)
      setIsAnalyzed(true)
    } else {
      setError(result.error)
    }
  }

  const directModules = analysisResult?.affected_modules.filter((m) => m.impact_level === "high") ?? []
  const indirectModules = analysisResult?.affected_modules.filter((m) => m.impact_level !== "high") ?? []

  const handleGenerateTestPoints = async () => {
    if (!analysisResult) return
    setIsGeneratingPoints(true)
    setError(null)

    const result = await generateTestPoints({
      project_id: projectId,
      requirement_text: requirementText,
      affected_modules: analysisResult.affected_modules.map((m) => m.node_id),
      test_depth: "standard",
    })

    setIsGeneratingPoints(false)

    if (result.ok) {
      setTestPointsResult(result.data)
    } else {
      setError(result.error)
    }
  }

  const priorityColor: Record<string, string> = {
    P0: "bg-red-100 text-red-700 border-red-200",
    P1: "bg-yellow-100 text-yellow-700 border-yellow-200",
    P2: "bg-blue-100 text-blue-700 border-blue-200",
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
        <div
          className={`w-1/2 border-r border-border p-6 flex flex-col ${
            isDragOver ? "border-dashed border-2 border-primary/50 bg-primary/5" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">需求描述</h2>
            <TooltipProvider>
              <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 bg-background shadow-sm"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>文字输入</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-background"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={uploadedFiles.length >= MAX_DOCUMENTS}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    上传文档 ({uploadedFiles.length}/{MAX_DOCUMENTS})
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-background"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadedImages.length >= MAX_IMAGES}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    上传图片 ({uploadedImages.length}/{MAX_IMAGES})
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, "document")}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files, "image")}
          />

          <Textarea
            className="flex-1 min-h-[300px] resize-none"
            placeholder={"输入需求描述，AI 将分析影响范围和完整性...\n\n支持拖拽上传文档 (.pdf, .doc, .docx, .txt) 或图片 (.png, .jpg, .jpeg)"}
            value={requirementText}
            onChange={(e) => setRequirementText(e.target.value)}
          />

          {/* Uploaded files display */}
          {(uploadedFiles.length > 0 || uploadedImages.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {uploadedFiles.map((file) => (
                <Badge
                  key={file.id}
                  variant="secondary"
                  className="flex items-center gap-1.5 py-1 px-2 text-xs"
                >
                  {file.status === "uploading" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <span className="text-muted-foreground">({file.size})</span>
                  <button
                    onClick={() => handleRemoveFile(file.id, "document")}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {uploadedImages.map((file) => (
                <Badge
                  key={file.id}
                  variant="secondary"
                  className="flex items-center gap-1.5 py-1 px-2 text-xs"
                >
                  {file.status === "uploading" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3 w-3" />
                  )}
                  <span className="max-w-[120px] truncate">{file.name}</span>
                  <span className="text-muted-foreground">({file.size})</span>
                  <button
                    onClick={() => handleRemoveFile(file.id, "image")}
                    className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Drag overlay hint */}
          {isDragOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/5 pointer-events-none">
              <div className="text-primary font-medium">松开以上传文件</div>
            </div>
          )}

          <Button
            className="mt-4 w-fit"
            onClick={handleAnalyze}
            disabled={!hasContent || isAnalyzing}
          >
            {isAnalyzing ? "分析中..." : "AI 分析"}
          </Button>
        </div>

        {/* Right Side - Analysis Results */}
        <div className="w-1/2 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              {/* Error State */}
              {error && (
                <Card className="border-destructive/60 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <h3 className="font-medium text-destructive">分析失败</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={handleAnalyze}>
                    重试
                  </Button>
                </Card>
              )}

              {/* Empty State */}
              {!isAnalyzed && !error && (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <p className="text-sm">输入需求后点击「AI 分析」查看结果</p>
                </div>
              )}

              {/* Results */}
              {isAnalyzed && analysisResult && (
                <>
                  {/* Impact Analysis */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h3 className="font-medium">影响范围</h3>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {analysisResult.affected_modules.length} 个模块
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {directModules.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">直接影响</p>
                          <div className="space-y-2">
                            {directModules.map((mod) => (
                              <div key={mod.node_id} className="flex items-start gap-2">
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 shrink-0">直接</Badge>
                                <div>
                                  <span className="text-sm font-medium">{mod.node_path || mod.node_name}</span>
                                  <p className="text-xs text-muted-foreground">{mod.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {indirectModules.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">间接影响</p>
                          <div className="space-y-2">
                            {indirectModules.map((mod) => (
                              <div key={mod.node_id} className="flex items-start gap-2">
                                <Badge variant="secondary" className="shrink-0">间接</Badge>
                                <div>
                                  <span className="text-sm font-medium">{mod.node_path || mod.node_name}</span>
                                  <p className="text-xs text-muted-foreground">{mod.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysisResult.affected_modules.length === 0 && (
                        <p className="text-sm text-muted-foreground">未发现受影响的模块</p>
                      )}
                    </div>
                  </Card>

                  {/* Completeness Issues */}
                  <Card className="border-border/60 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">完整性评估</h3>
                    </div>
                    <div className="space-y-2">
                      {analysisResult.completeness_issues.length > 0 ? (
                        analysisResult.completeness_issues.map((issue, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            <span className="text-muted-foreground">{issue}</span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          <span>需求描述完整，未发现明显遗漏</span>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Suggestions */}
                  {analysisResult.suggestions.length > 0 && (
                    <Card className="border-border/60 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        <h3 className="font-medium">建议</h3>
                      </div>
                      <div className="space-y-2">
                        {analysisResult.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground shrink-0">{index + 1}.</span>
                            <span>{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>模型: {analysisResult.metadata.model}</span>
                    </div>
                    <span>耗时: {analysisResult.metadata.analysis_time_ms}ms</span>
                    {analysisResult.metadata.tokens_used > 0 && (
                      <span>Token: {analysisResult.metadata.tokens_used}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Bottom Action Bar */}
          {isAnalyzed && (
            <div className="border-t border-border p-4 flex items-center justify-between bg-card">
              <Button variant="outline">保存分析结果</Button>
              <Button onClick={handleGenerateTestPoints} disabled={isGeneratingPoints}>
                {isGeneratingPoints ? "生成中..." : "生成测试点"}
              </Button>
            </div>
          )}

          {/* Test Points Results */}
          {testPointsResult && (
            <div className="border-t border-border">
              <ScrollArea className="max-h-[400px]">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">测试点 ({testPointsResult.coverage_summary.total})</h3>
                    <div className="flex gap-2 text-xs">
                      {Object.entries(testPointsResult.coverage_summary.by_priority).map(([k, v]) => (
                        <Badge key={k} variant="outline" className={priorityColor[k] || ""}>{k}: {v}</Badge>
                      ))}
                    </div>
                  </div>

                  {["P0", "P1", "P2"].map((priority) => {
                    const points = testPointsResult.test_points.filter((p) => p.priority === priority)
                    if (points.length === 0) return null
                    return (
                      <div key={priority}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={priorityColor[priority] || ""}>{priority}</Badge>
                          <span className="text-xs text-muted-foreground">{points.length} 条</span>
                        </div>
                        <div className="space-y-2">
                          {points.map((point) => (
                            <Card key={point.id} className="border-border/60 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground font-mono">{point.id}</span>
                                    <span className="text-sm font-medium">{point.title}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{point.description}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0">{point.category}</Badge>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {/* Category Summary */}
                  <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t">
                    {Object.entries(testPointsResult.coverage_summary.by_category).map(([k, v]) => (
                      <span key={k}>{k}: {v}</span>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
