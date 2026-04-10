"use server";

import { db } from "@/db";
import { issues, nodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkProjectAccess } from "@/services/permission.service";
import { logger } from "@/lib/logger";
import { type ActionResult, actionError, actionSuccess, AppError } from "@/lib/errors";

const VALID_TYPES = ["bug", "tech_debt", "design_flaw"] as const;
const VALID_SEVERITIES = ["critical", "high", "medium", "low"] as const;
const VALID_STATUSES = ["open", "resolved", "wontfix"] as const;

export async function createIssue(
  projectId: string,
  nodeId: string | null,
  data: {
    type: string;
    title: string;
    description: string;
    severity?: string;
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "editor");

    if (!data.title?.trim()) {
      return actionError(new AppError("问题标题不能为空", "blocking", "VALIDATION_ERROR"));
    }

    if (!VALID_TYPES.includes(data.type as typeof VALID_TYPES[number])) {
      return actionError(new AppError("无效的问题类型", "blocking", "VALIDATION_ERROR"));
    }

    if (data.severity && !VALID_SEVERITIES.includes(data.severity as typeof VALID_SEVERITIES[number])) {
      return actionError(new AppError("无效的严重程度", "blocking", "VALIDATION_ERROR"));
    }

    // 验证 nodeId 存在且属于该项目
    if (nodeId) {
      const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
      if (!node || node.projectId !== projectId) {
        return actionError(new AppError("节点不存在或不属于该项目", "blocking", "NOT_FOUND", 404));
      }
    }

    const [issue] = await db
      .insert(issues)
      .values({
        projectId,
        nodeId,
        type: data.type,
        title: data.title.trim(),
        description: data.description || "",
        severity: data.severity || "medium",
        createdBy: user.id,
      })
      .returning();

    logger.action("issue.create", user.id, { projectId, issueId: issue.id, type: data.type });
    revalidatePath(`/projects/${projectId}`);

    return actionSuccess({ id: issue.id });
  } catch (error) {
    return actionError(error);
  }
}

export async function getIssues(
  projectId: string,
  filters?: {
    nodeId?: string;
    type?: string;
    status?: string;
  },
) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  const conditions = [eq(issues.projectId, projectId)];

  if (filters?.nodeId) {
    conditions.push(eq(issues.nodeId, filters.nodeId));
  }
  if (filters?.type) {
    conditions.push(eq(issues.type, filters.type));
  }
  if (filters?.status) {
    conditions.push(eq(issues.status, filters.status));
  }

  const result = await db
    .select()
    .from(issues)
    .where(and(...conditions));

  return result;
}

export async function updateIssue(
  issueId: string,
  data: {
    title?: string;
    description?: string;
    type?: string;
    severity?: string;
    status?: string;
  },
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
    if (!issue) {
      return actionError(new AppError("问题不存在", "blocking", "NOT_FOUND", 404));
    }

    await checkProjectAccess(user.id, issue.projectId, "editor");

    if (data.title !== undefined && data.title.trim() === "") {
      return actionError(new AppError("问题标题不能为空", "blocking", "VALIDATION_ERROR"));
    }

    if (data.type && !VALID_TYPES.includes(data.type as typeof VALID_TYPES[number])) {
      return actionError(new AppError("无效的问题类型", "blocking", "VALIDATION_ERROR"));
    }

    if (data.severity && !VALID_SEVERITIES.includes(data.severity as typeof VALID_SEVERITIES[number])) {
      return actionError(new AppError("无效的严重程度", "blocking", "VALIDATION_ERROR"));
    }

    if (data.status && !VALID_STATUSES.includes(data.status as typeof VALID_STATUSES[number])) {
      return actionError(new AppError("无效的状态", "blocking", "VALIDATION_ERROR"));
    }

    await db
      .update(issues)
      .set({
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.severity !== undefined && { severity: data.severity }),
        ...(data.status !== undefined && { status: data.status }),
        updatedAt: new Date(),
      })
      .where(eq(issues.id, issueId));

    logger.action("issue.update", user.id, { issueId, projectId: issue.projectId });
    revalidatePath(`/projects/${issue.projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteIssue(issueId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
    if (!issue) {
      return actionError(new AppError("问题不存在", "blocking", "NOT_FOUND", 404));
    }

    await checkProjectAccess(user.id, issue.projectId, "editor");

    await db.delete(issues).where(eq(issues.id, issueId));

    logger.action("issue.delete", user.id, { issueId, projectId: issue.projectId });
    revalidatePath(`/projects/${issue.projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}
