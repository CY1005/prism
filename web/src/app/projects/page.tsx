"use client"

import Link from "next/link"
import { Bell, Plus, LogOut, Shield } from "lucide-react"
import { GlobalSearchBar } from "@/components/global-search-bar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { projectsData, projectsStrings } from "@/lib/projects-data"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { listProjects, type ProjectSummary } from "@/services/projects"
import { logout, getSessionUser } from "@/actions/auth"

const typeColorMap: Record<string, string> = {
  blue: "border-blue-200 text-blue-700 bg-blue-50",
  green: "border-green-200 text-green-700 bg-green-50",
  purple: "border-purple-200 text-purple-700 bg-purple-50",
  orange: "border-orange-200 text-orange-700 bg-orange-50",
}

const templateLabel: Record<string, string> = {
  product_analysis: "产品分析",
  system_architecture: "系统架构",
  research_platform: "研究平台",
  custom: "自定义",
}

const templateColor: Record<string, string> = {
  product_analysis: "blue",
  system_architecture: "green",
  research_platform: "purple",
  custom: "orange",
}

export default function ProjectsPage() {
  const [apiProjects, setApiProjects] = useState<ProjectSummary[] | null>(null)
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("")

  useEffect(() => {
    listProjects().then((r) => {
      if (r.ok && r.data.projects.length > 0) setApiProjects(r.data.projects)
    })
    getSessionUser().then((user) => {
      if (user) {
        setUserName(user.name)
        setUserInitials(user.name.charAt(0))
      }
    })
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  // Use API data if available, otherwise mock
  const displayProjects = apiProjects
    ? apiProjects.map((p) => ({
        id: p.id,
        title: p.name,
        type: templateLabel[p.template_type] || p.template_type,
        typeColor: templateColor[p.template_type] || "blue",
        description: p.description || "",
        stats: [
          { value: p.total_nodes, label: "模块" },
          { value: p.total_files, label: "功能项" },
          { value: `${Math.round(p.avg_completion)}%`, label: "完善度" },
        ],
        lastUpdated: p.created_at ? new Date(p.created_at).toLocaleDateString("zh-CN") : "",
        members: ["陈"],
      }))
    : projectsData

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <GlobalSearchBar />
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
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

      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">{projectsStrings.myProjects}</h1>
        <Link href="/projects/new">
          <Button variant="default">
            <Plus className="mr-2 h-4 w-4" />{projectsStrings.newProject}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6">
        {displayProjects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="border-border/60 p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className={cn("text-xs mb-2", typeColorMap[project.typeColor])}>
                    {project.type}
                  </Badge>
                  <h3 className="font-semibold text-foreground">{project.title}</h3>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
              <div className="mt-3 flex gap-4">
                {project.stats.map((stat, index) => (
                  <div key={index}>
                    <span className={cn("text-2xl font-bold", index === project.stats.length - 1 ? "text-primary" : "text-foreground")}>
                      {stat.value}
                    </span>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{projectsStrings.lastUpdated}{project.lastUpdated}</span>
                <div className="flex">
                  {project.members.map((member, index) => (
                    <Avatar key={index} className={`h-6 w-6 border-2 border-card ${index > 0 ? "-ml-2" : ""}`}>
                      <AvatarFallback className="bg-muted text-xs">{member}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
