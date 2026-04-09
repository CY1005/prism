"use server";

import { db } from "@/db";
import { projects, nodes, projectDimensionConfigs, dimensionTypes, dimensionRecords } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";

export async function getProjects() {
  const allProjects = await db.select().from(projects);

  const result = await Promise.all(
    allProjects.map(async (project) => {
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
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  return project ?? null;
}
