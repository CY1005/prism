"use client";

import { useState, useTransition } from "react";
import { PanelLeftClose, PanelLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { FeatureTree, type TreeNode } from "@/components/feature-tree";
import { DimensionCard } from "@/components/dimension-card";
import { cn } from "@/lib/utils";
import { getNodeWithDimensions } from "@/actions/nodes";

type Project = {
  id: string;
  name: string;
  templateType: string;
  hierarchyLabels: string[];
  versionMode: string;
};

type DimensionConfig = {
  config: { id: number; dimensionTypeId: number; sortOrder: number };
  dimType: { id: number; key: string; name: string; icon: string; description: string | null };
};

type NodeData = {
  node: { id: string; name: string; parentId: string | null; path: string };
  records: {
    record: { id: string; dimensionTypeId: number; content: Record<string, unknown> };
    dimType: { id: number; key: string; name: string };
  }[];
  versions: { id: string; versionLabel: string; summary: string; isCurrent: boolean }[];
};

interface WorkspaceProps {
  project: Project;
  tree: TreeNode[];
  dimensions: DimensionConfig[];
  initialNodeData: NodeData | null;
  initialSelectedId: string | null;
}

function renderDimensionContent(key: string, content: Record<string, unknown>) {
  switch (key) {
    case "description":
      return <p className="text-sm leading-relaxed">{content.text as string}</p>;

    case "user_scenario": {
      const scenarios = content.scenarios as { role: string; scenario: string; techStack: string[] }[];
      return (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">角色</th>
                <th className="px-3 py-2 text-left font-medium">使用场景</th>
                <th className="px-3 py-2 text-left font-medium">技术栈</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 font-medium">{s.role}</td>
                  <td className="px-3 py-2">{s.scenario}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {s.techStack.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "tech_impl": {
      const entries = content.entries as { title: string; text: string; tags: string[] }[];
      const ref = content.referenceStandards as string | undefined;
      return (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={i} className="rounded-md border bg-muted/30 p-4">
              <h4 className="text-sm font-medium">{entry.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{entry.text}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          ))}
          {ref && <p className="text-xs text-muted-foreground">参考标准：{ref}</p>}
        </div>
      );
    }

    case "design_decision":
      return (
        <div className="rounded-md border p-4 space-y-3">
          {(["context", "decision", "alternatives", "consequences"] as const).map((field) => {
            const labels: Record<string, string> = {
              context: "背景",
              decision: "决策",
              alternatives: "放弃的方案",
              consequences: "后果",
            };
            return (
              <div key={field}>
                <h4 className={cn(
                  "text-xs font-medium uppercase tracking-wider",
                  field === "alternatives" ? "text-destructive" : "text-muted-foreground"
                )}>
                  {labels[field]}
                </h4>
                <p className={cn("mt-1 text-sm", field === "alternatives" ? "text-muted-foreground" : "")}>
                  {content[field] as string}
                </p>
              </div>
            );
          })}
        </div>
      );

    case "engineering_exp":
      return (
        <div className="rounded-md border bg-amber-50/50 p-4">
          <h4 className="text-sm font-medium">{content.title as string}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{content.text as string}</p>
          {Array.isArray(content.tags) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(content.tags as string[]).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
      );

    default:
      return <pre className="text-xs text-muted-foreground">{JSON.stringify(content, null, 2)}</pre>;
  }
}

function buildBreadcrumb(tree: TreeNode[], nodeId: string): TreeNode[] {
  const path: TreeNode[] = [];
  function find(nodes: TreeNode[], target: string): boolean {
    for (const n of nodes) {
      path.push(n);
      if (n.id === target) return true;
      if (n.children.length > 0 && find(n.children, target)) return true;
      path.pop();
    }
    return false;
  }
  find(tree, nodeId);
  return path;
}

export function ProjectWorkspace({
  project,
  tree,
  dimensions,
  initialNodeData,
  initialSelectedId,
}: WorkspaceProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? "");
  const [nodeData, setNodeData] = useState<NodeData | null>(initialNodeData);
  const [isPending, startTransition] = useTransition();

  const handleSelectNode = (id: string) => {
    setSelectedId(id);
    startTransition(async () => {
      const data = await getNodeWithDimensions(id);
      setNodeData(data);
    });
  };

  const breadcrumbPath = nodeData ? buildBreadcrumb(tree, nodeData.node.id) : [];

  const filledDimensions = nodeData
    ? dimensions.filter((d) =>
        nodeData.records.some((r) => r.record.dimensionTypeId === d.dimType.id)
      ).length
    : 0;
  const totalDimensions = dimensions.length;
  const completionPercent = totalDimensions > 0 ? Math.round((filledDimensions / totalDimensions) * 100) : 0;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r transition-all duration-300",
          sidebarCollapsed ? "w-0 overflow-hidden" : "w-[280px]"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold truncate">{project.name}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {project.templateType === "product_analysis" ? "产品分析" : project.templateType}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSidebarCollapsed(true)}>
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="px-2">
            <FeatureTree data={tree} selectedId={selectedId} onSelect={handleSelectNode} />
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4">
            {sidebarCollapsed && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarCollapsed(false)}>
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbPath.map((node, i) => {
                  const isLast = i === breadcrumbPath.length - 1;
                  return (
                    <span key={node.id} className="contents">
                      {i > 0 && (
                        <BreadcrumbSeparator>
                          <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                      )}
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{node.name}</BreadcrumbPage>
                        ) : (
                          <span className="text-muted-foreground">{node.name}</span>
                        )}
                      </BreadcrumbItem>
                    </span>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {filledDimensions}/{totalDimensions} 维度已填写
            </span>
            <div className="flex items-center gap-2">
              <Progress value={completionPercent} className="h-2 w-24" />
              <span className="text-sm font-medium">{completionPercent}%</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl space-y-4 p-6">
            {isPending && (
              <div className="text-center text-sm text-muted-foreground py-8">加载中...</div>
            )}

            {!isPending && nodeData && (
              <>
                {dimensions.map((dim) => {
                  const matchingRecords = nodeData.records.filter(
                    (r) => r.record.dimensionTypeId === dim.dimType.id
                  );
                  const hasContent = matchingRecords.length > 0;

                  return (
                    <DimensionCard
                      key={dim.dimType.id}
                      title={dim.dimType.name}
                      entryCount={matchingRecords.length}
                      defaultExpanded={hasContent}
                      collapsedSummary={hasContent ? undefined : "未填写"}
                      onAdd={() => {}}
                    >
                      {hasContent ? (
                        <div className="space-y-3">
                          {matchingRecords.map((r) =>
                            renderDimensionContent(r.dimType.key, r.record.content)
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-sm text-muted-foreground">
                            点击添加{dim.dimType.name}
                          </p>
                        </div>
                      )}
                    </DimensionCard>
                  );
                })}

                {/* Version Timeline */}
                {nodeData.versions.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h2 className="text-lg font-semibold mb-4">版本演进</h2>
                    <div className="space-y-0">
                      {nodeData.versions.map((v, i) => (
                        <div key={v.id} className="relative flex gap-4">
                          <div className="relative flex flex-col items-center">
                            <div
                              className={cn(
                                "h-3 w-3 rounded-full border-2 shrink-0 z-10",
                                v.isCurrent
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/40 bg-background"
                              )}
                            />
                            {i < nodeData.versions.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-mono text-sm font-medium",
                                v.isCurrent ? "text-primary" : "text-muted-foreground"
                              )}>
                                {v.versionLabel}
                              </span>
                              {v.isCurrent && <Badge className="text-xs">当前版本</Badge>}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{v.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!isPending && !nodeData && (
              <div className="text-center text-muted-foreground py-16">
                <p>选择左侧树中的功能项查看详情</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
