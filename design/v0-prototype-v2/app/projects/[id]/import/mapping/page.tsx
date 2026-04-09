"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  Check,
  Pencil,
  AlertTriangle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

const steps = [
  { id: 1, name: "上传文件" },
  { id: 2, name: "文件预览" },
  { id: 3, name: "AI分析" },
  { id: 4, name: "确认映射" },
  { id: 5, name: "导入完成" },
]

const mappingData = [
  {
    id: 1,
    checked: true,
    sourceFile: "_全景/平台功能全景-R3.9.3.md",
    recommendedModule: "全局（拆分为27个模块）",
    dimension: "功能描述",
    confidence: 95,
    action: "拆分导入",
    needsConfirm: false,
  },
  {
    id: 2,
    checked: true,
    sourceFile: "推理服务/副本与调度/双状态机.md",
    recommendedModule: "推理服务",
    dimension: "技术实现",
    confidence: 92,
    action: "直接导入",
    needsConfirm: false,
  },
  {
    id: 3,
    checked: true,
    sourceFile: "集群与GPU/GPU管理/Orion-vGPU.md",
    recommendedModule: "GPU管理",
    dimension: "技术实现",
    confidence: 90,
    action: "直接导入",
    needsConfirm: false,
  },
  {
    id: 4,
    checked: true,
    sourceFile: "_组件/SeaweedFS.md",
    recommendedModule: "存储管理",
    dimension: "技术实现",
    confidence: 75,
    action: "直接导入",
    needsConfirm: false,
  },
  {
    id: 5,
    checked: true,
    sourceFile: "排查与运维/推理服务OOM.md",
    recommendedModule: "推理服务",
    dimension: "工程经验",
    confidence: 88,
    action: "直接导入",
    needsConfirm: false,
  },
  {
    id: 6,
    checked: false,
    sourceFile: "_全景/Gemini平台Bug趋势.md",
    recommendedModule: "？（需确认）",
    dimension: "测试分析",
    confidence: 45,
    action: "待确认",
    needsConfirm: true,
  },
  {
    id: 7,
    checked: true,
    sourceFile: "用户与空间/计费/支付宝对接.md",
    recommendedModule: "计费管理",
    dimension: "技术实现",
    confidence: 85,
    action: "直接导入",
    needsConfirm: false,
  },
  {
    id: 8,
    checked: false,
    sourceFile: "_行业/竞品分析.md",
    recommendedModule: "？（多模块）",
    dimension: "竞品参考",
    confidence: 40,
    action: "待确认",
    needsConfirm: true,
  },
]

const relationshipData = [
  { source: "GPU管理", type: "depends_on", target: "节点管理", confidence: 90 },
  { source: "推理服务", type: "depends_on", target: "任务提交通用能力", confidence: 85 },
  { source: "配额管理", type: "related_to", target: "空间管理", confidence: 80 },
]

const productLineTags = [
  { name: "全平台", count: 198 },
  { name: "仅私有云", count: 45, examples: "资源组管理、分布式推理" },
  { name: "仅智算中心", count: 34, examples: "定时扩缩容、Dockerfile制作" },
  { name: "仅公有云", count: 12 },
]

function getConfidenceColor(confidence: number) {
  if (confidence >= 80) return "text-green-600"
  if (confidence >= 50) return "text-yellow-600"
  return "text-red-600"
}

function getConfidenceDot(confidence: number) {
  if (confidence >= 80) return "bg-green-500"
  if (confidence >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

export default function MappingPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const currentStep = 4
  const [filter, setFilter] = useState("all")
  const [data, setData] = useState(mappingData)

  const selectedCount = data.filter((item) => item.checked).length
  const totalCount = data.length

  const filteredData = data.filter((item) => {
    if (filter === "all") return true
    if (filter === "high") return item.confidence >= 80
    if (filter === "confirm") return item.needsConfirm
    if (filter === "skipped") return !item.checked
    return true
  })

  const handleConfirm = () => {
    router.push(`/projects/${projectId}/import/complete`)
  }

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
      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-border/60 p-4">
            <span className="text-2xl font-bold text-foreground">26</span>
            <p className="text-sm text-muted-foreground">识别模块</p>
          </Card>
          <Card className="border-border/60 p-4">
            <span className="text-2xl font-bold text-foreground">377</span>
            <p className="text-sm text-muted-foreground">识别功能项</p>
          </Card>
          <Card className="border-border/60 p-4">
            <span className="text-2xl font-bold text-foreground">15</span>
            <p className="text-sm text-muted-foreground">识别关联关系</p>
          </Card>
          <Card className="border-border/60 p-4">
            <span className="text-2xl font-bold text-primary">8</span>
            <p className="text-sm text-muted-foreground">需人工确认</p>
          </Card>
        </div>

        {/* Mapping Table */}
        <Card className="border-border/60 flex-1 flex flex-col overflow-hidden">
          {/* Table Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                全部
              </Button>
              <Button
                variant={filter === "high" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("high")}
              >
                高置信度
              </Button>
              <Button
                variant={filter === "confirm" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("confirm")}
              >
                待确认
              </Button>
              <Button
                variant={filter === "skipped" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter("skipped")}
              >
                已跳过
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              已选 {selectedCount}/{totalCount} 个文件
            </span>
          </div>

          {/* Table */}
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>源文件</TableHead>
                  <TableHead>AI推荐模块</TableHead>
                  <TableHead>AI推荐维度</TableHead>
                  <TableHead className="w-24">置信度</TableHead>
                  <TableHead className="w-32">处理方式</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.needsConfirm ? "bg-yellow-50/50" : ""}
                  >
                    <TableCell>
                      {item.needsConfirm ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={(checked) => {
                            setData(
                              data.map((d) =>
                                d.id === item.id ? { ...d, checked: !!checked } : d
                              )
                            )
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.sourceFile}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">→ </span>
                      {item.recommendedModule}
                    </TableCell>
                    <TableCell>{item.dimension}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${getConfidenceDot(
                            item.confidence
                          )}`}
                        />
                        <span className={getConfidenceColor(item.confidence)}>
                          {item.confidence}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select defaultValue={item.action}>
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="直接导入">直接导入</SelectItem>
                          <SelectItem value="拆分导入">拆分导入</SelectItem>
                          <SelectItem value="跳过">跳过</SelectItem>
                          <SelectItem value="合并到已有">合并到已有</SelectItem>
                          <SelectItem value="待确认">待确认</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        {/* Relationships Section */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">AI 识别的关联关系</h3>
          <Card className="border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>源模块</TableHead>
                  <TableHead>关联类型</TableHead>
                  <TableHead>目标模块</TableHead>
                  <TableHead className="w-24">置信度</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relationshipData.map((rel, index) => (
                  <TableRow key={index}>
                    <TableCell>{rel.source}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {rel.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{rel.target}</TableCell>
                    <TableCell>{rel.confidence}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Product Line Tags Section */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">AI 识别的产品线差异标签</h3>
          <div className="flex flex-wrap gap-2">
            {productLineTags.map((tag) => (
              <Badge
                key={tag.name}
                variant="secondary"
                className="px-3 py-1.5 text-sm"
              >
                {tag.name}
                <span className="ml-1.5 text-muted-foreground">({tag.count}项)</span>
                {tag.examples && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    — {tag.examples}
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={`/projects/${projectId}/import`}>上一步</Link>
          </Button>
          <Button onClick={handleConfirm}>确认导入</Button>
        </div>
      </div>
    </div>
  )
}
