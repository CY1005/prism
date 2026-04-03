"use client"

import { AlertTriangle, CheckCircle, Scale, TestTube, XCircle, Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const impactItems = [
  { path: "推理服务 > 创建推理服务", type: "direct" },
  { path: "推理服务 > 拼卡管理", type: "direct" },
  { path: "推理服务 > 自动扩缩容", type: "indirect" },
  { path: "运维管理 > GPU调度策略", type: "indirect" },
]

const completenessItems = [
  { text: "私有云场景已覆盖", passed: true },
  { text: "GPU类型差异已说明", passed: true },
  { text: "智算中心场景未提及", passed: false },
  { text: "开关状态下行为未定义", passed: false },
  { text: "定时扩缩容联动未说明", passed: false },
]

const testPoints = [
  { id: 1, point: "拼卡开关开启后创建推理服务，GPU类型选择是否正确", priority: "P0", feature: "创建推理服务" },
  { id: 2, point: "运行中修改拼卡配置，验证对已有任务无影响", priority: "P0", feature: "拼卡管理" },
  { id: 3, point: "智算中心下相同操作是否一致", priority: "P1", feature: "创建推理服务" },
  { id: 4, point: "定时扩缩容触发时拼卡参数是否正确传递", priority: "P1", feature: "自动扩缩容" },
]

export function RequirementAnalysis() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Input Card */}
      <Card className="p-6 border-border/60 shadow-sm">
        <h2 className="text-xl font-semibold">需求分析</h2>
        <p className="text-sm text-muted-foreground mt-1">
          输入新需求描述，AI 将分析影响范围、完整性和合理性
        </p>
        <Textarea
          className="h-32 mt-4"
          placeholder="粘贴需求描述..."
        />
        <div className="flex gap-2 mt-4">
          <Button>开始分析</Button>
          <Button variant="outline">生成测试点</Button>
        </div>
      </Card>

      {/* Analysis Results */}
      <div className="space-y-4 mt-6">
        {/* Impact Analysis */}
        <Card className="p-5 border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="font-medium">影响范围分析</h3>
            <Badge variant="destructive">涉及 4 个模块</Badge>
          </div>
          <div className="space-y-2">
            {impactItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                <span className="text-sm">{item.path}</span>
                <Badge className={item.type === "direct" ? "bg-red-50 text-red-700 hover:bg-red-50" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-50"}>
                  {item.type === "direct" ? "直接影响" : "间接影响"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Completeness Check */}
        <Card className="p-5 border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h3 className="font-medium">完整性检查</h3>
          </div>
          <div className="space-y-2">
            {completenessItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {item.passed ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Rationality Evaluation */}
        <Card className="p-5 border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-5 w-5 text-yellow-500" />
            <h3 className="font-medium">合理性评价</h3>
            <Badge className="bg-yellow-50 text-yellow-700 hover:bg-yellow-50">有妥协</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            副本管理逻辑和现有自动扩缩容功能存在部分重叠，建议明确两者边界
          </p>
        </Card>

        {/* Test Points */}
        <Card className="p-5 border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TestTube className="h-5 w-5 text-primary" />
            <h3 className="font-medium">测试点（AI 生成）</h3>
            <Badge variant="secondary">12 条</Badge>
          </div>
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 font-medium">#</TableHead>
                  <TableHead className="font-medium">测试点</TableHead>
                  <TableHead className="w-20 font-medium">优先级</TableHead>
                  <TableHead className="w-28 font-medium">关联功能</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testPoints.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell>{point.id}</TableCell>
                    <TableCell className="text-sm">{point.point}</TableCell>
                    <TableCell>
                      <Badge className={point.priority === "P0" ? "bg-red-50 text-red-700 hover:bg-red-50" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-50"}>
                        {point.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{point.feature}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-primary cursor-pointer mt-2">查看全部 12 条 &rarr;</p>
          <Button variant="outline" className="mt-3">一键录入到测试分析</Button>
        </Card>
      </div>
    </div>
  )
}
