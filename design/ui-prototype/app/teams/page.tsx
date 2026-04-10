"use client"

import Link from "next/link"
import {
  Search, Bell, LogOut, Shield, Settings, Plus, ChevronRight,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { detailStrings } from "@/lib/project-detail-data"
import { teamsData } from "@/lib/teams-data"

export default function TeamsPage() {
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

      <div className="max-w-5xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">我的团队</h1>
          <Button><Plus className="h-4 w-4 mr-2" />创建团队</Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {teamsData.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <Card className="p-4 hover:border-primary/40 transition-all cursor-pointer border-border/60">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-muted text-sm">{team.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium">{team.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          team.role === "管理员"
                            ? "border-blue-200 text-blue-700 bg-blue-50"
                            : ""
                        }`}
                      >
                        {team.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{team.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {team.projects} 个项目 · {team.members} 个成员 · 创建于 {team.created}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
