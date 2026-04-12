"use server";

import { db } from "@/db";
import { competitorReferences, competitors, nodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkProjectAccess } from "@/services/permission.service";
import { logger } from "@/lib/logger";
import { type ActionResult, actionError, actionSuccess, AppError } from "@/lib/errors";

export async function createReference(
  projectId: string,
  nodeId: string,
  data: {
    competitorId: string;
    version?: string;
    featureCoverage?: string;
    technicalApproach?: string;
    prosAndCons?: { pros: string[]; cons: string[] };
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "editor");

    // Verify node belongs to project
    const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
    if (!node || node.projectId !== projectId) {
      return actionError(new AppError("节点不存在或不属于该项目", "blocking", "NOT_FOUND", 404));
    }

    // Verify competitor belongs to same project
    const [competitor] = await db.select().from(competitors).where(eq(competitors.id, data.competitorId));
    if (!competitor || competitor.projectId !== projectId) {
      return actionError(new AppError("竞品不存在或不属于该项目", "blocking", "NOT_FOUND", 404));
    }

    const [ref] = await db
      .insert(competitorReferences)
      .values({
        nodeId,
        competitorId: data.competitorId,
        version: data.version?.trim() || null,
        featureCoverage: data.featureCoverage?.trim() || null,
        technicalApproach: data.technicalApproach?.trim() || null,
        prosAndCons: data.prosAndCons || null,
      })
      .returning();

    logger.action("competitor_reference.create", user.id, { projectId, refId: ref.id, nodeId });
    revalidatePath(`/projects/${projectId}`);

    return actionSuccess({ id: ref.id });
  } catch (error) {
    return actionError(error);
  }
}

export async function updateReference(
  referenceId: string,
  projectId: string,
  data: {
    version?: string;
    featureCoverage?: string;
    technicalApproach?: string;
    prosAndCons?: { pros: string[]; cons: string[] };
  },
): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "editor");

    const [ref] = await db.select().from(competitorReferences).where(eq(competitorReferences.id, referenceId));
    if (!ref) {
      return actionError(new AppError("竞品参考不存在", "blocking", "NOT_FOUND", 404));
    }

    await db
      .update(competitorReferences)
      .set({
        ...(data.version !== undefined && { version: data.version.trim() || null }),
        ...(data.featureCoverage !== undefined && { featureCoverage: data.featureCoverage.trim() || null }),
        ...(data.technicalApproach !== undefined && { technicalApproach: data.technicalApproach.trim() || null }),
        ...(data.prosAndCons !== undefined && { prosAndCons: data.prosAndCons }),
        updatedAt: new Date(),
      })
      .where(eq(competitorReferences.id, referenceId));

    logger.action("competitor_reference.update", user.id, { referenceId, projectId });
    revalidatePath(`/projects/${projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteReference(referenceId: string, projectId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "editor");

    const [ref] = await db.select().from(competitorReferences).where(eq(competitorReferences.id, referenceId));
    if (!ref) {
      return actionError(new AppError("竞品参考不存在", "blocking", "NOT_FOUND", 404));
    }

    await db.delete(competitorReferences).where(eq(competitorReferences.id, referenceId));

    logger.action("competitor_reference.delete", user.id, { referenceId, projectId });
    revalidatePath(`/projects/${projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function getReferencesByNode(projectId: string, nodeId: string) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  return db
    .select({
      reference: competitorReferences,
      competitor: competitors,
    })
    .from(competitorReferences)
    .innerJoin(competitors, eq(competitorReferences.competitorId, competitors.id))
    .where(eq(competitorReferences.nodeId, nodeId));
}
