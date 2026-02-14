// ============================================================
// Brain Dump Detail — Review & Edit parsed tasks
// ============================================================

"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {
  PRIORITY_META,
  FEELING_META,
  TIME_UNIT_META,
  type TaskPriority,
  type TaskFeeling,
  type TimeUnit,
} from "@/types";

interface Category {
  id: string;
  name: string;
}

interface Task {
  id: string;
  text: string;
  sortOrder: number;
  status: string;
  quadrant: string | null;
  isPareto: boolean;
  priority: TaskPriority | null;
  feeling: TaskFeeling | null;
  estimatedValue: number | null;
  estimatedUnit: TimeUnit | null;
  categoryId: string | null;
  category: Category | null;
}

interface BrainDump {
  id: string;
  title: string | null;
  rawText: string | null;
  source: string;
  status: string;
  createdAt: string;
  tasks: Task[];
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  PROCESSING: { label: "Procesando", variant: "secondary" },
  PROCESSED: { label: "Procesado", variant: "default" },
  ARCHIVED: { label: "Archivado", variant: "secondary" },
  ERROR: { label: "Error", variant: "destructive" },
};

const SOURCE_LABELS: Record<string, string> = {
  WEB: "Web",
  TELEGRAM: "Telegram",
  IMAGE: "Imagen",
  WHATSAPP: "WhatsApp",
};

// Valid state transitions for BrainDump
const DUMP_TRANSITIONS: Record<string, { label: string; target: string; icon: React.ReactNode }[]> = {
  DRAFT: [
    { label: "Marcar como procesado", target: "PROCESSED", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  ],
  PROCESSED: [
    { label: "Archivar", target: "ARCHIVED", icon: <Archive className="h-3.5 w-3.5" /> },
    { label: "Volver a borrador", target: "DRAFT", icon: <RotateCcw className="h-3.5 w-3.5" /> },
  ],
  ARCHIVED: [
    { label: "Restaurar", target: "PROCESSED", icon: <RotateCcw className="h-3.5 w-3.5" /> },
  ],
  ERROR: [
    { label: "Reintentar (borrador)", target: "DRAFT", icon: <RotateCcw className="h-3.5 w-3.5" /> },
  ],
};

// Task status cycle
const TASK_STATUS_INFO: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendiente", color: "border-muted-foreground/30 hover:border-primary" },
  DONE: { label: "Completada", color: "border-green-500 bg-green-500 text-white" },
  HIDDEN: { label: "Oculta", color: "border-muted-foreground/20 bg-muted-foreground/20" },
};

