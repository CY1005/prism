"use client"

import { X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const comparisonData = [
  {
    dimension: "功能覆盖",
    ourProduct: "CPU/GPU物理卡/虚拟卡三类选择",
    aws: "Instance Type隐式选GPU",
    aliyun: "GPU型号+规格族",
    highlight: { ourProduct: null, aws: null, aliyun: null },
  },
  {
    dimension: "GPU 支持",
    ourProduct: "NVIDIA/昇腾/海光/寒武纪",
    aws: "仅NVIDIA",
    aliyun: "NVIDIA/昇腾",
    highlight: { ourProduct: "green", aws: "red", aliyun: null },
  },
  {
    dimension: "资源配置方式",
    ourProduct: "实例规格选择或自定义",
    aws: "预定义实例类型",
    aliyun: "规格族+自定义",
    highlight: { ourProduct: null, aws: null, aliyun: null },
  },
  {
    dimension: "虚拟化",
    ourProduct: "GPU共享调度+显存隔离",
    aws: "无原生vGPU",
    aliyun: "cGPU",
    highlight: { ourProduct: "green", aws: "red", aliyun: null },
  },
  {
    dimension: "扩缩容",
    ourProduct: "手动+定时+HPA",
    aws: "Application Auto Scaling",
    aliyun: "弹性ESS",
    highlight: { ourProduct: null, aws: "green", aliyun: null },
  },
]

const conclusions = [
  { type: "advantage", text: "优势：多厂商GPU支持范围最广（4家 vs AWS仅NVIDIA）" },
  { type: "advantage", text: "优势：原生虚拟GPU能力" },
  { type: "disadvantage", text: "劣势：扩缩容能力弱于AWS（缺少预测性扩缩容）" },
  { type: "disadvantage", text: "劣势：无Spot/竞价实例降本方案" },
]

function getCellClass(highlight: string | null) {
  if (highlight === "green") return "bg-green-50"
  if (highlight === "red") return "bg-red-50"
  return ""
}

export function CompetitiveComparison() {
  return (
    <div className="p-6">
      {/* Top Card */}
      <Card className="p-5 mb-6 border-border/60 shadow-sm">
        <h2 className="text-xl font-semibold">竞品对比</h2>
        <div className="flex gap-3 items-end mt-4 flex-wrap">
          <div>
            <Label className="text-sm">选择功能</Label>
            <Select defaultValue="create-inference">
              <SelectTrigger className="w-[200px] mt-1">
                <SelectValue placeholder="选择功能" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create-inference">创建推理服务</SelectItem>
                <SelectItem value="auto-scaling">自动扩缩容</SelectItem>
                <SelectItem value="card-management">拼卡管理</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">对比竞品</Label>
            <div className="flex gap-1 mt-1">
              <Badge variant="secondary" className="flex items-center gap-1">
                AWS SageMaker
                <X className="h-3 w-3 cursor-pointer" />
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                阿里PAI
                <X className="h-3 w-3 cursor-pointer" />
              </Badge>
            </div>
          </div>
          <Button variant="outline" size="sm">+ 添加竞品</Button>
          <Button size="sm">生成对比</Button>
        </div>
      </Card>

      {/* Comparison Table */}
      <div className="rounded-md border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-medium">对比维度</TableHead>
              <TableHead className="font-medium">本产品（私有云）</TableHead>
              <TableHead className="font-medium">AWS SageMaker</TableHead>
              <TableHead className="font-medium">阿里 PAI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisonData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{row.dimension}</TableCell>
                <TableCell className={getCellClass(row.highlight.ourProduct)}>
                  {row.ourProduct}
                </TableCell>
                <TableCell className={getCellClass(row.highlight.aws)}>
                  {row.aws}
                </TableCell>
                <TableCell className={getCellClass(row.highlight.aliyun)}>
                  {row.aliyun}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Conclusions */}
      <Card className="p-5 mt-6 border-border/60 shadow-sm">
        <h3 className="font-medium mb-3">对比结论（AI 生成）</h3>
        <ul className="space-y-2 text-sm">
          {conclusions.map((item, idx) => (
            <li key={idx}>
              {item.type === "advantage" ? "✅ " : "⚠️  "}
              {item.text}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
