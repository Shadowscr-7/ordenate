// ============================================================
// Pareto Tasks API — Fetch tasks for Pareto focus view
// ============================================================
import { NextRequest } from "next/server";

import { apiServerError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";

// GET /api/pareto — get all non-hidden tasks with Pareto info
export async function GET(_request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: { memberships: { take: 1 } },
    });
    const workspaceId = user?.memberships[0]?.workspaceId;
    if (!workspaceId) return apiUnauthorized();

    const tasks = await db.task.findMany({
      where: {
        brainDump: { workspaceId },
        status: { not: "HIDDEN" },
      },
      orderBy: [{ isPareto: "desc" }, { sortOrder: "asc" }],
      include: {
        brainDump: {
          select: { id: true, title: true },
        },
      },
    });

    return apiSuccess(tasks);
  } catch (error) {
    return apiServerError(error);
  }
}
