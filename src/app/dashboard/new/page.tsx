// ============================================================
// New Brain Dump Page — Capture text ideas
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Brain, Loader2, Send, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewDumpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");

  const lineCount = rawText
    .split("\n")
    .filter((l) => l.trim().length > 0).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawText.trim()) {
      setError("Escribe al menos una idea.");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/braindump", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || undefined,
            rawText: rawText.trim(),
            source: "WEB",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al crear el brain dump.");
          return;
        }

        const { data } = await res.json();
        router.push(`/dashboard/dump/${data.id}`);
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Brain Dump</h1>
        <p className="mt-1 text-muted-foreground">
          Escribe todas tus ideas, una por línea. Después podrás priorizarlas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up">
        {/* Title (optional) */}
        <div className="space-y-2">
          <Label htmlFor="title">Título (opcional)</Label>
          <Input
            id="title"
            placeholder="Ej: Ideas para el proyecto, Tareas de la semana..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            disabled={isPending}
          />
        </div>

        {/* Raw Text */}
        <div className="space-y-2">
          <Label htmlFor="rawText">Tus ideas</Label>
          <Textarea
            id="rawText"
            placeholder={`Escribe una idea por línea...\n\nEjemplo:\nTerminar presentación del lunes\nComprar regalos de navidad\nLlamar al dentista\nEstudiar para el examen\nOrganizar archivos del escritorio`}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[240px] resize-y font-mono text-sm leading-relaxed"
            disabled={isPending}
          />
          {rawText.trim() && (
            <p className="text-xs text-muted-foreground">
              {lineCount} {lineCount === 1 ? "tarea detectada" : "tareas detectadas"}
            </p>
          )}
        </div>

        {/* Tip */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Consejo:</span>{" "}
              Escribe una idea por línea. No te preocupes por el orden o la
              redacción, después podrás editarlas y clasificarlas en el tablero
              Eisenhower.
            </p>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isPending || !rawText.trim()}
            className="bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md shadow-primary/20"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Crear Brain Dump
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {lineCount > 0
              ? `Se crearán ${lineCount} tareas`
              : "Escribe algo para empezar"}
          </span>
        </div>
      </form>
    </div>
  );
}
