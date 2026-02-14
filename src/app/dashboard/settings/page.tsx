// ============================================================
// Settings Page — Placeholder
// ============================================================

import { Settings } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Configuración",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const workspace = user?.memberships[0]?.workspace;
  const subscription = workspace?.subscription;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu cuenta y suscripción.
        </p>
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
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Suscripción
            <Badge variant={subscription?.plan === "PRO" ? "default" : "secondary"}>
              {subscription?.plan ?? "BASIC"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Tu plan actual y estado de suscripción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Estado</p>
            <p className="text-muted-foreground text-sm">{subscription?.status ?? "ACTIVE"}</p>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium">Workspace</p>
            <p className="text-muted-foreground text-sm">{workspace?.name ?? "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
