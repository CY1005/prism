"use client"

import { Folder, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ModuleData {
  id: string
  name: string
  featureCount: number
  completionPercent: number
  dimensions: {
    name: string
    completed: number
    total: number
  }[]
  lastUpdate: string
}

const modulesData: ModuleData[] = [
  {
    id: "inference-service",
    name: "推理服务",
    featureCount: 5,
    completionPercent: 85,
    dimensions: [
      { name: "功能描述", completed: 5, total: 5 },
      { name: "用户场景", completed: 4, total: 5 },
      { name: "平台技术", completed: 3, total: 5 },
      { name: "设计决策", completed: 3, total: 5 },
      { name: "工程经验", completed: 4, total: 5 },
      { name: "测试分析", completed: 2, total: 5 },
      { name: "需求分析", completed: 1, total: 5 },
      { name: "竞品参考", completed: 2, total: 5 },
    ],
    lastUpdate: "陈玥 更新了 创建推理服务 — 2小时前",
  },
  {
    id: "training-service",
    name: "训练服务",
    featureCount: 3,
    completionPercent: 60,
    dimensions: [
      { name: "功能描述", completed: 3, total: 3 },
      { name: "用户场景", completed: 2, total: 3 },
      { name: "平台技术", completed: 2, total: 3 },
      { name: "设计决策", completed: 1, total: 3 },
      { name: "工程经验", completed: 2, total: 3 },
      { name: "测试分析", completed: 1, total: 3 },
      { name: "需求分析", completed: 1, total: 3 },
      { name: "竞品参考", completed: 1, total: 3 },
    ],
    lastUpdate: "昨天",
  },
  {
    id: "ops-management",
    name: "运维管理",
    featureCount: 7,
    completionPercent: 35,
    dimensions: [
      { name: "功能描述", completed: 3, total: 7 },
      { name: "用户场景", completed: 2, total: 7 },
      { name: "平台技术", completed: 1, total: 7 },
      { name: "设计决策", completed: 1, total: 7 },
      { name: "工程经验", completed: 2, total: 7 },
      { name: "测试分析", completed: 1, total: 7 },
      { name: "需求分析", completed: 0, total: 7 },
      { name: "竞品参考", completed: 1, total: 7 },
    ],
    lastUpdate: "5天前",
  },
]

function getDimensionBadgeClass(completed: number, total: number) {
  const percent = (completed / total) * 100
  if (percent >= 80) return "bg-green-50 text-green-700"
  if (percent >= 40) return "bg-yellow-50 text-yellow-700"
  return "bg-red-50 text-red-700"
}

function getStatusDotClass(percent: number) {
  if (percent >= 80) return "bg-green-500"
  if (percent >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

interface ProductLineOverviewProps {
  onModuleSelect?: (moduleId: string) => void
}

export function ProductLineOverview({ onModuleSelect }: ProductLineOverviewProps) {
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 border-border/60 shadow-sm">
          <div className="text-3xl font-bold">3</div>
          <div className="text-sm text-muted-foreground">功能模块</div>
        </Card>
        <Card className="p-4 border-border/60 shadow-sm">
          <div className="text-3xl font-bold">15</div>
          <div className="text-sm text-muted-foreground">功能项</div>
        </Card>
        <Card className="p-4 border-border/60 shadow-sm">
          <div className="text-3xl font-bold text-primary">72%</div>
          <Progress value={72} className="h-2 mt-2" />
          <div className="text-sm text-muted-foreground mt-1">平均完善度</div>
        </Card>
      </div>

      {/* Module List */}
      <div className="space-y-3">
        {modulesData.map((module) => (
          <Card
            key={module.id}
            className="p-4 border-border/60 shadow-sm hover:border-primary/30 cursor-pointer transition"
            onClick={() => onModuleSelect?.(module.id)}
          >
            {/* Top Row */}
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <Folder className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-medium">{module.name}</span>
              <div className="flex-1" />
              <span className="text-sm text-muted-foreground">{module.featureCount} 个功能项</span>
              <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(module.completionPercent)}`} />
              <span className="text-sm font-medium">{module.completionPercent}%</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Dimension Badges */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {module.dimensions.map((dim) => (
                <span
                  key={dim.name}
                  className={`text-xs px-2 py-0.5 rounded ${getDimensionBadgeClass(dim.completed, dim.total)}`}
                >
                  {dim.name} {dim.completed}/{dim.total}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-2 text-xs text-muted-foreground">
              最近更新：{module.lastUpdate}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
