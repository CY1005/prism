"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { use } from "react"
import {
  Bell,
  LogOut,
  ChevronRight,
  UserPlus,
  Trash2,
  FolderOpen,
  Users,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import {
  getTeamById,
  updateTeam,
  deleteTeam,
  inviteMember,
  removeMember,
  updateMemberRole,
  getTeamProjects,
} from "@/actions/teams"
import { logout, getSessionUser } from "@/actions/auth"
import { useRouter } from "next/navigation"

type TeamDetail = {
  id: string
  name: string
  description: string | null
  ownerId: string
  createdAt: Date
  members: {
    id: string
    userId: string
    role: string
    joinedAt: Date
    userName: string
    userEmail: string
  }[]
}

type TeamProject = {
  id: string
  name: string
  description: string | null
  templateType: string
  createdAt: Date
}

const ROLE_BADGE: Record<string, { label: string; variant: string }> = {
  admin: { label: "管理员", variant: "default" },
  member: { label: "成员", variant: "secondary" },
}

export default function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params)
  const router = useRouter()
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [projects, setProjects] = useState<TeamProject[]>([])
  const [currentUserId, setCurrentUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("")

  // Edit team state
  const [editDialog, setEditDialog] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [saving, setSaving] = useState(false)

  // Invite state
  const [inviteDialog, setInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")
  const [inviting, setInviting] = useState(false)

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadTeam = async () => {
    try {
      const data = await getTeamById(teamId)
      setTeam(data as TeamDetail)
    } catch {
      // ignore
    }
  }

  const loadProjects = async () => {
    try {
      const data = await getTeamProjects(teamId)
      setProjects(data as TeamProject[])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadTeam()
    loadProjects()
    getSessionUser().then((user) => {
      if (user) {
        setCurrentUserId(user.id)
        setUserName(user.name)
        setUserInitials(user.name.charAt(0))
      }
    })
  }, [teamId])

  const isOwner = team?.ownerId === currentUserId
  const isAdmin =
    isOwner || team?.members.some((m) => m.userId === currentUserId && m.role === "admin")

  const handleEditTeam = async () => {
    setSaving(true)
    const result = await updateTeam(teamId, {
      name: editName.trim(),
      description: editDesc.trim() || undefined,
    })
    if (result.success) {
      setEditDialog(false)
      await loadTeam()
    }
    setSaving(false)
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    const result = await inviteMember(teamId, {
      email: inviteEmail.trim(),
      role: inviteRole,
    })
    if (result.success) {
      setInviteDialog(false)
      setInviteEmail("")
      setInviteRole("member")
      await loadTeam()
    }
    setInviting(false)
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("确认移除该成员？")) return
    const result = await removeMember(teamId, userId)
    if (result.success) await loadTeam()
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    const result = await updateMemberRole(teamId, userId, newRole)
    if (result.success) await loadTeam()
  }

  const handleDeleteTeam = async () => {
    setDeleting(true)
    const result = await deleteTeam(teamId)
    if (result.success) {
      router.push("/teams")
    }
    setDeleting(false)
  }

  const handleLogout = async () => {
    await logout()
  }

  if (!team) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
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
              <BreadcrumbLink href="/teams">团队空间</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{team.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto w-full max-w-4xl px-6 py-6 space-y-8">
        {/* Team Info Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{team.name}</h1>
            {team.description && (
              <p className="mt-1 text-muted-foreground">{team.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              创建于 {new Date(team.createdAt).toLocaleDateString("zh-CN")}
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditName(team.name)
                setEditDesc(team.description || "")
                setEditDialog(true)
              }}
            >
              <Settings className="h-3.5 w-3.5" />
              编辑
            </Button>
          )}
        </div>

        <Separator />

        {/* Members Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              成员 ({team.members.length})
            </h2>
            {isAdmin && (
              <Button variant="default" size="sm" onClick={() => setInviteDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                邀请成员
              </Button>
            )}
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-12">头像</TableHead>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  {isAdmin && <TableHead className="w-40">操作</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.members.map((member) => {
                  const roleInfo = ROLE_BADGE[member.role] || { label: member.role, variant: "secondary" }
                  const isMemberOwner = member.userId === team.ownerId
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-sm">
                            {member.userName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {member.userName}
                        {isMemberOwner && (
                          <Badge variant="outline" className="ml-2 text-xs">创建者</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{member.userEmail}</TableCell>
                      <TableCell>
                        {isOwner && !isMemberOwner ? (
                          <Select
                            value={member.role}
                            onValueChange={(v) => v && handleChangeRole(member.userId, v)}
                          >
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">管理员</SelectItem>
                              <SelectItem value="member">成员</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={roleInfo.variant as "default" | "secondary"}>
                            {roleInfo.label}
                          </Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {!isMemberOwner && (
                            <button
                              className="text-sm text-destructive hover:underline"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              移除
                            </button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <Separator />

        {/* Projects Section */}
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FolderOpen className="h-5 w-5" />
            团队项目 ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <Card className="border-dashed border-2 p-8 text-center">
              <FolderOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                暂无团队项目，可在项目设置中将个人项目迁移到此团队
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="rounded-lg border p-4 hover:border-primary/30 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{project.name}</span>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{project.templateType}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Delete Team (owner only) */}
        {isOwner && (
          <>
            <Separator />
            <div>
              <h2 className="text-lg font-semibold text-destructive mb-2">危险区域</h2>
              <p className="text-sm text-muted-foreground mb-4">
                删除团队将移除所有成员关系，团队项目将变为个人项目。此操作不可撤销。
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除团队
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑团队</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>团队名称</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>团队描述</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>取消</Button>
            <Button onClick={handleEditTeam} disabled={!editName.trim() || saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialog} onOpenChange={setInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>邀请成员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>邮箱</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="输入用户邮箱"
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="member">成员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialog(false)}>取消</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting}>
              {inviting ? "邀请中..." : "邀请"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除团队</DialogTitle>
            <DialogDescription>
              删除团队「{team.name}」将移除所有成员关系。团队项目将变为个人项目。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteTeam} disabled={deleting}>
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
