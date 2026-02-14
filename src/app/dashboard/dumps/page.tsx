// ============================================================
// Dumps Page — Lista completa de todos los brain dumps
// ============================================================
import Link from "next/link";

import {
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  Circle,
  LayoutGrid,
  ListChecks,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/actions";
import { ROUTES } from "@/lib/constants";
import { db } from "@/lib/db";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Brain Dumps",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  PROCESSING: { label: "Procesando", variant: "secondary" },
  PROCESSED: { label: "Procesado", variant: "default" },
  ARCHIVED: { label: "Archivado", variant: "secondary" },
  ERROR: { label: "Error", variant: "destructive" },
};

const SOURCE_CONFIG: Record<string, { icon: string; label: string }> = {
  WEB: { icon: "🌐", label: "Web" },
  TELEGRAM: { icon: "📱", label: "Telegram" },
  IMAGE: { icon: "🖼️", label: "Imagen" },
  WHATSAPP: { icon: "💬", label: "WhatsApp" },
};

export default async function DumpsPage() {
  const user = await getCurrentUser();
  const workspaceId = user?.memberships[0]?.workspaceId;

  if (!workspaceId) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">No tienes un workspace activo</p>
      </div>
    );
  }

  // Fetch all brain dumps
  const dumps = await db.brainDump.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        select: { id: true, status: true },
      },
    },
  });

  // Calculate stats
  const totalDumps = dumps.length;
  const totalTasks = dumps.reduce((sum, dump) => sum + dump._count.tasks, 0);
  const doneTasks = dumps.reduce(
    (sum, dump) => sum + dump.tasks.filter((t) => t.status === "DONE").length,
    0,
  );
  const pendingTasks = totalTasks - doneTasks;

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Brain className="text-primary h-8 w-8" />
            Brain Dumps
          </h1>
          <p className="text-muted-foreground mt-1">Todos tus volcados mentales organizados</p>
        </div>
        <Button asChild>
          <Link href={ROUTES.NEW_DUMP}>
            <Brain className="mr-2 h-4 w-4" />
            Nuevo Dump
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4" data-tour="dumps-stats">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-3">
              <Brain className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDumps}</p>
              <p className="text-muted-foreground text-xs">Total Dumps</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <ListChecks className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalTasks}</p>
              <p className="text-muted-foreground text-xs">Total Tareas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{doneTasks}</p>
              <p className="text-muted-foreground text-xs">Completadas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-3">
              <Circle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingTasks}</p>
              <p className="text-muted-foreground text-xs">Pendientes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dumps List */}
      {dumps.length === 0 ? (
        <Card className="p-12 text-center">
          <Brain className="text-muted-foreground mx-auto mb-4 h-16 w-16 opacity-50" />
          <h3 className="mb-2 text-xl font-semibold">No hay brain dumps</h3>
          <p className="text-muted-foreground mb-6">
            Crea tu primer volcado mental para empezar a organizar tus ideas.
          </p>
          <Button asChild>
            <Link href={ROUTES.NEW_DUMP}>
              <Brain className="mr-2 h-4 w-4" />
              Crear Brain Dump
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-3" data-tour="dumps-list">
          {dumps.map((dump) => {
            const doneCount = dump.tasks.filter((t) => t.status === "DONE").length;
            const totalCount = dump._count.tasks;
            const pendingCount = totalCount - doneCount;
            const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
            const statusConfig = STATUS_CONFIG[dump.status] || STATUS_CONFIG.DRAFT;
            const sourceConfig = SOURCE_CONFIG[dump.source] || SOURCE_CONFIG.WEB;

            return (
              <Card
                key={dump.id}
                className="hover:border-primary/50 p-4 transition-all hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="bg-primary/10 shrink-0 rounded-lg p-3">
                    <Brain className="text-primary h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Title and badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={ROUTES.BRAIN_DUMP(dump.id)}
                          className="hover:text-primary line-clamp-1 text-lg font-semibold transition-colors"
                        >
                          {dump.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            {sourceConfig.icon} {sourceConfig.label}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            {new Date(dump.createdAt).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress and actions */}
                    <div className="flex items-center gap-4">
                      {/* Progress bar */}
                      <div className="flex-1 space-y-1">
                        <div className="text-muted-foreground flex items-center justify-between text-xs">
                          <span>
                            {doneCount} de {totalCount} completadas
                          </span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="bg-secondary h-2 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={ROUTES.BRAIN_DUMP(dump.id)}>
                            <ArrowRight className="mr-1 h-4 w-4" />
                            Ver tareas
                          </Link>
                        </Button>
                        {pendingCount > 0 && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`${ROUTES.EISENHOWER}?dumpId=${dump.id}`}>
                              <LayoutGrid className="mr-1 h-4 w-4" />
                              Eisenhower
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
