"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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

const dimensionCoverage = [
  { name: "功能描述", completed: 5, total: 5 },
  { name: "用户场景", completed: 4, total: 5 },
  { name: "平台技术", completed: 3, total: 5 },
  { name: "设计决策", completed: 3, total: 5 },
  { name: "工程经验", completed: 4, total: 5 },
  { name: "测试分析", completed: 2, total: 5 },
  { name: "需求分析", completed: 1, total: 5 },
  { name: "竞品参考", completed: 2, total: 5 },
]

const featureItems = [
  {
    id: "create-inference",
    name: "创建推理服务",
    version: "v1.6",
    completionPercent: 62,
    dimensionStatus: [1, 1, 1, 1, 1, 2, 2, 3], // 1=green, 2=yellow, 3=red
    lastUpdate: "2小时前",
  },
  {
    id: "auto-scaling",
    name: "自动扩缩容",
    version: "v3.7",
    completionPercent: 90,
    dimensionStatus: [1, 1, 1, 1, 1, 1, 1, 2],
    lastUpdate: "昨天",
  },
  {
    id: "card-management",
    name: "拼卡管理",
    version: "v3.8",
    completionPercent: 45,
    dimensionStatus: [1, 1, 1, 2, 2, 3, 3, 3],
    lastUpdate: "昨天",
  },
  {
    id: "replica-management",
    name: "副本管理",
    version: "v2.0",
    completionPercent: 70,
    dimensionStatus: [1, 1, 1, 1, 1, 2, 2, 3],
    lastUpdate: "3天前",
  },
  {
    id: "gpu-scheduling",
    name: "GPU调度策略",
    version: "v1.6",
    completionPercent: 30,
    dimensionStatus: [1, 1, 2, 3, 3, 3, 3, 3],
    lastUpdate: "1周前",
  },
]

function getStatusDotClass(status: number) {
  if (status === 1) return "bg-green-500"
  if (status === 2) return "bg-yellow-500"
  return "bg-red-500"
}

interface ModuleOverviewProps {
  onFeatureSelect?: (featureId: string) => void
}

export function ModuleOverview({ onFeatureSelect }: ModuleOverviewProps) {
  return (
    <div>
      {/* Section 1: Dimension Coverage */}
      <Card className="p-5 mb-6 border-border/60 shadow-sm">
        <h3 className="text-base font-medium mb-4">维度覆盖率</h3>
        <div className="space-y-3">
          {dimensionCoverage.map((dim) => (
            <div key={dim.name} className="flex items-center gap-3">
              <span className="text-sm w-16 text-right text-muted-foreground">{dim.name}</span>
              <Progress className="flex-1 h-2" value={(dim.completed / dim.total) * 100} />
              <span className="text-sm w-8 text-right">{dim.completed}/{dim.total}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 2: Feature List */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">功能项列表</h3>
        <Select defaultValue="completion">
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completion">按完善度排序</SelectItem>
            <SelectItem value="time">按更新时间</SelectItem>
            <SelectItem value="name">按名称</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">功能项</TableHead>
              <TableHead className="font-medium">引入版本</TableHead>
              <TableHead className="font-medium">完善度</TableHead>
              <TableHead className="font-medium">维度状态</TableHead>
              <TableHead className="font-medium">最近更新</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {featureItems.map((item) => (
              <TableRow 
                key={item.id} 
                className="cursor-pointer hover:bg-muted/30"
              >
                <TableCell className="font-medium p-0">
                  <Link 
                    href={`/feature/${item.id}`}
                    className="text-primary hover:underline block px-4 py-4"
                    onClick={() => onFeatureSelect?.(item.id)}
                  >
                    {item.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.version}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress className="w-20 h-2" value={item.completionPercent} />
                    <span className="text-xs">{item.completionPercent}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {item.dimensionStatus.map((status, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(status)}`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.lastUpdate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
