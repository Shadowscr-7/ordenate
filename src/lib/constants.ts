// ============================================================
// App Constants
// ============================================================

export const APP_NAME = "Ordénate";
export const APP_DESCRIPTION = "Tu mente, en orden — Sistema de Priorización Inteligente con IA";

export const ROUTES = {
  // Public
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  AUTH_CALLBACK: "/auth/callback",

  // Protected
  DASHBOARD: "/dashboard",
  NEW_DUMP: "/dashboard/new",
  BRAIN_DUMP: (id: string) => `/dashboard/dump/${id}` as const,
  BACKLOG: "/dashboard/backlog",
  EISENHOWER: "/dashboard/eisenhower",
  PARETO: "/dashboard/pareto",
  HISTORY: "/dashboard/history",
  SETTINGS: "/dashboard/settings",
} as const;

export const KEYBOARD_SHORTCUTS = {
  NEW_DUMP: "n",
  COMMAND_PALETTE: "k",
  MARK_DONE: "d",
  QUADRANT_1: "1",
  QUADRANT_2: "2",
  QUADRANT_3: "3",
  QUADRANT_4: "4",
} as const;
