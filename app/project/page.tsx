"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { FeatureTree } from "@/components/feature-tree"
import { ProductLineOverview } from "@/components/product-line-overview"
import { ModuleOverview } from "@/components/module-overview"
import { RequirementAnalysis } from "@/components/requirement-analysis"
import { CompetitiveComparison } from "@/components/competitive-comparison"
import { treeData } from "@/lib/tree-data"
import { cn } from "@/lib/utils"

type TabType = "panorama" | "product-line" | "relationship" | "requirement" | "competitive" | "settings"
type ContentType = "product-line-overview" | "module-overview"

const tabs: { id: TabType; label: string }[] = [
  { id: "panorama", label: "全景图" },
  { id: "product-line", label: "产品线" },
  { id: "relationship", label: "关系图" },
  { id: "requirement", label: "需求分析" },
  { id: "competitive", label: "竞品对比" },
]

// Feature IDs that have detail pages
const featureIds = ["create-inference", "auto-scaling", "card-management", "replica-management", "gpu-scheduling"]

export default function ProjectWorkbenchPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("product-line")
  const [selectedFeature, setSelectedFeature] = useState("private-cloud")
  const [contentType, setContentType] = useState<ContentType>("product-line-overview")

  // Determine breadcrumb based on content type
  const getBreadcrumbItems = () => {
    if (contentType === "module-overview") {
      return [
        { label: "AI云平台竞品分析", onClick: () => setContentType("product-line-overview") },
        { label: "私有云", onClick: () => setContentType("product-line-overview") },
        { label: "推理服务", current: true },
      ]
    }
    return [
      { label: "我的项目", href: "#" },
      { label: "AI云平台竞品分析", current: true },
    ]
  }

  const breadcrumbItems = getBreadcrumbItems()

  const handleModuleSelect = (moduleId: string) => {
    setSelectedFeature(moduleId)
    setContentType("module-overview")
  }

  const handleFeatureSelect = (featureId: string) => {
    // Navigate to the detailed feature page
    setSelectedFeature(featureId)
  }

  const showSidebar = activeTab === "product-line"

  const renderContent = () => {
    switch (activeTab) {
      case "requirement":
        return <RequirementAnalysis />
      case "competitive":
        return <CompetitiveComparison />
      case "product-line":
        if (contentType === "module-overview") {
          return (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Badge variant="secondary">5 个功能项 · 完善度 85%</Badge>
              </div>
              <ModuleOverview onFeatureSelect={handleFeatureSelect} />
            </div>
          )
        }
        return (
          <div className="p-6">
            <ProductLineOverview onModuleSelect={handleModuleSelect} />
          </div>
        )
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {activeTab === "panorama" && "全景图视图开发中..."}
            {activeTab === "relationship" && "关系图视图开发中..."}
            {activeTab === "settings" && "设置页面开发中..."}
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold text-foreground hover:text-primary transition-colors">Prism</Link>
            <span className="text-muted-foreground">/</span>
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbItems.map((item, idx) => (
                  <BreadcrumbItem key={idx}>
                    {item.current ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <>
                        {item.onClick ? (
                          <button 
                            onClick={item.onClick}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {item.label}
                          </button>
                        ) : (
                          <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                        )}
                        <BreadcrumbSeparator>
                          <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                      </>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border px-6">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id === "product-line") {
                    setContentType("product-line-overview")
                  }
                }}
                className={cn(
                  "py-3 text-sm transition-colors relative",
                  activeTab === tab.id
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-1.5 py-3 text-sm transition-colors",
              activeTab === "settings"
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            设置
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - only show for product-line tab */}
          {showSidebar && (
            <aside
              className={cn(
                "flex flex-col border-r border-border bg-sidebar transition-all duration-300",
                sidebarCollapsed ? "w-0 overflow-hidden" : "w-[280px]"
              )}
            >
              <div className="flex h-10 items-center justify-between border-b border-sidebar-border px-4">
                <span className="text-sm font-medium text-sidebar-foreground">功能树</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-2">
                  <FeatureTree
                    data={treeData}
                    selectedId={selectedFeature}
                    onSelect={(id) => {
                      setSelectedFeature(id)
                      // Check if it's a module folder, product line, or feature
                      if (["inference-service", "training-service", "ops-service"].includes(id)) {
                        setContentType("module-overview")
                      } else if (["private-cloud", "public-cloud", "smart-computing"].includes(id)) {
                        setContentType("product-line-overview")
                      } else if (featureIds.includes(id)) {
                        // Navigate to feature detail page
                        router.push(`/feature/${id}`)
                      }
                    }}
                  />
                </div>
              </ScrollArea>
            </aside>
          )}

          {/* Right Content */}
          <div className="flex-1 overflow-hidden">
            {showSidebar && sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-[140px] z-10 h-8 w-8"
                onClick={() => setSidebarCollapsed(false)}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <ScrollArea className="h-full">
              {renderContent()}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  )
}
