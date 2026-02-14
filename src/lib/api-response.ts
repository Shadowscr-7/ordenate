// ============================================================
// API Response Helpers
// ============================================================

import { NextResponse } from "next/server";
import { type ZodError } from "zod";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiValidationError(error: ZodError) {
  const formatted = error.issues.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));

  return NextResponse.json(
    { success: false, error: "Validation error", details: formatted },
    { status: 422 },
  );
}

export function apiUnauthorized() {
  return apiError("No autorizado", 401);
}

export function apiNotFound(entity = "Recurso") {
  return apiError(`${entity} no encontrado`, 404);
}

export function apiServerError(error: unknown) {
  console.error("[API Error]", error);
  return apiError("Error interno del servidor", 500);
}
