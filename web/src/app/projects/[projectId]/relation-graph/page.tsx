"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type FitViewOptions,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getModuleRelations } from "@/actions/nodes";

type GraphData = {
  nodes: { id: string; name: string; type: string }[];
  edges: { source: string; target: string; relation: string }[];
};

function computeCircularLayout(
  nodeIds: string[],
  radiusBase: number = 220,
): Record<string, { x: number; y: number }> {
  const count = nodeIds.length;
  const radius = Math.max(radiusBase, count * 40);
  const positions: Record<string, { x: number; y: number }> = {};
  nodeIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    positions[id] = {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  });
  return positions;
}

const fitViewOptions: FitViewOptions = { padding: 0.2 };

export default function RelationGraphPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data: GraphData = await getModuleRelations(projectId);

      if (data.nodes.length === 0) {
        setRfNodes([]);
        setRfEdges([]);
        return;
      }

      const positions = computeCircularLayout(data.nodes.map((n) => n.id));

      const nodes: Node[] = data.nodes.map((n) => ({
        id: n.id,
        position: positions[n.id] ?? { x: 0, y: 0 },
        data: { label: n.name },
        style: {
          background: n.type === "folder" ? "#e0f2fe" : "#f0fdf4",
          border: "1px solid #94a3b8",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: n.type === "folder" ? 600 : 400,
          whiteSpace: "nowrap" as const,
        },
      }));

      const edges: Edge[] = data.edges.map((e, i) => ({
        id: `edge-${i}`,
        source: e.source,
        target: e.target,
        label: e.relation,
        labelStyle: { fontSize: 11, fill: "#64748b" },
        labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.8 },
        style: { stroke: "#94a3b8" },
        type: "default",
        animated: e.relation === "depends_on",
      }));

      setRfNodes(nodes);
      setRfEdges(edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] text-muted-foreground text-sm">
        加载关系图中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (rfNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] gap-3 text-muted-foreground">
        <svg
          className="h-16 w-16 opacity-30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <circle cx="6" cy="6" r="2" />
          <circle cx="18" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="7" y1="8" x2="11" y2="16" />
          <line x1="17" y1="8" x2="13" y2="16" />
        </svg>
        <p className="text-sm">暂无模块关系，请先在功能项中添加关联</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        fitView
        fitViewOptions={fitViewOptions}
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
