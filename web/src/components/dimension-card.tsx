"use client";

import { useState } from "react";
import { ChevronDown, Plus, FileEdit, ClipboardPaste, Upload, Link, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DimensionCardProps {
  title: string;
  icon?: LucideIcon;
  entryCount: number;
  collapsedSummary?: string;
  defaultExpanded?: boolean;
  onAdd?: () => void;
  children: React.ReactNode;
}

export function DimensionCard({
  title,
  icon: Icon,
  entryCount,
  collapsedSummary,
  defaultExpanded = false,
  onAdd,
  children,
}: DimensionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [comingSoonMsg, setComingSoonMsg] = useState<string | null>(null);

  const showComingSoon = (method: string) => {
    setComingSoonMsg(`${method}功能即将上线`);
    setTimeout(() => setComingSoonMsg(null), 2000);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm relative">
      {comingSoonMsg && (
        <div className="absolute top-2 right-2 z-10 rounded-md bg-foreground/90 px-3 py-1.5 text-xs text-background animate-in fade-in-0 zoom-in-95">
          {comingSoonMsg}
        </div>
      )}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              )}
              <h3 className="font-medium">{title}</h3>
              <Badge variant="secondary" className="text-xs">
                {entryCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {onAdd && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="inline-flex items-center justify-center gap-1 rounded-md px-3 h-8 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    添加
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={onAdd}>
                      <FileEdit className="h-4 w-4" />
                      手动编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => showComingSoon("粘贴Markdown")}>
                      <ClipboardPaste className="h-4 w-4" />
                      粘贴Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => showComingSoon("上传文件")}>
                      <Upload className="h-4 w-4" />
                      上传文件
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => showComingSoon("URL导入")}>
                      <Link className="h-4 w-4" />
                      URL导入
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <CollapsibleTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
            </div>
          </div>
          {!isOpen && collapsedSummary && (
            <p className={cn("mt-2 text-sm text-muted-foreground", Icon && "pl-11")}>
              {collapsedSummary}
            </p>
          )}
        </div>
        <CollapsibleContent>
          <div className="px-4 pb-4">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
