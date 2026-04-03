"use client"

import Link from "next/link"
import { use } from "react"
import { Bell, UserPlus, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
import { settingsStrings, settingsMembers } from "@/lib/settings-data"

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
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
              <BreadcrumbLink href={`/projects/${id}`}>{settingsStrings.projectName}</BreadcrumbLink>
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
          <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors">
            {settingsStrings.basicInfo}
          </button>
          <button className="w-full text-left px-3 py-2 text-sm bg-primary/10 text-primary font-medium rounded-md">
            {settingsStrings.memberManagement}
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors">
            {settingsStrings.aiConfig}
          </button>
        </div>

        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">{settingsStrings.memberManagement}</h2>
            <Button variant="default">
              <UserPlus className="h-4 w-4 mr-2" />
              {settingsStrings.inviteMember}
            </Button>
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
                {settingsMembers.map((member) => (
                  <TableRow key={member.email}>
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-sm">{member.initials}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                    <TableCell>
                      {member.roleVariant === "green" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{member.role}</Badge>
                      ) : (
                        <Badge variant={member.roleVariant}>{member.role}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.canEdit ? (
                        <span className="text-sm">
                          <button className="text-primary hover:underline">{settingsStrings.editRole}</button>
                          <span className="text-muted-foreground mx-1">·</span>
                          <button className="text-primary hover:underline">{settingsStrings.remove}</button>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator className="mt-8" />

          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-6">{settingsStrings.aiConfig}</h2>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>{settingsStrings.aiProvider}</Label>
                <Select defaultValue="local">
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
                <Input type="password" placeholder="sk-..." />
              </div>
              <Button variant="default">{settingsStrings.saveConfig}</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
