// ============================================================
// Categories API — CRUD para categorías de tareas
// ============================================================
import { NextRequest } from "next/server";

import { z } from "zod";

import {
  apiServerError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";

const createCategorySchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
});

// Helper: get workspaceId for current user
async function getWorkspaceId(authUserId: string) {
  const user = await db.user.findUnique({
    where: { authId: authUserId },
    include: { memberships: { take: 1 } },
  });
  return user?.memberships[0]?.workspaceId ?? null;
}

// GET /api/categories — listar categorías del workspace
export async function GET() {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const workspaceId = await getWorkspaceId(authUser.id);
    if (!workspaceId) return apiUnauthorized();

    const categories = await db.category.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
    });

    return apiSuccess(categories);
  } catch (error) {
    return apiServerError(error);
  }
}

// POST /api/categories — crear categoría (o devolver existente)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const workspaceId = await getWorkspaceId(authUser.id);
    if (!workspaceId) return apiUnauthorized();

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    // Upsert: si ya existe, devolver la existente
    const category = await db.category.upsert({
      where: {
        workspaceId_name: {
          workspaceId,
          name: parsed.data.name.trim(),
        },
      },
      update: {},
      create: {
        name: parsed.data.name.trim(),
        workspaceId,
      },
    });

    return apiSuccess(category);
  } catch (error) {
    return apiServerError(error);
  }
}
