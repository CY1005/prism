"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useTransition } from "react"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  Plus,
  Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import { detailStrings } from "@/lib/project-detail-data"
import { createIssue, getIssuesByNode, getIssuesByCategory, deleteIssue } from "@/actions/issues"
import { useProjectRole } from "@/contexts/project-role-context"
import {
  AddIssueDialog,
  CATEGORY_CONFIG,
  type Issue,
  type IssueCategory,
} from "@/components/issue-card"

export default function IssuesPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { isViewer } = useProjectRole()
  const [isPending, startTransition] = useTransition()

  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadIssues = async () => {
    setLoading(true)
    try {
      if (filterCategory !== "all") {
        const data = await getIssuesByCategory(projectId, filterCategory)
        setIssues(data as Issue[])
      } else {
        // Load all categories
        const results = await Promise.all(
          (["bug", "tech_debt", "design_flaw", "performance"] as const).map(
            (cat) => getIssuesByCategory(projectId, cat)
          )
        )
        setIssues(results.flat() as Issue[])
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }

  useEffect(() => {
    loadIssues()
  }, [projectId, filterCategory])

  const handleSave = (data: { category: string; description: string; tags: string[] }) => {
    startTransition(async () => {
      await createIssue(projectId, null, data)
      await loadIssues()
    })
  }

  const handleDelete = async (issueId: string) => {
    if (!confirm("确认删除该问题？")) return
    await deleteIssue(issueId)
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
              <Select value={filterCategory} onValueChange={(v) => v && setFilterCategory(v)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="tech_debt">技术债</SelectItem>
                  <SelectItem value="design_flaw">设计缺陷</SelectItem>
                  <SelectItem value="performance">性能</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={isViewer}
              title={isViewer ? "查看者无编辑权限" : undefined}
            >
              <Plus className="h-4 w-4 mr-2" />
              新建问题
            </Button>
          </div>

          {/* Issues Table */}
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">描述</TableHead>
                  <TableHead className="font-medium w-24">分类</TableHead>
                  <TableHead className="font-medium w-32">标签</TableHead>
                  <TableHead className="font-medium w-40">创建时间</TableHead>
                  <TableHead className="font-medium w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : issues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      暂无问题记录
                    </TableCell>
                  </TableRow>
                ) : (
                  issues.map((issue) => {
                    const cat = issue.category as IssueCategory
                    const config = CATEGORY_CONFIG[cat]
                    return (
                      <TableRow key={issue.id}>
                        <TableCell>
                          <span className="text-sm">{issue.description}</span>
                        </TableCell>
                        <TableCell>
                          {config && (
                            <Badge className={`${config.bgColor} ${config.textColor} hover:${config.bgColor} text-xs`}>
                              {config.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {issue.tags?.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(issue.createdAt).toLocaleDateString("zh-CN")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(issue.id)}
                            disabled={isViewer}
                            title={isViewer ? "查看者无编辑权限" : undefined}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </ScrollArea>

      {/* Create Dialog */}
      <AddIssueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSave}
      />
    </div>
  )
}
