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
  useAI: z.boolean().default(false),
});

// ─── Task ───────────────────────────────────────────────────

export const updateTaskSchema = z.object({
  text: z.string().min(1).max(1000).optional(),
  quadrant: z.enum(["Q1_DO", "Q2_SCHEDULE", "Q3_DELEGATE", "Q4_DELETE"]).nullable().optional(),
  isPareto: z.boolean().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "HIDDEN"]).optional(),
  sortOrder: z.number().int().min(0).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(["ALTA", "MEDIA", "BAJA"]).nullable().optional(),
  feeling: z.enum(["MUST_DO", "WANT_TO", "DONT_CARE", "LAZY"]).nullable().optional(),
  estimatedValue: z.number().int().min(1).nullable().optional(),
  estimatedUnit: z.enum(["MINUTES", "HOURS", "DAYS"]).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  responsible: z.string().max(150).nullable().optional(),
  leaderDecision: z.string().max(500).nullable().optional(),
});

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int().min(0),
      quadrant: z.enum(["Q1_DO", "Q2_SCHEDULE", "Q3_DELEGATE", "Q4_DELETE"]).nullable().optional(),
    }),
  ),
});

// ─── Types ──────────────────────────────────────────────────

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateBrainDumpInput = z.infer<typeof createBrainDumpSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
