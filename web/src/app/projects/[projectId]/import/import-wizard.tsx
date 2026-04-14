"use client";

import { useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileText,
  Folder,
  FolderOpen,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  FileUp,
  X,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  uploadZip,
  confirmImport,
  type ParsedFile,
  type FileTreeNode,
  type ImportItem,
} from "@/actions/import";

// ─── Types ───────────────────────────────────────────

type FlatFolder = { id: string; name: string; path: string; depth: number };
type DimOption = { id: number; key: string; name: string };

interface MappingRow {
  file: ParsedFile;
  selected: boolean;
  targetNodeId: string;
  nodeName: string;
  dimensionTypeId: number | null;
}

interface ImportWizardProps {
  projectId: string;
  projectName: string;
  folders: FlatFolder[];
  dimensions: DimOption[];
  /** When false, omit the outer min-h-screen wrapper and header (used when embedded in ImportPageClient). Default: true */
  standalone?: boolean;
}

const STEPS = [
  { label: "上传文件", icon: Upload },
  { label: "预览文件", icon: Eye },
  { label: "映射配置", icon: FileText },
  { label: "确认导入", icon: Check },
];

// ─── File Tree Component ────────────────────────────

function FileTreeItem({
  node,
  depth,
  selectedFile,
  onSelect,
  parentPath,
}: {
  node: FileTreeNode;
  depth: number;
  selectedFile: string | null;
  onSelect: (path: string) => void;
  parentPath: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const isFolder = node.type === "folder";
  const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name;
  const isSelected = selectedFile === nodePath;

  return (
    <div>
      <button
        className={cn(
          "flex items-center gap-1.5 w-full text-left py-1 px-2 rounded text-sm hover:bg-muted/80 transition-colors",
          isSelected && "bg-primary/10 text-primary",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) setExpanded(!expanded);
          else onSelect(nodePath);
        }}
      >
        {isFolder ? (
          expanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
          )
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
        {!isFolder && node.format && (
          <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
            {node.format}
          </Badge>
        )}
      </button>
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.name}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
              parentPath={nodePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step Indicator ─────────────────────────────────

function StepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: typeof STEPS;
}) {
  return (
    <div className="flex items-center justify-center gap-0 max-w-2xl mx-auto">
      {steps.map((step, index) => {
        const completed = index < currentStep;
        const active = index === currentStep;
        const StepIcon = step.icon;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors",
                  completed
                    ? "bg-primary border-primary text-primary-foreground"
                    : active
                      ? "border-primary text-primary bg-primary/10"
                      : "border-border text-muted-foreground bg-muted/30",
                )}
              >
                {completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <StepIcon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  active
                    ? "font-medium text-primary"
                    : completed
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 h-px mx-3",
                  index < currentStep ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Format Badge Helper ────────────────────────────

function formatBadgeColor(format: string) {
  switch (format) {
    case "markdown":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "csv":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Main Wizard ────────────────────────────────────

export function ImportWizard({
  projectId,
  projectName,
  folders,
  dimensions,
  standalone = true,
}: ImportWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [step, setStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload result
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Preview state
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<string | null>(null);

  // Mapping state
  const [mappingRows, setMappingRows] = useState<MappingRow[]>([]);

  // Preview dialog
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  // F15: Import progress tracking
  const [importProgress, setImportProgress] = useState<{
    isImporting: boolean;
    currentFile: string;
    processed: number;
    total: number;
    percent: number;
    splitCount: number;
    assignedModule: string;
  } | null>(null);

  // F15: Import summary
  const [importSummary, setImportSummary] = useState<{
    totalRecords: number;
    featureItems: number;
    linkedRecords: number;
    modules: string[];
  } | null>(null);

  // ─── Upload Handlers ────────────────────────────

  const handleUpload = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".zip")) {
        setError("请上传 .zip 格式的文件");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError("文件大小不能超过 50MB");
        return;
      }

      setError(null);
      setUploadedFileName(file.name);

      startTransition(async () => {
        const fd = new FormData();
        fd.append("file", file);
        const result = await uploadZip(fd);
        if (!result.success) {
          setError(result.error);
          return;
        }

        setParsedFiles(result.data.files);
        setFileTree(result.data.tree);

        // Initialize mapping rows
        const rows: MappingRow[] = result.data.files.map((f) => ({
          file: f,
          selected: true,
          targetNodeId: folders[0]?.id ?? "",
          nodeName: f.name.replace(/\.[^.]+$/, ""),
          dimensionTypeId: dimensions[0]?.id ?? null,
        }));
        setMappingRows(rows);

        // Select first file for preview
        if (result.data.files.length > 0) {
          setSelectedPreviewFile(result.data.files[0].path);
        }

        setStep(1);
      });
    },
    [folders, dimensions],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload],
  );

  // ─── Mapping Handlers ──────────────────────────

  const toggleRow = (index: number) => {
    setMappingRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)),
    );
  };

  const toggleAll = () => {
    const allSelected = mappingRows.every((r) => r.selected);
    setMappingRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const updateTarget = (index: number, targetNodeId: string) => {
    setMappingRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, targetNodeId } : r)),
    );
  };

  const updateDimension = (index: number, dimId: string) => {
    setMappingRows((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, dimensionTypeId: dimId ? parseInt(dimId) : null }
          : r,
      ),
    );
  };

  const bulkUpdateTarget = (targetNodeId: string | null) => {
    if (!targetNodeId) return;
    setMappingRows((prev) =>
      prev.map((r) => (r.selected ? { ...r, targetNodeId } : r)),
    );
  };

  const bulkUpdateDimension = (dimId: string | null) => {
    if (!dimId) return;
    const parsed = dimId !== "none" ? parseInt(dimId) : null;
    setMappingRows((prev) =>
      prev.map((r) => (r.selected ? { ...r, dimensionTypeId: parsed } : r)),
    );
  };

  // ─── Confirm Import ─────────────────────────────

  const handleConfirm = () => {
    const selected = mappingRows.filter((r) => r.selected && r.targetNodeId);
    if (selected.length === 0) {
      setError("请至少选择一个文件并指定目标模块");
      return;
    }

    setError(null);

    // F15: Build progress simulation based on selected items
    const items: ImportItem[] = selected.map((r) => ({
      fileName: r.file.name,
      content: r.file.content,
      targetNodeId: r.targetNodeId,
      nodeName: r.nodeName,
      dimensionTypeId: r.dimensionTypeId ?? undefined,
    }));

    // Show progress panel
    setImportProgress({
      isImporting: true,
      currentFile: items[0]?.fileName ?? "",
      processed: 0,
      total: items.length,
      percent: 0,
      splitCount: 0,
      assignedModule: "",
    });

    startTransition(async () => {
      // Simulate per-file progress
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const folder = folders.find((f) => f.id === item.targetNodeId);
        setImportProgress({
          isImporting: true,
          currentFile: item.fileName,
          processed: i,
          total: items.length,
          percent: Math.round((i / items.length) * 100),
          splitCount: 1,
          assignedModule: folder?.name ?? item.nodeName,
        });
        // Brief visual delay per file
        await new Promise((r) => setTimeout(r, 200));
      }

      const result = await confirmImport(projectId, items);
      if (!result.success) {
        setError(result.error);
        setImportProgress(null);
        return;
      }

      // Complete progress
      setImportProgress({
        isImporting: false,
        currentFile: "",
        processed: items.length,
        total: items.length,
        percent: 100,
        splitCount: 0,
        assignedModule: "",
      });

      // F15: Build import summary
      const moduleSet = new Set<string>();
      for (const item of items) {
        const folder = folders.find((f) => f.id === item.targetNodeId);
        moduleSet.add(folder?.name ?? item.nodeName);
      }
      setImportSummary({
        totalRecords: result.data.imported,
        featureItems: items.length,
        linkedRecords: result.data.imported,
        modules: Array.from(moduleSet),
      });

      // Find which module got the most imports for Aha Moment
      const targetCounts = new Map<string, number>();
      for (const item of items) {
        targetCounts.set(
          item.targetNodeId,
          (targetCounts.get(item.targetNodeId) || 0) + 1,
        );
      }
      let topModule = "";
      let topCount = 0;
      for (const [id, count] of targetCounts) {
        if (count > topCount) {
          topModule = id;
          topCount = count;
        }
      }

      // Delay redirect so user can see summary
      setTimeout(() => {
        router.push(
          `/projects/${projectId}?imported=true&topModule=${topModule}&count=${result.data.imported}`,
        );
      }, 3000);
    });
  };

  // ─── Preview helpers ────────────────────────────

  const selectedFile = parsedFiles.find((f) => f.path === selectedPreviewFile);

  const openPreview = (file: ParsedFile) => {
    setPreviewFileName(file.name);
    setPreviewContent(file.content);
    setPreviewDialog(true);
  };

  const selectedCount = mappingRows.filter((r) => r.selected).length;

  // ─── Render ───────────────────────────────────

  const innerContent = (
    <div style={standalone ? { display: "flex", flexDirection: "column" as const, minHeight: "100vh" } : { display: "flex", flexDirection: "column" as const, flex: 1, minHeight: 0, overflow: "hidden" }}>
      {/* Header — only in standalone mode */}
      {standalone && (
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4 inline mr-1" />
              {projectName}
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-lg font-semibold">导入文档</h1>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${projectId}`}>取消</Link>
          </Button>
        </header>
      )}

      {/* Step Indicator */}
      <div className="px-6 py-4 shrink-0">
        <StepIndicator currentStep={step} steps={STEPS} />
      </div>

      <Separator className="shrink-0" />

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button className="ml-auto" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step Content */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        {/* ─── Step 0: Upload ─────────────────────── */}
        {step === 0 && (
          <div className="flex items-center justify-center p-6" style={{ position: "absolute", inset: 0 }}>
            <Card
              className={cn(
                "w-full max-w-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
                isPending && "opacity-60 pointer-events-none",
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleFileInput}
              />
              <FileUp className="h-12 w-12 mx-auto text-muted-foreground/60 mb-4" />
              {isPending ? (
                <>
                  <p className="text-lg font-medium">正在解析 {uploadedFileName}...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    解析文件内容中，请稍候
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">
                    拖拽 ZIP 压缩包到这里，或点击选择
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    上传 .zip 压缩包（内含 .md / .csv / .txt 文件），最大 50MB
                  </p>
                </>
              )}
            </Card>
          </div>
        )}

        {/* ─── Step 1: Preview ────────────────────── */}
        {step === 1 && fileTree && (
          <div style={{ position: "absolute", inset: 0, display: "flex", overflow: "hidden" }}>
            {/* Left: File Tree */}
            <div style={{ width: 260, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div className="px-4 py-3 border-b" style={{ flexShrink: 0 }}>
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">
                    {uploadedFileName}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {parsedFiles.length} 个文件
                  </Badge>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div className="py-2">
                  {(fileTree.children ?? []).map((child) => (
                    <FileTreeItem
                      key={child.name}
                      node={child}
                      depth={0}
                      selectedFile={selectedPreviewFile}
                      onSelect={setSelectedPreviewFile}
                      parentPath=""
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: File Preview */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
              {selectedFile ? (
                <>
                  <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20" style={{ flexShrink: 0 }}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedFile.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", formatBadgeColor(selectedFile.format))}
                      >
                        {selectedFile.format}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatSize(selectedFile.size)}
                    </span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <pre className="text-sm text-muted-foreground p-6 whitespace-pre-wrap font-mono">
                      {selectedFile.content}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <p>选择左侧文件查看预览</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Step 2: Mapping ────────────────────── */}
        {step === 2 && folders.length === 0 && (
          <div className="flex items-center justify-center p-6" style={{ position: "absolute", inset: 0 }}>
            <Card className="max-w-md p-8 text-center border-dashed border-2">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-yellow-500" />
              <h3 className="text-lg font-semibold mb-2">无法映射文件</h3>
              <p className="text-sm text-muted-foreground mb-4">
                请先在项目中创建至少一个模块文件夹，然后再导入文件
              </p>
              <Button size="sm" asChild>
                <Link href={`/projects/${projectId}`}>返回工作区</Link>
              </Button>
            </Card>
          </div>
        )}
        {step === 2 && folders.length > 0 && (
          <div className="flex flex-col" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            {/* Bulk Actions Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  {mappingRows.every((r) => r.selected) ? "取消全选" : "全选"}
                </Button>
                {folders.length > 0 && (
                  <Select onValueChange={bulkUpdateTarget}>
                    <SelectTrigger className="w-[180px] h-8 text-sm">
                      <SelectValue placeholder="批量修改目标模块" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.path}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {dimensions.length > 0 && (
                  <Select onValueChange={bulkUpdateDimension}>
                    <SelectTrigger className="w-[160px] h-8 text-sm">
                      <SelectValue placeholder="批量修改维度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">不关联维度</SelectItem>
                      {dimensions.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Badge variant="secondary">
                已选 {selectedCount}/{mappingRows.length} 个文件
              </Badge>
            </div>

            {/* Mapping Table */}
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={mappingRows.every((r) => r.selected)}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="font-medium">文件名</TableHead>
                    <TableHead className="font-medium">格式</TableHead>
                    <TableHead className="font-medium">大小</TableHead>
                    <TableHead className="font-medium">目标模块</TableHead>
                    <TableHead className="font-medium">关联维度</TableHead>
                    <TableHead className="font-medium w-[80px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappingRows.map((row, index) => (
                    <TableRow
                      key={row.file.name}
                      className={cn(!row.selected && "opacity-50")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={row.selected}
                          onCheckedChange={() => toggleRow(index)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{row.file.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            formatBadgeColor(row.file.format),
                          )}
                        >
                          {row.file.format}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatSize(row.file.size)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {folders.length > 0 ? (
                          <Select
                            value={row.targetNodeId}
                            onValueChange={(v) => v && updateTarget(index, v)}
                          >
                            <SelectTrigger className="h-8 w-[180px] text-sm">
                              <SelectValue placeholder="选择模块" />
                            </SelectTrigger>
                            <SelectContent>
                              {folders.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.path}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            暂无可选模块
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {dimensions.length > 0 ? (
                          <Select
                            value={
                              row.dimensionTypeId
                                ? String(row.dimensionTypeId)
                                : "none"
                            }
                            onValueChange={(v) => updateDimension(index, v === "none" ? "" : v ?? "")}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">不关联</SelectItem>
                              {dimensions.map((d) => (
                                <SelectItem key={d.id} value={String(d.id)}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openPreview(row.file)}
                        >
                          预览
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}

        {/* ─── Step 3: Confirm ────────────────────── */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto p-6 space-y-6" style={{ position: "absolute", inset: 0, overflowY: "auto" }}>
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">导入确认</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">源文件</span>
                  <span className="font-medium">{uploadedFileName}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">待导入文件数</span>
                  <span className="font-medium">{selectedCount} 个</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">跳过文件数</span>
                  <span className="text-muted-foreground">
                    {mappingRows.length - selectedCount} 个
                  </span>
                </div>
              </div>
            </Card>

            {/* Selected files summary */}
            <Card className="p-6">
              <h3 className="text-sm font-medium mb-3">导入详情</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {mappingRows
                  .filter((r) => r.selected)
                  .map((row) => {
                    const targetFolder = folders.find(
                      (f) => f.id === row.targetNodeId,
                    );
                    const dim = dimensions.find(
                      (d) => d.id === row.dimensionTypeId,
                    );
                    return (
                      <div
                        key={row.file.name}
                        className="flex items-center gap-3 rounded-md border p-3 text-sm"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate flex-1">
                          {row.nodeName}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate max-w-[200px]">
                          {targetFolder?.path || "未指定"}
                        </span>
                        {dim && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {dim.name}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
              </div>
              {mappingRows.filter((r) => r.selected && !r.targetNodeId).length >
                0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    部分文件未指定目标模块，这些文件将被跳过
                  </span>
                </div>
              )}
            </Card>

            {/* F15: Import Progress Panel */}
            {importProgress && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    导入进度
                    {importProgress.isImporting && (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-xs">
                        进行中
                      </Badge>
                    )}
                    {!importProgress.isImporting && (
                      <Badge variant="outline" className="text-xs border-green-300 text-green-600">
                        完成
                      </Badge>
                    )}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {importProgress.processed}/{importProgress.total} 文件
                  </span>
                </div>
                <div className="mb-3">
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${importProgress.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block text-right">
                    {importProgress.percent}%
                  </span>
                </div>
                {importProgress.isImporting && importProgress.currentFile && (
                  <div className="rounded-md border p-3 bg-primary/5 border-l-4 border-l-primary">
                    <p className="text-sm">
                      <span className="text-muted-foreground">正在处理：</span>
                      <span className="font-medium">{importProgress.currentFile}</span>
                    </p>
                    {importProgress.assignedModule && (
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">归入模块：</span>
                        <Badge variant="outline" className="text-xs">
                          {importProgress.assignedModule}
                        </Badge>
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* F15: Import Summary */}
            {importSummary && (
              <Card className="p-6 border-green-200 bg-green-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <Check className="h-5 w-5 text-green-600" />
                  <h3 className="text-base font-semibold text-green-900">导入完成</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md border border-green-200 bg-white p-3 text-center">
                    <span className="text-2xl font-bold text-foreground">{importSummary.totalRecords}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">导入数据条数</p>
                  </div>
                  <div className="rounded-md border border-green-200 bg-white p-3 text-center">
                    <span className="text-2xl font-bold text-foreground">{importSummary.featureItems}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">拆分功能项</p>
                  </div>
                  <div className="rounded-md border border-green-200 bg-white p-3 text-center">
                    <span className="text-2xl font-bold text-foreground">{importSummary.linkedRecords}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">关联记录数</p>
                  </div>
                  <div className="rounded-md border border-green-200 bg-white p-3 text-center">
                    <span className="text-2xl font-bold text-foreground">{importSummary.modules.length}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">归入模块数</p>
                  </div>
                </div>
                {importSummary.modules.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">模块：</span>
                    {importSummary.modules.map((m) => (
                      <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-3">即将跳转到项目概览页...</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {step > 0 && (
        <div className="border-t px-6 py-4 bg-card">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一步
            </Button>
            <div className="flex items-center gap-3">
              {step < 3 && (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={isPending}
                >
                  下一步
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {step === 3 && (
                <Button
                  onClick={handleConfirm}
                  disabled={isPending || selectedCount === 0 || mappingRows.some((r) => r.selected && !r.targetNodeId)}
                >
                  {isPending ? (
                    "导入中..."
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      确认导入（{selectedCount} 个文件）
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {previewFileName}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono p-4">
              {previewContent}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (standalone) {
    return <div className="bg-background">{innerContent}</div>;
  }
  return innerContent;
}
