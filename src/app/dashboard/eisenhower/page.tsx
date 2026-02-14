// ============================================================
// Eisenhower Board — Drag & drop task prioritization
// ============================================================

"use client";

import { useEffect, useState, useCallback, useTransition, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Inbox,
  Loader2,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROUTES } from "@/lib/constants";
import { type EisenhowerQuadrant, QUADRANT_META } from "@/types";

// ─── Types ──────────────────────────────────────────────────

interface TaskItem {
  id: string;
  text: string;
  sortOrder: number;
  status: string;
  quadrant: EisenhowerQuadrant | null;
  isPareto: boolean;
  brainDump: { id: string; title: string | null };
}

type ColumnId = EisenhowerQuadrant | "INBOX";

const COLUMNS: { id: ColumnId; label: string; description: string; color: string; bg: string; border: string }[] = [
  {
    id: "INBOX",
    label: "Sin clasificar",
    description: "Tareas pendientes de clasificar",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-muted-foreground/20",
  },
  {
    id: "Q1_DO",
    label: "🔴 Hacer",
    description: "Urgente + Importante",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    id: "Q2_SCHEDULE",
    label: "🔵 Planificar",
    description: "Importante, no urgente",
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
  },
  {
    id: "Q3_DELEGATE",
    label: "🟡 Delegar",
    description: "Urgente, no importante",
    color: "text-yellow-500",
    bg: "bg-yellow-500/5",
    border: "border-yellow-500/20",
  },
  {
    id: "Q4_DELETE",
    label: "⚪ Eliminar",
    description: "Ni urgente ni importante",
    color: "text-neutral-400",
    bg: "bg-neutral-500/5",
    border: "border-neutral-500/20",
  },
];

// ─── Helpers ────────────────────────────────────────────────

function getColumnId(task: TaskItem): ColumnId {
  return task.quadrant ?? "INBOX";
}

