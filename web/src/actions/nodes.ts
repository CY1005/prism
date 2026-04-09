"use server";

import { db } from "@/db";
import { nodes, dimensionRecords, versionRecords, dimensionTypes, projectDimensionConfigs } from "@/db/schema";
import { eq, and, asc, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProjectTree(projectId: string) {
  const allNodes = await db
    .select()
    .from(nodes)
    .where(eq(nodes.projectId, projectId))
    .orderBy(asc(nodes.depth), asc(nodes.sortOrder));

  // Build tree structure
  type TreeNode = (typeof allNodes)[number] & { children: TreeNode[] };
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const node of allNodes) {
    nodeMap.set(node.id, { ...node, children: [] });
  }

  for (const node of allNodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent) parent.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  return roots;
}

export async function getNodeWithDimensions(nodeId: string) {
  const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
  if (!node) return null;

  const records = await db
    .select({
      record: dimensionRecords,
      dimType: dimensionTypes,
    })
    .from(dimensionRecords)
    .innerJoin(dimensionTypes, eq(dimensionRecords.dimensionTypeId, dimensionTypes.id))
    .where(eq(dimensionRecords.nodeId, nodeId));

  const versions = await db
    .select()
    .from(versionRecords)
    .where(eq(versionRecords.nodeId, nodeId))
    .orderBy(asc(versionRecords.createdAt));

  return { node, records, versions };
}

export async function getProjectDimensions(projectId: string) {
  return db
    .select({
      config: projectDimensionConfigs,
      dimType: dimensionTypes,
    })
    .from(projectDimensionConfigs)
    .innerJoin(dimensionTypes, eq(projectDimensionConfigs.dimensionTypeId, dimensionTypes.id))
    .where(and(eq(projectDimensionConfigs.projectId, projectId), eq(projectDimensionConfigs.enabled, true)))
    .orderBy(asc(projectDimensionConfigs.sortOrder));
}

export async function createNode(
  projectId: string,
  parentId: string | null,
  name: string,
  type: "folder" | "file" = "file"
) {
  const parent = parentId
    ? (await db.select().from(nodes).where(eq(nodes.id, parentId)))[0]
    : null;

  const depth = parent ? parent.depth + 1 : 0;
  const path = parent ? (parent.path ? `${parent.path}/${parent.id}` : parent.id) : "";

  // Get max sort order among siblings
  const siblings = parentId
    ? await db.select().from(nodes).where(and(eq(nodes.projectId, projectId), eq(nodes.parentId, parentId)))
    : await db.select().from(nodes).where(and(eq(nodes.projectId, projectId), isNull(nodes.parentId)));

  const sortOrder = siblings.length;

  const [newNode] = await db
    .insert(nodes)
    .values({ projectId, parentId, name, type, depth, sortOrder, path })
    .returning();

  revalidatePath(`/projects/${projectId}`);
  return newNode;
}

export async function createDimensionRecord(
  nodeId: string,
  dimensionTypeId: number,
  content: Record<string, unknown>
) {
  const [record] = await db
    .insert(dimensionRecords)
    .values({ nodeId, dimensionTypeId, content })
    .returning();

  const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
  if (node) revalidatePath(`/projects/${node.projectId}`);
  return record;
}

export async function updateDimensionRecord(
  recordId: string,
  content: Record<string, unknown>
) {
  const [record] = await db
    .select()
    .from(dimensionRecords)
    .where(eq(dimensionRecords.id, recordId));
  if (!record) return null;

  const [updated] = await db
    .update(dimensionRecords)
    .set({ content, version: record.version + 1, updatedAt: new Date() })
    .where(eq(dimensionRecords.id, recordId))
    .returning();

  return updated;
}

export async function deleteDimensionRecord(recordId: string) {
  await db.delete(dimensionRecords).where(eq(dimensionRecords.id, recordId));
}
