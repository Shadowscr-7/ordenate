// ============================================================
// Dashboard Page — Main overview with Telegram QR
// ============================================================

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Kanban,
  Plus,
  Target,
  Sparkles,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/actions";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TelegramLink } from "@/components/dashboard/telegram-link";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "Usuario";
  const subscription = user?.memberships[0]?.workspace?.subscription;
  const isPro = subscription?.plan === "PRO";

  return (
    <div className="animate-fade-in space-y-8">
      {/* Welcome */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Hola, {firstName}
          </h1>
          <Sparkles className="h-6 w-6 text-amber-400" />
        </div>
        <p className="mt-1 text-muted-foreground">
          Captura tus ideas y prioriza lo que importa.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up stagger-1 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* New Brain Dump */}
        <Card className="group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-cyan-400/20 transition-transform duration-300 group-hover:scale-110">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Nuevo Brain Dump</CardTitle>
              <CardDescription>Captura tus ideas</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="group/btn w-full bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              <Link href={ROUTES.NEW_DUMP}>
                Crear dump
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Eisenhower */}
        <Card className="group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/5 hover:border-blue-500/20">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 transition-transform duration-300 group-hover:scale-110">
              <Kanban className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-base">Tablero Eisenhower</CardTitle>
              <CardDescription>Prioriza tus tareas</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full transition-colors hover:border-blue-500/30 hover:bg-blue-500/5">
              <Link href={ROUTES.EISENHOWER}>
                Ver tablero
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pareto */}
        <Card className="group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/5 hover:border-green-500/20">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400/20 to-emerald-400/20 transition-transform duration-300 group-hover:scale-110">
              <Target className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-base">Foco Pareto</CardTitle>
              <CardDescription>El 20% que importa</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full transition-colors hover:border-green-500/30 hover:bg-green-500/5">
              <Link href={ROUTES.PARETO}>
                Ver foco
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Telegram Link — Pro feature or upgrade CTA */}
      <div className="animate-fade-in-up stagger-3">
        {isPro ? (
          <TelegramLink
            userId={user?.id ?? ""}
            isLinked={!!user?.telegramChatId}
          />
        ) : (
          <Card className="border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-cyan-400/5">
            <CardContent className="flex items-center justify-between py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Desbloquea Telegram Bot, IA y más
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Actualiza a Pro para acceder a todas las integraciones
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                <Link href={ROUTES.SETTINGS}>Actualizar</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty State */}
      <Card className="animate-fade-in-up stagger-4 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-400/10">
            <Brain className="h-8 w-8 text-primary/60" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No hay brain dumps aún</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Comienza creando tu primer brain dump. Escribe o sube una foto con
            tus ideas y la IA las convertirá en tareas organizadas.
          </p>
          <Button
            asChild
            className="group bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20"
          >
            <Link href={ROUTES.NEW_DUMP}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primer dump
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
