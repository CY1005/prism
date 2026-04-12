"use server";

import { db } from "@/db";
import { competitors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkProjectAccess } from "@/services/permission.service";
import { logger } from "@/lib/logger";
import { type ActionResult, actionError, actionSuccess, AppError } from "@/lib/errors";

export async function createCompetitor(
  projectId: string,
  data: {
    name: string;
    website?: string;
    description?: string;
  },
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "editor");

    if (!data.name?.trim()) {
      return actionError(new AppError("竞品名称不能为空", "blocking", "VALIDATION_ERROR"));
    }

    const [competitor] = await db
      .insert(competitors)
      .values({
        projectId,
        name: data.name.trim(),
        website: data.website?.trim() || null,
        description: data.description?.trim() || null,
      })
      .returning();

    logger.action("competitor.create", user.id, { projectId, competitorId: competitor.id });
    revalidatePath(`/projects/${projectId}`);

    return actionSuccess({ id: competitor.id });
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCompetitor(
  competitorId: string,
  data: {
    name?: string;
    website?: string;
    description?: string;
  },
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [competitor] = await db.select().from(competitors).where(eq(competitors.id, competitorId));
    if (!competitor) {
      return actionError(new AppError("竞品不存在", "blocking", "NOT_FOUND", 404));
    }

    await checkProjectAccess(user.id, competitor.projectId, "editor");

    if (data.name !== undefined && data.name.trim() === "") {
      return actionError(new AppError("竞品名称不能为空", "blocking", "VALIDATION_ERROR"));
    }

    await db
      .update(competitors)
      .set({
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.website !== undefined && { website: data.website.trim() || null }),
        ...(data.description !== undefined && { description: data.description.trim() || null }),
      })
      .where(eq(competitors.id, competitorId));

    logger.action("competitor.update", user.id, { competitorId, projectId: competitor.projectId });
    revalidatePath(`/projects/${competitor.projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteCompetitor(competitorId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [competitor] = await db.select().from(competitors).where(eq(competitors.id, competitorId));
    if (!competitor) {
      return actionError(new AppError("竞品不存在", "blocking", "NOT_FOUND", 404));
    }

    await checkProjectAccess(user.id, competitor.projectId, "editor");

    await db.delete(competitors).where(eq(competitors.id, competitorId));

    logger.action("competitor.delete", user.id, { competitorId, projectId: competitor.projectId });
    revalidatePath(`/projects/${competitor.projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function getCompetitorsByProject(projectId: string) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  return db.select().from(competitors).where(eq(competitors.projectId, projectId));
}
