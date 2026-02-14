// ============================================================
// AI Normalize API — Convert raw text into clean task list
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/actions";
import { normalizeText } from "@/lib/ai";
import { hasProAccess } from "@/lib/plan-gate";
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiError,
  apiServerError,
} from "@/lib/api-response";
import { aiLimiter, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  rawText: z.string().min(1, "El texto no puede estar vacío").max(50000),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!aiLimiter.check(ip)) {
      return apiError("Demasiadas solicitudes. Intenta de nuevo más tarde.", 429);
    }

    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    // Pro-only feature
    const user = await db.user.findUnique({
      where: { authId: authUser.id },
      include: { memberships: { take: 1 } },
    });
    const workspaceId = user?.memberships[0]?.workspaceId;
    if (!workspaceId) return apiUnauthorized();
    const gate = await hasProAccess(workspaceId);
    if (!gate.allowed) return apiError(gate.reason ?? "Requiere plan Pro", 403);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await normalizeText(parsed.data.rawText);

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return apiError("La funcionalidad de IA no está configurada", 503);
    }
    return apiServerError(error);
  }
}
