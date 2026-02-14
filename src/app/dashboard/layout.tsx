// ============================================================
// Dashboard Layout — Protected area with sidebar + header
// ============================================================
import { redirect } from "next/navigation";

import { getCurrentUser, getSession } from "@/lib/auth/actions";

import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // First check Supabase auth session
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // Then check Prisma DB record
  const user = await getCurrentUser();
  if (!user) {
    // Auth exists but no DB record — sign out to break the loop
    redirect("/api/auth/signout");
  }

  return (
    <AppShell userEmail={user.email} userName={user.name}>
      {children}
    </AppShell>
  );
}
