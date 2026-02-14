// ============================================================
// New Brain Dump Page — Text + Image + AI Processing
// ============================================================
// Three input modes:
//   1. Texto — Type ideas, one per line
//   2. Imagen — Upload photo → OCR extract → editable text
//   3. AI toggle — Process with AI (normalize + classify)
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  Camera,
  Check,
  ImageIcon,
  Lightbulb,
  Loader2,
  Lock,
  Send,
  Sparkles,
  Type,
  Upload,
  X,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ──────────────────────────────────────────────────

type InputMode = "text" | "image";

type ProcessingStep =
  | "idle"
  | "uploading"
  | "ocr"
  | "normalizing"
  | "classifying"
  | "saving"
  | "done"
  | "error";

const STEP_LABELS: Record<ProcessingStep, string> = {
  idle: "",
  uploading: "Subiendo imagen…",
  ocr: "Extrayendo texto de la imagen…",
  normalizing: "IA normalizando tareas…",
  classifying: "IA clasificando en Eisenhower…",
  saving: "Guardando brain dump…",
  done: "¡Listo!",
  error: "Error en el procesamiento",
};

const STEP_ORDER: ProcessingStep[] = [
  "uploading",
  "ocr",
  "normalizing",
  "classifying",
  "saving",
  "done",
];

// ─── Component ──────────────────────────────────────────────

