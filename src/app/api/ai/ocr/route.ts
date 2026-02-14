// ============================================================
// AI OCR API — Extract text from uploaded image
// ============================================================

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/actions";
import { extractTextFromImage } from "@/lib/ai";
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiError,
  apiServerError,
} from "@/lib/api-response";

const schema = z.object({
  image: z.string().min(1, "La imagen es requerida"), // base64
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/gif"])
    .default("image/jpeg"),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await getSession();
    if (!authUser) return apiUnauthorized();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await extractTextFromImage(
      parsed.data.image,
      parsed.data.mimeType,
    );

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
