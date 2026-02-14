// ============================================================
// Eisenhower Board — Drag & drop task prioritization
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  type EisenhowerQuadrant,
  FEELING_META,
  PRIORITY_META,
  QUADRANT_META,
  TASK_STATUS_META,
  type TaskFeeling,
  type TaskPriority,
  type TaskStatus as TaskStatusType,
} from "@/types";
import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Inbox,
  Loader2,
  Pencil,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";

import { ROUTES } from "@/lib/constants";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ─── Types ──────────────────────────────────────────────────

interface TaskItem {
  id: string;
  text: string;
  sortOrder: number;
  status: string;
  quadrant: EisenhowerQuadrant | null;
  isPareto: boolean;
  priority: TaskPriority | null;
  feeling: TaskFeeling | null;
  estimatedValue: number | null;
  estimatedUnit: string | null;
  responsible: string | null;
  leaderDecision: string | null;
  dueDate: string | null;
  category: { id: string; name: string } | null;
  brainDump: { id: string; title: string | null };
}

type ColumnId = EisenhowerQuadrant | "INBOX";

const COLUMNS: {
  id: ColumnId;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}[] = [
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
    label: "🔴 Urgente e Importante",
    description: "Acción inmediata requerida",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    id: "Q2_SCHEDULE",
    label: "🔵 No urgente pero importante",
    description: "Planificar para después",
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
  },
  {
    id: "Q3_DELEGATE",
    label: "🟡 Urgente pero no importante",
    description: "Delegar si es posible",
    color: "text-yellow-500",
    bg: "bg-yellow-500/5",
    border: "border-yellow-500/20",
  },
  {
    id: "Q4_DELETE",
    label: "⚪ No es urgente ni importante",
    description: "Considerar eliminar",
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
  return tasks.filter((t) => getColumnId(t) === columnId).sort((a, b) => a.sortOrder - b.sortOrder);
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
  onUpdateField,
  isPending,
  showDump,
  isDragDropTourTarget = false,
}: {
  task: TaskItem;
  onToggleDone: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onEdit: (task: TaskItem) => void;
  onUpdateField: (taskId: string, field: string, value: unknown) => void;
  isPending: boolean;
  showDump: boolean;
  isDragDropTourTarget?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusOptions: TaskStatusType[] = ["PENDING", "IN_PROGRESS", "DONE"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-tour={isDragDropTourTarget ? "drag-drop" : undefined}
      className={`bg-card rounded-lg border transition-all ${
        isDragging
          ? "ring-primary/30 scale-[1.02] opacity-50 shadow-lg ring-2"
          : "hover:border-primary/15 hover:shadow-sm"
      } ${task.status === "DONE" ? "opacity-60" : ""}`}
    >
      <div className="group flex items-start gap-2 px-3 py-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground/30 hover:text-muted-foreground mt-0.5 shrink-0 cursor-grab touch-none transition-colors active:cursor-grabbing"
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

        {/* Text + badges */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className={`text-[13px] leading-snug ${task.status === "DONE" ? "text-muted-foreground line-through" : ""}`}
            >
              {task.text}
            </p>
            {task.priority && (
              <span
                className={`inline-flex shrink-0 rounded px-1 py-0 text-[9px] font-bold text-white ${PRIORITY_META[task.priority].bg}`}
              >
                {PRIORITY_META[task.priority].label}
              </span>
            )}
            {task.feeling && (
              <span className="text-[10px]" title={FEELING_META[task.feeling].label}>
                {FEELING_META[task.feeling].emoji}
              </span>
            )}
            {task.category && (
              <span className="text-[10px] text-purple-500">📁 {task.category.name}</span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {showDump && task.brainDump.title && (
              <p className="text-muted-foreground/60 truncate text-[11px]">
                {task.brainDump.title}
              </p>
            )}
            {task.responsible && (
              <span className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
                <User className="h-2.5 w-2.5" /> {task.responsible}
              </span>
            )}
            {task.dueDate && (
              <span
                className={`flex items-center gap-0.5 text-[10px] ${new Date(task.dueDate) < new Date() && task.status !== "DONE" ? "font-medium text-red-500" : "text-muted-foreground/60"}`}
              >
                <Clock className="h-2.5 w-2.5" />
                {new Date(task.dueDate).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
          <button
            onClick={() => onEdit(task)}
            disabled={isPending}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded p-1"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            disabled={isPending}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded p-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="bg-muted/10 animate-fade-in space-y-2 border-t px-3 py-2">
          {/* Estado + Responsable */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground mb-0.5 block text-[10px] font-medium">
                Estado
              </label>
              <select
                className="bg-background h-6 w-full rounded border px-1.5 text-[11px]"
                value={task.status}
                onChange={(e) => onUpdateField(task.id, "status", e.target.value)}
                disabled={isPending}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-muted-foreground mb-0.5 block text-[10px] font-medium">
                Responsable
              </label>
              <Input
                className="h-6 text-[11px]"
                placeholder="Asignar persona..."
                defaultValue={task.responsible ?? ""}
                onBlur={(e) => onUpdateField(task.id, "responsible", e.target.value || null)}
                disabled={isPending}
              />
            </div>
          </div>
          {/* Pareto + Vencimiento */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-muted-foreground mb-0.5 block text-[10px] font-medium">
                Pareto 20%
              </label>
              <button
                onClick={() => onUpdateField(task.id, "isPareto", !task.isPareto)}
                disabled={isPending}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors ${
                  task.isPareto
                    ? "bg-amber-500/20 text-amber-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Star className={`h-3 w-3 ${task.isPareto ? "fill-amber-500" : ""}`} />
                {task.isPareto ? "Sí — Vital" : "No"}
              </button>
            </div>
            <div>
              <label className="text-muted-foreground mb-0.5 block text-[10px] font-medium">
                Vencimiento
              </label>
              <Input
                type="date"
                className="h-6 text-[11px]"
                defaultValue={
                  task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  onUpdateField(
                    task.id,
                    "dueDate",
                    e.target.value ? new Date(e.target.value).toISOString() : null,
                  )
                }
                disabled={isPending}
              />
            </div>
          </div>
          {/* Decisión del Líder */}
          <div>
            <label className="text-muted-foreground mb-0.5 block text-[10px] font-medium">
              Decisión del Líder
            </label>
            <Input
              className="h-6 text-[11px]"
              placeholder="Escribir decisión..."
              defaultValue={task.leaderDecision ?? ""}
              onBlur={(e) => onUpdateField(task.id, "leaderDecision", e.target.value || null)}
              disabled={isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Drag Overlay Card ──────────────────────────────────────

function DragOverlayCard({ task }: { task: TaskItem }) {
  return (
    <div className="border-primary/30 bg-card ring-primary/20 flex items-start gap-2 rounded-lg border px-3 py-2 shadow-xl ring-2">
      <GripVertical className="text-muted-foreground/30 mt-0.5 h-4 w-4 shrink-0" />
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
  onUpdateField,
  isPending,
  showDump,
  hideDone,
}: {
  column: (typeof COLUMNS)[number];
  tasks: TaskItem[];
  onToggleDone: (task: TaskItem) => void;
  onDelete: (id: string) => void;
  onEdit: (task: TaskItem) => void;
  onUpdateField: (taskId: string, field: string, value: unknown) => void;
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
        isOver ? "ring-primary/30 border-primary/30 ring-2" : ""
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-inherit px-3 py-2.5">
        <div>
          <h3 className={`text-sm font-semibold ${column.color}`}>{column.label}</h3>
          <p className="text-muted-foreground text-[11px]">{column.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] tabular-nums">
            {filtered.length}
          </Badge>
          {hideDone && doneCount > 0 && (
            <span className="text-muted-foreground text-[10px]">+{doneCount}</span>
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
              <p className="text-muted-foreground/50 text-[11px]">
                {column.id === "INBOX"
                  ? "Arrastra tareas aquí para desclasificar"
                  : "Arrastra tareas aquí"}
              </p>
            </div>
          ) : (
            filtered.map((task, index) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onToggleDone={onToggleDone}
                onDelete={onDelete}
                onEdit={onEdit}
                onUpdateField={onUpdateField}
                isPending={isPending}
                showDump={showDump}
                isDragDropTourTarget={index === 0}
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
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
  const [hideDone, setHideDone] = useState(false);
  const [showDump, setShowDump] = useState(true);
  const [inboxCollapsed, setInboxCollapsed] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editText, setEditText] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [brainDumpFilter, setBrainDumpFilter] = useState<string | null>(null);
  const [brainDumps, setBrainDumps] = useState<Array<{ id: string; title: string | null }>>([]);
  const [isPending, startTransition] = useTransition();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Check for dumpId in URL
  useEffect(() => {
    const dumpId = searchParams.get("dumpId");
    if (dumpId) {
      setBrainDumpFilter(dumpId);
    }
  }, [searchParams]);

  // Fetch brain dumps for filter
  useEffect(() => {
    const fetchDumps = async () => {
      try {
        const res = await fetch("/api/braindump");
        if (!res.ok) return;
        const { data } = await res.json();
        setBrainDumps(data?.dumps || []);
      } catch (err) {
        console.error("Error loading dumps:", err);
      }
    };
    fetchDumps();
  }, []);

  // ── Fetch ──

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const url = brainDumpFilter
        ? `/api/eisenhower?brainDumpId=${brainDumpFilter}`
        : "/api/eisenhower";
      const res = await fetch(url);
      if (!res.ok) return;
      const { data } = await res.json();
      setTasks(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [brainDumpFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Persist ──

  const persistChanges = useCallback((updatedTasks: TaskItem[]) => {
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
  }, []);

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
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
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
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, text } : t)));
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

  function updateField(taskId: string, field: string, value: unknown) {
    // Optimistic — instant UI update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t)));
    // Fire-and-forget
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function classifyWithAI() {
    const inbox = tasks.filter((t) => !t.quadrant);
    if (inbox.length === 0) return;
    setClassifying(true);
    try {
      const payload = inbox.map((t) => ({
        text: t.text,
        priority: t.priority ?? undefined,
        feeling: t.feeling ?? undefined,
        estimatedValue: t.estimatedValue ?? undefined,
        estimatedUnit: t.estimatedUnit ?? undefined,
        category: t.category?.name ?? undefined,
      }));
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: payload }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      const results = data.results as { quadrant: EisenhowerQuadrant }[];
      const updates: { id: string; quadrant: EisenhowerQuadrant }[] = [];
      inbox.forEach((t, i) => {
        if (results[i]?.quadrant) {
          updates.push({ id: t.id, quadrant: results[i].quadrant });
        }
      });
      if (updates.length > 0) {
        setTasks((prev) =>
          prev.map((t) => {
            const u = updates.find((u) => u.id === t.id);
            return u ? { ...t, quadrant: u.quadrant } : t;
          }),
        );
        // Persist each
        await Promise.all(
          updates.map((u) =>
            fetch(`/api/tasks/${u.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ quadrant: u.quadrant }),
            }),
          ),
        );
      }
    } catch {
      // ignore
    } finally {
      setClassifying(false);
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
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
            <h1 className="text-2xl font-bold tracking-tight">Tablero Eisenhower</h1>
            <p className="text-muted-foreground text-sm">
              Arrastra tus tareas a los cuadrantes para priorizarlas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={brainDumpFilter || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setBrainDumpFilter(value || null);
                }}
                disabled={loading}
                data-tour="eisenhower-filter"
                className="border-input bg-background relative z-50 h-7 rounded-md border px-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Todos los Brain Dumps</option>
                {brainDumps.map((dump) => (
                  <option key={dump.id} value={dump.id}>
                    {dump.title || "Sin título"}
                  </option>
                ))}
              </select>
              {loading && (
                <Loader2 className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 animate-spin" />
              )}
            </div>
            {brainDumpFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setBrainDumpFilter(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
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
              <TooltipContent>{showDump ? "Ocultar origen" : "Mostrar origen"}</TooltipContent>
            </Tooltip>
            {tasks.filter((t) => !t.quadrant).length > 0 && (
              <Button
                size="sm"
                className="h-7 gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs text-white shadow-md"
                onClick={classifyWithAI}
                disabled={classifying}
              >
                {classifying ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Clasificar con IA
              </Button>
            )}
          </div>
        </div>

        {/* Edit Dialog (inline) */}
        {editingTask && (
          <div className="animate-fade-in bg-card rounded-lg border p-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium">Editando tarea</p>
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

        {/* Loading overlay */}
        {loading && <LoadingOverlay message="Cargando tareas..." />}

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
                className="text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
              >
                {inboxCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <Inbox className="h-4 w-4" />
                Sin clasificar
                <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px]">
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
                  onUpdateField={updateField}
                  isPending={isPending}
                  showDump={showDump}
                  hideDone={hideDone}
                />
              )}
            </div>
          )}

          {/* 4 Quadrants Grid */}
          <div className="grid gap-3 md:grid-cols-2">
            {quadrantColumns.map((col) => {
              const tourAttr = col.id === "Q1_DO" ? "quadrant-1" : 
                               col.id === "Q2_SCHEDULE" ? "quadrant-2" : 
                               col.id === "Q3_DELEGATE" ? "quadrant-3" : 
                               col.id === "Q4_DELETE" ? "quadrant-4" : undefined;
              return (
                <div key={col.id} data-tour={tourAttr}>
                  <DroppableColumn
                    column={col}
                    tasks={getColumnTasks(tasks, col.id)}
                    onToggleDone={toggleDone}
                    onDelete={deleteTask}
                    onEdit={startEdit}
                    onUpdateField={updateField}
                    isPending={isPending}
                    showDump={showDump}
                    hideDone={hideDone}
                  />
                </div>
              );
            })}
          </div>

          {/* Drag overlay */}
          <DragOverlay>{activeTask && <DragOverlayCard task={activeTask} />}</DragOverlay>
        </DndContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="text-muted-foreground/40 mb-3 h-10 w-10" />
              <h3 className="mb-1 text-base font-semibold">Sin tareas</h3>
              <p className="text-muted-foreground mb-4 max-w-sm text-sm">
                Crea un brain dump primero para tener tareas que priorizar.
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
