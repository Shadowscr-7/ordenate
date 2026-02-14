// ============================================================
// Dashboard Page — Main overview with recent dumps & Telegram
// ============================================================

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
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

  // Fetch recent brain dumps
  const recentDumps = workspaceId
    ? await db.brainDump.findMany({
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
      })
    : [];

  const totalTasks = workspaceId
    ? await db.task.count({
        where: { brainDump: { workspaceId } },
      })
    : 0;

  const doneTasks = workspaceId
    ? await db.task.count({
        where: { brainDump: { workspaceId }, status: "DONE" },
      })
    : 0;

  const totalDumps = workspaceId
    ? await db.brainDump.count({ where: { workspaceId } })
    : 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome + New Dump CTA */}
      <div className="animate-fade-in-up flex items-center justify-between">
        <div>
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
        <Button
          asChild
          className="group/btn bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30"
        >
          <Link href={ROUTES.NEW_DUMP}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo dump
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
          </Link>
        </Button>
      </div>

      {/* Telegram Link — Pro feature or upgrade CTA */}
      <div className="animate-fade-in-up stagger-1">
        {isPro ? (
          <TelegramLink
            userId={user?.id ?? ""}
            isLinked={!!user?.telegramChatId}
          />
        ) : (
          <Card className="border-dashed border-primary/20 bg-gradient-to-r from-primary/5 to-cyan-400/5">
            <CardContent className="flex items-center justify-between py-4">
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

      {/* Quick Stats — inline row */}
      {totalDumps > 0 && (
        <div className="animate-fade-in-up stagger-2 grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-2 text-center">
              <p className="text-lg font-bold">{totalDumps}</p>
              <p className="text-[11px] text-muted-foreground">Brain Dumps</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2 text-center">
              <p className="text-lg font-bold">{totalTasks}</p>
              <p className="text-[11px] text-muted-foreground">Tareas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2 text-center">
              <p className="text-lg font-bold text-green-500">{doneTasks}</p>
              <p className="text-[11px] text-muted-foreground">Completadas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Brain Dumps — Compact table */}
      {recentDumps.length > 0 ? (
        <div className="animate-fade-in-up stagger-3 space-y-2">
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
              <div className="divide-y divide-border">
                {recentDumps.map((dump) => {
                  const statusInfo = STATUS_BADGE[dump.status] ?? STATUS_BADGE.DRAFT;
                  const doneCount = dump.tasks.length;
                  const totalCount = dump._count.tasks;
                  return (
                    <Link
                      key={dump.id}
                      href={`/dashboard/dump/${dump.id}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <span className="text-base leading-none">
                        {SOURCE_ICON[dump.source] ?? "📝"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {dump.title || "Brain Dump"}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                        {totalCount} {totalCount === 1 ? "tarea" : "tareas"}
                        {doneCount > 0 && ` · ${doneCount} ✓`}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {new Date(dump.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">
                        {statusInfo.label}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="animate-fade-in-up stagger-3 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-cyan-400/10">
              <Brain className="h-6 w-6 text-primary/60" />
            </div>
            <h3 className="mb-1 text-base font-semibold">No hay brain dumps aún</h3>
            <p className="mb-4 max-w-sm text-sm text-muted-foreground">
              Comienza creando tu primer brain dump.
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
      )}
    </div>
  );
}
