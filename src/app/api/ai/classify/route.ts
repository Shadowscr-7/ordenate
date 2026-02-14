// ============================================================
// AI Classify API — Suggest Eisenhower quadrants for tasks
// ============================================================
import { NextRequest } from "next/server";

import { z } from "zod";

import { classifyTasks } from "@/lib/ai";
import {
  apiError,
  apiServerError,
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/api-response";
import { getSession } from "@/lib/auth/actions";
import { aiLimiter, getClientIp } from "@/lib/rate-limit";

const classifyInputSchema = z.object({
  text: z.string().min(1).max(1000),
  priority: z.string().nullable().optional(),
  feeling: z.string().nullable().optional(),
  estimatedValue: z.number().nullable().optional(),
  estimatedUnit: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

const schema = z.object({
  tasks: z
    .union([z.array(z.string().min(1).max(1000)), z.array(classifyInputSchema)])
    .refine((arr) => arr.length >= 1 && arr.length <= 100, {
      message: "Se requiere entre 1 y 100 tareas",
    }),
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

    const result = await classifyTasks(parsed.data.tasks);

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return apiError("La funcionalidad de IA no está configurada", 503);
    }
    return apiServerError(error);
  }
}
