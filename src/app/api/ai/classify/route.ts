// ============================================================
// AI Classify API — Suggest Eisenhower quadrants for tasks
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/actions";
import { classifyTasks } from "@/lib/ai";
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiError,
  apiServerError,
} from "@/lib/api-response";

const schema = z.object({
  tasks: z
    .array(z.string().min(1).max(1000))
    .min(1, "Se requiere al menos una tarea")
    .max(100, "Máximo 100 tareas por request"),
});

export async function POST(request: NextRequest) {
  try {
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
