// ============================================================
// App-wide Type Definitions
// ============================================================

export type EisenhowerQuadrant = "Q1_DO" | "Q2_SCHEDULE" | "Q3_DELEGATE" | "Q4_DELETE";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "HIDDEN";

export type TaskPriority = "ALTA" | "MEDIA" | "BAJA";

export type TaskFeeling = "MUST_DO" | "WANT_TO" | "DONT_CARE" | "LAZY";

export type TimeUnit = "MINUTES" | "HOURS" | "DAYS";

export type BrainDumpStatus = "DRAFT" | "PROCESSING" | "PROCESSED" | "ERROR" | "ARCHIVED";

export type BrainDumpSource = "WEB" | "IMAGE" | "TELEGRAM" | "WHATSAPP";

export type SubscriptionPlan = "BASIC" | "PRO";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

// ─── Eisenhower Quadrant Metadata ───────────────────────────

export const QUADRANT_META: Record<
  EisenhowerQuadrant,
  { label: string; description: string; color: string; icon: string }
> = {
  Q1_DO: {
    label: "Urgente e Importante",
    description: "Acción inmediata requerida",
    color: "text-red-500",
    icon: "🔴",
  },
  Q2_SCHEDULE: {
    label: "No urgente pero importante",
    description: "Planificar para después",
    color: "text-blue-500",
    icon: "🔵",
  },
  Q3_DELEGATE: {
    label: "Urgente pero no importante",
    description: "Delegar si es posible",
    color: "text-yellow-500",
    icon: "🟡",
  },
  Q4_DELETE: {
    label: "No es urgente ni importante",
    description: "Considerar eliminar",
    color: "text-neutral-400",
    icon: "⚪",
  },
};

// ─── Priority Metadata ──────────────────────────────────────

export const PRIORITY_META: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  ALTA: { label: "Alta", color: "text-red-500", bg: "bg-red-500" },
  MEDIA: { label: "Media", color: "text-amber-500", bg: "bg-amber-500" },
  BAJA: { label: "Baja", color: "text-green-500", bg: "bg-green-500" },
};

// ─── Feeling Metadata ───────────────────────────────────────

export const FEELING_META: Record<TaskFeeling, { label: string; emoji: string }> = {
  MUST_DO: { label: "Lo tengo que hacer sí o sí", emoji: "😤" },
  WANT_TO: { label: "Quiero hacerlo", emoji: "😊" },
  DONT_CARE: { label: "Me da igual", emoji: "😐" },
  LAZY: { label: "Me da fiaca", emoji: "😴" },
};

// ─── Time Unit Metadata ─────────────────────────────────────

export const TIME_UNIT_META: Record<TimeUnit, { label: string; labelPlural: string }> = {
  MINUTES: { label: "minuto", labelPlural: "minutos" },
  HOURS: { label: "hora", labelPlural: "horas" },
  DAYS: { label: "día", labelPlural: "días" },
};

// ─── Eisenhower Task Status (for board) ─────────────────────

export const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "text-muted-foreground" },
  IN_PROGRESS: { label: "En Curso", color: "text-blue-500" },
  DONE: { label: "Finalizado", color: "text-green-500" },
  HIDDEN: { label: "Oculta", color: "text-neutral-400" },
};

// ─── Plan Limits ────────────────────────────────────────────

export const PLAN_LIMITS: Record<SubscriptionPlan, { maxDumpsPerMonth: number; features: string[] }> = {
  BASIC: {
    maxDumpsPerMonth: 10,
    features: ["Brain Dumps de texto", "Tablero Eisenhower"],
  },
  PRO: {
    maxDumpsPerMonth: Infinity,
    features: [
      "Brain Dumps ilimitados",
      "Tablero Eisenhower",
      "Vista Pareto",
      "Google Calendar",
      "Bots (Telegram/WhatsApp)",
      "Soporte prioritario",
    ],
  },
};
