"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import {
  Search, Bell, ChevronRight, LogOut, Settings, Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings } from "@/lib/project-detail-data"
import { activityGroups, actionTypeConfig } from "@/lib/activity-data"

export default function ActivityPage() {
  const params = useParams()
  const projectId = params.id as string
  const [actionFilter, setActionFilter] = useState("全部")
  const [userFilter, setUserFilter] = useState("全部")
  const [timeFilter, setTimeFilter] = useState("全部")

  const totalRecords = activityGroups.reduce((sum, g) => sum + g.records.length, 0)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
        <Link href="/projects" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
        <Link href="/search" className="relative w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={detailStrings.searchPlaceholder} className="pl-9 cursor-pointer" readOnly />
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href="/admin"><Shield className="h-4 w-4 text-muted-foreground" /></Link></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild><Link href={`/projects/${projectId}/settings`}><Settings className="h-4 w-4 text-muted-foreground" /></Link></Button>
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
            <BreadcrumbItem><BreadcrumbLink href="/projects">{detailStrings.myProjects}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
            <BreadcrumbItem><BreadcrumbLink href={`/projects/${projectId}`}>{detailStrings.projectName}</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
            <BreadcrumbItem><BreadcrumbPage>操作日志</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center justify-between px-6 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">操作日志</h2>
          <Badge variant="secondary">{totalRecords} 条记录</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="操作类型" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部类型</SelectItem>
              <SelectItem value="create">创建</SelectItem>
              <SelectItem value="edit">编辑</SelectItem>
              <SelectItem value="delete">删除</SelectItem>
              <SelectItem value="import">导入</SelectItem>
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="操作者" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部人员</SelectItem>
              <SelectItem value="陈玥">陈玥</SelectItem>
              <SelectItem value="王工">王工</SelectItem>
              <SelectItem value="李工">李工</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="时间范围" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部时间</SelectItem>
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="7d">近7天</SelectItem>
              <SelectItem value="30d">近30天</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 pb-6">
          {activityGroups.map((group) => (
            <div key={group.label}>
              <div className="text-sm font-medium text-muted-foreground py-2 mt-2">{group.label}</div>
              {group.records.map((record) => {
                const config = actionTypeConfig[record.actionType]
                return (
                  <div key={record.id} className="flex items-center gap-3 py-3 border-b border-border/60">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-muted text-xs">{record.userInitial}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm min-w-0">
                      <span className="font-medium">{record.user}</span>
                      {" "}
                      <span className={config.color}>{record.action}</span>
                      {" "}
                      <span>{record.target}</span>
                    </div>
                    <div className="flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">{record.time}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">{record.path}</Badge>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
