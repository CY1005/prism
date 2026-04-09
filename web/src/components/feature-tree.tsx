"use client";

import { useState } from "react";
import { ChevronRight, Folder, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TreeNode {
  id: string;
  name: string;
  type: "folder" | "file";
  depth: number;
  children: TreeNode[];
}

interface FeatureTreeProps {
  data: TreeNode[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function TreeItem({
  node,
  level = 0,
  selectedId,
  onSelect,
  expandedIds,
  toggleExpand,
}: {
  node: TreeNode;
  level?: number;
  selectedId: string;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const isFolder = node.type === "folder";
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        onClick={() => {
          if (isFolder) {
            toggleExpand(node.id);
          } else {
            onSelect(node.id);
          }
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          "hover:bg-accent",
          isSelected && !isFolder && "bg-accent font-medium"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {isFolder ? (
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        ) : (
          <span className="w-4" />
        )}
        {isFolder ? (
          <Folder className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="flex-1 truncate text-left">{node.name}</span>
      </button>
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FeatureTree({ data, selectedId, onSelect }: FeatureTreeProps) {
  // Auto-expand all folders initially
  const allFolderIds = new Set<string>();
  function collectFolders(nodes: TreeNode[]) {
    for (const n of nodes) {
      if (n.type === "folder") {
        allFolderIds.add(n.id);
        collectFolders(n.children);
      }
    }
  }
  collectFolders(data);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(allFolderIds);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1 py-2">
      {data.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          expandedIds={expandedIds}
          toggleExpand={toggleExpand}
        />
      ))}
    </div>
  );
}
