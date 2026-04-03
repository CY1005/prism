"use client"

import Link from "next/link"
import { Search, Bell, ChevronRight, LogOut, Settings, Shield } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { detailStrings, productLines, recentUpdates, statsLabels } from "@/lib/project-detail-data"

function getStatusColor(percent: number) {
  if (percent >= 80) return "bg-green-500"
  if (percent >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export default function ProjectOverviewPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
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
            <Link href="/projects/1/settings">
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
              <BreadcrumbPage>{detailStrings.projectName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="grid grid-cols-4 gap-4 px-6 py-4">
        <Card className="border-border/60 p-4 shadow-sm">
          <span className="text-2xl font-bold text-foreground">{statsLabels.line1}</span>
          <p className="text-sm text-muted-foreground">{detailStrings.productLine}</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-sm">
          <span className="text-2xl font-bold text-foreground">{statsLabels.line2}</span>
          <p className="text-sm text-muted-foreground">{detailStrings.modules}</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-sm">
          <span className="text-2xl font-bold text-foreground">{statsLabels.line3}</span>
          <p className="text-sm text-muted-foreground">{detailStrings.features}</p>
        </Card>
        <Card className="border-border/60 p-4 shadow-sm">
          <span className="text-2xl font-bold text-foreground">{statsLabels.line4}</span>
          <p className="text-sm text-muted-foreground">{detailStrings.avgCompletion}</p>
          <Progress value={58} className="mt-2 h-2" />
        </Card>
      </div>

      <div className="flex flex-1 gap-6 px-6 pb-6">
        <Card className="flex-1 border-border/60 p-6 shadow-sm">
          <div className="flex gap-6">
            {productLines.map((line) => (
              <div key={line.name} className="flex flex-col items-center">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
                  <span
                    className={`h-2 w-2 rounded-full ${getStatusColor(line.completion)}`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {line.name}
                  </span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex flex-col gap-2">
                  {line.modules.map((module, index) => (
                    <div key={module.name} className="flex flex-col items-center">
                      {index > 0 && <div className="h-2 w-px bg-border" />}
                      <Link href="/" className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-2 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${getStatusColor(module.completion)}`}
                        />
                        <span className="text-xs text-foreground">
                          {module.name}
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="w-[280px] border-border/60 p-4 shadow-sm">
          <h3 className="mb-4 font-medium text-foreground">{detailStrings.recentUpdates}</h3>
          <div className="space-y-0">
            {recentUpdates.map((update, index) => (
              <div key={index}>
                <div className="flex gap-3 py-3">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="bg-muted text-xs">
                      {update.user}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {update.user} {update.action}
                    </p>
                    <p className="text-xs text-muted-foreground">{update.time}</p>
                  </div>
                </div>
                {index < recentUpdates.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
