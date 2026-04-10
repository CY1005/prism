"use server";

import { db } from "@/db";
import {
  nodes,
  dimensionRecords,
  versionRecords,
  dimensionTypes,
  projectDimensionConfigs,
} from "@/db/schema";
import { eq, and, asc, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkProjectAccess } from "@/services/permission.service";
import { logger } from "@/lib/logger";
import { type ActionResult, actionError, actionSuccess, AppError } from "@/lib/errors";

export async function getProjectTree(projectId: string) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  const allNodes = await db
    .select()
    .from(nodes)
    .where(eq(nodes.projectId, projectId))
    .orderBy(asc(nodes.depth), asc(nodes.sortOrder));

  const dimConfigs = await db
    .select()
    .from(projectDimensionConfigs)
    .where(
      and(
        eq(projectDimensionConfigs.projectId, projectId),
        eq(projectDimensionConfigs.enabled, true),
      ),
    );
  const totalDims = dimConfigs.length;

  const allRecords = await db
    .select({
      nodeId: dimensionRecords.nodeId,
      dimTypeId: dimensionRecords.dimensionTypeId,
    })
    .from(dimensionRecords)
    .innerJoin(nodes, eq(dimensionRecords.nodeId, nodes.id))
    .where(eq(nodes.projectId, projectId));

  const filledPerNode = new Map<string, Set<number>>();
  for (const r of allRecords) {
    if (!filledPerNode.has(r.nodeId))
      filledPerNode.set(r.nodeId, new Set());
    filledPerNode.get(r.nodeId)!.add(r.dimTypeId);
  }

  type TreeNode = (typeof allNodes)[number] & {
    children: TreeNode[];
    completionPercent: number;
  };
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const node of allNodes) {
    const filled = filledPerNode.get(node.id)?.size ?? 0;
    const percent =
      totalDims > 0 ? Math.round((filled / totalDims) * 100) : 0;
    nodeMap.set(node.id, {
      ...node,
      children: [],
      completionPercent: node.type === "file" ? percent : 0,
    });
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

  function calcFolderCompletion(node: TreeNode): number {
    if (node.type === "file") return node.completionPercent;
    if (node.children.length === 0) return 0;
    const sum = node.children.reduce(
      (acc, c) => acc + calcFolderCompletion(c),
      0,
    );
    node.completionPercent = Math.round(sum / node.children.length);
    return node.completionPercent;
  }
  roots.forEach(calcFolderCompletion);

  return roots;
}

export async function getNodeWithDimensions(nodeId: string) {
  const user = await requireAuth();

  const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
  if (!node) return null;

  await checkProjectAccess(user.id, node.projectId, "viewer");

  const records = await db
    .select({
      record: dimensionRecords,
      dimType: dimensionTypes,
    })
    .from(dimensionRecords)
    .innerJoin(
      dimensionTypes,
      eq(dimensionRecords.dimensionTypeId, dimensionTypes.id),
    )
    .where(eq(dimensionRecords.nodeId, nodeId));

  const versions = await db
    .select()
    .from(versionRecords)
    .where(eq(versionRecords.nodeId, nodeId))
    .orderBy(asc(versionRecords.createdAt));

  return { node, records, versions };
}

export async function getProjectDimensions(projectId: string) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  return db
    .select({
      config: projectDimensionConfigs,
      dimType: dimensionTypes,
    })
    .from(projectDimensionConfigs)
    .innerJoin(
      dimensionTypes,
      eq(projectDimensionConfigs.dimensionTypeId, dimensionTypes.id),
    )
    .where(
      and(
        eq(projectDimensionConfigs.projectId, projectId),
        eq(projectDimensionConfigs.enabled, true),
      ),
    )
    .orderBy(asc(projectDimensionConfigs.sortOrder));
}

