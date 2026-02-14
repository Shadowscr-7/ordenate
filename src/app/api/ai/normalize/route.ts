// ============================================================
// AI Normalize API — Convert raw text into clean task list
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/actions";
import { normalizeText } from "@/lib/ai";
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiError,
  apiServerError,
} from "@/lib/api-response";

const schema = z.object({
  rawText: z.string().min(1, "El texto no puede estar vacío").max(50000),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

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
