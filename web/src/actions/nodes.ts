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

  // Get dimension config count for this project
  const dimConfigs = await db
    .select()
    .from(projectDimensionConfigs)
    .where(and(eq(projectDimensionConfigs.projectId, projectId), eq(projectDimensionConfigs.enabled, true)));
  const totalDims = dimConfigs.length;

  // Get filled dimension counts per node
  const allRecords = await db
    .select({ nodeId: dimensionRecords.nodeId, dimTypeId: dimensionRecords.dimensionTypeId })
    .from(dimensionRecords)
    .innerJoin(nodes, eq(dimensionRecords.nodeId, nodes.id))
    .where(eq(nodes.projectId, projectId));

  const filledPerNode = new Map<string, Set<number>>();
  for (const r of allRecords) {
    if (!filledPerNode.has(r.nodeId)) filledPerNode.set(r.nodeId, new Set());
    filledPerNode.get(r.nodeId)!.add(r.dimTypeId);
  }

  // Build tree structure
  type TreeNode = (typeof allNodes)[number] & { children: TreeNode[]; completionPercent: number };
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const node of allNodes) {
    const filled = filledPerNode.get(node.id)?.size ?? 0;
    const percent = totalDims > 0 ? Math.round((filled / totalDims) * 100) : 0;
    nodeMap.set(node.id, { ...node, children: [], completionPercent: node.type === "file" ? percent : 0 });
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

  // Calculate folder completion as average of children
  function calcFolderCompletion(node: TreeNode): number {
    if (node.type === "file") return node.completionPercent;
    if (node.children.length === 0) return 0;
    const sum = node.children.reduce((acc, c) => acc + calcFolderCompletion(c), 0);
    node.completionPercent = Math.round(sum / node.children.length);
    return node.completionPercent;
  }
  roots.forEach(calcFolderCompletion);

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

export async function renameNode(nodeId: string, newName: string) {
  const [updated] = await db
    .update(nodes)
    .set({ name: newName, updatedAt: new Date() })
    .where(eq(nodes.id, nodeId))
    .returning();

  if (updated) revalidatePath(`/projects/${updated.projectId}`);
  return updated;
}

export async function deleteNode(nodeId: string) {
  const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
  if (!node) return;

  // Delete node and all descendants (cascade handles dimension_records)
  // First delete children recursively
  const children = await db.select().from(nodes).where(eq(nodes.parentId, nodeId));
  for (const child of children) {
    await deleteNode(child.id);
  }
  await db.delete(nodes).where(eq(nodes.id, nodeId));
  revalidatePath(`/projects/${node.projectId}`);
}

export async function getFolderOverview(nodeId: string, projectId: string) {
  const children = await db
    .select()
    .from(nodes)
    .where(and(eq(nodes.parentId, nodeId), eq(nodes.projectId, projectId)))
    .orderBy(asc(nodes.sortOrder));

  // Get dimension config count
  const dimConfigs = await db
    .select()
    .from(projectDimensionConfigs)
    .where(and(eq(projectDimensionConfigs.projectId, projectId), eq(projectDimensionConfigs.enabled, true)));
  const totalDims = dimConfigs.length;

  // Get filled counts for each child
  const result = await Promise.all(
    children.map(async (child) => {
      if (child.type === "file") {
        const records = await db
          .select({ dimTypeId: dimensionRecords.dimensionTypeId })
          .from(dimensionRecords)
          .where(eq(dimensionRecords.nodeId, child.id));
        const uniqueDims = new Set(records.map((r) => r.dimTypeId));
        return {
          ...child,
          filledDimensions: uniqueDims.size,
          totalDimensions: totalDims,
          completionPercent: totalDims > 0 ? Math.round((uniqueDims.size / totalDims) * 100) : 0,
        };
      }
      // For folders, count descendant files
      const descendants = await db
        .select()
        .from(nodes)
        .where(and(eq(nodes.projectId, projectId), eq(nodes.type, "file")));
      const childDescendants = descendants.filter((d) => d.path.includes(child.id));
      return {
        ...child,
        filledDimensions: childDescendants.length,
        totalDimensions: childDescendants.length,
        completionPercent: 0,
        childCount: childDescendants.length,
      };
    })
  );

  return result;
}

export async function updateNodeSortOrder(nodeId: string, newSortOrder: number) {
  const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
  if (!node) return;

  // Get siblings
  const siblings = node.parentId
    ? await db.select().from(nodes).where(and(eq(nodes.projectId, node.projectId), eq(nodes.parentId, node.parentId!)))
    : await db.select().from(nodes).where(and(eq(nodes.projectId, node.projectId), isNull(nodes.parentId)));

  const sorted = siblings.sort((a, b) => a.sortOrder - b.sortOrder);
  const oldIndex = sorted.findIndex((s) => s.id === nodeId);
  if (oldIndex === -1) return;

  // Remove from old position and insert at new
  sorted.splice(oldIndex, 1);
  sorted.splice(newSortOrder, 0, node);

  // Update all sort orders
  for (let i = 0; i < sorted.length; i++) {
    await db.update(nodes).set({ sortOrder: i }).where(eq(nodes.id, sorted[i].id));
  }

  revalidatePath(`/projects/${node.projectId}`);
}
