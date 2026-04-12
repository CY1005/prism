"use server";

import { db } from "@/db";
import { issues, nodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkProjectAccess } from "@/services/permission.service";
import { logger } from "@/lib/logger";
import { type ActionResult, actionError, actionSuccess, AppError } from "@/lib/errors";

const VALID_CATEGORIES = ["bug", "tech_debt", "design_flaw", "performance"] as const;
type IssueCategory = (typeof VALID_CATEGORIES)[number];

// ADR-012: 问题按分类自动关联到对应维度
export const CATEGORY_DIMENSION_MAP: Record<IssueCategory, string> = {
  bug: "test_analysis",
  tech_debt: "engineering_exp",
  design_flaw: "design_decision",
  performance: "tech_impl",
};

export async function createIssue(
  projectId: string,
  nodeId: string | null,
  data: {
    category: string;
    description: string;
    tags?: string[];
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "editor");

    if (!data.description?.trim()) {
      return actionError(new AppError("问题描述不能为空", "blocking", "VALIDATION_ERROR"));
    }

    if (!VALID_CATEGORIES.includes(data.category as IssueCategory)) {
      return actionError(new AppError("无效的问题分类", "blocking", "VALIDATION_ERROR"));
    }

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
        category: data.category,
        description: data.description.trim(),
        tags: data.tags || [],
      })
      .returning();

    logger.action("issue.create", user.id, { projectId, issueId: issue.id, category: data.category });
    revalidatePath(`/projects/${projectId}`);

    return actionSuccess({ id: issue.id });
  } catch (error) {
    return actionError(error);
  }
}

export async function updateIssue(
  issueId: string,
  data: {
    category?: string;
    description?: string;
    tags?: string[];
  },
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [issue] = await db.select().from(issues).where(eq(issues.id, issueId));
    if (!issue) {
      return actionError(new AppError("问题不存在", "blocking", "NOT_FOUND", 404));
    }

    await checkProjectAccess(user.id, issue.projectId, "editor");

    if (data.description !== undefined && data.description.trim() === "") {
      return actionError(new AppError("问题描述不能为空", "blocking", "VALIDATION_ERROR"));
    }

    if (data.category && !VALID_CATEGORIES.includes(data.category as IssueCategory)) {
      return actionError(new AppError("无效的问题分类", "blocking", "VALIDATION_ERROR"));
    }

    await db
      .update(issues)
      .set({
        ...(data.category !== undefined && { category: data.category }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.tags !== undefined && { tags: data.tags }),
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

export async function getIssuesByNode(projectId: string, nodeId: string) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  return db
    .select()
    .from(issues)
    .where(and(eq(issues.projectId, projectId), eq(issues.nodeId, nodeId)));
}

export async function getIssuesByCategory(projectId: string, category: string) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  if (!VALID_CATEGORIES.includes(category as IssueCategory)) {
    return [];
  }

  return db
    .select()
    .from(issues)
    .where(and(eq(issues.projectId, projectId), eq(issues.category, category)));
}
