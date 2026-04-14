"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Sparkles, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ImportWizard } from "./import-wizard";
import { AIImportWizard } from "@/components/ai-import-wizard";

type ImportMode = "manual" | "ai";

interface ImportPageClientProps {
  projectId: string;
  projectName: string;
  folders: { id: string; name: string; path: string; depth: number }[];
  dimensions: { id: number; key: string; name: string }[];
}

export function ImportPageClient({
  projectId,
  projectName,
  folders,
  dimensions,
}: ImportPageClientProps) {
  const [mode, setMode] = useState<ImportMode>("manual");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
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

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
          <button
            onClick={() => setMode("manual")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "manual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="h-3.5 w-3.5" />
            手动映射
          </button>
          <button
            onClick={() => setMode("ai")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "ai"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI 智能导入
          </button>
        </div>

        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="sm">
            取消
          </Button>
        </Link>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === "manual" ? (
          <ImportWizard
            projectId={projectId}
            projectName={projectName}
            folders={folders}
            dimensions={dimensions}
          />
        ) : (
          <AIImportWizard
            projectId={projectId}
            projectName={projectName}
            folders={folders}
            dimensions={dimensions}
          />
        )}
      </div>
    </div>
  );
}
