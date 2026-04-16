"use server";

import { db } from "@/db";
import { nodes, dimensionRecords } from "@/db/schema";
import { eq, and, isNull, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { checkProjectAccess } from "@/services/permission.service";
import { logger } from "@/lib/logger";
import { type ActionResult, actionError, actionSuccess, AppError } from "@/lib/errors";
import { logActivity } from "./activity-log";

// ─── Types ───────────────────────────────────────────

export interface ParsedFile {
  path: string;
  name: string;
  format: "markdown" | "csv" | "text";
  content: string;
  size: number;
  rows?: number;
  columns?: number;
}

export interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  format?: string;
  children?: FileTreeNode[];
}

export interface UploadResult {
  files: ParsedFile[];
  tree: FileTreeNode;
}

export interface ImportItem {
  fileName: string;
  content: string;
  targetNodeId: string; // parent module node id
  nodeName: string;
  dimensionTypeId?: number; // which dimension to populate with content
}

// ─── Upload Zip (calls FastAPI) ──────────────────────

export async function uploadZip(
  formData: FormData,
): Promise<ActionResult<UploadResult>> {
  try {
    const user = await requireAuth();
    const file = formData.get("file") as File | null;

    if (!file) {
      return actionError(
        new AppError("请选择文件", "blocking", "VALIDATION_ERROR", 400),
      );
    }

    const apiBase = process.env.API_URL ?? "http://localhost:8001";
    const res = await fetch(`${apiBase}/api/import/upload`, {
      method: "POST",
      body: (() => {
        const fd = new FormData();
        fd.append("file", file);
        return fd;
      })(),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: "上传失败" }));
      return actionError(
        new AppError(
          body.detail || "上传失败",
          "blocking",
          "UPLOAD_FAILED",
          res.status,
        ),
      );
    }

    const data: UploadResult = await res.json();

    logger.action("import.upload", user.id, {
      fileCount: data.files.length,
    });

    return actionSuccess(data);
  } catch (error) {
    return actionError(error);
  }
}

// ─── Confirm Import (batch create nodes + dimension records) ──

export async function confirmImport(
  projectId: string,
  items: ImportItem[],
): Promise<ActionResult<{ imported: number; errors: string[] }>> {
  try {
    const user = await requireAuth();
    await checkProjectAccess(user.id, projectId, "editor");

    if (!items.length) {
      return actionError(
        new AppError("没有要导入的项目", "blocking", "VALIDATION_ERROR", 400),
      );
    }

    const errors: string[] = [];
    let importedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        // Resolve parent node
        const [parent] = await db
          .select()
          .from(nodes)
          .where(eq(nodes.id, item.targetNodeId));

        if (!parent) {
          errors.push(`"${item.nodeName}": 目标模块不存在`);
          continue;
        }

        // Calculate depth and path
        const depth = parent.depth + 1;
        const path = parent.path
          ? `${parent.path}/${parent.id}`
          : parent.id;

        // Calculate sort order
        const siblings = await db
          .select()
          .from(nodes)
          .where(
            and(
              eq(nodes.projectId, projectId),
              eq(nodes.parentId, item.targetNodeId),
            ),
          );
        const sortOrder = siblings.length;

        // Insert node
        const [newNode] = await db
          .insert(nodes)
          .values({
            projectId,
            parentId: item.targetNodeId,
            name: item.nodeName,
            type: "file",
            depth,
            sortOrder,
            path,
            createdBy: user.id,
          })
          .returning();

        // If dimensionTypeId provided, create a dimension record with the content
        if (item.dimensionTypeId && item.content) {
          await db.insert(dimensionRecords).values({
            nodeId: newNode.id,
            dimensionTypeId: item.dimensionTypeId,
            content: { text: item.content },
            createdBy: user.id,
          });
        }

        importedCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "未知错误";
        errors.push(`"${item.nodeName}": ${msg}`);
      }
    }

    logger.action("import.confirm", user.id, {
      projectId,
      importedCount,
      errorCount: errors.length,
    });
    logActivity({ projectId, userId: user.id, actionType: "import", targetType: "node", targetId: projectId, summary: `批量导入${importedCount}个功能项`, metadata: { importedCount, errorCount: errors.length } });
    revalidatePath(`/projects/${projectId}`);

    return actionSuccess({ imported: importedCount, errors });
  } catch (error) {
    return actionError(error);
  }
}
