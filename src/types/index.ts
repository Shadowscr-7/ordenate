// ============================================================
// App-wide Type Definitions
// ============================================================

export type EisenhowerQuadrant = "Q1_DO" | "Q2_SCHEDULE" | "Q3_DELEGATE" | "Q4_DELETE";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "HIDDEN";

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
    label: "Hacer",
    description: "Urgente e Importante",
    color: "text-red-500",
    icon: "🔴",
  },
  Q2_SCHEDULE: {
    label: "Planificar",
    description: "No Urgente pero Importante",
    color: "text-blue-500",
    icon: "🔵",
  },
  Q3_DELEGATE: {
    label: "Delegar",
    description: "Urgente pero No Importante",
    color: "text-yellow-500",
    icon: "🟡",
  },
  Q4_DELETE: {
    label: "Eliminar",
    description: "No Urgente ni Importante",
    color: "text-neutral-400",
    icon: "⚪",
  },
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
