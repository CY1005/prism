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
  CloudUpload,
  FileText,
  Folder,
  FolderOpen,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
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

// Mock file tree data
const fileTreeData = [
  {
    name: "01-工作",
    type: "folder" as const,
    expanded: true,
    children: [
      {
        name: "_全景",
        type: "folder" as const,
        expanded: true,
        children: [
          { name: "平台功能全景-R3.9.3.md", type: "file" as const },
          { name: "平台架构导航地图.md", type: "file" as const },
        ],
      },
      {
        name: "集群与GPU",
        type: "folder" as const,
        expanded: true,
        children: [
          {
            name: "集群管理",
            type: "folder" as const,
            children: [
              { name: "集群创建流程.md", type: "file" as const },
              { name: "集群配置说明.md", type: "file" as const },
            ],
          },
          {
            name: "节点管理",
            type: "folder" as const,
            children: [
              { name: "节点状态监控.md", type: "file" as const },
            ],
          },
          {
            name: "GPU管理",
            type: "folder" as const,
            children: [
              { name: "Orion-vGPU.md", type: "file" as const },
              { name: "GPU调度策略.md", type: "file" as const },
            ],
          },
        ],
      },
      {
        name: "推理服务",
        type: "folder" as const,
        expanded: true,
        children: [
          {
            name: "创建编辑",
            type: "folder" as const,
            children: [
              { name: "服务创建向导.md", type: "file" as const },
            ],
          },
          {
            name: "副本与调度",
            type: "folder" as const,
            children: [
              { name: "双状态机.md", type: "file" as const },
              { name: "副本扩缩容.md", type: "file" as const },
            ],
          },
        ],
      },
      {
        name: "任务与训练",
        type: "folder" as const,
        children: [
          { name: "任务提交流程.md", type: "file" as const },
        ],
      },
      {
        name: "数据与资产",
        type: "folder" as const,
        children: [
          { name: "数据集管理.md", type: "file" as const },
        ],
      },
      {
        name: "用户与空间",
        type: "folder" as const,
        children: [
          { name: "空间权限管理.md", type: "file" as const },
          {
            name: "计费",
            type: "folder" as const,
            children: [
              { name: "支付宝对接.md", type: "file" as const },
            ],
          },
        ],
      },
    ],
  },
]

const sampleFileContent = `# 平台功能全景-R3.9.3

## 概述

本文档描述了 AI 云平台 R3.9.3 版本的功能全景，涵盖以下核心模块：

## 1. 集群与资源管理

### 1.1 集群管理
- 集群创建与配置
- 集群状态监控
- 集群扩缩容

### 1.2 节点管理
- 节点注册与发现
- 节点健康检查
- 节点标签管理

### 1.3 GPU 管理
- GPU 资源池
- vGPU 虚拟化（Orion-vGPU）
- GPU 调度策略

## 2. 推理服务

### 2.1 服务管理
- 服务创建向导
- 服务版本管理
- 服务监控告警

### 2.2 副本与调度
- 双状态机设计
- 副本自动扩缩容
- 负载均衡策略

## 3. 任务与训练

### 3.1 任务管理
- 任务提交
- 任务队列
- 任务优先级

### 3.2 分布式训练
- 多机多卡训练
- 训练断点续传
- 训练日志收集
`

type FileNode = {
  name: string
  type: "file" | "folder"
  expanded?: boolean
  children?: FileNode[]
}

function FileTreeNode({
  node,
  depth = 0,
  selectedFile,
  onSelect,
}: {
  node: FileNode
  depth?: number
  selectedFile: string | null
  onSelect: (name: string) => void
}) {
  const [expanded, setExpanded] = useState(node.expanded ?? false)
  const isFolder = node.type === "folder"
  const isSelected = selectedFile === node.name

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded)
          } else {
            onSelect(node.name)
          }
        }}
      >
        {isFolder ? (
          <>
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {expanded ? (
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            <FileText className="h-4 w-4 text-muted-foreground" />
          </>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode
              key={index}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ImportPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const [currentStep, setCurrentStep] = useState(1)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>("平台功能全景-R3.9.3.md")
  const [selectAll, setSelectAll] = useState(true)

  const handleFileUpload = () => {
    setFileUploaded(true)
  }

  const handleNextStep = () => {
    if (currentStep === 2) {
      router.push(`/projects/${projectId}/import/analyzing`)
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1)
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
      <div className="flex-1 px-6 pb-6">
        {currentStep === 1 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div
              className={`w-[500px] h-[300px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                fileUploaded
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
              onClick={handleFileUpload}
            >
              {fileUploaded ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">ai-quality-engineering.zip</p>
                  <p className="text-xs text-muted-foreground mt-1">2.3 MB - 已上传</p>
                </>
              ) : (
                <>
                  <CloudUpload className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-foreground">拖拽 zip 文件到此处，或点击选择文件</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    支持 .zip 格式，包含 .md / .csv / .txt 文件
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col h-full">
            {/* File Info Bar */}
            <Card className="border-border/60 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">已解压：ai-quality-engineering.zip</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>47 个文件</span>
                  <span>12 个目录</span>
                  <span>总计 2.3 MB</span>
                </div>
              </div>
            </Card>

            {/* Two Column Layout */}
            <div className="flex gap-4 flex-1 min-h-0">
              {/* Left: File Tree */}
              <Card className="w-[40%] border-border/60 flex flex-col">
                <div className="p-3 border-b border-border">
                  <span className="text-sm font-medium">文件目录</span>
                </div>
                <ScrollArea className="flex-1 p-2">
                  {fileTreeData.map((node, index) => (
                    <FileTreeNode
                      key={index}
                      node={node}
                      selectedFile={selectedFile}
                      onSelect={setSelectedFile}
                    />
                  ))}
                </ScrollArea>
              </Card>

              {/* Right: File Preview */}
              <Card className="w-[60%] border-border/60 flex flex-col">
                <div className="p-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">
                    01-工作/_全景/{selectedFile || "选择文件预览"}
                  </span>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap text-foreground/80">
                    {sampleFileContent}
                  </pre>
                </ScrollArea>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {currentStep === 2 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={(checked) => setSelectAll(checked as boolean)}
                />
                <label htmlFor="selectAll" className="text-sm text-muted-foreground cursor-pointer">
                  全选 / 取消全选
                </label>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevStep}>
                上一步
              </Button>
            )}
            <Button
              onClick={handleNextStep}
              disabled={currentStep === 1 && !fileUploaded}
            >
              {currentStep === 2 ? "开始 AI 分析" : "下一步"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
