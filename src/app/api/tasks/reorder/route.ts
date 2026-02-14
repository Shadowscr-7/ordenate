// ============================================================
// Task Reorder API — Bulk update quadrant & sort order
// ============================================================
import { NextRequest } from "next/server";

import {
  apiServerError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { reorderTasksSchema } from "@/lib/validations";

// PATCH /api/tasks/reorder — bulk update quadrant + sortOrder
export async function PATCH(request: NextRequest) {
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
    const parsed = reorderTasksSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    // Verify all tasks belong to the user's workspace
    const taskIds = parsed.data.tasks.map((t) => t.id);
    const owned = await db.task.findMany({
      where: {
        id: { in: taskIds },
        brainDump: { workspaceId },
      },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((t) => t.id));
    const valid = parsed.data.tasks.filter((t) => ownedIds.has(t.id));

    // Batch update
    await db.$transaction(
      valid.map((t) =>
        db.task.update({
          where: { id: t.id },
          data: {
            sortOrder: t.sortOrder,
            ...(t.quadrant !== undefined && { quadrant: t.quadrant }),
          },
        }),
      ),
    );

    return apiSuccess({ updated: valid.length });
  } catch (error) {
    return apiServerError(error);
  }
}
