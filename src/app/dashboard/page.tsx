// ============================================================
// Dashboard Page — Main overview with recent dumps & Telegram
// ============================================================
import Link from "next/link";

import { ArrowRight, Brain, LayoutGrid, Plus, Sparkles } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/actions";
import { ROUTES } from "@/lib/constants";
import { db } from "@/lib/db";

import { TelegramLink } from "@/components/dashboard/telegram-link";
import { WelcomeDialog } from "@/components/dashboard/welcome-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Dashboard",
};

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  PROCESSING: { label: "Procesando", variant: "secondary" },
  PROCESSED: { label: "Procesado", variant: "default" },
  ARCHIVED: { label: "Archivado", variant: "secondary" },
  ERROR: { label: "Error", variant: "destructive" },
};

const SOURCE_ICON: Record<string, string> = {
  WEB: "🌐",
  TELEGRAM: "📱",
  IMAGE: "🖼️",
  WHATSAPP: "💬",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "Usuario";
  const subscription = user?.memberships[0]?.workspace?.subscription;
  const isPro = subscription?.plan === "PRO";
  const workspaceId = user?.memberships[0]?.workspaceId;

  // Fetch all dashboard data in parallel to reduce latency
  const [recentDumps, totalTasks, doneTasks, totalDumps] = workspaceId
    ? await Promise.all([
        db.brainDump.findMany({
          where: { workspaceId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            _count: { select: { tasks: true } },
            tasks: {
              where: { status: "DONE" },
              select: { id: true },
            },
          },
        }),
        db.task.count({
          where: { brainDump: { workspaceId } },
        }),
        db.task.count({
          where: { brainDump: { workspaceId }, status: "DONE" },
        }),
        db.brainDump.count({ where: { workspaceId } }),
      ])
    : [[], 0, 0, 0];

  // Monthly dump count for Basic plan limit display
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dumpsThisMonth = workspaceId
    ? await db.brainDump.count({
        where: { workspaceId, createdAt: { gte: monthStart } },
      })
    : 0;
  const monthlyLimit = isPro ? null : 10;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome + New Dump CTA */}
      <div className="animate-fade-in-up flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Hola, {firstName}</h1>
            <Sparkles className="h-6 w-6 text-amber-400" />
          </div>
          <p className="text-muted-foreground mt-1">Captura tus ideas y prioriza lo que importa.</p>
        </div>
        <Button
          asChild
          data-tour="new-dump"
          className="group/btn from-primary shadow-primary/20 hover:shadow-primary/30 bg-gradient-to-r to-cyan-500 text-white shadow-md transition-all hover:shadow-lg"
        >
          <Link href={ROUTES.NEW_DUMP}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo dump
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </Button>
      </div>

      {/* Telegram Link — Pro feature or upgrade CTA */}
      <div className="animate-fade-in-up stagger-1" data-tour="telegram-link">{isPro ? (
          <TelegramLink userId={user?.id ?? ""} isLinked={!!user?.telegramChatId} />
        ) : (
          <Card className="border-primary/20 from-primary/5 border-dashed bg-gradient-to-r to-cyan-400/5">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                  <Sparkles className="text-primary h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Desbloquea Telegram Bot, IA y más</p>
                  <p className="text-muted-foreground text-xs">
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

      {/* Quick Stats — inline row */}
      {totalDumps > 0 && (
        <div
          className={`animate-fade-in-up stagger-2 grid gap-3 ${monthlyLimit !== null ? "grid-cols-4" : "grid-cols-3"}`}
        >
          <Card>
            <CardContent className="py-2 text-center">
              <p className="text-lg font-bold">{totalDumps}</p>
              <p className="text-muted-foreground text-[11px]">Brain Dumps</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2 text-center">
              <p className="text-lg font-bold">{totalTasks}</p>
              <p className="text-muted-foreground text-[11px]">Tareas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2 text-center">
              <p className="text-lg font-bold text-green-500">{doneTasks}</p>
              <p className="text-muted-foreground text-[11px]">Completadas</p>
            </CardContent>
          </Card>
          {monthlyLimit !== null && (
            <Card className={dumpsThisMonth >= monthlyLimit ? "border-amber-500/50" : ""}>
              <CardContent className="py-2 text-center">
                <p
                  className={`text-lg font-bold ${dumpsThisMonth >= monthlyLimit ? "text-amber-500" : ""}`}
                >
                  {dumpsThisMonth}/{monthlyLimit}
                </p>
                <p className="text-muted-foreground text-[11px]">Dumps / mes</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Brain Dumps — Compact table */}
      {recentDumps.length > 0 ? (
        <div className="animate-fade-in-up stagger-3 space-y-2" data-tour="recent-dumps">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Brain Dumps recientes</h2>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href={ROUTES.HISTORY}>
                Ver todos
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-border divide-y">
                {recentDumps.map((dump) => {
                  const statusInfo = STATUS_BADGE[dump.status] ?? STATUS_BADGE.DRAFT;
                  const doneCount = dump.tasks.length;
                  const totalCount = dump._count.tasks;
                  return (
                    <div
                      key={dump.id}
                      className="hover:bg-muted/50 flex items-center gap-3 px-4 py-2.5 transition-colors"
                    >
                      <Link
                        href={`/dashboard/dump/${dump.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <span className="text-base leading-none">
                          {SOURCE_ICON[dump.source] ?? "📝"}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {dump.title || "Brain Dump"}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                          {totalCount} {totalCount === 1 ? "tarea" : "tareas"}
                          {doneCount > 0 && ` · ${doneCount} ✓`}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-[11px]">
                          {new Date(dump.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        <Badge variant={statusInfo.variant} className="px-1.5 py-0 text-[10px]">
                          {statusInfo.label}
                        </Badge>
                      </Link>
                      <Link
                        href={`${ROUTES.EISENHOWER}?dumpId=${dump.id}`}
                        className="shrink-0"
                        title="Ver en Eisenhower"
                      >
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <LayoutGrid className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="animate-fade-in-up stagger-3 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="from-primary/10 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br to-cyan-400/10">
              <Brain className="text-primary/60 h-6 w-6" />
            </div>
            <h3 className="mb-1 text-base font-semibold">No hay brain dumps aún</h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-sm">
              Comienza creando tu primer brain dump.
            </p>
            <Button
              asChild
              className="group from-primary shadow-primary/20 bg-gradient-to-r to-cyan-500 text-white shadow-md"
            >
              <Link href={ROUTES.NEW_DUMP}>
                <Plus className="mr-2 h-4 w-4" />
                Crear primer dump
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Onboarding: Welcome dialog for first-time users */}
      {totalDumps === 0 && <WelcomeDialog userName={firstName} />}
    </div>
  );
}