const QUADRANT_BADGE: Record<string, { label: string; icon: string; className: string }> = {
  Q1_DO: { label: "Urgente e Importante", icon: "🔴", className: "border-red-500/30 bg-red-500/10 text-red-500" },
  Q2_SCHEDULE: { label: "No urgente, importante", icon: "🔵", className: "border-blue-500/30 bg-blue-500/10 text-blue-500" },
  Q3_DELEGATE: { label: "Urgente, no importante", icon: "🟡", className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500" },
  Q4_DELETE: { label: "Ni urgente, ni importante", icon: "⚪", className: "border-neutral-500/30 bg-neutral-500/10 text-neutral-400" },
};

export default function BrainDumpDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [dump, setDump] = useState<BrainDump | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  // Editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchDump = useCallback(async () => {
    try {
      const res = await fetch(`/api/braindump/${id}`);
      if (!res.ok) {
        setError("No se encontró el brain dump.");
        return;
      }
      const { data } = await res.json();
      setDump(data);
    } catch {
      setError("Error al cargar el brain dump.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDump();
    // Fetch categories
    fetch("/api/categories")
      .then((r) => r.json())
      .then((r) => setCategories(r.data ?? []))
      .catch(() => {});
  }, [fetchDump]);

  // ── Task CRUD ──

  function startEditTask(task: Task) {
    setEditingTaskId(task.id);
    setEditText(task.text);
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setEditText("");
  }

  function updateLocalTask(taskId: string, updates: Partial<Task>) {
    setDump((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      };
    });
  }

  function saveEditTask(taskId: string) {
    if (!editText.trim()) return;
    const text = editText.trim();
    updateLocalTask(taskId, { text });
    setEditingTaskId(null);
    setEditText("");
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }

  function deleteTask(taskId: string) {
    setDump((prev) => {
      if (!prev) return prev;
      return { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) };
    });
    fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
  }

  function toggleTaskDone(task: Task) {
    const nextStatus =
      task.status === "PENDING" ? "DONE" : task.status === "DONE" ? "HIDDEN" : "PENDING";
    updateLocalTask(task.id, { status: nextStatus });
    fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
  }

  function setTaskStatus(taskId: string, status: string) {
    updateLocalTask(taskId, { status });
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  }

  function changeDumpStatus(newStatus: string) {
    startTransition(async () => {
      await fetch(`/api/braindump/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchDump();
    });
  }

  function addNewTask() {
    if (!newTaskText.trim()) return;
    startTransition(async () => {
      await fetch(`/api/braindump/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTaskText.trim() }),
      });
      setNewTaskText("");
      setIsAddingTask(false);
      fetchDump();
    });
  }

  function deleteDump() {
    startTransition(async () => {
      await fetch(`/api/braindump/${id}`, { method: "DELETE" });
      router.push(ROUTES.HISTORY);
    });
  }

  async function classifyWithAI() {
    if (!dump) return;
    const pendingTasks = dump.tasks.filter(
      (t) => t.status !== "HIDDEN" && !t.quadrant,
    );
    if (pendingTasks.length === 0) return;

    setIsClassifying(true);
    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: pendingTasks.map((t) => ({
            text: t.text,
            priority: t.priority,
            feeling: t.feeling,
            estimatedValue: t.estimatedValue,
            estimatedUnit: t.estimatedUnit,
            category: t.category?.name ?? null,
          })),
        }),
      });
      if (!res.ok) return;
      const { data } = await res.json();

      // Apply classifications
      for (const ct of data.tasks) {
        const task = pendingTasks.find(
          (t) => t.text.toLowerCase().trim() === ct.text.toLowerCase().trim(),
        );
        if (task) {
          await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quadrant: ct.quadrant }),
          });
        }
      }
      fetchDump();
    } catch {
      // ignore
    } finally {
      setIsClassifying(false);
    }
  }

  function updateTaskField(taskId: string, field: string, value: unknown) {
    // Optimistic — update UI instantly
    updateLocalTask(taskId, { [field]: value } as Partial<Task>);
    // Fire-and-forget API call
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function createOrAssignCategory(taskId: string, categoryName: string) {
    if (!categoryName.trim()) {
      updateTaskField(taskId, "categoryId", null);
      return;
    }
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      });
      if (!res.ok) return;
      const { data } = await res.json();
      // Add to local categories list immediately
      setCategories((prev) =>
        prev.some((c) => c.id === data.id) ? prev : [...prev, data].sort((a, b) => a.name.localeCompare(b.name)),
      );
      // Optimistically assign
      updateLocalTask(taskId, { categoryId: data.id, category: { id: data.id, name: data.name } });
      fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: data.id }),
      });
    } catch {
      // ignore
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !dump) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Brain className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-1 text-lg font-semibold">
            {error || "Brain Dump no encontrado"}
          </h3>
          <Button asChild variant="outline" className="mt-4">
            <Link href={ROUTES.DASHBOARD}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[dump.status] ?? STATUS_LABELS.DRAFT;
  const pendingCount = dump.tasks.filter((t) => t.status === "PENDING").length;
  const doneCount = dump.tasks.filter((t) => t.status === "DONE").length;
  const hiddenCount = dump.tasks.filter((t) => t.status === "HIDDEN").length;
  const visibleTasks = showHidden
    ? dump.tasks
    : dump.tasks.filter((t) => t.status !== "HIDDEN");
  const transitions = DUMP_TRANSITIONS[dump.status] ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="animate-fade-in flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href={ROUTES.DASHBOARD}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {dump.title || "Brain Dump"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-10">
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {SOURCE_LABELS[dump.source] ?? dump.source}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              {new Date(dump.createdAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {/* Status transition buttons */}
          {transitions.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-10 pt-2">
              {transitions.map((t) => (
                <Button
                  key={t.target}
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => changeDumpStatus(t.target)}
                  disabled={isPending}
                >
                  {t.icon}
                  {t.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10"
          onClick={deleteDump}
          disabled={isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="animate-fade-in-up flex gap-4">
        <Card className="flex-1">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold">{dump.tasks.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="py-3 text-center">
            <p className="text-2xl font-bold text-green-500">{doneCount}</p>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>
        {hiddenCount > 0 && (
          <Card className="flex-1">
            <CardContent className="py-3 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{hiddenCount}</p>
              <p className="text-xs text-muted-foreground">Ocultas</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task List */}
      <Card className="animate-fade-in-up stagger-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Tareas</CardTitle>
              <CardDescription>
                Revisa, edita o elimina las tareas extraídas de tu brain dump.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {dump.tasks.some((t) => t.status !== "HIDDEN" && !t.quadrant) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={classifyWithAI}
                  disabled={isClassifying || isPending}
                >
                  {isClassifying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  Clasificar con IA
                </Button>
              )}
              {hiddenCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => setShowHidden(!showHidden)}
                >
                  {showHidden ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Ocultar ({hiddenCount})
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Mostrar ocultas ({hiddenCount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {visibleTasks.length === 0 && !showHidden ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {dump.tasks.length === 0
                ? "No hay tareas en este brain dump."
                : "Todas las tareas están ocultas."}
            </p>
          ) : visibleTasks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay tareas en este brain dump.
            </p>
          ) : (
            visibleTasks.map((task) => (
              <div key={task.id} className={`rounded-lg transition-colors ${task.status === "HIDDEN" ? "opacity-50" : ""}`}>
                <div className="group flex items-center gap-2 px-2 py-2 hover:bg-muted/50">
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    {expandedTaskId === task.id ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Status toggle */}
                  <button
                    onClick={() => toggleTaskDone(task)}
                    title={`${TASK_STATUS_INFO[task.status]?.label ?? task.status} — clic para cambiar`}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      task.status === "DONE"
                        ? "border-green-500 bg-green-500 text-white"
                        : task.status === "HIDDEN"
                          ? "border-muted-foreground/20 bg-muted-foreground/20"
                          : "border-muted-foreground/30 hover:border-primary"
                    }`}
                    disabled={isPending}
                  >
                    {task.status === "DONE" && <Check className="h-3 w-3" />}
                    {task.status === "HIDDEN" && <EyeOff className="h-2.5 w-2.5 text-muted-foreground" />}
                  </button>

                  {/* Text or Edit Input */}
                  {editingTaskId === task.id ? (
                    <div className="flex flex-1 items-center gap-1">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="h-8 flex-1 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditTask(task.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        disabled={isPending}
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEditTask(task.id)} disabled={isPending}>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit} disabled={isPending}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-1 items-center gap-2 min-w-0 flex-wrap">
                        <span className={`text-sm ${task.status === "DONE" ? "text-muted-foreground line-through" : task.status === "HIDDEN" ? "text-muted-foreground/50 italic line-through" : ""}`}>
                          {task.text}
                        </span>
                        {task.isPareto && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />}
                        {task.priority && (
                          <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0 text-[10px] font-bold text-white ${PRIORITY_META[task.priority].bg}`}>
                            {PRIORITY_META[task.priority].label}
                          </span>
                        )}
                        {task.category && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-1.5 py-0 text-[10px] font-medium text-purple-500">
                            <Tag className="h-2 w-2" /> {task.category.name}
                          </span>
                        )}
                        {task.feeling && (
                          <span className="text-[10px]" title={FEELING_META[task.feeling].label}>
                            {FEELING_META[task.feeling].emoji}
                          </span>
                        )}
                        {task.estimatedValue && task.estimatedUnit && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {task.estimatedValue} {task.estimatedValue === 1 ? TIME_UNIT_META[task.estimatedUnit].label : TIME_UNIT_META[task.estimatedUnit].labelPlural}
                          </span>
                        )}
                        {task.quadrant && QUADRANT_BADGE[task.quadrant] && (
                          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0 text-[10px] font-medium ${QUADRANT_BADGE[task.quadrant].className}`}>
                            {QUADRANT_BADGE[task.quadrant].icon}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {task.status === "HIDDEN" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Restaurar" onClick={() => setTaskStatus(task.id, "PENDING")} disabled={isPending}>
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {task.status !== "HIDDEN" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Ocultar" onClick={() => setTaskStatus(task.id, "HIDDEN")} disabled={isPending}>
                            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditTask(task)} disabled={isPending}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteTask(task.id)} disabled={isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Expanded detail panel */}
                {expandedTaskId === task.id && (
                  <TaskDetailPanel
                    task={task}
                    categories={categories}
                    onUpdate={updateTaskField}
                    onCategoryAssign={createOrAssignCategory}
                  />
                )}
              </div>
            ))
          )}

          {/* Add new task */}
          {isAddingTask ? (
            <div className="flex items-center gap-1 px-2 pt-2">
              <Input
                placeholder="Nueva tarea..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="h-8 flex-1 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNewTask();
                  if (e.key === "Escape") {
                    setIsAddingTask(false);
                    setNewTaskText("");
                  }
                }}
                disabled={isPending}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={addNewTask}
                disabled={isPending || !newTaskText.trim()}
              >
                <Check className="h-3.5 w-3.5 text-green-500" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskText("");
                }}
                disabled={isPending}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Agregar tarea
            </button>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="animate-fade-in-up stagger-2 flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link href={ROUTES.HISTORY}>Ver historial</Link>
        </Button>
        <Button
          asChild
          className="flex-1 bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20"
        >
          <Link href={ROUTES.NEW_DUMP}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo dump
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Task Detail Panel ──────────────────────────────────────

function TaskDetailPanel({
  task,
  categories,
  onUpdate,
  onCategoryAssign,
}: {
  task: Task;
  categories: Category[];
  onUpdate: (taskId: string, field: string, value: unknown) => void;
  onCategoryAssign: (taskId: string, name: string) => void;
}) {
  const [newCat, setNewCat] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const priorities: TaskPriority[] = ["ALTA", "MEDIA", "BAJA"];
  const feelings: TaskFeeling[] = ["MUST_DO", "WANT_TO", "DONT_CARE", "LAZY"];
  const units: TimeUnit[] = ["MINUTES", "HOURS", "DAYS"];

  return (
    <div className="mx-8 mb-2 rounded-lg border bg-muted/20 px-4 py-3 space-y-3 animate-fade-in">
      {/* Row 1: Categoría + Prioridad */}
      <div className="grid grid-cols-2 gap-3">
        {/* Categoría */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
            <Tag className="inline h-3 w-3 mr-1" />Categoría
          </label>
          {showNewCat ? (
            <div className="flex gap-1">
              <Input
                className="h-7 text-xs flex-1"
                placeholder="Nueva categoría..."
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCat.trim()) {
                    onCategoryAssign(task.id, newCat);
                    setNewCat("");
                    setShowNewCat(false);
                  }
                  if (e.key === "Escape") setShowNewCat(false);
                }}
              />
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { onCategoryAssign(task.id, newCat); setNewCat(""); setShowNewCat(false); }} disabled={!newCat.trim()}>
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-1">
              <select
                className="h-7 flex-1 rounded-md border bg-background px-2 text-xs"
                value={task.categoryId ?? ""}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setShowNewCat(true);
                  } else {
                    onUpdate(task.id, "categoryId", e.target.value || null);
                  }
                }}
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new__">+ Crear nueva...</option>
              </select>
            </div>
          )}
        </div>

        {/* Prioridad */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
            Prioridad
          </label>
          <div className="flex gap-1">
            {priorities.map((p) => (
              <button
                key={p}
                onClick={() => onUpdate(task.id, "priority", task.priority === p ? null : p)}
                className={`flex-1 rounded px-2 py-1 text-[11px] font-bold transition-colors ${
                  task.priority === p
                    ? `${PRIORITY_META[p].bg} text-white`
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {PRIORITY_META[p].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Sentimiento + Tiempo estimado */}
      <div className="grid grid-cols-2 gap-3">
        {/* ¿Cómo me siento? */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
            ¿Cómo me siento?
          </label>
          <div className="grid grid-cols-2 gap-1">
            {feelings.map((f) => (
              <button
                key={f}
                onClick={() => onUpdate(task.id, "feeling", task.feeling === f ? null : f)}
                className={`rounded px-2 py-1 text-[11px] transition-colors text-left ${
                  task.feeling === f
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {FEELING_META[f].emoji} {FEELING_META[f].label}
              </button>
            ))}
          </div>
        </div>

        {/* ¿Cuánto tardo? */}
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
            <Clock className="inline h-3 w-3 mr-1" />¿Cuánto tardo?
          </label>
          <div className="flex gap-1">
            <Input
              type="number"
              min={1}
              className="h-7 w-16 text-xs"
              placeholder="—"
              defaultValue={task.estimatedValue ?? ""}
              onBlur={(e) => {
                const val = e.target.value ? parseInt(e.target.value) : null;
                if (val !== task.estimatedValue) onUpdate(task.id, "estimatedValue", val);
              }}
            />
            <select
              className="h-7 flex-1 rounded-md border bg-background px-2 text-xs"
              value={task.estimatedUnit ?? ""}
              onChange={(e) => onUpdate(task.id, "estimatedUnit", e.target.value || null)}
            >
              <option value="">Unidad</option>
              {units.map((u) => (
                <option key={u} value={u}>{TIME_UNIT_META[u].labelPlural}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}