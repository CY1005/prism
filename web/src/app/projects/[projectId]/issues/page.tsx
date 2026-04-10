"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"
import { getIssues, createIssue, updateIssue, deleteIssue } from "@/actions/issues"

type Issue = {
  id: string
  projectId: string
  nodeId: string | null
  type: string
  title: string
  description: string
  severity: string
  status: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  tech_debt: "技术债务",
  design_flaw: "设计缺陷",
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: "严重",
  high: "高",
  medium: "中",
  low: "低",
}

const STATUS_LABELS: Record<string, string> = {
  open: "待处理",
  resolved: "已解决",
  wontfix: "不修复",
}

function severityBadgeClass(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200"
    case "high":
      return "bg-orange-100 text-orange-700 border-orange-200"
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "low":
      return "bg-blue-100 text-blue-700 border-blue-200"
    default:
      return ""
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "open":
      return "bg-red-50 text-red-600 border-red-200"
    case "resolved":
      return "bg-green-50 text-green-600 border-green-200"
    case "wontfix":
      return "bg-gray-50 text-gray-600 border-gray-200"
    default:
      return ""
  }
}

function typeBadgeClass(type: string) {
  switch (type) {
    case "bug":
      return "bg-red-50 text-red-700 border-red-200"
    case "tech_debt":
      return "bg-purple-50 text-purple-700 border-purple-200"
    case "design_flaw":
      return "bg-amber-50 text-amber-700 border-amber-200"
    default:
      return ""
  }
}

export default function IssuesPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formType, setFormType] = useState("bug")
  const [formSeverity, setFormSeverity] = useState("medium")
  const [formNodeId, setFormNodeId] = useState("")
  const [saving, setSaving] = useState(false)

  const loadIssues = async () => {
    setLoading(true)
    try {
      const data = await getIssues(projectId)
      setIssues(data as Issue[])
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    loadIssues()
  }, [projectId])

  const filteredIssues = issues.filter((issue) => {
    if (filterType !== "all" && issue.type !== filterType) return false
    if (filterSeverity !== "all" && issue.severity !== filterSeverity) return false
    if (filterStatus !== "all" && issue.status !== filterStatus) return false
    return true
  })

  const openCreateDialog = () => {
    setEditingIssue(null)
    setFormTitle("")
    setFormDescription("")
    setFormType("bug")
    setFormSeverity("medium")
    setFormNodeId("")
    setDialogOpen(true)
  }

  const openEditDialog = (issue: Issue) => {
    setEditingIssue(issue)
    setFormTitle(issue.title)
    setFormDescription(issue.description)
    setFormType(issue.type)
    setFormSeverity(issue.severity)
    setFormNodeId(issue.nodeId || "")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formTitle.trim()) return
    setSaving(true)
    try {
      if (editingIssue) {
        await updateIssue(editingIssue.id, {
          title: formTitle,
          description: formDescription,
          type: formType,
          severity: formSeverity,
        })
      } else {
        await createIssue(projectId, formNodeId || null, {
          title: formTitle,
          description: formDescription,
          type: formType,
          severity: formSeverity,
        })
      }
      setDialogOpen(false)
      await loadIssues()
    } catch {
      // ignore
    }
    setSaving(false)
  }

  const handleDelete = async (issueId: string) => {
    if (!confirm("确认删除该问题？")) return
    await deleteIssue(issueId)
    await loadIssues()
  }

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    await updateIssue(issueId, { status: newStatus })
    await loadIssues()
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
              <BreadcrumbPage>问题沉淀</BreadcrumbPage>
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
        <Link href={`/projects/${projectId}/analysis`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          需求工作台
        </Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          竞品对比
        </Link>
        <Link href={`/projects/${projectId}/issues`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">
          问题沉淀
        </Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          设置
        </Link>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Control Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="tech_debt">技术债务</SelectItem>
                  <SelectItem value="design_flaw">设计缺陷</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={(v) => v && setFilterSeverity(v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="严重程度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部严重度</SelectItem>
                  <SelectItem value="critical">严重</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="open">待处理</SelectItem>
                  <SelectItem value="resolved">已解决</SelectItem>
                  <SelectItem value="wontfix">不修复</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新建问题
            </Button>
          </div>

          {/* Issues Table */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">标题</TableHead>
                  <TableHead className="font-medium w-24">类型</TableHead>
                  <TableHead className="font-medium w-24">严重度</TableHead>
                  <TableHead className="font-medium w-24">状态</TableHead>
                  <TableHead className="font-medium w-40">创建时间</TableHead>
                  <TableHead className="font-medium w-28">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      暂无问题记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{issue.title}</span>
                          {issue.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{issue.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeBadgeClass(issue.type)}>
                          {TYPE_LABELS[issue.type] || issue.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={severityBadgeClass(issue.severity)}>
                          {SEVERITY_LABELS[issue.severity] || issue.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select value={issue.status} onValueChange={(v) => v && handleStatusChange(issue.id, v)}>
                          <SelectTrigger className="h-7 w-[90px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">待处理</SelectItem>
                            <SelectItem value="resolved">已解决</SelectItem>
                            <SelectItem value="wontfix">不修复</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(issue.createdAt).toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(issue)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(issue.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </ScrollArea>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingIssue ? "编辑问题" : "新建问题"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="问题标题" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="问题描述" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={formType} onValueChange={(v) => v && setFormType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="tech_debt">技术债务</SelectItem>
                    <SelectItem value="design_flaw">设计缺陷</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>严重度</Label>
                <Select value={formSeverity} onValueChange={(v) => v && setFormSeverity(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">严重</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>关联节点 ID（可选）</Label>
              <Input value={formNodeId} onChange={(e) => setFormNodeId(e.target.value)} placeholder="UUID 格式的节点 ID" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving || !formTitle.trim()}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
