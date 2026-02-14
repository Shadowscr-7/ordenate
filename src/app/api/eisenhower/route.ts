// ============================================================
// Eisenhower Tasks API — All tasks for the board
// ============================================================

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import {
  apiSuccess,
  apiUnauthorized,
  apiServerError,
} from "@/lib/api-response";

// GET /api/eisenhower — get all non-hidden tasks grouped for the board
export async function GET(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: { memberships: { take: 1 } },
    });
    const workspaceId = user?.memberships[0]?.workspaceId;
    if (!workspaceId) return apiUnauthorized();

    // Optional filter by brain dump
    const { searchParams } = new URL(request.url);
    const brainDumpId = searchParams.get("brainDumpId");

    const tasks = await db.task.findMany({
      where: {
        brainDump: { workspaceId },
        status: { not: "HIDDEN" },
        ...(brainDumpId ? { brainDumpId } : {}),
      },
      orderBy: { sortOrder: "asc" },
      include: {
        brainDump: {
          select: { id: true, title: true },
        },
        category: { select: { id: true, name: true } },
      },
    });

    return apiSuccess(tasks);
  } catch (error) {
    return apiServerError(error);
  }
}
