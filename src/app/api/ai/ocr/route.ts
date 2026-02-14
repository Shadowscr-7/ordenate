// ============================================================
// AI OCR API — Extract text from uploaded image
// ============================================================
import { NextRequest } from "next/server";

import { z } from "zod";

import { extractTextFromImage } from "@/lib/ai";
import {
  apiError,
  apiServerError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { hasProAccess } from "@/lib/plan-gate";
import { aiLimiter, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  image: z.string().min(1, "La imagen es requerida"), // base64
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]).default("image/jpeg"),
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

    const result = await extractTextFromImage(parsed.data.image, parsed.data.mimeType);

    if (!result.text.trim()) {
      return apiError("No se pudo detectar texto en la imagen", 422);
    }

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return apiError("La funcionalidad de IA no está configurada", 503);
    }
    return apiServerError(error);
  }
}
