// ============================================================
// Create Brain Dump from Pending Tasks
// ============================================================
import { NextRequest } from "next/server";

import { apiError, apiServerError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";

// POST /api/braindump/from-pending — create dump with pending tasks from other dumps
export async function POST(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: { memberships: { take: 1 } },
    });
    const workspaceId = user?.memberships[0]?.workspaceId;
    if (!workspaceId) return apiUnauthorized();

    const body = await request.json();
    const { title, sourceDumpIds } = body;

    if (!title || !Array.isArray(sourceDumpIds) || sourceDumpIds.length === 0) {
      return apiError("title and sourceDumpIds are required", 400);
    }

    // Fetch pending tasks from source dumps
    const pendingTasks = await db.task.findMany({
      where: {
        brainDumpId: { in: sourceDumpIds },
        brainDump: { workspaceId },
        status: { notIn: ["DONE", "HIDDEN"] },
      },
      orderBy: { createdAt: "asc" },
    });

    if (pendingTasks.length === 0) {
      return apiError("No pending tasks found in selected dumps", 400);
    }

    // Create new dump with copied tasks
    const newDump = await db.brainDump.create({
      data: {
        title,
        workspaceId,
        source: "WEB",
        status: "DRAFT",
        tasks: {
          create: pendingTasks.map((task, index) => ({
            text: task.text,
            sortOrder: index,
            status: task.status,
            quadrant: task.quadrant,
            isPareto: task.isPareto,
            priority: task.priority,
            feeling: task.feeling,
            estimatedValue: task.estimatedValue,
            estimatedUnit: task.estimatedUnit,
            responsible: task.responsible,
            leaderDecision: task.leaderDecision,
            dueDate: task.dueDate,
            categoryId: task.categoryId,
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    return apiSuccess(newDump);
  } catch (error) {
    return apiServerError(error);
  }
}
