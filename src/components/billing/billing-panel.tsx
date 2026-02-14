// ============================================================
// Billing Panel — Client component for subscription management
// ============================================================

"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import {
  AlertTriangle,
  Calendar,
  Check,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SubscriptionInfo {
  plan: "BASIC" | "PRO";
  status: string;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  dumpsThisMonth: number;
  dumpsLimit: number | null;
}

const STATUS_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  ACTIVE: { label: "Activa", variant: "default" },
  PAST_DUE: { label: "Pago pendiente", variant: "destructive" },
  CANCELED: { label: "Cancelada", variant: "secondary" },
  TRIALING: { label: "Prueba", variant: "outline" },
  INCOMPLETE: { label: "Incompleta", variant: "destructive" },
};

const PLAN_FEATURES: Record<string, string[]> = {
  BASIC: ["10 Brain Dumps al mes", "Tablero Eisenhower", "Vista Pareto", "Historial de 30 días"],
  PRO: [
    "Brain Dumps ilimitados",
    "Tablero Eisenhower",
    "Vista Pareto avanzada",
    "Procesamiento con IA",
    "Bot Telegram + WhatsApp",
    "Google Calendar sync",
    "Soporte prioritario",
  ],
};

export function BillingPanel() {
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "success") {
      toast.success("¡Suscripción activada con éxito! 🎉");
      window.history.replaceState({}, "", "/dashboard/settings");
      setTimeout(() => fetchSubscription(), 2000);
    } else if (checkoutStatus === "canceled") {
      toast.error("Pago cancelado. Puedes intentarlo de nuevo.");
      window.history.replaceState({}, "", "/dashboard/settings");
    }
  }, [searchParams]);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/stripe/subscription");
      if (res.ok) {
        const { data } = await res.json();
        setSub(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function startCheckout(plan: "BASIC" | "PRO") {
    setActionLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { data, error } = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(error ?? "Error al crear la sesión de pago.");
      }
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setActionLoading(null);
    }
  }

  async function openPortal() {
    setActionLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });
      const { data, error } = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error(error ?? "Error al abrir el portal.");
      }
    } catch {
      toast.error("Error de conexión.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!sub) return null;

  const isPro = sub.plan === "PRO";
  const hasStripe = !!sub.stripeSubId;
  const statusInfo = STATUS_LABELS[sub.status] ?? STATUS_LABELS.ACTIVE;
  const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;

  return (
    <div className="space-y-4">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPro ? (
              <Crown className="h-5 w-5 text-amber-500" />
            ) : (
              <Zap className="h-5 w-5 text-blue-500" />
            )}
            Plan {sub.plan}
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            {sub.cancelAtPeriodEnd && (
              <Badge variant="destructive" className="text-[10px]">
                Se cancela al final del período
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isPro
              ? "Acceso completo a todas las funcionalidades"
              : "Plan básico con funcionalidades esenciales"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Features list */}
          <div className="grid grid-cols-2 gap-1.5">
            {PLAN_FEATURES[sub.plan].map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-sm">
                <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Usage */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Brain Dumps este mes</p>
              <p className="text-muted-foreground text-xs">
                {sub.dumpsLimit
                  ? `${sub.dumpsThisMonth} de ${sub.dumpsLimit} usados`
                  : `${sub.dumpsThisMonth} creados (ilimitados)`}
              </p>
            </div>
            {sub.dumpsLimit && (
              <div className="flex items-center gap-2">
                <div className="bg-muted h-2 w-24 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all ${
                      sub.dumpsThisMonth >= sub.dumpsLimit ? "bg-red-500" : "bg-primary"
                    }`}
                    style={{
                      width: `${Math.min((sub.dumpsThisMonth / sub.dumpsLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span
                  className={`font-mono text-xs ${sub.dumpsThisMonth >= sub.dumpsLimit ? "text-red-500" : ""}`}
                >
                  {sub.dumpsThisMonth}/{sub.dumpsLimit}
                </span>
              </div>
            )}
          </div>

          {/* Period info */}
          {periodEnd && hasStripe && (
            <>
              <Separator />
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                {sub.cancelAtPeriodEnd
                  ? `Tu plan se cancela el ${periodEnd.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
                  : `Próxima renovación: ${periodEnd.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`}
              </div>
            </>
          )}

          {/* Limit warning */}
          {sub.dumpsLimit && sub.dumpsThisMonth >= sub.dumpsLimit && (
            <>
              <Separator />
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-600">Límite alcanzado</p>
                  <p className="text-muted-foreground text-xs">
                    Has usado todos tus brain dumps de este mes. Actualiza a Pro para dumps
                    ilimitados.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Upgrade / Manage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gestión de suscripción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isPro && (
            <div className="border-primary/20 bg-primary/5 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="text-primary h-4 w-4" />
                    Actualizar a Pro
                  </h4>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Brain dumps ilimitados, IA avanzada, integraciones y más.
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    $19<span className="text-muted-foreground text-sm font-normal">/mes</span>
                  </p>
                </div>
              </div>
              <Button
                className="from-primary shadow-primary/25 mt-3 w-full bg-gradient-to-r to-cyan-500 text-white shadow-lg"
                onClick={() => startCheckout("PRO")}
                disabled={!!actionLoading}
              >
                {actionLoading === "PRO" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Crown className="mr-2 h-4 w-4" />
                )}
                Suscribirse a Pro
              </Button>
            </div>
          )}

          {hasStripe && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={openPortal}
              disabled={!!actionLoading}
            >
              {actionLoading === "portal" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gestionar suscripción en Stripe
            </Button>
          )}

          {!hasStripe && !isPro && (
            <p className="text-muted-foreground text-center text-xs">
              Actualmente en plan gratuito. Suscríbete para desbloquear más funciones.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