export default function NewDumpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [useAI, setUseAI] = useState(true);

  // Image state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [ocrDone, setOcrDone] = useState(false);

  // Processing state
  const [processingStep, setProcessingStep] = useState<ProcessingStep>("idle");

  // Plan info (for gating Pro features like OCR)
  const [isPro, setIsPro] = useState(true); // default true to avoid flash
  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((d) => setIsPro(d.data?.plan === "PRO"))
      .catch(() => setIsPro(false));
  }, []);

  const lineCount = rawText.split("\n").filter((l) => l.trim().length > 0).length;

  // ── Image handling ──

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no puede superar 10 MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Formato no soportado. Usa JPG, PNG, WebP o GIF.");
      return;
    }

    setError("");
    setImageMimeType(file.type);
    setOcrDone(false);
    setRawText("");

    // Preview
    const previewReader = new FileReader();
    previewReader.onload = () => setImagePreview(previewReader.result as string);
    previewReader.readAsDataURL(file);

    // Base64 for API
    const b64Reader = new FileReader();
    b64Reader.onload = () => {
      const dataUrl = b64Reader.result as string;
      // Strip data:image/...;base64, prefix
      const base64 = dataUrl.split(",")[1];
      setImageBase64(base64);
    };
    b64Reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setOcrDone(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // ── OCR ──

  async function runOCR() {
    if (!imageBase64) return;

    setError("");
    setProcessingStep("ocr");

    try {
      const res = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mimeType: imageMimeType }),
      });

      const { data, error: apiErr } = await res.json();
      if (!res.ok) {
        setError(apiErr || "Error al extraer texto de la imagen.");
        setProcessingStep("error");
        return;
      }

      setRawText(data.text);
      setOcrDone(true);
      setProcessingStep("idle");
    } catch {
      setError("Error de conexión al servicio de OCR.");
      setProcessingStep("error");
    }
  }

  // ── Submit ──

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawText.trim()) {
      setError("Escribe al menos una idea.");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        // Show processing steps
        if (useAI) {
          setProcessingStep("normalizing");
        } else {
          setProcessingStep("saving");
        }

        const res = await fetch("/api/braindump", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim() || undefined,
            rawText: rawText.trim(),
            source: inputMode === "image" ? "IMAGE" : "WEB",
            useAI,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Error al crear el brain dump.");
          setProcessingStep("error");
          return;
        }

        setProcessingStep("done");
        const { data } = await res.json();

        // Brief pause to show "done" state
        await new Promise((r) => setTimeout(r, 600));
        router.push(`/dashboard/dump/${data.id}`);
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
        setProcessingStep("error");
      }
    });
  }

  const isProcessing =
    processingStep !== "idle" && processingStep !== "done" && processingStep !== "error";

  // ── Render ──

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Brain Dump</h1>
        <p className="text-muted-foreground mt-1">
          Escribe o sube una foto con tus ideas. La IA las organiza por ti.
        </p>
      </div>

      {/* Input Mode Tabs */}
      <div className="animate-fade-in flex gap-2">
        <Button
          variant={inputMode === "text" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setInputMode("text")}
          disabled={isProcessing}
        >
          <Type className="h-4 w-4" />
          Texto
        </Button>
        <Button
          variant={inputMode === "image" ? "default" : "outline"}
          size="sm"
          className="gap-2"
          onClick={() => setInputMode("image")}
          disabled={isProcessing || !isPro}
          title={!isPro ? "Función Pro — Actualiza tu plan" : undefined}
        >
          <Camera className="h-4 w-4" />
          Imagen
          {!isPro && <Lock className="text-muted-foreground h-3 w-3" />}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="animate-fade-in-up space-y-5">
        {/* Title (optional) */}
        <div className="space-y-2">
          <Label htmlFor="title">Título (opcional)</Label>
          <Input
            id="title"
            placeholder={
              useAI ? "La IA sugerirá un título si lo dejas vacío" : "Ej: Tareas de la semana..."
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            disabled={isProcessing}
          />
        </div>

        {/* ── Image Upload ── */}
        {inputMode === "image" && (
          <div className="space-y-3">
            <Label>Imagen</Label>

            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border-muted-foreground/20 bg-muted/20 hover:border-primary/40 hover:bg-muted/40 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 transition-colors"
              >
                <div className="bg-primary/10 rounded-full p-3">
                  <Upload className="text-primary h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Haz clic para subir una imagen</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    JPG, PNG, WebP o GIF — Máx 10 MB
                  </p>
                </div>
              </button>
            ) : (
              <div className="bg-card relative overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-64 w-full bg-black/5 object-contain"
                />
                <div className="flex items-center justify-between border-t px-3 py-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="text-muted-foreground h-4 w-4" />
                    <span className="text-muted-foreground text-xs">
                      {ocrDone ? (
                        <span className="flex items-center gap-1 text-green-500">
                          <Check className="h-3 w-3" /> Texto extraído
                        </span>
                      ) : (
                        "Imagen cargada"
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!ocrDone && (
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        className="h-7 gap-1.5 text-xs"
                        onClick={runOCR}
                        disabled={isProcessing || !imageBase64}
                      >
                        {processingStep === "ocr" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        Extraer texto
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={clearImage}
                      disabled={isProcessing}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        )}

        {/* ── Text Area ── */}
        {(inputMode === "text" || ocrDone) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rawText">{ocrDone ? "Texto extraído (editable)" : "Tus ideas"}</Label>
              {rawText.trim() && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {lineCount} {lineCount === 1 ? "tarea" : "tareas"} detectadas
                </span>
              )}
            </div>
            <Textarea
              id="rawText"
              placeholder={
                ocrDone
                  ? "El texto extraído de la imagen aparecerá aquí. Puedes editarlo antes de procesar."
                  : `Escribe una idea por línea...\n\nEjemplo:\nTerminar presentación del lunes\nComprar regalos de navidad\nLlamar al dentista\nEstudiar para el examen`
              }
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="min-h-[200px] resize-y font-mono text-sm leading-relaxed"
              disabled={isProcessing}
            />
          </div>
        )}

        {/* ── AI Toggle ── */}
        <Card
          className={`border transition-colors ${useAI ? "border-primary/30 bg-primary/5" : "border-muted"}`}
        >
          <CardContent className="flex items-center gap-4 py-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Zap className={`h-4 w-4 ${useAI ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">Procesar con IA</span>
                {useAI && (
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    GPT-4o mini
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {useAI
                  ? "La IA limpiará el texto, normalizará las tareas y sugerirá clasificación Eisenhower"
                  : "Cada línea se convertirá en una tarea tal cual"}
              </p>
            </div>
            <Switch checked={useAI} onCheckedChange={setUseAI} disabled={isProcessing} />
          </CardContent>
        </Card>

        {/* Tip */}
        {!useAI && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-start gap-3 py-3">
              <Lightbulb className="text-primary mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-muted-foreground text-xs">
                <span className="text-foreground font-medium">Consejo:</span> Escribe una idea por
                línea. Después podrás editarlas y clasificarlas en el tablero Eisenhower.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Processing Progress ── */}
        {isProcessing && (
          <Card className="border-primary/30 bg-primary/5 animate-fade-in">
            <CardContent className="py-4">
              <div className="mb-3 flex items-center gap-3">
                <Loader2 className="text-primary h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">{STEP_LABELS[processingStep]}</span>
              </div>
              <div className="space-y-2">
                {STEP_ORDER.slice(0, STEP_ORDER.indexOf(processingStep) + 1).map((step) => (
                  <div key={step} className="flex items-center gap-2 text-xs">
                    {step === processingStep ? (
                      <Loader2 className="text-primary h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3 text-green-500" />
                    )}
                    <span
                      className={
                        step === processingStep ? "text-foreground" : "text-muted-foreground"
                      }
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-lg border px-3 py-2">
            <X className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={isPending || !rawText.trim() || isProcessing}
            className="from-primary shadow-primary/20 bg-gradient-to-r to-cyan-500 text-white shadow-md"
          >
            {isPending || isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              <>
                {useAI ? <Sparkles className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                {useAI ? "Crear con IA" : "Crear Brain Dump"}
              </>
            )}
          </Button>
          <span className="text-muted-foreground text-xs">
            {lineCount > 0
              ? useAI
                ? `${lineCount} líneas → IA normalizará + clasificará`
                : `Se crearán ${lineCount} tareas`
              : inputMode === "image" && !ocrDone
                ? "Sube una imagen y extrae el texto"
                : "Escribe algo para empezar"}
          </span>
        </div>
      </form>
    </div>
  );
}