export async function createNode(
  projectId: string,
  parentId: string | null,
  name: string,
  type: "folder" | "file" = "file",
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "editor");

    const parent = parentId
      ? (await db.select().from(nodes).where(eq(nodes.id, parentId)))[0]
      : null;

    const depth = parent ? parent.depth + 1 : 0;
    const path = parent
      ? parent.path
        ? `${parent.path}/${parent.id}`
        : parent.id
      : "";

    const siblings = parentId
      ? await db
          .select()
          .from(nodes)
          .where(
            and(
              eq(nodes.projectId, projectId),
              eq(nodes.parentId, parentId),
            ),
          )
      : await db
          .select()
          .from(nodes)
          .where(
            and(eq(nodes.projectId, projectId), isNull(nodes.parentId)),
          );

    const sortOrder = siblings.length;

    const [newNode] = await db
      .insert(nodes)
      .values({
        projectId,
        parentId,
        name,
        type,
        depth,
        sortOrder,
        path,
        createdBy: user.id,
      })
      .returning();

    logger.action("node.create", user.id, {
      projectId,
      nodeId: newNode.id,
      type,
    });
    revalidatePath(`/projects/${projectId}`);

    return actionSuccess({ id: newNode.id });
  } catch (error) {
    return actionError(error);
  }
}

export async function createDimensionRecord(
  nodeId: string,
  dimensionTypeId: number,
  content: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireAuth();

    const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
    if (!node)
      return actionError(new AppError("节点不存在", "blocking", "NOT_FOUND", 404));

    await checkProjectAccess(user.id, node.projectId, "editor");

    const [record] = await db
      .insert(dimensionRecords)
      .values({
        nodeId,
        dimensionTypeId,
        content,
        createdBy: user.id,
      })
      .returning();

    logger.action("dimension.create", user.id, {
      nodeId,
      dimensionTypeId,
    });
    revalidatePath(`/projects/${node.projectId}`);

    return actionSuccess({ id: record.id });
  } catch (error) {
    return actionError(error);
  }
}

