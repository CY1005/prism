"use client";

import { useState } from "react";
import {
  Sparkles,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ─── Types ──────────────────────────────────────────

export interface SnapshotDimension {
  dimensionKey: string;
  dimensionName: string;
  content: string;
  checked: boolean;
}

export interface SnapshotData {
  summary: string;
  dimensions: SnapshotDimension[];
}

interface SnapshotResultProps {
  data: SnapshotData;
  onSave: (params: {
    summary: string;
    selectedDimensions: { dimensionKey: string; content: string }[];
  }) => Promise<void>;
}

// ─── Component ──────────────────────────────────────

export function SnapshotResult({ data, onSave }: SnapshotResultProps) {
  const [summary, setSummary] = useState(data.summary);
  const [dimensionChecks, setDimensionChecks] = useState(
    data.dimensions.map((d) => d.checked),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleDimension(index: number) {
    setDimensionChecks((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  const selectedCount = dimensionChecks.filter(Boolean).length;

  const handleSave = async () => {
    setIsSaving(true);
    const selectedDimensions = data.dimensions
      .filter((_, i) => dimensionChecks[i])
      .map((d) => ({ dimensionKey: d.dimensionKey, content: d.content }));

    await onSave({ summary, selectedDimensions });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-border/60 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-base font-medium">一句话概要</h3>
          <Badge
            variant="outline"
            className="text-xs border-primary/30 text-primary bg-primary/5"
          >
            AI生成
          </Badge>
        </div>
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </Card>

      {/* Dimensions */}
      <Card className="border-border/60 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium">按维度结构化输出</h3>
            <Badge
              variant="outline"
              className="text-xs border-primary/30 text-primary bg-primary/5"
            >
              AI生成
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            已选中 {selectedCount}/{data.dimensions.length} 个维度
          </span>
        </div>

        <div className="space-y-3">
          {data.dimensions.map((dim, index) => (
            <Collapsible key={dim.dimensionKey} defaultOpen={index < 2}>
              <div className="border border-border/60 rounded-lg px-4 overflow-hidden">
                <CollapsibleTrigger className="flex items-center gap-3 w-full py-3 text-left">
                  <span className="font-medium text-sm">{dim.dimensionName}</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pb-4">
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">
                    {dim.content}
                  </div>
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`snap-check-${index}`}
                      checked={dimensionChecks[index]}
                      onCheckedChange={() => toggleDimension(index)}
                    />
                    <label
                      htmlFor={`snap-check-${index}`}
                      className="text-sm cursor-pointer select-none"
                    >
                      覆盖当前维度内容
                    </label>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          className="gap-1.5"
          disabled={selectedCount === 0 || isSaving}
          onClick={handleSave}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isSaving
            ? "更新中..."
            : saved
              ? "已更新"
              : `确认更新（${selectedCount}个维度）`}
        </Button>
      </div>
    </div>
  );
}
