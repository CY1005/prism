"use client";

import { useState } from "react";
import { Check, X, Link2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ─── Types ──────────────────────────────────────────────

export type FeedStatus = "pending" | "confirmed" | "ignored";

export type FeedItemData = {
  id: string;
  title: string;
  source: string;
  publishedDate: Date | string;
  summary: string;
  suggestedNodeId: string | null;
  suggestedNodeName: string | null;
  confidence: number;
  status: string;
};

const STATUS_CONFIG: Record<FeedStatus, { label: string; color: string }> = {
  pending: { label: "待确认", color: "border-yellow-200 text-yellow-700 bg-yellow-50" },
  confirmed: { label: "已关联", color: "border-green-200 text-green-700 bg-green-50" },
  ignored: { label: "已忽略", color: "border-gray-200 text-gray-500 bg-gray-50" },
};

const SOURCE_COLORS: Record<string, string> = {
  "NVIDIA Blog": "border-green-200 text-green-700 bg-green-50",
  "AWS Blog": "border-orange-200 text-orange-700 bg-orange-50",
  "K8s Blog": "border-blue-200 text-blue-700 bg-blue-50",
};

function getSourceColor(source: string) {
  return SOURCE_COLORS[source] ?? "border-gray-200 text-gray-600 bg-gray-50";
}

// ─── Feed Card Component ────────────────────────────────

interface FeedCardProps {
  item: FeedItemData;
  compact?: boolean;
  onConfirm?: (itemId: string, nodeId: string) => void;
  onIgnore?: (itemId: string) => void;
  onReassign?: (itemId: string) => void;
}

export function FeedCard({
  item,
  compact = false,
  onConfirm,
  onIgnore,
  onReassign,
}: FeedCardProps) {
  const [loading, setLoading] = useState(false);
  const status = (item.status as FeedStatus) || "pending";
  const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const dateStr =
    item.publishedDate instanceof Date
      ? item.publishedDate.toLocaleDateString("zh-CN")
      : typeof item.publishedDate === "string"
        ? new Date(item.publishedDate).toLocaleDateString("zh-CN")
        : "";

  const handleConfirm = async () => {
    if (!onConfirm || !item.suggestedNodeId) return;
    setLoading(true);
    await onConfirm(item.id, item.suggestedNodeId);
    setLoading(false);
  };

  const handleIgnore = async () => {
    if (!onIgnore) return;
    setLoading(true);
    await onIgnore(item.id);
    setLoading(false);
  };

  if (compact) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-border p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs ${getSourceColor(item.source)}`}>
              {item.source}
            </Badge>
            <span className="text-sm font-medium truncate">{item.title}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{dateStr}</span>
      </div>
    );
  }

  return (
    <Card
      className={`border-border/60 shadow-sm p-5 ${status === "ignored" ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs ${getSourceColor(item.source)}`}>
            {item.source}
          </Badge>
          <Badge variant="outline" className={`text-xs ${statusConf.color}`}>
            {statusConf.label}
          </Badge>
          <span className="font-medium">{item.title}</span>
        </div>
        <span className="text-xs text-muted-foreground shrink-0 ml-4">{dateStr}</span>
      </div>

      <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>

      <Separator className="mb-3" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">AI 推荐关联：</span>
          {item.suggestedNodeName && (
            <Badge variant="secondary" className="text-xs">
              <Link2 className="h-3 w-3 mr-1" />
              {item.suggestedNodeName}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs ml-1">
            置信度 {Math.round(item.confidence * 100)}%
          </Badge>
        </div>

        {status === "pending" && (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="h-7 gap-1"
              onClick={handleConfirm}
              disabled={loading || !item.suggestedNodeId}
            >
              <Check className="h-3.5 w-3.5" />
              确认关联
            </Button>
            {onReassign && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1"
                onClick={() => onReassign(item.id)}
                disabled={loading}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                调整关联
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-muted-foreground"
              onClick={handleIgnore}
              disabled={loading}
            >
              <X className="h-3.5 w-3.5" />
              忽略
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Feed List Component ────────────────────────────────

interface FeedListProps {
  items: FeedItemData[];
  compact?: boolean;
  onConfirm?: (itemId: string, nodeId: string) => void;
  onIgnore?: (itemId: string) => void;
  onReassign?: (itemId: string) => void;
}

export function FeedList({
  items,
  compact = false,
  onConfirm,
  onIgnore,
  onReassign,
}: FeedListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        暂无动态
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedCard
          key={item.id}
          item={item}
          compact={compact}
          onConfirm={onConfirm}
          onIgnore={onIgnore}
          onReassign={onReassign}
        />
      ))}
    </div>
  );
}