export async function updateDimensionRecord(
  recordId: string,
  content: Record<string, unknown>,
  expectedVersion: number,
): Promise<ActionResult<{ id: string; version: number }>> {
  try {
    const user = await requireAuth();

    const [record] = await db
      .select()
      .from(dimensionRecords)
      .where(eq(dimensionRecords.id, recordId));

    if (!record)
      return actionError(
        new AppError("记录不存在", "blocking", "NOT_FOUND", 404),
      );

    const [node] = await db
      .select()
      .from(nodes)
      .where(eq(nodes.id, record.nodeId));
    if (node) await checkProjectAccess(user.id, node.projectId, "editor");

    // 乐观锁检查
    if (record.version !== expectedVersion) {
      return actionError(
        new AppError(
          "内容已被他人修改，请刷新后重试",
          "blocking",
          "VERSION_CONFLICT",
          409,
        ),
      );
    }

    const [updated] = await db
      .update(dimensionRecords)
      .set({
        content,
        version: record.version + 1,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(dimensionRecords.id, recordId))
      .returning();

    logger.action("dimension.update", user.id, {
      recordId,
      newVersion: updated.version,
    });

    if (node) revalidatePath(`/projects/${node.projectId}`);

    return actionSuccess({ id: updated.id, version: updated.version });
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteDimensionRecord(
  recordId: string,
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [record] = await db
      .select()
      .from(dimensionRecords)
      .where(eq(dimensionRecords.id, recordId));
    if (!record)
      return actionError(
        new AppError("记录不存在", "blocking", "NOT_FOUND", 404),
      );

    const [node] = await db
      .select()
      .from(nodes)
      .where(eq(nodes.id, record.nodeId));
    if (node) await checkProjectAccess(user.id, node.projectId, "editor");

    await db
      .delete(dimensionRecords)
      .where(eq(dimensionRecords.id, recordId));

    logger.action("dimension.delete", user.id, { recordId });

    if (node) revalidatePath(`/projects/${node.projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function renameNode(
  nodeId: string,
  newName: string,
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
    if (!node)
      return actionError(
        new AppError("节点不存在", "blocking", "NOT_FOUND", 404),
      );

    await checkProjectAccess(user.id, node.projectId, "editor");

    await db
      .update(nodes)
      .set({ name: newName, updatedBy: user.id, updatedAt: new Date() })
      .where(eq(nodes.id, nodeId));

    logger.action("node.rename", user.id, { nodeId, newName });
    revalidatePath(`/projects/${node.projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteNode(nodeId: string): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId));
    if (!node)
      return actionError(
        new AppError("节点不存在", "blocking", "NOT_FOUND", 404),
      );

    await checkProjectAccess(user.id, node.projectId, "editor");

    // CASCADE handles children and dimension_records
    await db.delete(nodes).where(eq(nodes.id, nodeId));

    logger.action("node.delete", user.id, {
      nodeId,
      projectId: node.projectId,
    });
    revalidatePath(`/projects/${node.projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}

export async function getFolderOverview(
  nodeId: string,
  projectId: string,
) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  const children = await db
    .select()
    .from(nodes)
    .where(
      and(eq(nodes.parentId, nodeId), eq(nodes.projectId, projectId)),
    )
    .orderBy(asc(nodes.sortOrder));

  const dimConfigs = await db
    .select()
    .from(projectDimensionConfigs)
    .where(
      and(
        eq(projectDimensionConfigs.projectId, projectId),
        eq(projectDimensionConfigs.enabled, true),
      ),
    );
  const totalDims = dimConfigs.length;

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
          completionPercent:
            totalDims > 0
              ? Math.round((uniqueDims.size / totalDims) * 100)
              : 0,
        };
      }
      const descendants = await db
        .select()
        .from(nodes)
        .where(
          and(eq(nodes.projectId, projectId), eq(nodes.type, "file")),
        );
      const childDescendants = descendants.filter((d) =>
        d.path.includes(child.id),
      );
      return {
        ...child,
        filledDimensions: childDescendants.length,
        totalDimensions: childDescendants.length,
        completionPercent: 0,
        childCount: childDescendants.length,
      };
    }),
  );

  return result;
}

export async function getCompetitiveRecords(projectId: string) {
  const user = await requireAuth();
  await checkProjectAccess(user.id, projectId, "viewer");

  const competitiveKeys = ["competitive_ref", "competitor"];

  const records = await db
    .select({
      nodeId: nodes.id,
      nodeName: nodes.name,
      nodePath: nodes.path,
      recordId: dimensionRecords.id,
      content: dimensionRecords.content,
    })
    .from(dimensionRecords)
    .innerJoin(nodes, eq(dimensionRecords.nodeId, nodes.id))
    .innerJoin(
      dimensionTypes,
      eq(dimensionRecords.dimensionTypeId, dimensionTypes.id),
    )
    .where(
      and(
        eq(nodes.projectId, projectId),
        inArray(dimensionTypes.key, competitiveKeys),
      ),
    );

  return records;
}

export async function updateNodeSortOrder(
  nodeId: string,
  newSortOrder: number,
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const [node] = await db
      .select()
      .from(nodes)
      .where(eq(nodes.id, nodeId));
    if (!node)
      return actionError(
        new AppError("节点不存在", "blocking", "NOT_FOUND", 404),
      );

    await checkProjectAccess(user.id, node.projectId, "editor");

    const siblings = node.parentId
      ? await db
          .select()
          .from(nodes)
          .where(
            and(
              eq(nodes.projectId, node.projectId),
              eq(nodes.parentId, node.parentId!),
            ),
          )
      : await db
          .select()
          .from(nodes)
          .where(
            and(
              eq(nodes.projectId, node.projectId),
              isNull(nodes.parentId),
            ),
          );

    const sorted = siblings.sort((a, b) => a.sortOrder - b.sortOrder);
    const oldIndex = sorted.findIndex((s) => s.id === nodeId);
    if (oldIndex === -1)
      return actionError(
        new AppError("节点未找到", "blocking", "NOT_FOUND", 404),
      );

    sorted.splice(oldIndex, 1);
    sorted.splice(newSortOrder, 0, node);

    // 事务：批量更新排序
    await db.transaction(async (tx) => {
      for (let i = 0; i < sorted.length; i++) {
        await tx
          .update(nodes)
          .set({ sortOrder: i })
          .where(eq(nodes.id, sorted[i].id));
      }
    });

    logger.action("node.reorder", user.id, { nodeId, newSortOrder });
    revalidatePath(`/projects/${node.projectId}`);

    return actionSuccess(undefined);
  } catch (error) {
    return actionError(error);
  }
}
