// ============================================================
// Pareto Focus View — The vital 20% that drives 80% of results
// ============================================================
// Shows Pareto-flagged tasks prominently, with AI suggestion
// capability and manual toggle. Includes due-date management.
// ============================================================

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import Link from "next/link";

import { type EisenhowerQuadrant, QUADRANT_META } from "@/types";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  Star,
  Target,
  Zap,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ─── Types ──────────────────────────────────────────────────

interface TaskItem {
  id: string;
  text: string;
  sortOrder: number;
  status: string;
  quadrant: EisenhowerQuadrant | null;
  isPareto: boolean;
  dueDate: string | null;
  brainDump: { id: string; title: string | null };
}

// ─── Component ──────────────────────────────────────────────

export default function ParetoPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideDone, setHideDone] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── Fetch ──

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/pareto");
      if (!res.ok) return;
      const { data } = await res.json();
      setTasks(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Actions ──

  function togglePareto(task: TaskItem) {
    const newVal = !task.isPareto;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, isPareto: newVal } : t)));
    startTransition(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPareto: newVal }),
      });
    });
  }

  function toggleDone(task: TaskItem) {
    const newStatus = task.status === "DONE" ? "PENDING" : "DONE";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    startTransition(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    });
  }

  function setDueDate(taskId: string, date: string | null) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, dueDate: date } : t)));
    startTransition(async () => {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: date ? new Date(date).toISOString() : null }),
      });
    });
  }

  async function analyzeWithAI() {
    const pendingTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "HIDDEN");
    if (pendingTasks.length === 0) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/pareto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: pendingTasks.map((t) => ({
            text: t.text,
            quadrant: t.quadrant,
          })),
        }),
      });
      if (!res.ok) return;
      const { data } = await res.json();

      // Apply suggestions
      for (const suggestion of data.suggestions) {
        const task = pendingTasks.find(
          (t) => t.text.toLowerCase().trim() === suggestion.taskText.toLowerCase().trim(),
        );
        if (task && suggestion.isPareto !== task.isPareto) {
          await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPareto: suggestion.isPareto }),
          });
        }
      }
      fetchTasks();
    } catch {
      // ignore
    } finally {
      setIsAnalyzing(false);
    }
  }

  // ── Derived data ──

  const paretoTasks = tasks.filter((t) => t.isPareto);
  const nonParetoTasks = tasks.filter((t) => !t.isPareto);
  const pendingPareto = paretoTasks.filter((t) => t.status === "PENDING");
  const donePareto = paretoTasks.filter((t) => t.status === "DONE");

  const displayPareto = hideDone ? paretoTasks.filter((t) => t.status !== "DONE") : paretoTasks;

  const displayOther = hideDone
    ? nonParetoTasks.filter((t) => t.status !== "DONE")
    : nonParetoTasks;

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="animate-fade-in space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4" data-tour="pareto-principle">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <Target className="mr-2 inline-block h-6 w-6 text-amber-500" />
              Foco Pareto
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              El 20% de tareas que genera el 80% del impacto. Enfócate aquí.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={analyzeWithAI}
                  disabled={isAnalyzing || isPending}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {isAnalyzing ? "Analizando…" : "Analizar con IA"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>La IA identificará las tareas más impactantes</TooltipContent>
            </Tooltip>
            <Button
              variant={hideDone ? "default" : "outline"}
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => setHideDone(!hideDone)}
            >
              {hideDone ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              Completadas
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-2.5 text-center">
              <p className="text-lg font-bold text-amber-500">{pendingPareto.length}</p>
              <p className="text-muted-foreground text-[11px]">Pareto activas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 text-center">
              <p className="text-lg font-bold text-green-500">{donePareto.length}</p>
              <p className="text-muted-foreground text-[11px]">Completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 text-center">
              <p className="text-lg font-bold">
                {tasks.length > 0 ? Math.round((paretoTasks.length / tasks.length) * 100) : 0}%
              </p>
              <p className="text-muted-foreground text-[11px]">Del total</p>
            </CardContent>
          </Card>
        </div>

        {/* Pareto Tasks — The Vital Few */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <h2 className="text-sm font-semibold">Las pocas vitales</h2>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] tabular-nums">
              {displayPareto.length}
            </Badge>
          </div>

          {displayPareto.length === 0 ? (
            <Card className="border-dashed border-amber-500/20">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="text-muted-foreground/30 mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">
                  {paretoTasks.length > 0
                    ? "Todas las tareas Pareto están completadas."
                    : "No hay tareas Pareto marcadas aún."}
                </p>
                <p className="text-muted-foreground/60 mt-1 text-xs">
                  Usa el botón &quot;Analizar con IA&quot; o marca tareas manualmente con la ⭐
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-amber-500/20 bg-amber-500/[0.02]" data-tour="pareto-list">
              <CardContent className="divide-border divide-y py-1">
                {displayPareto.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onTogglePareto={togglePareto}
                    onToggleDone={toggleDone}
                    onSetDueDate={setDueDate}
                    isPending={isPending}
                    highlight
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Other Tasks */}
        <div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Otras tareas
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] tabular-nums">
              {displayOther.length}
            </Badge>
          </button>

          {showAll && displayOther.length > 0 && (
            <Card>
              <CardContent className="divide-border divide-y py-1">
                {displayOther.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onTogglePareto={togglePareto}
                    onToggleDone={toggleDone}
                    onSetDueDate={setDueDate}
                    isPending={isPending}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Empty state */}
        {tasks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="text-muted-foreground/40 mb-3 h-10 w-10" />
              <h3 className="mb-1 text-base font-semibold">Sin tareas</h3>
              <p className="text-muted-foreground mb-4 max-w-sm text-sm">
                Crea un brain dump primero para tener tareas que analizar.
              </p>
              <Button
                asChild
                className="from-primary shadow-primary/20 bg-gradient-to-r to-cyan-500 text-white shadow-md"
              >
                <Link href={ROUTES.NEW_DUMP}>Crear brain dump</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

// ─── Task Row ───────────────────────────────────────────────

function TaskRow({
  task,
  onTogglePareto,
  onToggleDone,
  onSetDueDate,
  isPending,
  highlight,
}: {
  task: TaskItem;
  onTogglePareto: (t: TaskItem) => void;
  onToggleDone: (t: TaskItem) => void;
  onSetDueDate: (id: string, date: string | null) => void;
  isPending: boolean;
  highlight?: boolean;
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const quadrant = task.quadrant ? QUADRANT_META[task.quadrant] : null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div
      className={`group flex items-center gap-2.5 px-2 py-2.5 transition-colors ${
        highlight ? "" : "hover:bg-muted/30"
      } ${task.status === "DONE" ? "opacity-50" : ""}`}
    >
      {/* Pareto star */}
      <button
        onClick={() => onTogglePareto(task)}
        disabled={isPending}
        className="shrink-0 transition-transform hover:scale-110"
        title={task.isPareto ? "Quitar de Pareto" : "Marcar como Pareto"}
      >
        <Star
          className={`h-4 w-4 transition-colors ${
            task.isPareto
              ? "fill-amber-500 text-amber-500"
              : "text-muted-foreground/25 hover:text-amber-500/50"
          }`}
        />
      </button>

      {/* Done toggle */}
      <button
        onClick={() => onToggleDone(task)}
        disabled={isPending}
        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
          task.status === "DONE"
            ? "border-green-500 bg-green-500 text-white"
            : "border-muted-foreground/30 hover:border-primary"
        }`}
      >
        {task.status === "DONE" && <Check className="h-2.5 w-2.5" />}
      </button>

      {/* Task info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`text-[13px] leading-snug ${
              task.status === "DONE" ? "text-muted-foreground line-through" : ""
            }`}
          >
            {task.text}
          </p>
          {quadrant && (
            <span className={`shrink-0 text-[10px] ${quadrant.color}`}>{quadrant.icon}</span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          {task.brainDump.title && (
            <span className="text-muted-foreground/50 truncate text-[11px]">
              {task.brainDump.title}
            </span>
          )}
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 text-[11px] ${
                isOverdue ? "font-medium text-red-500" : "text-muted-foreground/60"
              }`}
            >
              <Calendar className="h-2.5 w-2.5" />
              {new Date(task.dueDate).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Date picker */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {showDatePicker ? (
          <div className="flex items-center gap-1">
            <Input
              type="date"
              className="h-7 w-32 text-xs"
              defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
              onChange={(e) => {
                onSetDueDate(task.id, e.target.value || null);
                setShowDatePicker(false);
              }}
              autoFocus
              onBlur={() => setShowDatePicker(false)}
            />
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowDatePicker(true)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1"
              >
                <Calendar className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {task.dueDate ? "Cambiar fecha" : "Agregar fecha límite"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
