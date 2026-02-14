// ============================================================
// History Page — All brain dumps
// ============================================================

import Link from "next/link";
import { Brain, Plus, ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/actions";
import { db } from "@/lib/db";
import { ROUTES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Historial",
};

const STATUS_BADGE: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
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

export default async function HistoryPage() {
  const user = await getCurrentUser();
  const workspaceId = user?.memberships[0]?.workspaceId;

  const dumps = workspaceId
    ? await db.brainDump.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { tasks: true } },
          tasks: {
            where: { status: "DONE" },
            select: { id: true },
          },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial</h1>
          <p className="mt-1 text-muted-foreground">
            Todos tus brain dumps y tareas anteriores.
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20"
        >
          <Link href={ROUTES.NEW_DUMP}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo dump
          </Link>
        </Button>
      </div>

      {dumps.length > 0 ? (
        <Card className="animate-fade-in-up">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {dumps.map((dump) => {
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
                        year: "numeric",
                      })}
                    </span>
                    <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">
                      {statusInfo.label}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="animate-fade-in-up border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Brain className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-semibold">Sin historial</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Aquí aparecerán tus brain dumps procesados y tareas.
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20"
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
