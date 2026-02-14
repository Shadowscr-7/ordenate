// ============================================================
// AI Pareto API — Suggest vital 20% of tasks
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/actions";
import { suggestPareto } from "@/lib/ai";
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiError,
  apiServerError,
} from "@/lib/api-response";
import { aiLimiter, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  tasks: z
    .array(
      z.object({
        text: z.string().min(1),
        quadrant: z.string().nullable(),
      }),
    )
    .min(1, "Se requiere al menos una tarea")
    .max(100),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!aiLimiter.check(ip)) {
      return apiError("Demasiadas solicitudes. Intenta de nuevo más tarde.", 429);
    }

    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await suggestPareto(parsed.data.tasks);

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return apiError("La funcionalidad de IA no está configurada", 503);
    }
    return apiServerError(error);
  }
}
