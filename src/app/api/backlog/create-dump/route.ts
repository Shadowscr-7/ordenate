// ============================================================
// Backlog Create Dump API — Create brain dump from backlog tasks
// ============================================================
// POST /api/backlog/create-dump
// Body: { taskIds: string[], title: string, useAI?: boolean }
// ============================================================
import { NextRequest } from "next/server";

import { z } from "zod";

import { classifyTasks } from "@/lib/ai";
import {
  apiError,
  apiServerError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { apiLimiter, getClientIp } from "@/lib/rate-limit";

const createDumpFromBacklogSchema = z.object({
  taskIds: z.array(z.string()).min(1, "Debes seleccionar al menos una tarea"),
  title: z.string().min(1, "El título es requerido").max(200),
  useAI: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const { ok } = apiLimiter.check(getClientIp(request));
    if (!ok) return apiError("Demasiadas solicitudes. Intenta en un momento.", 429);

    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const body = await request.json();
    const parsed = createDumpFromBacklogSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { taskIds, title, useAI } = parsed.data;

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

    // Optional: AI classification
    let aiClassifications: { text: string; quadrant: string }[] = [];
    if (useAI) {
      try {
        const taskTexts = backlogTasks.map((t) => t.text);
        const classified = await classifyTasks(taskTexts);
        aiClassifications = classified.tasks;
      } catch (error) {
        console.error("[Backlog] AI classification error:", error);
        // Continue without AI classification
      }
    }

    // Prepare tasks
    const tasksToCreate = backlogTasks.map((backlogTask, index: number) => {
      // Use existing quadrant or AI classification
      let quadrant = backlogTask.quadrant;

      if (useAI && !quadrant) {
        const aiClassification = aiClassifications.find(
          (c) => c.text.toLowerCase().trim() === backlogTask.text.toLowerCase().trim(),
        );
        if (aiClassification) {
          quadrant = aiClassification.quadrant as
            | "Q1_DO"
            | "Q2_SCHEDULE"
            | "Q3_DELEGATE"
            | "Q4_DELETE";
        }
      }

      return {
        text: backlogTask.text,
        sortOrder: index,
        quadrant,
        status: "PENDING" as const,
      };
    });

    // Create brain dump with tasks
    const brainDump = await db.$transaction(async (tx) => {
      const dump = await tx.brainDump.create({
        data: {
          title,
          rawText: backlogTasks.map((t) => t.text).join("\n"),
          source: "WEB",
          status: "PROCESSED",
          workspaceId,
          tasks: {
            create: tasksToCreate,
          },
        },
        include: {
          tasks: true,
        },
      });

      // Mark backlog tasks as assigned
      await tx.backlogTask.updateMany({
        where: {
          id: { in: taskIds },
        },
        data: {
          status: "ASSIGNED",
        },
      });

      return dump;
    });

    return apiSuccess(
      {
        brainDump,
        taskCount: brainDump.tasks.length,
      },
      201,
    );
  } catch (error) {
    console.error("[Backlog Create Dump API] error:", error);
    return apiServerError(error);
  }
}
