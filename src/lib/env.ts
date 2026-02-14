// ============================================================
// Environment validation — Zod schemas
// ============================================================
// Server env vars are validated at runtime when imported.
// Client env vars are exposed via NEXT_PUBLIC_ prefix only.
// NEVER import this file from client components.
// ============================================================

import { z } from "zod";

// --- Server-only environment variables ---
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),

  // Phase 3
  OPENAI_API_KEY: z.string().optional(),

  // Phase 5
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Phase 4
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Storage
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
});

// --- Client environment variables (NEXT_PUBLIC_) ---
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

// --- Lazy validation — only validates when first accessed ---
function createEnvProxy<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  getter: () => Record<string, unknown>,
): T {
  let parsed: T | null = null;
  return new Proxy({} as T, {
    get(_, prop: string) {
      if (!parsed) {
        parsed = schema.parse(getter()) as T;
      }
      return parsed[prop];
    },
  });
}

export const serverEnv = createEnvProxy(serverSchema, () => process.env);

export const clientEnv = createEnvProxy(clientSchema, () => ({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
}));