function getColumnTasks(tasks: TaskItem[], columnId: ColumnId) {
  return tasks
    .filter((t) => getColumnId(t) === columnId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ─── Custom collision detection ─────────────────────────────
// pointerWithin detects which column the cursor is physically inside,
// returning the sortable item first (smaller rect) or the column itself
// for empty-area drops.  closestCenter is the fallback when the cursor
// is in a gap between columns during a fast drag.

const customCollisionDetection: CollisionDetection = (args) => {
  const pw = pointerWithin(args);
  if (pw.length > 0) return pw;
  return closestCenter(args);
};

// ─── Sortable Task Card ─────────────────────────────────────

function SortableTaskCard({
  task,
  onToggleDone,
  onDelete,
  onEdit,
  isPending,
  showDump,
}: {
  task: TaskItem;
  onToggleDone: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onEdit: (task: TaskItem) => void;
  isPending: boolean;
  showDump: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 rounded-lg border bg-card px-3 py-2 transition-all ${
        isDragging
          ? "scale-[1.02] opacity-50 shadow-lg ring-2 ring-primary/30"
          : "hover:shadow-sm hover:border-primary/15"
      } ${task.status === "DONE" ? "opacity-60" : ""}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground/30 transition-colors hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Done toggle */}
      <button
        onClick={() => onToggleDone(task)}
        disabled={isPending}
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
          task.status === "DONE"
            ? "border-green-500 bg-green-500 text-white"
            : "border-muted-foreground/30 hover:border-primary"
        }`}
      >
        {task.status === "DONE" && <Check className="h-2.5 w-2.5" />}
      </button>

      {/* Pareto star */}
      {task.isPareto && (
        <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-amber-500 text-amber-500" />
      )}

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] leading-snug ${
            task.status === "DONE" ? "text-muted-foreground line-through" : ""
          }`}
        >
          {task.text}
        </p>
        {showDump && task.brainDump.title && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/60">
            {task.brainDump.title}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(task)}
          disabled={isPending}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          disabled={isPending}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Drag Overlay Card ──────────────────────────────────────

function DragOverlayCard({ task }: { task: TaskItem }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-card px-3 py-2 shadow-xl ring-2 ring-primary/20">
      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/30" />
      <div
        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          task.status === "DONE"
            ? "border-green-500 bg-green-500 text-white"
            : "border-muted-foreground/30"
        }`}
      >
        {task.status === "DONE" && <Check className="h-2.5 w-2.5" />}
      </div>
      <p className="text-[13px] leading-snug">{task.text}</p>
    </div>
  );
}

// ─── Droppable Column ───────────────────────────────────────

function DroppableColumn({
  column,
  tasks,
  onToggleDone,
  onDelete,
  onEdit,
  isPending,
  showDump,
  hideDone,
}: {
  column: (typeof COLUMNS)[number];
  tasks: TaskItem[];
  onToggleDone: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onEdit: (task: TaskItem) => void;
  isPending: boolean;
  showDump: boolean;
  hideDone: boolean;
}) {
  const filtered = hideDone ? tasks.filter((t) => t.status !== "DONE") : tasks;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border ${column.border} ${column.bg} min-h-[200px] transition-all ${
        isOver ? "ring-2 ring-primary/30 border-primary/30" : ""
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-inherit">
        <div>
          <h3 className={`text-sm font-semibold ${column.color}`}>
            {column.label}
          </h3>
          <p className="text-[11px] text-muted-foreground">{column.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 tabular-nums">
            {filtered.length}
          </Badge>
          {hideDone && doneCount > 0 && (
            <span className="text-[10px] text-muted-foreground">+{doneCount}</span>
          )}
        </div>
      </div>

      {/* Tasks */}
      <SortableContext
        items={filtered.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
        id={column.id}
      >
        <div className="flex flex-1 flex-col gap-1.5 p-2" data-column={column.id}>
          {filtered.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-6">
              <p className="text-[11px] text-muted-foreground/50">
                {column.id === "INBOX"
                  ? "Arrastra tareas aquí para desclasificar"
                  : "Arrastra tareas aquí"}
              </p>
            </div>
          ) : (
            filtered.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onToggleDone={onToggleDone}
                onDelete={onDelete}
                onEdit={onEdit}
                isPending={isPending}
                showDump={showDump}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Main Board Component ───────────────────────────────────

export default function EisenhowerPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const [showDump, setShowDump] = useState(true);
  const [inboxCollapsed, setInboxCollapsed] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editText, setEditText] = useState("");
  const [isPending, startTransition] = useTransition();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Fetch ──

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/eisenhower");
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

  // ── Persist ──

  const persistChanges = useCallback(
    (updatedTasks: TaskItem[]) => {
      // Debounced save — batch multiple rapid changes
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const payload = updatedTasks.map((t, i) => ({
          id: t.id,
          sortOrder: i,
          quadrant: t.quadrant ?? null,
        }));
        fetch("/api/tasks/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: payload }),
        });
      }, 300);
    },
    [],
  );

  // ── DnD handlers ──

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    const overColumn = COLUMNS.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);
    const targetColumnId: ColumnId | undefined = overColumn
      ? overColumn.id
      : overTask
        ? getColumnId(overTask)
        : undefined;

    if (!targetColumnId) return;

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    const currentColumn = getColumnId(activeTaskItem);
    if (currentColumn === targetColumnId) return;

    // Move to new column optimistically
    setTasks((prev) =>
      prev.map((t) =>
        t.id === activeId
          ? {
              ...t,
              quadrant: targetColumnId === "INBOX" ? null : (targetColumnId as EisenhowerQuadrant),
            }
          : t,
      ),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    const overColumn = COLUMNS.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);
    const targetColumnId: ColumnId | undefined = overColumn
      ? overColumn.id
      : overTask
        ? getColumnId(overTask)
        : undefined;

    if (!targetColumnId) return;

    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === activeId
          ? {
              ...t,
              quadrant: targetColumnId === "INBOX" ? null : (targetColumnId as EisenhowerQuadrant),
            }
          : t,
      );

      // Reorder within column
      if (activeId !== overId && overTask) {
        const columnTasks = getColumnTasks(updated, targetColumnId);
        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          const [moved] = columnTasks.splice(oldIndex, 1);
          columnTasks.splice(newIndex, 0, moved);
          // Update sortOrder
          columnTasks.forEach((t, i) => {
            t.sortOrder = i;
          });
        }
      }

      persistChanges(updated);
      return updated;
    });
  }

  // ── Task actions ──

  function toggleDone(task: TaskItem) {
    const newStatus = task.status === "DONE" ? "PENDING" : "DONE";
    // Optimistic
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );
    startTransition(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    });
  }

  function deleteTask(id: string) {
    // Optimistic
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    });
  }

  function startEdit(task: TaskItem) {
    setEditingTask(task);
    setEditText(task.text);
  }

  function saveEdit() {
    if (!editingTask || !editText.trim()) return;
    const taskId = editingTask.id;
    const text = editText.trim();
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, text } : t)),
    );
    setEditingTask(null);
    setEditText("");
    startTransition(async () => {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    });
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const inboxColumn = COLUMNS[0];
  const quadrantColumns = COLUMNS.slice(1);
  const inboxTasks = getColumnTasks(tasks, "INBOX");

  return (
    <TooltipProvider delayDuration={200}>
      <div className="animate-fade-in space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tablero Eisenhower
            </h1>
            <p className="text-sm text-muted-foreground">
              Arrastra tus tareas a los cuadrantes para priorizarlas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={hideDone ? "default" : "outline"}
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setHideDone(!hideDone)}
                >
                  {hideDone ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {hideDone ? "Ocultas" : "Completadas"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {hideDone ? "Mostrar completadas" : "Ocultar completadas"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showDump ? "default" : "outline"}
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setShowDump(!showDump)}
                >
                  <Filter className="h-3 w-3" />
                  Origen
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showDump ? "Ocultar origen" : "Mostrar origen"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Edit Dialog (inline) */}
        {editingTask && (
          <div className="animate-fade-in rounded-lg border bg-card p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Editando tarea
            </p>
            <div className="flex gap-2">
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") setEditingTask(null);
                }}
              />
              <Button size="sm" className="h-8" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8"
                onClick={() => setEditingTask(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* DnD Context */}
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Inbox — collapsible */}
          {inboxTasks.length > 0 && (
            <div className="animate-fade-in-up">
              <button
                onClick={() => setInboxCollapsed(!inboxCollapsed)}
                className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {inboxCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <Inbox className="h-4 w-4" />
                Sin clasificar
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {inboxTasks.length}
                </Badge>
              </button>
              {!inboxCollapsed && (
                <DroppableColumn
                  column={inboxColumn}
                  tasks={inboxTasks}
                  onToggleDone={toggleDone}
                  onDelete={deleteTask}
                  onEdit={startEdit}
                  isPending={isPending}
                  showDump={showDump}
                  hideDone={hideDone}
                />
              )}
            </div>
          )}

          {/* 4 Quadrants Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {quadrantColumns.map((col) => (
              <DroppableColumn
                key={col.id}
                column={col}
                tasks={getColumnTasks(tasks, col.id)}
                onToggleDone={toggleDone}
                onDelete={deleteTask}
                onEdit={startEdit}
                isPending={isPending}
                showDump={showDump}
                hideDone={hideDone}
              />
            ))}
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeTask && <DragOverlayCard task={activeTask} />}
          </DragOverlay>
        </DndContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <h3 className="mb-1 text-base font-semibold">Sin tareas</h3>
              <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                Crea un brain dump primero para tener tareas que priorizar.
              </p>
              <Button
                asChild
                className="bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20"
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
