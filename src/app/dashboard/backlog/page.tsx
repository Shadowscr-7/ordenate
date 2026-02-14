"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { toast } from "sonner";
import { Plus, Trash2, ArrowRight, ListPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface BacklogTask {
  id: string;
  text: string;
  source: string;
  quadrant?: string;
  createdAt: string;
}

interface BrainDump {
  id: string;
  title: string;
  createdAt: string;
  taskCount: number;
}

export default function BacklogPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<BacklogTask[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);
  
  // Dialog states
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDumpId, setSelectedDumpId] = useState("");
  const [newDumpTitle, setNewDumpTitle] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  useEffect(() => {
    fetchBacklog();
  }, []);

  async function fetchBacklog() {
    try {
      setLoading(true);
      const [backlogRes, dumpsRes] = await Promise.all([
        fetch("/api/backlog"),
        fetch("/api/braindump?limit=20"),
      ]);

      if (backlogRes.ok) {
        const response = await backlogRes.json();
        setTasks(response.data?.tasks || []);
      }

      if (dumpsRes.ok) {
        const response = await dumpsRes.json();
        setBrainDumps(
          (response.data?.dumps || []).map((d: { id: string; title: string; createdAt: string; _count?: { tasks: number } }) => ({
            id: d.id,
            title: d.title || "Sin título",
            createdAt: d.createdAt,
            taskCount: d._count?.tasks || 0,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching backlog:", error);
      toast.error("Error al cargar el backlog");
    } finally {
      setLoading(false);
    }
  }

  function toggleTask(taskId: string) {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }

  function toggleAll() {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)));
    }
  }

  async function handleDelete() {
    if (selectedTasks.size === 0) {
      toast.error("Selecciona al menos una tarea");
      return;
    }

    if (!confirm(`¿Eliminar ${selectedTasks.size} tareas del backlog?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const promises = Array.from(selectedTasks).map((id) =>
        fetch(`/api/backlog?id=${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      toast.success("Tareas eliminadas");
      setSelectedTasks(new Set());
      fetchBacklog();
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast.error("Error al eliminar tareas");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateTask() {
    const text = newTaskText.trim();
    if (!text) {
      toast.error("Escribe una tarea");
      return;
    }

    try {
      setCreatingTask(true);
      const res = await fetch("/api/backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error("Failed to create task");
      }

      toast.success("Tarea creada");
      setNewTaskText("");
      fetchBacklog();
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Error al crear tarea");
    } finally {
      setCreatingTask(false);
    }
  }

  async function handleMoveToDump() {
    if (!selectedDumpId) {
      toast.error("Selecciona un brain dump");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/backlog/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: Array.from(selectedTasks),
          brainDumpId: selectedDumpId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to move tasks");
      }

      const data = await res.json();
      toast.success(`${data.movedCount} tareas movidas al brain dump`);
      setSelectedTasks(new Set());
      setShowMoveDialog(false);
      setSelectedDumpId("");
      fetchBacklog();
    } catch (error) {
      console.error("Error moving tasks:", error);
      toast.error("Error al mover tareas");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCreateDump() {
    if (!newDumpTitle.trim()) {
      toast.error("Ingresa un título");
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch("/api/backlog/create-dump", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: Array.from(selectedTasks),
          title: newDumpTitle.trim(),
          useAI,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create dump");
      }

      const data = await res.json();
      toast.success(`Brain dump creado con ${data.taskCount} tareas`);
      setSelectedTasks(new Set());
      setShowCreateDialog(false);
      setNewDumpTitle("");
      setUseAI(false);
      router.push(`/dashboard/dump/${data.brainDump.id}`);
    } catch (error) {
      console.error("Error creating dump:", error);
      toast.error("Error al crear brain dump");
    } finally {
      setActionLoading(false);
    }
  }

  const getQuadrantBadge = (quadrant?: string) => {
    if (!quadrant) return null;
    const colors = {
      Q1_DO: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      Q2_SCHEDULE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      Q3_DELEGATE: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      Q4_DELETE: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
    };
    const labels = {
      Q1_DO: "Hacer",
      Q2_SCHEDULE: "Programar",
      Q3_DELEGATE: "Delegar",
      Q4_DELETE: "Eliminar",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[quadrant as keyof typeof colors]}`}>
        {labels[quadrant as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return <LoadingOverlay message="Cargando backlog..." />;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {actionLoading && <LoadingOverlay message="Procesando tareas..." />}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Backlog</h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length} {tasks.length === 1 ? "tarea" : "tareas"} pendientes
          </p>
        </div>
      </div>

      {/* Add new task */}
      <Card className="p-3 mb-6 bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Escribe una tarea y presiona Enter..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !creatingTask) {
                handleCreateTask();
              }
            }}
            disabled={creatingTask}
            className="flex-1"
          />
          <Button
            onClick={handleCreateTask}
            disabled={creatingTask || !newTaskText.trim()}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </Button>
        </div>
      </Card>

      {selectedTasks.size > 0 && (
        <Card className="p-3 mb-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-primary">
              {selectedTasks.size} {selectedTasks.size === 1 ? "tarea seleccionada" : "tareas seleccionadas"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowMoveDialog(true)}
                disabled={actionLoading}
                className="gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                Mover a dump
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                disabled={actionLoading}
                className="gap-1.5"
              >
                <ListPlus className="w-4 h-4" />
                Crear dump
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={actionLoading}
                className="gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {tasks.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <ListPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No hay tareas en el backlog</h3>
            <p className="text-muted-foreground mb-6">
              Las tareas que envíes por Telegram o agregues manualmente aparecerán aquí.
            </p>
            <Button onClick={() => router.push("/dashboard/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Crear brain dump
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1 py-2 px-1">
            <Checkbox
              checked={selectedTasks.size === tasks.length}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => toggleAll()}>
              Seleccionar todas
            </span>
          </div>

          {tasks.map((task) => (
            <Card key={task.id} className="p-3 hover:border-primary/50 transition-all hover:shadow-sm">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedTasks.has(task.id)}
                  onCheckedChange={() => toggleTask(task.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1.5 leading-snug">{task.text}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getQuadrantBadge(task.quadrant)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(task.createdAt).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {task.source === "TELEGRAM" && (
                      <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                        Telegram
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Move to dump dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover tareas a un brain dump</DialogTitle>
            <DialogDescription>
              Selecciona el brain dump donde quieres mover las {selectedTasks.size} tareas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {brainDumps.map((dump) => (
              <button
                key={dump.id}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedDumpId === dump.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 hover:bg-accent/50"
                }`}
                onClick={() => setSelectedDumpId(dump.id)}
              >
                <div className="font-medium">{dump.title}</div>
                <div className="text-sm text-muted-foreground">
                  {dump.taskCount} tareas · {new Date(dump.createdAt).toLocaleDateString("es-ES")}
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleMoveToDump} disabled={!selectedDumpId || actionLoading}>
              Mover tareas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create dump dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear brain dump desde backlog</DialogTitle>
            <DialogDescription>
              Crea un nuevo brain dump con las {selectedTasks.size} tareas seleccionadas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ej: Tareas de la semana"
                value={newDumpTitle}
                onChange={(e) => setNewDumpTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useAI"
                checked={useAI}
                onCheckedChange={(checked: boolean) => setUseAI(checked)}
              />
              <label
                htmlFor="useAI"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Clasificar con IA (Eisenhower)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDump} disabled={!newDumpTitle.trim() || actionLoading}>
              Crear brain dump
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
