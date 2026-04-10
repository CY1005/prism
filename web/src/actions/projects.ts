"use server";

import { db } from "@/db";
import {
  projects,
  nodes,
  projectDimensionConfigs,
  dimensionTypes,
  projectTemplates,
  projectMembers,
} from "@/db/schema";
import { eq, count, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkProjectAccess } from "@/services/permission.service";
import { createProjectSchema } from "@/lib/validators/project";
import { logger } from "@/lib/logger";
import { type ActionResult, actionError, actionSuccess, AppError } from "@/lib/errors";

export async function getProjects() {
  const user = await requireAuth();

  // 平台管理员看所有项目，普通用户只看自己有权限的
  let projectList;
  if (user.role === "platform_admin") {
    projectList = await db.select().from(projects);
  } else {
    projectList = await db
      .select({ project: projects })
      .from(projects)
      .innerJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(eq(projectMembers.userId, user.id))
      .then((rows) => rows.map((r) => r.project));
  }

  const result = await Promise.all(
    projectList.map(async (project) => {
      const [nodeCount] = await db
        .select({ count: count() })
        .from(nodes)
        .where(eq(nodes.projectId, project.id));

      return {
        ...project,
        nodeCount: nodeCount.count,
      };
    })
  );

  return result;
}

export async function getProject(projectId: string) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  return project ?? null;
}

export async function createProject(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuth();

    const raw = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      templateType: formData.get("templateType") as string,
    };

    const parsed = createProjectSchema.safeParse(raw);
    if (!parsed.success) {
      return actionError(new AppError(parsed.error.errors[0]?.message || "输入格式错误", "blocking", "VALIDATION_ERROR"));
    }

    const { name, description, templateType } = parsed.data;

    // 获取模板配置
    const [template] = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.key, templateType));

    if (!template) {
      return actionError(new AppError("无效的项目模板", "blocking", "VALIDATION_ERROR"));
    }

    // 事务：创建项目 + 维度配置 + 创建者成员
    const result = await db.transaction(async (tx) => {
      const [newProject] = await tx
        .insert(projects)
        .values({
          name,
          description,
          templateType,
          hierarchyLabels: template.hierarchyLabels,
          createdBy: user.id,
        })
        .returning();

      // 获取模板维度并创建配置
      const templateDims = await tx
        .select()
        .from(dimensionTypes)
        .where(
          // 用 in 查询模板的维度keys不太方便，先查全部再filter
        );

      const allDims = await tx.select().from(dimensionTypes);
      const enabledDims = allDims.filter((d) => template.dimensionKeys.includes(d.key));

      if (enabledDims.length > 0) {
        await tx.insert(projectDimensionConfigs).values(
          enabledDims.map((dim, i) => ({
            projectId: newProject.id,
            dimensionTypeId: dim.id,
            enabled: true,
            sortOrder: i,
          }))
        );
      }

      // 创建者自动成为项目管理员
      await tx.insert(projectMembers).values({
        projectId: newProject.id,
        userId: user.id,
        role: "admin",
      });

      return newProject;
    });

    logger.action("project.create", user.id, { projectId: result.id, templateType });
    revalidatePath("/");

    return actionSuccess({ id: result.id });
  } catch (error) {
    return actionError(error);
  }
}
