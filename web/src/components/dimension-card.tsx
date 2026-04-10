"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface DimensionCardProps {
  title: string;
  entryCount: number;
  collapsedSummary?: string;
  defaultExpanded?: boolean;
  onAdd?: () => void;
  children: React.ReactNode;
}

export function DimensionCard({
  title,
  entryCount,
  collapsedSummary,
  defaultExpanded = false,
  onAdd,
  children,
}: DimensionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-medium">{title}</h3>
              <Badge variant="secondary" className="text-xs">
                {entryCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {onAdd && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={onAdd}
                >
                  <Plus className="h-4 w-4" />
                  添加
                </Button>
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
            <p className="mt-2 text-sm text-muted-foreground">
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
