// ============================================================
// Add Task to Brain Dump — POST /api/braindump/[id]/tasks
// ============================================================
import { NextRequest } from "next/server";

import { apiNotFound, apiServerError, apiSuccess, apiUnauthorized } from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const { id } = await params;

    // Verify ownership
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: { memberships: { take: 1 } },
    });
    if (!user?.memberships[0]) return apiUnauthorized();

    const brainDump = await db.brainDump.findFirst({
      where: {
        id,
        workspaceId: user.memberships[0].workspaceId,
      },
      include: { tasks: { orderBy: { sortOrder: "desc" }, take: 1 } },
    });
    if (!brainDump) return apiNotFound("Brain Dump");

    const body = await request.json();
    const text = body.text?.trim();
    if (!text) {
      return new Response(JSON.stringify({ error: "El texto es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const maxOrder = brainDump.tasks[0]?.sortOrder ?? -1;

    const task = await db.task.create({
      data: {
        text,
        sortOrder: maxOrder + 1,
        status: "PENDING",
        brainDumpId: id,
      },
    });

    return apiSuccess(task, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
