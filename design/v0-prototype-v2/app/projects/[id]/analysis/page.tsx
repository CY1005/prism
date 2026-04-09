"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  Scale,
  TestTube,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { detailStrings } from "@/lib/project-detail-data"
import { analysisResultData } from "@/lib/analysis-data"

export default function AnalysisPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
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
            <Link href={`/projects/${projectId}/settings`}>
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

      {/* Breadcrumb */}
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
              <BreadcrumbLink href={`/projects/${projectId}`}>{detailStrings.projectName}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>需求分析</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-border px-6">
        <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          全景图
        </Link>
        <Link href={`/projects/${projectId}/product-lines/private-cloud`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          产品线
        </Link>
        <Link href={`/projects/${projectId}/analysis`} className="border-b-2 border-primary text-primary font-medium pb-3 pt-2 text-sm">
          需求分析
        </Link>
        <Link href={`/projects/${projectId}/comparison`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm">
          竞品对比
        </Link>
        <div className="flex-1" />
        <Link href={`/projects/${projectId}/settings`} className="text-muted-foreground hover:text-foreground pb-3 pt-2 text-sm flex items-center gap-1">
          <Settings className="h-3.5 w-3.5" />
          设置
        </Link>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto p-6">
          {/* Input Card */}
          <Card className="border-border/60 shadow-sm p-6">
            <h2 className="text-xl font-semibold">需求分析</h2>
            <p className="text-sm text-muted-foreground mt-1">
              输入新需求描述，AI 将分析影响范围、完整性和合理性
            </p>
            <Textarea
              className="mt-4 min-h-[128px]"
              placeholder="粘贴需求描述..."
            />
            <div className="flex gap-2 mt-4">
              <Button>开始分析</Button>
              <Button variant="outline">生成测试点</Button>
            </div>
          </Card>

          {/* Results */}
          <div className="space-y-4 mt-6">
            {/* Impact Analysis */}
            <Card className="border-border/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium">{analysisResultData.impactAnalysis.title}</h3>
                <Badge variant="destructive">涉及 {analysisResultData.impactAnalysis.affectedModulesCount} 个模块</Badge>
              </div>
              <div className="space-y-2">
                {analysisResultData.impactAnalysis.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${item.type === "direct" ? "bg-red-500" : "bg-yellow-500"}`} />
                    <span className="text-sm">{item.path}</span>
                    <Badge className={item.type === "direct" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}>
                      {item.type === "direct" ? "直接影响" : "间接影响"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Completeness Check */}
            <Card className="border-border/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-medium">{analysisResultData.completenessCheck.title}</h3>
              </div>
              <div className="space-y-2 text-sm">
                {analysisResultData.completenessCheck.items.map((item, index) => (
                  <p key={index}>
                    <span className={item.passed ? "text-green-500" : "text-red-500"}>
                      {item.passed ? "\u2705" : "\u274C"}
                    </span>{" "}
                    {item.text}
                  </p>
                ))}
              </div>
            </Card>

            {/* Reasonability Evaluation */}
            <Card className="border-border/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">{analysisResultData.reasonabilityEval.title}</h3>
                <Badge className="bg-yellow-50 text-yellow-700">{analysisResultData.reasonabilityEval.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{analysisResultData.reasonabilityEval.description}</p>
            </Card>

            {/* Test Points */}
            <Card className="border-border/60 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TestTube className="h-5 w-5 text-primary" />
                <h3 className="font-medium">{analysisResultData.testPoints.title}</h3>
                <Badge variant="secondary">{analysisResultData.testPoints.count} 条</Badge>
              </div>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>测试点</TableHead>
                      <TableHead className="w-20">优先级</TableHead>
                      <TableHead className="w-28">关联功能</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisResultData.testPoints.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <Badge className={item.priority === "P0" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}>
                            {item.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.relatedFeature}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-primary cursor-pointer mt-2">
                查看全部 {analysisResultData.testPoints.count} 条 →
              </p>
              <Button variant="outline" className="mt-3">
                一键录入到测试分析
              </Button>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
