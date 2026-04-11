"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  FileText,
  Folder,
  FolderOpen,
  AlertTriangle,
  Check,
  Upload,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { importAIData, type FileTreeItem } from "@/lib/import-ai-data"
import { detailStrings } from "@/lib/project-detail-data"
import { cn } from "@/lib/utils"

function getConfidenceColor(confidence: number) {
  if (confidence >= 85) return "bg-green-100 text-green-700 border-green-200"
  if (confidence >= 60) return "bg-yellow-100 text-yellow-700 border-yellow-200"
  return "bg-red-100 text-red-700 border-red-200"
}

function FileTreeNode({
  item,
  depth,
  selectedFile,
  onSelect,
}: {
  item: FileTreeItem
  depth: number
  selectedFile: string | null
  onSelect: (name: string, content?: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const isFolder = item.type === "folder"
  const isSelected = selectedFile === item.name

  return (
    <div>
      <button
        className={cn(
          "flex items-center gap-1.5 w-full text-left py-1 px-2 rounded text-sm hover:bg-muted/80 transition-colors",
          isSelected && "bg-primary/10 text-primary"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded)
          } else {
            onSelect(item.name, item.content)
          }
        }}
      >
        {isFolder ? (
          expanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
          )
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{item.name}</span>
      </button>
      {isFolder && expanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FileTreeNode
              key={child.name}
              item={child}
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

export default function ImportAIPage() {
  const params = useParams()
  const projectId = params.id as string

  const data = importAIData
  const [rows, setRows] = useState(data.mappingRows)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  const selectedCount = rows.filter((r) => r.selected).length
  const totalCount = rows.length

  function toggleRow(id: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    )
  }

  function toggleAll() {
    const allSelected = rows.every((r) => r.selected)
    setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })))
  }

  function updateModule(id: string, module: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, recommendedModule: module } : r))
    )
  }

  function updateDimension(id: string, dimension: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, recommendedDimension: dimension } : r
      )
    )
  }

  function handleFileSelect(name: string, content?: string) {
    setSelectedFile(name)
    setFilePreview(content || null)
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
              <BreadcrumbPage>AI智能导入</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Step Indicator */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-center gap-0 max-w-2xl mx-auto">
          {data.steps.map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium border-2",
                    step.completed
                      ? "bg-primary border-primary text-primary-foreground"
                      : step.active
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground bg-muted/30"
                  )}
                >
                  {step.completed ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm whitespace-nowrap",
                    step.active
                      ? "font-medium text-primary"
                      : step.completed
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < data.steps.length - 1 && (
                <div
                  className={cn(
                    "w-16 h-px mx-3",
                    data.steps[index + 1].completed || data.steps[index + 1].active
                      ? "bg-primary"
                      : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: File Tree */}
        <div className="w-[260px] border-r border-border bg-muted/20 flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate">{data.zipName}</span>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="py-2">
              {data.fileTree.map((item) => (
                <FileTreeNode
                  key={item.name}
                  item={item}
                  depth={0}
                  selectedFile={selectedFile}
                  onSelect={handleFileSelect}
                />
              ))}
            </div>
          </ScrollArea>
          {/* File Preview */}
          {filePreview && (
            <div className="border-t border-border">
              <div className="px-4 py-2 bg-muted/50">
                <span className="text-xs font-medium text-muted-foreground">文件预览</span>
              </div>
              <ScrollArea className="h-[200px]">
                <pre className="text-xs text-muted-foreground p-4 whitespace-pre-wrap">
                  {filePreview}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Right: Mapping Table */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Bulk Actions Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/20">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {rows.every((r) => r.selected) ? "取消全选" : "全选"}
              </Button>
              <Select>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue placeholder="批量修改模块" />
                </SelectTrigger>
                <SelectContent>
                  {data.availableModules.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue placeholder="批量修改维度" />
                </SelectTrigger>
                <SelectContent>
                  {data.availableDimensions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Badge variant="secondary">
              {totalCount} 条映射结果
            </Badge>
          </div>

          {/* Table */}
          <ScrollArea className="flex-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={rows.every((r) => r.selected)}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-medium">文件名</TableHead>
                  <TableHead className="font-medium">AI拆分结果</TableHead>
                  <TableHead className="font-medium">推荐模块</TableHead>
                  <TableHead className="font-medium">推荐维度</TableHead>
                  <TableHead className="font-medium w-[80px]">置信度</TableHead>
                  <TableHead className="font-medium w-[140px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      row.conflict && "bg-yellow-50/50"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={row.selected}
                        onCheckedChange={() => toggleRow(row.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{row.fileName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">{row.splitResult}</span>
                        {row.conflict && (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs text-yellow-600">{row.conflictMessage}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.recommendedModule}
                        onValueChange={(v) => updateModule(row.id, v)}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {data.availableModules.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.recommendedDimension}
                        onValueChange={(v) => updateDimension(row.id, v)}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {data.availableDimensions.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getConfidenceColor(row.confidence))}
                      >
                        {row.confidence}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.conflict ? (
                        <div className="flex items-center gap-1.5">
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                            合并
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground">
                            跳过
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                          预览
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Bottom Action Bar */}
          <div className="border-t border-border px-6 py-4 bg-card">
            <div className="flex items-center justify-between">
              <Link href={`/projects/${projectId}/data-flow`} className="text-xs text-primary hover:underline">
                确认后将进入导入进度页面
              </Link>
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild>
                  <Link href={`/projects/${projectId}`}>取消</Link>
                </Button>
                <Button className="gap-1.5">
                  <Check className="h-4 w-4" />
                  确认导入（将导入 {selectedCount}/{totalCount} 条）
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
