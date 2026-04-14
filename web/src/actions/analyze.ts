"use server";

import { requireAuth } from "@/lib/auth";
import { checkProjectAccess } from "@/services/permission.service";
import { type ActionResult, actionError, actionSuccess, AppError } from "@/lib/errors";

const API_BASE = process.env.API_URL ?? "http://localhost:8001";

export interface AffectedNodesResult {
  node_id: string;
  affected_node_ids: string[];
  analysis_record_id: string | null;
}

export async function getAffectedNodes(
  nodeId: string,
  projectId: string,
): Promise<ActionResult<AffectedNodesResult>> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "viewer");

    const params = new URLSearchParams({ node_id: nodeId, project_id: projectId });
    const res = await fetch(`${API_BASE}/api/analyze/affected-nodes?${params.toString()}`);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "查询影响节点失败" }));
      return actionError(
        new AppError(body.detail || "查询影响节点失败", "blocking", "AFFECTED_NODES_FAILED", res.status),
      );
    }

    const data: AffectedNodesResult = await res.json();
    return actionSuccess(data);
  } catch (error) {
    return actionError(error);
  }
}
