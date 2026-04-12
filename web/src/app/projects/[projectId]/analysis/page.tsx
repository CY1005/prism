"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { useState, useRef, useCallback } from "react"
import {
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  AlertTriangle,
  Type,
  FileText,
  ImagePlus,
  X,
  Loader2,
  ChevronDown,
  Save,
  TestTube,
  Scan,
  Globe,
} from "lucide-react"
import { GlobalSearchBar } from "@/components/global-search-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { AnalysisResult } from "@/components/analysis-result"
import {
  analyzeRequirementStream,
  generateTestPoints,
  saveAnalysis,
  saveTestPoints,
  type AnalysisLevel,
  type LayerResult,
  type StreamChunk,
  type TestPointsResponse,
} from "@/services/analyzer"

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

// AI providers
const AI_PROVIDERS = [
  { value: "default", label: "默认" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "deepseek", label: "DeepSeek" },
]

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

function createEmptyLayer(level: AnalysisLevel): LayerResult {
  return {
    level,
    affected_modules: [],
    completeness_issues: [],
    suggestions: [],
    isStreaming: true,
    isComplete: false,
  }
}

export default function AnalysisPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = params.projectId as string
  const initialNodeId = searchParams.get("nodeId") || ""

  const [requirementText, setRequirementText] = useState("")
  const [nodeId, setNodeId] = useState(initialNodeId)
  const [provider, setProvider] = useState("default")
  const [layers, setLayers] = useState<LayerResult[]>([])
  const [currentLevel, setCurrentLevel] = useState<AnalysisLevel | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [testPointsResult, setTestPointsResult] = useState<TestPointsResponse | null>(null)
  const [isGeneratingPoints, setIsGeneratingPoints] = useState(false)
  const [checkedTestPoints, setCheckedTestPoints] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingTestPoints, setIsSavingTestPoints] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const MAX_DOCUMENTS = 3
  const MAX_IMAGES = 5

  const hasContent = requirementText.trim() || uploadedFiles.length > 0 || uploadedImages.length > 0
  const hasResults = layers.length > 0
  const isStreaming = layers.some((l) => l.isStreaming)
  const allLayersDone = layers.length > 0 && layers.every((l) => l.isComplete)
  const highestLevel = layers.length > 0 ? layers[layers.length - 1].level : null

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

  const handleRemoveFile = (id: string, type: "document" | "image") => {
    if (type === "document") {
      setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
    } else {
      const file = uploadedImages.find((f) => f.id === id)
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl)
      setUploadedImages((prev) => prev.filter((f) => f.id !== id))
    }
  }

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
    const firstFile = files[0]
    const extension = "." + firstFile.name.split(".").pop()?.toLowerCase()
    if ([".pdf", ".doc", ".docx", ".txt"].includes(extension)) {
      handleFileUpload(files, "document")
    } else if ([".png", ".jpg", ".jpeg"].includes(extension)) {
      handleFileUpload(files, "image")
    }
  }, [handleFileUpload])

  // Start analysis at a given level
  const startAnalysis = (level: AnalysisLevel) => {
    if (!hasContent && level === "L1") return
    setError(null)
    setCurrentLevel(level)

    // For L1, reset layers; for L2/L3, append
    if (level === "L1") {
      setLayers([createEmptyLayer("L1")])
      setTestPointsResult(null)
      setCheckedTestPoints(new Set())
    } else {
      setLayers((prev) => [...prev, createEmptyLayer(level)])
    }

    const controller = analyzeRequirementStream(
      {
        project_id: projectId,
        requirement_text: requirementText,
        node_id: nodeId || undefined,
        level,
        provider: provider !== "default" ? provider : undefined,
      },
      (chunk: StreamChunk) => {
        setLayers((prev) => {
          const updated = [...prev]
          const idx = updated.findIndex((l) => l.level === chunk.level)
          if (idx === -1) return prev
          const layer = { ...updated[idx] }

          if (chunk.type === "modules" && chunk.data.affected_modules) {
            layer.affected_modules = [
              ...layer.affected_modules,
              ...chunk.data.affected_modules,
            ]
          }
          if (chunk.type === "completeness" && chunk.data.completeness_issues) {
            layer.completeness_issues = [
              ...layer.completeness_issues,
              ...chunk.data.completeness_issues,
            ]
          }
          if (chunk.type === "suggestions" && chunk.data.suggestions) {
            layer.suggestions = [
              ...layer.suggestions,
              ...chunk.data.suggestions,
            ]
          }
          if (chunk.type === "metadata" && chunk.data.metadata) {
            layer.metadata = chunk.data.metadata
          }
          if (chunk.type === "done") {
            layer.isStreaming = false
            layer.isComplete = true
          }
          if (chunk.type === "error") {
            layer.isStreaming = false
            layer.isComplete = true
          }

          updated[idx] = layer
          return updated
        })
      },
      (errMsg) => {
        setError(errMsg)
        setLayers((prev) =>
          prev.map((l) =>
            l.level === level ? { ...l, isStreaming: false, isComplete: true } : l
          )
        )
        setCurrentLevel(null)
      },
      () => {
        setLayers((prev) =>
          prev.map((l) =>
            l.level === level ? { ...l, isStreaming: false, isComplete: true } : l
          )
        )
        setCurrentLevel(null)
      },
    )

    abortRef.current = controller
  }

  const handleAnalyze = () => startAnalysis("L1")

  const handleGenerateTestPoints = async () => {
    const allModules = layers.flatMap((l) => l.affected_modules)
    if (allModules.length === 0) return
    setIsGeneratingPoints(true)
    setError(null)

    const result = await generateTestPoints({
      project_id: projectId,
      requirement_text: requirementText,
      affected_modules: allModules.map((m) => m.node_id),
      test_depth: "standard",
    })

    setIsGeneratingPoints(false)
    if (result.ok) {
      setTestPointsResult(result.data)
      // Pre-check all
      setCheckedTestPoints(new Set(result.data.test_points.map((p) => p.id)))
    } else {
      setError(result.error)
    }
  }

  const handleSaveAnalysis = async () => {
    if (!nodeId) {
      setError("请先选择要分析的功能节点")
      return
    }
    setIsSaving(true)
    const result = await saveAnalysis(projectId, nodeId, layers)
    setIsSaving(false)
    if (!result.ok) setError(result.error)
  }

  const handleSaveTestPoints = async () => {
    if (!nodeId) {
      setError("请先选择要分析的功能节点")
      return
    }
    if (!testPointsResult) return
    setIsSavingTestPoints(true)
    // Backend expects full test point objects, not just IDs
    const selectedPoints = testPointsResult.test_points.filter((p) =>
      checkedTestPoints.has(p.id)
    )
    const result = await saveTestPoints(projectId, nodeId, selectedPoints)
    setIsSavingTestPoints(false)
    if (!result.ok) setError(result.error)
  }

  const toggleTestPoint = (id: string) => {
    setCheckedTestPoints((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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
        <GlobalSearchBar />
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
        <Link href={`/projects/${projectId}/issues`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          问题沉淀
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
            <div className="flex items-center gap-2">
              {/* AI Provider Switcher */}
              <Select value={provider} onValueChange={(v) => v && setProvider(v)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                  <Tooltip>
                    <TooltipTrigger
                      className="inline-flex items-center justify-center h-7 w-7 p-0 rounded-md bg-background shadow-sm hover:bg-accent"
                    >
                      <Type className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>文字输入</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      className="inline-flex items-center justify-center h-7 w-7 p-0 rounded-md hover:bg-background disabled:opacity-50"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={uploadedFiles.length >= MAX_DOCUMENTS}
                    >
                      <FileText className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      上传文档 ({uploadedFiles.length}/{MAX_DOCUMENTS})
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      className="inline-flex items-center justify-center h-7 w-7 p-0 rounded-md hover:bg-background disabled:opacity-50"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadedImages.length >= MAX_IMAGES}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      上传图片 ({uploadedImages.length}/{MAX_IMAGES})
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>

          {/* Node ID selector */}
          {nodeId && (
            <div className="mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                功能节点: {nodeId}
              </Badge>
              <button
                onClick={() => setNodeId("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

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
            disabled={!hasContent || isStreaming}
          >
            {isStreaming && currentLevel === "L1" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                分析中...
              </>
            ) : (
              "AI 分析"
            )}
          </Button>
        </div>

        {/* Right Side - Analysis Results */}
        <div className="w-1/2 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
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
              {!hasResults && !error && (
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                  <p className="text-sm">输入需求后点击「AI 分析」查看结果</p>
                </div>
              )}

              {/* Progressive Layer Results */}
              {layers.map((layer) => (
                <div key={layer.level}>
                  <AnalysisResult layer={layer} />

                  {/* Expand button after each complete layer */}
                  {layer.isComplete && layer.level === "L1" && highestLevel === "L1" && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startAnalysis("L2")}
                        disabled={isStreaming}
                        className="gap-2"
                      >
                        <Scan className="h-4 w-4" />
                        扩展分析范围
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {layer.isComplete && layer.level === "L2" && highestLevel === "L2" && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startAnalysis("L3")}
                        disabled={isStreaming}
                        className="gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        全局扫描
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Separator between layers */}
                  {layer.level !== highestLevel && (
                    <div className="border-t border-border/60 my-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Bottom Action Bar */}
          {hasResults && allLayersDone && !testPointsResult && (
            <div className="border-t border-border p-4 flex items-center justify-between bg-card">
              <Button
                variant="outline"
                onClick={handleSaveAnalysis}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "保存中..." : "保存到需求分析维度"}
              </Button>
              <Button
                onClick={handleGenerateTestPoints}
                disabled={isGeneratingPoints}
                className="gap-2"
              >
                <TestTube className="h-4 w-4" />
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
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={checkedTestPoints.has(point.id)}
                                  onCheckedChange={() => toggleTestPoint(point.id)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1">
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

              {/* Test Points Action Bar */}
              <div className="border-t border-border p-4 flex items-center justify-between bg-card">
                <span className="text-sm text-muted-foreground">
                  已选 {checkedTestPoints.size} / {testPointsResult.test_points.length} 条
                </span>
                <Button
                  onClick={handleSaveTestPoints}
                  disabled={isSavingTestPoints || checkedTestPoints.size === 0}
                  className="gap-2"
                >
                  {isSavingTestPoints ? "录入中..." : "一键录入测试分析维度"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
