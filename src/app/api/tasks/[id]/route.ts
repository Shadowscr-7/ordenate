// ============================================================
// Task API — Update or Delete a single task
// ============================================================

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import { updateTaskSchema } from "@/lib/validations";
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiServerError,
} from "@/lib/api-response";

async function verifyTaskOwnership(authUserId: string, taskId: string) {
  const user = await db.user.findUnique({
    where: { authId: authUserId },
    include: {
      memberships: { take: 1 },
    },
  });
  if (!user?.memberships[0]) return null;

  const task = await db.task.findFirst({
    where: {
      id: taskId,
      brainDump: {
        workspaceId: user.memberships[0].workspaceId,
      },
    },
  });
  return task;
}

// PATCH /api/tasks/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const { id } = await params;
    const task = await verifyTaskOwnership(authUser.id, id);
    if (!task) return apiNotFound("Tarea");

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const updateData: Record<string, unknown> = {};
    if (parsed.data.text !== undefined) updateData.text = parsed.data.text;
    if (parsed.data.quadrant !== undefined) updateData.quadrant = parsed.data.quadrant;
    if (parsed.data.isPareto !== undefined) updateData.isPareto = parsed.data.isPareto;
    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
      if (parsed.data.status === "DONE") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;
    if (parsed.data.dueDate !== undefined) updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
    if (parsed.data.feeling !== undefined) updateData.feeling = parsed.data.feeling;
    if (parsed.data.estimatedValue !== undefined) updateData.estimatedValue = parsed.data.estimatedValue;
    if (parsed.data.estimatedUnit !== undefined) updateData.estimatedUnit = parsed.data.estimatedUnit;
    if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;
    if (parsed.data.responsible !== undefined) updateData.responsible = parsed.data.responsible;
    if (parsed.data.leaderDecision !== undefined) updateData.leaderDecision = parsed.data.leaderDecision;

    const updated = await db.task.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess(updated);
  } catch (error) {
    return apiServerError(error);
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const { id } = await params;
    const task = await verifyTaskOwnership(authUser.id, id);
    if (!task) return apiNotFound("Tarea");

    await db.task.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
