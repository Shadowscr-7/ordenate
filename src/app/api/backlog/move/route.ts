// ============================================================
// Backlog Move API — Move tasks to a brain dump
// ============================================================
// POST /api/backlog/move
// Body: { taskIds: string[], brainDumpId: string }
// ============================================================

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiValidationError,
  apiServerError,
} from "@/lib/api-response";
import { apiLimiter, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const moveTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, "Debes seleccionar al menos una tarea"),
  brainDumpId: z.string().min(1, "Brain dump ID es requerido"),
});

export async function POST(request: NextRequest) {
  try {
    const { ok } = apiLimiter.check(getClientIp(request));
    if (!ok) return apiError("Demasiadas solicitudes. Intenta en un momento.", 429);

    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const body = await request.json();
    const parsed = moveTasksSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { taskIds, brainDumpId } = parsed.data;

    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: {
        memberships: {
          include: { workspace: true },
          take: 1,
        },
      },
    });

    if (!user || !user.memberships[0]) {
      return apiUnauthorized();
    }

    const workspaceId = user.memberships[0].workspace.id;

    // Verify brain dump belongs to workspace
    const brainDump = await db.brainDump.findFirst({
      where: {
        id: brainDumpId,
        workspaceId,
      },
      include: {
        tasks: {
          orderBy: { sortOrder: "desc" },
          take: 1,
        },
      },
    });

    if (!brainDump) {
      return apiError("Brain dump no encontrado", 404);
    }

    // Get backlog tasks
    const backlogTasks = await db.backlogTask.findMany({
      where: {
        id: { in: taskIds },
        workspaceId,
        status: "PENDING",
      },
      orderBy: { createdAt: "asc" },
    });

    if (backlogTasks.length === 0) {
      return apiError("No se encontraron tareas válidas", 404);
    }

    // Calculate starting sortOrder
    const maxSortOrder = brainDump.tasks[0]?.sortOrder ?? 0;
    let nextSortOrder = maxSortOrder + 1;

    // Create tasks in brain dump
    const tasksToCreate = backlogTasks.map((backlogTask: any) => ({
      text: backlogTask.text,
      sortOrder: nextSortOrder++,
      quadrant: backlogTask.quadrant,
      status: "PENDING" as const,
      brainDumpId: brainDumpId,
    }));

    await db.$transaction([
      // Create tasks in brain dump
      db.task.createMany({
        data: tasksToCreate,
      }),
      // Mark backlog tasks as assigned
      db.backlogTask.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: {
          status: "ASSIGNED",
        },
      }),
    ]);

    return apiSuccess({
      success: true,
      movedCount: backlogTasks.length,
      brainDumpId,
    });
  } catch (error) {
    console.error("[Backlog Move API] error:", error);
    return apiServerError(error);
  }
}
