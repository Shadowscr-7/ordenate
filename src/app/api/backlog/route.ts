// ============================================================
// Backlog API — Manage backlog tasks (Jira-style)
// ============================================================
// GET    /api/backlog         → List all backlog tasks
// POST   /api/backlog         → Create new backlog task
// DELETE /api/backlog?id=xxx  → Delete a backlog task
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

// ─── GET: List backlog tasks ─────────────────────────────────

export async function GET(_request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

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

    const backlogTasks = await db.backlogTask.findMany({
      where: {
        workspaceId,
        status: "PENDING",
      },
      orderBy: [
        { createdAt: "desc" },
      ],
    });

    return apiSuccess({
      tasks: backlogTasks,
      count: backlogTasks.length,
    });
  } catch (error) {
    console.error("[Backlog API] GET error:", error);
    return apiServerError(error);
  }
}

// ─── POST: Create backlog task ───────────────────────────────

const createBacklogTaskSchema = z.object({
  text: z.string().min(1).max(2000),
  source: z.enum(["MANUAL", "TELEGRAM", "WEB", "IMPORT"]).default("WEB"),
  quadrant: z.enum(["Q1_DO", "Q2_SCHEDULE", "Q3_DELEGATE", "Q4_DELETE"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { ok } = apiLimiter.check(getClientIp(request));
    if (!ok) return apiError("Demasiadas solicitudes. Intenta en un momento.", 429);

    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const body = await request.json();
    const parsed = createBacklogTaskSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { text, source, quadrant } = parsed.data;

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

    const backlogTask = await db.backlogTask.create({
      data: {
        text,
        source,
        quadrant,
        workspaceId,
      },
    });

    return apiSuccess(backlogTask, 201);
  } catch (error) {
    console.error("[Backlog API] POST error:", error);
    return apiServerError(error);
  }
}

// ─── DELETE: Remove backlog task ─────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("id");

    if (!taskId) {
      return apiError("Missing task ID", 400);
    }

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

    // Verify task belongs to user's workspace
    const task = await db.backlogTask.findFirst({
      where: {
        id: taskId,
        workspaceId,
      },
    });

    if (!task) {
      return apiError("Tarea no encontrada", 404);
    }

    await db.backlogTask.delete({
      where: { id: taskId },
    });

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("[Backlog API] DELETE error:", error);
    return apiServerError(error);
  }
}
