// ============================================================
// Settings Page — Profile + Billing
// ============================================================
import { Suspense } from "react";

import { Loader2 } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/actions";

import { BillingPanel } from "@/components/billing/billing-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Configuración",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const workspace = user?.memberships[0]?.workspace;

  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu cuenta y suscripción.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Tu información de cuenta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Nombre</p>
            <p className="text-muted-foreground text-sm">{user?.name ?? "—"}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium">Workspace</p>
            <p className="text-muted-foreground text-sm">{workspace?.name ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            </CardContent>
          </Card>
        }
      >
        <BillingPanel />
      </Suspense>
    </div>
  );
}
