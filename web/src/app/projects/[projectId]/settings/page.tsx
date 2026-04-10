"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { use } from "react"
import { Bell, UserPlus, LogOut, GripVertical, FileText, Users, Server, GitBranch, Lightbulb, TestTube, ClipboardList, Building, FileCode, Gauge, DollarSign, Folder, File } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getProject,
  updateProject,
  getProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateProjectAIConfig,
} from "@/actions/projects"

type TabType = "basic" | "dimensions" | "hierarchy" | "members" | "ai"

const settingsStrings = {
  myProjects: "我的项目",
  settings: "设置",
  basicInfo: "基本信息",
  memberManagement: "成员管理",
  aiConfig: "AI配置",
  inviteMember: "邀请成员",
  avatar: "头像",
  username: "用户名",
  email: "邮箱",
  role: "角色",
  action: "操作",
  admin: "管理员",
  editor: "编辑者",
  viewer: "查看者",
  editRole: "修改角色",
  remove: "移除",
  aiProvider: "AI Provider",
  localMode: "本地模式",
  saveConfig: "保存配置",
  userName: "陈琦",
  userInitials: "陈",
}

type ProjectData = {
  id: string
  name: string
  description: string | null
  templateType: string
  hierarchyLabels: string[]
  versionMode: string
  aiProvider: string | null
  aiApiKeyEnc: string | null
}

type MemberData = {
  id: string
  userId: string
  role: string
  createdAt: Date
  userName: string
  userEmail: string
}

const enabledDimensions = [
  { id: "desc", name: "功能描述", description: "功能的核心说明", icon: FileText },
  { id: "user", name: "用户场景", description: "谁在什么场景下使用", icon: Users },
  { id: "tech", name: "技术实现", description: "平台侧的技术方案", icon: Server },
  { id: "decision", name: "设计决策", description: "关键架构决策及取舍", icon: GitBranch },
  { id: "exp", name: "工程经验", description: "踩坑记录与最佳实践", icon: Lightbulb },
  { id: "test", name: "测试分析", description: "测试策略与问题记录", icon: TestTube },
  { id: "req", name: "需求分析", description: "需求拆解与影响范围", icon: ClipboardList },
  { id: "comp", name: "竞品参考", description: "竞品功能对标分析", icon: Building },
]

const disabledDimensions = [
  { id: "api", name: "接口规范", description: "API接口与协议定义", icon: FileCode },
  { id: "deploy", name: "部署配置", description: "部署架构与运维配置", icon: Server },
  { id: "quality", name: "质量指标", description: "准确率、延迟等量化指标", icon: Gauge },
  { id: "cost", name: "成本分析", description: "资源成本与ROI分析", icon: DollarSign },
]

