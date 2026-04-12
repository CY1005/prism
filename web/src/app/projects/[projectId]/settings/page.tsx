"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { use } from "react"
import { Bell, UserPlus, LogOut, GripVertical, Folder, File } from "lucide-react"
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
import {
  getProjectDimensionConfigs,
  updateDimensionConfig,
  type DimensionConfigRow,
} from "@/actions/project-settings"
import { logout, getSessionUser } from "@/actions/auth"
import { useProjectRole } from "@/contexts/project-role-context"

type TabType = "basic" | "dimensions" | "hierarchy" | "members" | "ai"

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

const ROLE_BADGE: Record<string, { label: string; variant: string }> = {
  admin: { label: "管理员", variant: "default" },
  editor: { label: "编辑者", variant: "green" },
  viewer: { label: "查看者", variant: "secondary" },
}

export default function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { canAdmin } = useProjectRole()
  const [activeTab, setActiveTab] = useState<TabType>("dimensions")
  const [project, setProject] = useState<ProjectData | null>(null)
  const [members, setMembers] = useState<MemberData[]>([])
  const [dimensionConfigs, setDimensionConfigs] = useState<DimensionConfigRow[]>([])
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
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("")

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
    loadDimensions()
    getSessionUser().then((user) => {
      if (user) {
        setUserName(user.name)
        setUserInitials(user.name.charAt(0))
      }
    })
  }, [projectId])

  const loadMembers = async () => {
    try {
      const m = await getProjectMembers(projectId)
      setMembers(m as MemberData[])
    } catch {
      // ignore
    }
  }

  const loadDimensions = async () => {
    try {
      const configs = await getProjectDimensionConfigs(projectId)
      setDimensionConfigs(configs)
    } catch {
      // ignore
    }
  }

  const handleToggleDimension = (configId: number, enabled: boolean) => {
    setDimensionConfigs((prev) =>
      prev.map((c) => (c.configId === configId ? { ...c, enabled } : c))
    )
  }

  const handleSaveDimensions = async () => {
    setSaving(true)
    await updateDimensionConfig(
      projectId,
      dimensionConfigs.map((c, i) => ({
        dimensionTypeId: c.dimensionTypeId,
        enabled: c.enabled,
        sortOrder: i,
      })),
    )
    setSaving(false)
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
    // Pass raw key — server action handles encryption
    await updateProjectAIConfig(projectId, aiProvider, aiApiKey || null)
    setAiApiKey("")
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

  const handleLogout = async () => {
    await logout()
  }

  const enabledDims = dimensionConfigs.filter((c) => c.enabled)
  const disabledDims = dimensionConfigs.filter((c) => !c.enabled)

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
              <AvatarFallback className="bg-muted text-sm">{userInitials || "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="px-6 py-3 border-b border-border bg-card">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/projects">我的项目</BreadcrumbLink>
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
              <BreadcrumbPage>设置</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex">
        <div className="w-[200px] border-r border-border p-4 space-y-1">
          {(["basic", "dimensions", "hierarchy", "members", "ai"] as TabType[]).map((tab) => {
            const labels: Record<TabType, string> = {
              basic: "基本信息",
              dimensions: "维度管理",
              hierarchy: "层级配置",
              members: "成员管理",
              ai: "AI配置",
            }
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                  activeTab === tab
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        <div className="flex-1 p-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div>
              <h2 className="text-lg font-semibold mb-6">基本信息</h2>
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
                <Button
                  variant="default"
                  onClick={handleSaveBasic}
                  disabled={saving || !canAdmin}
                  title={!canAdmin ? "查看者无编辑权限" : undefined}
                >
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          )}

          {/* Dimensions Management Tab — reads from DB */}
          {activeTab === "dimensions" && (
            <div>
              <h2 className="text-lg font-semibold mb-2">维度管理</h2>
              <p className="text-sm text-muted-foreground mb-6">配置本项目启用的知识维度和显示顺序</p>

              {dimensionConfigs.length === 0 ? (
                <p className="text-muted-foreground text-sm">暂无维度配置，请先通过模板创建项目</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {enabledDims.map((dim) => (
                      <div key={dim.configId} className="flex items-center gap-4 p-3 rounded-md border border-border">
                        <Switch
                          checked={true}
                          onCheckedChange={(checked) => handleToggleDimension(dim.configId, checked)}
                          disabled={!canAdmin}
                        />
                        <span className="font-medium text-sm">{dim.name}</span>
                        <span className="text-sm text-muted-foreground">{dim.description}</span>
                        <div className="flex-1" />
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </div>
                    ))}
                  </div>

                  {disabledDims.length > 0 && (
                    <>
                      <Separator className="my-6" />
                      <div className="space-y-2">
                        {disabledDims.map((dim) => (
                          <div key={dim.configId} className="flex items-center gap-4 p-3 rounded-md border border-border opacity-60">
                            <Switch
                              checked={false}
                              onCheckedChange={(checked) => handleToggleDimension(dim.configId, checked)}
                              disabled={!canAdmin}
                            />
                            <span className="font-medium text-sm text-muted-foreground">{dim.name}</span>
                            <span className="text-sm text-muted-foreground">{dim.description}</span>
                            <div className="flex-1" />
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="mt-6">
                    <Button
                      variant="default"
                      onClick={handleSaveDimensions}
                      disabled={saving || !canAdmin}
                      title={!canAdmin ? "查看者无编辑权限" : undefined}
                    >
                      {saving ? "保存中..." : "保存"}
                    </Button>
                  </div>
                </>
              )}
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
                  <Button
                    variant="default"
                    onClick={handleSaveHierarchy}
                    disabled={saving || !canAdmin}
                    title={!canAdmin ? "查看者无编辑权限" : undefined}
                  >
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
                <h2 className="text-lg font-semibold">成员管理</h2>
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
                  <Button
                    variant="default"
                    onClick={handleInvite}
                    disabled={saving || !canAdmin}
                    title={!canAdmin ? "查看者无编辑权限" : undefined}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    邀请成员
                  </Button>
                </div>
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12">头像</TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead className="w-32">操作</TableHead>
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
                              className="text-sm text-destructive hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => canAdmin && handleRemoveMember(member.userId)}
                              disabled={!canAdmin}
                              title={!canAdmin ? "查看者无编辑权限" : undefined}
                            >
                              移除
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
              <h2 className="text-lg font-semibold mb-6">AI配置</h2>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <Select value={aiProvider} onValueChange={(v) => v && setAiProvider(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">本地模式</SelectItem>
                      <SelectItem value="claude">Claude API</SelectItem>
                      <SelectItem value="codex">Codex API</SelectItem>
                      <SelectItem value="kimi">Kimi API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" placeholder="sk-..." value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} />
                  <p className="text-xs text-muted-foreground">密钥将加密存储，保存后不可查看原文</p>
                </div>
                <Button
                  variant="default"
                  onClick={handleSaveAI}
                  disabled={saving || !canAdmin}
                  title={!canAdmin ? "查看者无编辑权限" : undefined}
                >
                  {saving ? "保存中..." : "保存配置"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
