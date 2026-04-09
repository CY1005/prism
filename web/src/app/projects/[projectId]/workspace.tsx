"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  Folder,
  FileText,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  getNodeWithDimensions,
  getFolderOverview,
  createNode,
  createDimensionRecord,
  updateDimensionRecord,
  deleteDimensionRecord,
  renameNode,
  deleteNode,
  updateNodeSortOrder,
} from "@/actions/nodes";

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

type FolderChild = {
  id: string;
  name: string;
  type: string;
  filledDimensions: number;
  totalDimensions: number;
  completionPercent: number;
  childCount?: number;
};

interface WorkspaceProps {
  project: Project;
  tree: TreeNode[];
  dimensions: DimensionConfig[];
  initialNodeData: NodeData | null;
  initialSelectedId: string | null;
}

// ─── Dimension Content Renderers ────────────────────────

function renderDimensionContent(key: string, content: Record<string, unknown>) {
  switch (key) {
    case "description":
      return <p className="text-sm leading-relaxed">{content.text as string}</p>;

    case "user_scenario": {
      const scenarios = content.scenarios as { role: string; scenario: string; techStack: string[] }[] | undefined;
      if (!Array.isArray(scenarios)) return <p className="text-sm">{content.text as string ?? JSON.stringify(content)}</p>;
      return (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">角色</th>
              <th className="px-3 py-2 text-left font-medium">使用场景</th>
              <th className="px-3 py-2 text-left font-medium">技术栈</th>
            </tr></thead>
            <tbody>
              {scenarios.map((s, i) => (
                <tr key={i} className="border-t">
                  <td className="px-3 py-2 font-medium">{s.role}</td>
                  <td className="px-3 py-2">{s.scenario}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      {s.techStack.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
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
      const entries = content.entries as { title: string; text: string; tags: string[] }[] | undefined;
      if (!Array.isArray(entries)) return <p className="text-sm">{content.text as string ?? JSON.stringify(content)}</p>;
      const ref = content.referenceStandards as string | undefined;
      return (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={i} className="rounded-md border bg-muted/30 p-4">
              <h4 className="text-sm font-medium">{entry.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{entry.text}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
              </div>
            </div>
          ))}
          {ref && <p className="text-xs text-muted-foreground">参考标准：{ref}</p>}
        </div>
      );
    }

    case "design_decision": {
      const labels: Record<string, string> = { context: "背景", decision: "决策", alternatives: "放弃的方案", consequences: "后果" };
      return (
        <div className="rounded-md border p-4 space-y-3">
          {Object.entries(labels).map(([field, label]) => (
            <div key={field}>
              <h4 className={cn("text-xs font-medium uppercase tracking-wider", field === "alternatives" ? "text-destructive" : "text-muted-foreground")}>{label}</h4>
              <p className={cn("mt-1 text-sm", field === "alternatives" ? "text-muted-foreground" : "")}>{content[field] as string}</p>
            </div>
          ))}
        </div>
      );
    }

    case "engineering_exp":
      return (
        <div className="rounded-md border bg-amber-50/50 p-4">
          <h4 className="text-sm font-medium">{content.title as string}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{content.text as string}</p>
          {Array.isArray(content.tags) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(content.tags as string[]).map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
            </div>
          )}
        </div>
      );

    default:
      return <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
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

function getStatusColor(percent: number) {
  if (percent >= 80) return "bg-green-500";
  if (percent >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

// ─── Main Workspace ─────────────────────────────────────

export function ProjectWorkspace({
  project,
  tree: initialTree,
  dimensions,
  initialNodeData,
  initialSelectedId,
}: WorkspaceProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? "");
  const [selectedType, setSelectedType] = useState<"folder" | "file">("file");
  const [nodeData, setNodeData] = useState<NodeData | null>(initialNodeData);
  const [folderChildren, setFolderChildren] = useState<FolderChild[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [tree, setTree] = useState(initialTree);

  // Dialog states
  const [addNodeDialog, setAddNodeDialog] = useState(false);
  const [addNodeParentId, setAddNodeParentId] = useState<string | null>(null);
  const [addNodeType, setAddNodeType] = useState<"folder" | "file">("file");
  const [addNodeName, setAddNodeName] = useState("");

  const [renameDialog, setRenameDialog] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const [addDimDialog, setAddDimDialog] = useState(false);
  const [addDimTypeId, setAddDimTypeId] = useState(0);
  const [addDimTypeName, setAddDimTypeName] = useState("");
  const [addDimContent, setAddDimContent] = useState("");

  const [editDimDialog, setEditDimDialog] = useState(false);
  const [editDimRecordId, setEditDimRecordId] = useState("");
  const [editDimContent, setEditDimContent] = useState("");

  // ─── Handlers ───────────────────────────────────────

  const refreshPage = () => router.refresh();

  const handleSelectNode = (id: string, type: "folder" | "file") => {
    setSelectedId(id);
    setSelectedType(type);
    startTransition(async () => {
      if (type === "file") {
        setFolderChildren(null);
        const data = await getNodeWithDimensions(id);
        setNodeData(data);
      } else {
        setNodeData(null);
        const children = await getFolderOverview(id, project.id);
        setFolderChildren(children);
      }
    });
  };

  const handleAddChild = (parentId: string | null, type: "folder" | "file") => {
    setAddNodeParentId(parentId);
    setAddNodeType(type);
    setAddNodeName("");
    setAddNodeDialog(true);
  };

  const handleConfirmAddNode = () => {
    if (!addNodeName.trim()) return;
    startTransition(async () => {
      await createNode(project.id, addNodeParentId, addNodeName.trim(), addNodeType);
      setAddNodeDialog(false);
      refreshPage();
    });
  };

  const handleRename = (nodeId: string, currentName: string) => {
    setRenameNodeId(nodeId);
    setRenameValue(currentName);
    setRenameDialog(true);
  };

  const handleConfirmRename = () => {
    if (!renameValue.trim()) return;
    startTransition(async () => {
      await renameNode(renameNodeId, renameValue.trim());
      setRenameDialog(false);
      refreshPage();
    });
  };

  const handleDelete = (nodeId: string) => {
    if (!confirm("确定删除？子节点也会被删除。")) return;
    startTransition(async () => {
      await deleteNode(nodeId);
      if (selectedId === nodeId) {
        setSelectedId("");
        setNodeData(null);
        setFolderChildren(null);
      }
      refreshPage();
    });
  };

  const handleAddDimension = (dimTypeId: number, dimTypeName: string) => {
    setAddDimTypeId(dimTypeId);
    setAddDimTypeName(dimTypeName);
    setAddDimContent("");
    setAddDimDialog(true);
  };

  const handleConfirmAddDimension = () => {
    if (!addDimContent.trim() || !nodeData) return;
    startTransition(async () => {
      let content: Record<string, unknown>;
      try {
        content = JSON.parse(addDimContent);
      } catch {
        content = { text: addDimContent };
      }
      await createDimensionRecord(nodeData.node.id, addDimTypeId, content);
      setAddDimDialog(false);
      const data = await getNodeWithDimensions(nodeData.node.id);
      setNodeData(data);
      refreshPage();
    });
  };

  const handleEditDimension = (recordId: string, content: Record<string, unknown>) => {
    setEditDimRecordId(recordId);
    const text = content.text as string | undefined;
    setEditDimContent(text ?? JSON.stringify(content, null, 2));
    setEditDimDialog(true);
  };

  const handleConfirmEditDimension = () => {
    if (!editDimContent.trim() || !nodeData) return;
    startTransition(async () => {
      let content: Record<string, unknown>;
      try {
        content = JSON.parse(editDimContent);
      } catch {
        content = { text: editDimContent };
      }
      await updateDimensionRecord(editDimRecordId, content);
      setEditDimDialog(false);
      const data = await getNodeWithDimensions(nodeData.node.id);
      setNodeData(data);
    });
  };

  const handleReorder = (nodeId: string, newIndex: number) => {
    startTransition(async () => {
      await updateNodeSortOrder(nodeId, newIndex);
      refreshPage();
    });
  };

  const handleDeleteDimension = (recordId: string) => {
    if (!confirm("确定删除此记录？")) return;
    startTransition(async () => {
      await deleteDimensionRecord(recordId);
      if (nodeData) {
        const data = await getNodeWithDimensions(nodeData.node.id);
        setNodeData(data);
      }
      refreshPage();
    });
  };

  // ─── Computed ─────────────────────────────────────────

  const breadcrumbPath = selectedId ? buildBreadcrumb(tree, selectedId) : [];

  const filledDimensions = nodeData
    ? dimensions.filter((d) => nodeData.records.some((r) => r.record.dimensionTypeId === d.dimType.id)).length
    : 0;
  const totalDimensions = dimensions.length;
  const completionPercent = totalDimensions > 0 ? Math.round((filledDimensions / totalDimensions) * 100) : 0;

  // ─── Render ─────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn("flex flex-col border-r transition-all duration-300", sidebarCollapsed ? "w-0 overflow-hidden" : "w-[280px]")}>
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
            <FeatureTree
              data={tree}
              selectedId={selectedId}
              onSelect={handleSelectNode}
              onAddChild={handleAddChild}
              onRename={handleRename}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
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
                      {i > 0 && <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>}
                      <BreadcrumbItem>
                        {isLast ? <BreadcrumbPage>{node.name}</BreadcrumbPage> : <span className="text-muted-foreground">{node.name}</span>}
                      </BreadcrumbItem>
                    </span>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {selectedType === "file" && nodeData && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{filledDimensions}/{totalDimensions} 维度已填写</span>
              <div className="flex items-center gap-2">
                <Progress value={completionPercent} className="h-2 w-24" />
                <span className="text-sm font-medium">{completionPercent}%</span>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl space-y-4 p-6">
            {isPending && <div className="text-center text-sm text-muted-foreground py-8">加载中...</div>}

            {/* File view: Dimension cards */}
            {!isPending && selectedType === "file" && nodeData && (
              <>
                {dimensions.map((dim) => {
                  const matchingRecords = nodeData.records.filter((r) => r.record.dimensionTypeId === dim.dimType.id);
                  const hasContent = matchingRecords.length > 0;

                  return (
                    <DimensionCard
                      key={dim.dimType.id}
                      title={dim.dimType.name}
                      entryCount={matchingRecords.length}
                      defaultExpanded={hasContent}
                      collapsedSummary={hasContent ? undefined : "未填写"}
                      onAdd={() => handleAddDimension(dim.dimType.id, dim.dimType.name)}
                    >
                      {hasContent ? (
                        <div className="space-y-3">
                          {matchingRecords.map((r) => (
                            <div key={r.record.id} className="group relative">
                              {renderDimensionContent(r.dimType.key, r.record.content)}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleEditDimension(r.record.id, r.record.content)}>编辑</Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => handleDeleteDimension(r.record.id)}>删除</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-sm text-muted-foreground">点击添加{dim.dimType.name}</p>
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
                            <div className={cn("h-3 w-3 rounded-full border-2 shrink-0 z-10", v.isCurrent ? "border-primary bg-primary" : "border-muted-foreground/40 bg-background")} />
                            {i < nodeData.versions.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-mono text-sm font-medium", v.isCurrent ? "text-primary" : "text-muted-foreground")}>{v.versionLabel}</span>
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

            {/* Folder view: Children overview */}
            {!isPending && selectedType === "folder" && folderChildren && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{breadcrumbPath[breadcrumbPath.length - 1]?.name}</h2>
                  <Button variant="outline" size="sm" onClick={() => handleAddChild(selectedId, "file")}>
                    <Plus className="h-4 w-4 mr-1" /> 添加功能项
                  </Button>
                </div>
                {folderChildren.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16">
                    <Folder className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p>暂无内容，点击上方按钮添加</p>
                  </div>
                ) : (
                  folderChildren.map((child) => (
                    <div
                      key={child.id}
                      className="rounded-lg border p-4 hover:border-primary/30 cursor-pointer transition-colors"
                      onClick={() => handleSelectNode(child.id, child.type as "folder" | "file")}
                    >
                      <div className="flex items-center gap-3">
                        {child.type === "folder" ? (
                          <Folder className="h-5 w-5 text-primary" />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{child.name}</span>
                        <div className="flex-1" />
                        {child.type === "file" && (
                          <>
                            <span className="text-sm text-muted-foreground">
                              {child.filledDimensions}/{child.totalDimensions} 维度
                            </span>
                            <span className={cn("h-2.5 w-2.5 rounded-full", getStatusColor(child.completionPercent))} />
                            <span className="text-sm font-medium">{child.completionPercent}%</span>
                          </>
                        )}
                        {child.type === "folder" && child.childCount !== undefined && (
                          <span className="text-sm text-muted-foreground">{child.childCount} 个功能项</span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Empty state */}
            {!isPending && !nodeData && !folderChildren && (
              <div className="text-center text-muted-foreground py-16">
                <p>选择左侧树中的节点查看详情</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      {/* ─── Dialogs ─────────────────────────────────── */}

      {/* Add Node */}
      <Dialog open={addNodeDialog} onOpenChange={setAddNodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加{addNodeType === "folder" ? "文件夹" : "功能项"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input
                value={addNodeName}
                onChange={(e) => setAddNodeName(e.target.value)}
                placeholder={addNodeType === "folder" ? "输入文件夹名称" : "输入功能项名称"}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmAddNode()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNodeDialog(false)}>取消</Button>
            <Button onClick={handleConfirmAddNode} disabled={!addNodeName.trim()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Node */}
      <Dialog open={renameDialog} onOpenChange={setRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>新名称</Label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmRename()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(false)}>取消</Button>
            <Button onClick={handleConfirmRename} disabled={!renameValue.trim()}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dimension Record */}
      <Dialog open={addDimDialog} onOpenChange={setAddDimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 {addDimTypeName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>内容</Label>
              <textarea
                className="flex w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={addDimContent}
                onChange={(e) => setAddDimContent(e.target.value)}
                placeholder="输入文字内容，或粘贴 JSON 格式数据"
              />
              <p className="text-xs text-muted-foreground">纯文本会自动包装为 {"{ text: '...' }"}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDimDialog(false)}>取消</Button>
            <Button onClick={handleConfirmAddDimension} disabled={!addDimContent.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dimension Record */}
      <Dialog open={editDimDialog} onOpenChange={setEditDimDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>内容</Label>
              <textarea
                className="flex w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={editDimContent}
                onChange={(e) => setEditDimContent(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDimDialog(false)}>取消</Button>
            <Button onClick={handleConfirmEditDimension} disabled={!editDimContent.trim()}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