const ROLE_BADGE: Record<string, { label: string; variant: string }> = {
  admin: { label: "管理员", variant: "default" },
  editor: { label: "编辑者", variant: "green" },
  viewer: { label: "查看者", variant: "secondary" },
}

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [activeTab, setActiveTab] = useState<TabType>("dimensions")
  const [project, setProject] = useState<ProjectData | null>(null)
  const [members, setMembers] = useState<MemberData[]>([])
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  const [level1, setLevel1] = useState("产品线")
  const [level2, setLevel2] = useState("模块")
  const [level3, setLevel3] = useState("功能项")
  const [aiProvider, setAiProvider] = useState("local")
  const [aiApiKey, setAiApiKey] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("viewer")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getProject(projectId).then((p) => {
      if (p) {
        setProject(p as ProjectData)
        setProjectName(p.name)
        setProjectDescription(p.description || "")
        const labels = p.hierarchyLabels as string[]
        if (labels?.length >= 3) {
          setLevel1(labels[0])
          setLevel2(labels[1])
          setLevel3(labels[2])
        }
        setAiProvider(p.aiProvider || "local")
      }
    })
    loadMembers()
  }, [projectId])

  const loadMembers = async () => {
    try {
      const m = await getProjectMembers(projectId)
      setMembers(m as MemberData[])
    } catch {
      // ignore
    }
  }

  const handleSaveBasic = async () => {
    setSaving(true)
    await updateProject(projectId, { name: projectName, description: projectDescription })
    setSaving(false)
  }

  const handleSaveHierarchy = async () => {
    setSaving(true)
    await updateProject(projectId, { hierarchyLabels: [level1, level2, level3] })
    setSaving(false)
  }

  const handleSaveAI = async () => {
    setSaving(true)
    await updateProjectAIConfig(projectId, aiProvider, aiApiKey || null)
    setSaving(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setSaving(true)
    const result = await addProjectMember(projectId, inviteEmail, inviteRole)
    if (result.success) {
      setInviteEmail("")
      await loadMembers()
    }
    setSaving(false)
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("确认移除该成员？")) return
    await removeProjectMember(projectId, userId)
    await loadMembers()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-sm">{settingsStrings.userInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{settingsStrings.userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/login">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </header>

      <div className="px-6 py-3 border-b border-border bg-card">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">{settingsStrings.myProjects}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/projects/${projectId}`}>{project?.name || "项目"}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{settingsStrings.settings}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex">
        <div className="w-[200px] border-r border-border p-4 space-y-1">
          <button
            onClick={() => setActiveTab("basic")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "basic"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {settingsStrings.basicInfo}
          </button>
          <button
            onClick={() => setActiveTab("dimensions")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "dimensions"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            维度管理
          </button>
          <button
            onClick={() => setActiveTab("hierarchy")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "hierarchy"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            层级配置
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "members"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {settingsStrings.memberManagement}
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "ai"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {settingsStrings.aiConfig}
          </button>
        </div>

        <div className="flex-1 p-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div>
              <h2 className="text-lg font-semibold mb-6">{settingsStrings.basicInfo}</h2>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>项目名称</Label>
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>项目描述</Label>
                  <Input value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>项目类型</Label>
                  <div className="flex items-center gap-2 py-2">
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                      {project?.templateType || "custom"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">（创建后不可更改）</span>
                  </div>
                </div>
                <Button variant="default" onClick={handleSaveBasic} disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          )}

          {/* Dimensions Management Tab */}
          {activeTab === "dimensions" && (
            <div>
              <h2 className="text-lg font-semibold mb-2">维度管理</h2>
              <p className="text-sm text-muted-foreground mb-6">配置本项目启用的知识维度和显示顺序</p>

              <div className="space-y-2">
                {enabledDimensions.map((dim) => (
                  <div key={dim.id} className="flex items-center gap-4 p-3 rounded-md border border-border">
                    <Switch defaultChecked />
                    <dim.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{dim.name}</span>
                    <span className="text-sm text-muted-foreground">{dim.description}</span>
                    <div className="flex-1" />
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                {disabledDimensions.map((dim) => (
                  <div key={dim.id} className="flex items-center gap-4 p-3 rounded-md border border-border opacity-60">
                    <Switch />
                    <dim.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-muted-foreground">{dim.name}</span>
                    <span className="text-sm text-muted-foreground">{dim.description}</span>
                    <div className="flex-1" />
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button variant="default">保存</Button>
              </div>
            </div>
          )}

          {/* Hierarchy Config Tab */}
          {activeTab === "hierarchy" && (
            <div>
              <h2 className="text-lg font-semibold mb-2">层级标签配置</h2>
              <p className="text-sm text-muted-foreground mb-6">自定义本项目的三层结构名称</p>

              <div className="flex gap-8">
                <div className="space-y-4 max-w-xs flex-1">
                  <div className="space-y-2">
                    <Label>第1层</Label>
                    <Input value={level1} onChange={(e) => setLevel1(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>第2层</Label>
                    <Input value={level2} onChange={(e) => setLevel2(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>第3层</Label>
                    <Input value={level3} onChange={(e) => setLevel3(e.target.value)} />
                  </div>
                  <Button variant="default" onClick={handleSaveHierarchy} disabled={saving}>
                    {saving ? "保存中..." : "保存"}
                  </Button>
                </div>

                <Card className="p-4 w-[200px]">
                  <h4 className="text-sm font-medium mb-3">预览</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span>{level1 || "产品线"}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      <span>{level2 || "模块"}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-8">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span>{level3 || "功能项"}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">{settingsStrings.memberManagement}</h2>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="输入邮箱"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-48"
                  />
                  <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="editor">编辑者</SelectItem>
                      <SelectItem value="viewer">查看者</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="default" onClick={handleInvite} disabled={saving}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {settingsStrings.inviteMember}
                  </Button>
                </div>
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12">{settingsStrings.avatar}</TableHead>
                      <TableHead>{settingsStrings.username}</TableHead>
                      <TableHead>{settingsStrings.email}</TableHead>
                      <TableHead>{settingsStrings.role}</TableHead>
                      <TableHead className="w-32">{settingsStrings.action}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => {
                      const roleInfo = ROLE_BADGE[member.role] || { label: member.role, variant: "secondary" }
                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-muted text-sm">
                                {member.userName?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{member.userName}</TableCell>
                          <TableCell className="text-muted-foreground">{member.userEmail}</TableCell>
                          <TableCell>
                            {roleInfo.variant === "green" ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{roleInfo.label}</Badge>
                            ) : (
                              <Badge variant={roleInfo.variant as "default" | "secondary"}>{roleInfo.label}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              className="text-sm text-destructive hover:underline"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              {settingsStrings.remove}
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {members.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                          暂无成员
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* AI Config Tab */}
          {activeTab === "ai" && (
            <div>
              <h2 className="text-lg font-semibold mb-6">{settingsStrings.aiConfig}</h2>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>{settingsStrings.aiProvider}</Label>
                  <Select value={aiProvider} onValueChange={(v) => v && setAiProvider(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">{settingsStrings.localMode}</SelectItem>
                      <SelectItem value="claude">Claude API</SelectItem>
                      <SelectItem value="codex">Codex API</SelectItem>
                      <SelectItem value="kimi">Kimi API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" placeholder="sk-..." value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} />
                </div>
                <Button variant="default" onClick={handleSaveAI} disabled={saving}>
                  {saving ? "保存中..." : settingsStrings.saveConfig}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
