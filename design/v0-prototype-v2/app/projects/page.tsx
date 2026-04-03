"use client"

import Link from "next/link"
import { Search, Bell, Plus, LogOut, Shield } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { projectsData, projectsStrings } from "@/lib/projects-data"

export default function ProjectsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <Link href="/search" className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={projectsStrings.searchPlaceholder}
            className="pl-9 cursor-pointer"
            readOnly
          />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/admin">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="h-4 w-4 text-muted-foreground" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-muted text-sm">{projectsStrings.userInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">{projectsStrings.userName}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/login">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Page Title */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">{projectsStrings.myProjects}</h1>
        <Button variant="default">
          <Plus className="mr-2 h-4 w-4" />
          {projectsStrings.newProject}
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-3 gap-4 px-6">
        {projectsData.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="border-border/60 p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
            <h3 className="font-semibold text-foreground">{project.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
            <div className="mt-3 flex gap-4">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {project.productLines}
                </span>
                <p className="text-xs text-muted-foreground">{projectsStrings.productLine}</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {project.modules}
                </span>
                <p className="text-xs text-muted-foreground">{projectsStrings.module}</p>
              </div>
              <div>
                <span className="text-2xl font-bold text-primary">
                  {project.completion}%
                </span>
                <p className="text-xs text-muted-foreground">{projectsStrings.completion}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {projectsStrings.lastUpdated}{project.lastUpdated}
              </span>
              <div className="flex">
                {project.members.map((member, index) => (
                  <Avatar
                    key={index}
                    className={`h-6 w-6 border-2 border-card ${index > 0 ? "-ml-2" : ""}`}
                  >
                    <AvatarFallback className="bg-muted text-xs">
                      {member}
                    </AvatarFallback>
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
