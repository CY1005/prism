"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  Search, Bell, LogOut, Shield, ChevronRight, UserPlus, Plus, Settings,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"
import { teamsData, teamMembersData, teamProjectsData } from "@/lib/teams-data"

type TabId = "overview" | "members" | "projects" | "settings"

const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "团队概览" },
  { id: "members", label: "成员管理" },
  { id: "projects", label: "项目管理" },
  { id: "settings", label: "团队设置" },
]

export default function TeamDetailPage() {
  const params = useParams()
  const teamId = params.id as string
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  const team = teamsData.find((t) => t.id === teamId) || teamsData[0]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-6">
          <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground pb-0.5">项目</Link>
          <Link href="/teams" className="text-sm text-primary font-medium border-b-2 border-primary pb-0.5">团队</Link>
        </div>
        <Link href="/search" className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="搜索项目、模块、功能..." className="pl-9 cursor-pointer" readOnly />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href="/admin"><Shield className="h-4 w-4 text-muted-foreground" /></Link></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Bell className="h-4 w-4 text-muted-foreground" /></Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-muted text-sm">{detailStrings.userInitials}</AvatarFallback></Avatar>
            <span className="text-sm text-foreground">{detailStrings.userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href="/login"><LogOut className="h-4 w-4 text-muted-foreground" /></Link></Button>
        </div>
      </header>

      <div className="px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/teams">团队</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
            <BreadcrumbItem><BreadcrumbPage>{team.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex flex-1 px-6 pb-6 gap-6">
        {/* Left sidebar */}
        <div className="w-[240px] shrink-0">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                className={`w-full justify-start ${activeTab === tab.id ? "bg-muted font-medium" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold">{team.name}</h1>
                  <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-xs">{team.role}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">创建于 {team.created}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="border-border/60 p-4 shadow-sm">
                  <span className="text-2xl font-bold">{team.projects}</span>
                  <p className="text-sm text-muted-foreground">项目数</p>
                </Card>
                <Card className="border-border/60 p-4 shadow-sm">
                  <span className="text-2xl font-bold">{team.members}</span>
                  <p className="text-sm text-muted-foreground">成员数</p>
                </Card>
                <Card className="border-border/60 p-4 shadow-sm">
                  <span className="text-2xl font-bold">12</span>
                  <p className="text-sm text-muted-foreground">本月活跃天数</p>
                </Card>
              </div>

              <Card className="border-border/60 shadow-sm">
                <div className="p-4 border-b border-border">
                  <h3 className="font-medium">团队项目</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>项目名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>完善度</TableHead>
                      <TableHead>最近更新</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamProjectsData.map((project) => (
                      <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs border-${project.typeColor}-200 text-${project.typeColor}-700 bg-${project.typeColor}-50`}>
                            {project.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={project.completion} className="h-2 w-20" />
                            <span className="text-sm text-muted-foreground">{project.completion}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">2小时前</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === "members" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">成员管理</h2>
                <Button size="sm"><UserPlus className="h-3.5 w-3.5 mr-1" />邀请成员</Button>
              </div>
              <Card className="border-border/60 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>成员</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>团队角色</TableHead>
                      <TableHead>项目数</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembersData.map((member) => (
                      <TableRow key={member.email}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7"><AvatarFallback className="bg-muted text-xs">{member.name[0]}</AvatarFallback></Avatar>
                            <span className="font-medium">{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant={member.role === "团队管理员" ? "default" : "secondary"} className="text-xs">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.projects}</TableCell>
                        <TableCell>
                          {member.isCreator ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="h-7 text-xs">编辑角色</Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">移除</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === "projects" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">项目管理</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">迁入已有项目</Button>
                  <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" />新建项目</Button>
                </div>
              </div>
              <Card className="border-border/60 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>项目名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>创建者</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamProjectsData.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{project.type}</Badge>
                        </TableCell>
                        <TableCell>{project.creator}</TableCell>
                        <TableCell className="text-muted-foreground">{project.created}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">设置</Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">移出团队</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-lg font-semibold">团队设置</h2>
              <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block">团队名称</Label>
                  <Input defaultValue={team.name} />
                </div>
                <div>
                  <Label className="mb-1.5 block">团队描述</Label>
                  <Textarea defaultValue={team.description} rows={3} />
                </div>
                <Button>保存</Button>
              </div>

              <Separator />

              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <h3 className="font-medium text-destructive mb-2">危险操作</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  解散团队后，团队下的所有项目将变为个人项目。此操作不可撤销。
                </p>
                <Button variant="destructive" size="sm">解散团队</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
