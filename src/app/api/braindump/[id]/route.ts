// ============================================================
// Brain Dump Detail API — Get, Update, Delete a brain dump
// ============================================================

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiServerError,
} from "@/lib/api-response";

async function getUserWorkspaceId(authUserId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { authId: authUserId },
    include: {
      memberships: { take: 1 },
    },
  });
  return user?.memberships[0]?.workspaceId ?? null;
}

// GET /api/braindump/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const { id } = await params;
    const workspaceId = await getUserWorkspaceId(authUser.id);
    if (!workspaceId) return apiUnauthorized();

    const brainDump = await db.brainDump.findFirst({
      where: { id, workspaceId },
      include: {
        tasks: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!brainDump) return apiNotFound("Brain Dump");

    return apiSuccess(brainDump);
  } catch (error) {
    return apiServerError(error);
  }
}

// PATCH /api/braindump/[id] — Update status or title
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const { id } = await params;
    const workspaceId = await getUserWorkspaceId(authUser.id);
    if (!workspaceId) return apiUnauthorized();

    const existing = await db.brainDump.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) return apiNotFound("Brain Dump");

    const body = await request.json();
    const updated = await db.brainDump.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: {
        tasks: { orderBy: { sortOrder: "asc" } },
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    return apiServerError(error);
  }
}

// DELETE /api/braindump/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const { id } = await params;
    const workspaceId = await getUserWorkspaceId(authUser.id);
    if (!workspaceId) return apiUnauthorized();

    const existing = await db.brainDump.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) return apiNotFound("Brain Dump");

    await db.brainDump.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
