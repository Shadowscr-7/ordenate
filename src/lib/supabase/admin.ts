// ============================================================
// Supabase Client — Admin (Service Role)
// ============================================================
// ⚠️  NEVER import this in client components!
// Uses service_role key — bypasses RLS.
// Only use for server-side admin operations.
// ============================================================
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
