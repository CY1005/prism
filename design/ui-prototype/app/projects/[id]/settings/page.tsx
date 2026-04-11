"use client"

import { useState } from "react"
import Link from "next/link"
import { use } from "react"
import { Bell, UserPlus, LogOut, GripVertical, FileText, Users, Server, GitBranch, Lightbulb, TestTube, ClipboardList, Building, FileCode, Gauge, DollarSign, Folder, File, Plus, Pencil, Trash2, Upload, Download, ChevronDown } from "lucide-react"
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
import { settingsStrings, settingsMembers } from "@/lib/settings-data"
import { cn } from "@/lib/utils"

const competitors = [
  { name: "Run:ai", description: "GPU虚拟化与编排平台，专注于AI基础设施资源优化", featureCount: 24 },
  { name: "AWS SageMaker", description: "AWS全托管机器学习平台，覆盖ML全生命周期", featureCount: 42 },
  { name: "华为 ModelArts", description: "华为云一站式AI开发平台，面向企业级AI应用", featureCount: 36 },
  { name: "阿里云 PAI", description: "阿里云机器学习平台，提供端到端AI工程化能力", featureCount: 31 },
  { name: "Kubeflow", description: "基于Kubernetes的开源ML工作流平台", featureCount: 18 },
]

type TabType = "basic" | "dimensions" | "hierarchy" | "members" | "ai" | "competitors" | "import-export"

const enabledDimensions = [
  { id: "desc", name: "功能描述", description: "功能的核心说明", icon: FileText },
  { id: "user", name: "用户场景", description: "谁在什么场景下使用", icon: Users },
  { id: "tech", name: "技术实现", description: "平台侧的技术方案", icon: Server },
  { id: "decision", name: "设计决策", description: "关键架构决策及取舍", icon: GitBranch },
  { id: "exp", name: "工程经验", description: "踩坑记录与最佳实践", icon: Lightbulb },
  { id: "test", name: "测试分析", description: "测试策略与问题记录", icon: TestTube },
  { id: "req", name: "需求分析", description: "需求拆解与影响范围", icon: ClipboardList },
  { id: "comp", name: "竞品参考", description: "竞品功能对标分析", icon: Building },
]

const disabledDimensions = [
  { id: "api", name: "接口规范", description: "API接口与协议定义", icon: FileCode },
  { id: "deploy", name: "部署配置", description: "部署架构与运维配置", icon: Server },
  { id: "quality", name: "质量指标", description: "准确率、延迟等量化指标", icon: Gauge },
  { id: "cost", name: "成本分析", description: "资源成本与ROI分析", icon: DollarSign },
]

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<TabType>("dimensions")
  const [level1, setLevel1] = useState("产品线")
  const [level2, setLevel2] = useState("模块")
  const [level3, setLevel3] = useState("功能项")
  
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
          <button 
            onClick={() => setActiveTab("basic")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "basic" 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {settingsStrings.basicInfo}
          </button>
          <button 
            onClick={() => setActiveTab("dimensions")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "dimensions" 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            维度管理
          </button>
          <button 
            onClick={() => setActiveTab("hierarchy")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "hierarchy" 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            层级配置
          </button>
          <button 
            onClick={() => setActiveTab("members")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "members" 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {settingsStrings.memberManagement}
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "ai"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {settingsStrings.aiConfig}
          </button>
          <button
            onClick={() => setActiveTab("competitors")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "competitors"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            竞品管理
          </button>
          <button
            onClick={() => setActiveTab("import-export")}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              activeTab === "import-export"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            导入/导出
          </button>
        </div>

        <div className="flex-1 p-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div>
              <h2 className="text-lg font-semibold mb-6">{settingsStrings.basicInfo}</h2>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>项目名称</Label>
                  <Input defaultValue="AI云平台竞品分析" />
                </div>
                <div className="space-y-2">
                  <Label>项目描述</Label>
                  <Input defaultValue="系统性分析AI云平台行业竞品设计与技术" />
                </div>
                <div className="space-y-2">
                  <Label>项目类型</Label>
                  <div className="flex items-center gap-2 py-2">
                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                      产品竞品分析
                    </Badge>
                    <span className="text-xs text-muted-foreground">（创建后不可更改）</span>
                  </div>
                </div>
                <Button variant="default">保存</Button>
              </div>
            </div>
          )}

          {/* Dimensions Management Tab */}
          {activeTab === "dimensions" && (
            <div>
              <h2 className="text-lg font-semibold mb-2">维度管理</h2>
              <p className="text-sm text-muted-foreground mb-6">配置本项目启用的知识维度和显示顺序</p>
              
              <div className="space-y-2">
                {enabledDimensions.map((dim) => (
                  <div key={dim.id} className="flex items-center gap-4 p-3 rounded-md border border-border">
                    <Switch defaultChecked />
                    <dim.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{dim.name}</span>
                    <span className="text-sm text-muted-foreground">{dim.description}</span>
                    <div className="flex-1" />
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                {disabledDimensions.map((dim) => (
                  <div key={dim.id} className="flex items-center gap-4 p-3 rounded-md border border-border opacity-60">
                    <Switch />
                    <dim.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm text-muted-foreground">{dim.name}</span>
                    <span className="text-sm text-muted-foreground">{dim.description}</span>
                    <div className="flex-1" />
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button variant="default">保存</Button>
              </div>
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
                  <Button variant="default">保存</Button>
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
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* AI Config Tab */}
          {activeTab === "ai" && (
            <div>
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
          )}

          {/* Competitors Tab */}
          {activeTab === "competitors" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-semibold">竞品管理</h2>
                  <p className="text-sm text-muted-foreground mt-1">全局竞品实体，可在竞品对比中引用</p>
                </div>
                <Button variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  添加竞品
                </Button>
              </div>

              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>竞品名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead className="w-24">功能项数</TableHead>
                      <TableHead className="w-32">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((comp) => (
                      <TableRow key={comp.name}>
                        <TableCell className="font-medium">{comp.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{comp.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{comp.featureCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <button className="text-muted-foreground hover:text-foreground">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Import/Export Tab */}
          {activeTab === "import-export" && (
            <div>
              <h2 className="text-lg font-semibold mb-6">导入/导出</h2>

              <div className="space-y-8 max-w-lg">
                <div>
                  <h3 className="text-sm font-medium mb-2">导入</h3>
                  <p className="text-sm text-muted-foreground mb-4">上传 Markdown 或 zip 文件导入知识数据</p>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    上传文件
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">支持 Markdown (.md) / zip 格式</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-2">导出</h3>
                  <p className="text-sm text-muted-foreground mb-4">将项目知识导出为文件</p>
                  <div className="flex items-center gap-3">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      按模块导出
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      整个项目导出
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      导出为 zip
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
