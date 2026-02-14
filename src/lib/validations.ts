// ============================================================
// API Validation Schemas — Zod
// ============================================================
// Shared validation schemas used across API routes.
// ============================================================

import { z } from "zod";

// ─── Auth ───────────────────────────────────────────────────

export const signUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  name: z.string().min(1, "Nombre requerido").max(100),
});

export const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

// ─── Brain Dump ─────────────────────────────────────────────

export const createBrainDumpSchema = z.object({
  title: z.string().max(200).optional(),
  rawText: z.string().min(1, "El texto no puede estar vacío").max(50000),
  source: z.enum(["WEB", "IMAGE", "TELEGRAM", "WHATSAPP"]).default("WEB"),
});

// ─── Task ───────────────────────────────────────────────────

export const updateTaskSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  quadrant: z.enum(["Q1_DO", "Q2_SCHEDULE", "Q3_DELEGATE", "Q4_DELETE"]).optional(),
  isPareto: z.boolean().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "HIDDEN"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int().min(0),
      quadrant: z.enum(["Q1_DO", "Q2_SCHEDULE", "Q3_DELEGATE", "Q4_DELETE"]).optional(),
    }),
  ),
});

// ─── Types ──────────────────────────────────────────────────

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateBrainDumpInput = z.infer<typeof createBrainDumpSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
