// ============================================================
// AI Classify — Suggest Eisenhower quadrant for tasks
// ============================================================
// Takes a list of tasks and returns suggested quadrant
// classifications with confidence scores.
// ============================================================
import type { EisenhowerQuadrant } from "@/types";

import { getOpenAI } from "./openai";

export interface ClassifyInput {
  text: string;
  priority?: string | null;
  feeling?: string | null;
  estimatedValue?: number | null;
  estimatedUnit?: string | null;
  category?: string | null;
}

export interface ClassifiedTask {
  text: string;
  quadrant: EisenhowerQuadrant;
  confidence: number; // 0-1
  reason: string;
}

export interface ClassifyResult {
  tasks: ClassifiedTask[];
}

const SYSTEM_PROMPT = `Eres un experto en la Matriz de Eisenhower. Tu trabajo es clasificar tareas en los 4 cuadrantes.

CUADRANTES:
- Q1_DO (🔴 Urgente e Importante): Acción inmediata, deadline cercano, consecuencias graves si no se hace
- Q2_SCHEDULE (🔵 No urgente pero importante): Desarrollo personal, planificación, prevención, relaciones
- Q3_DELEGATE (🟡 Urgente pero no importante): Interrupciones, reuniones prescindibles, tareas mecánicas urgentes  
- Q4_DELETE (⚪ No es urgente ni importante): Distracciones, actividades de escape, tareas triviales

DATOS ADICIONALES PARA CLASIFICAR:
- Si la prioridad es ALTA → probablemente Q1 o Q2
- Si la prioridad es BAJA → probablemente Q3 o Q4
- Si el sentimiento es "MUST_DO" (lo tengo que hacer sí o sí) → probablemente Q1
- Si el sentimiento es "LAZY" (me da fiaca) → probablemente Q3 o Q4
- Si el sentimiento es "WANT_TO" (quiero hacerlo) → probablemente Q2
- Tareas de poco tiempo estimado y baja importancia → Q3_DELEGATE
- Categoría TRABAJO con prioridad ALTA → probablemente Q1

GUÍA:
- Si tiene deadline explícito o implícito cercano → urgente
- Si impacta objetivos importantes → importante
- Si es administrativa/mecánica → Q3_DELEGATE
- Si es trivial sin deadline → Q4_DELETE
- En caso de duda entre Q1 y Q2, preferir Q2

Responde SOLO con JSON válido, SIN markdown ni bloques de código.`;

const USER_PROMPT = (tasks: ClassifyInput[]) =>
  `Clasifica estas tareas en cuadrantes Eisenhower:

${tasks
  .map((t, i) => {
    let line = `${i + 1}. ${t.text}`;
    if (t.priority) line += ` | Prioridad: ${t.priority}`;
    if (t.feeling) line += ` | Sentimiento: ${t.feeling}`;
    if (t.estimatedValue && t.estimatedUnit)
      line += ` | Tiempo: ${t.estimatedValue} ${t.estimatedUnit}`;
    if (t.category) line += ` | Categoría: ${t.category}`;
    return line;
  })
  .join("\n")}

Responde con este formato JSON exacto:
{
  "tasks": [
    {
      "text": "texto exacto de la tarea",
      "quadrant": "Q1_DO | Q2_SCHEDULE | Q3_DELEGATE | Q4_DELETE",
      "confidence": 0.85,
      "reason": "razón breve de la clasificación"
    }
  ]
}`;

export async function classifyTasks(tasks: string[] | ClassifyInput[]): Promise<ClassifyResult> {
  const openai = getOpenAI();

  // Normalize: accept both string[] and ClassifyInput[]
  const normalized: ClassifyInput[] = tasks.map((t) => (typeof t === "string" ? { text: t } : t));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 3000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT(normalized) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed = JSON.parse(content);

  if (!Array.isArray(parsed.tasks)) {
    throw new Error("Invalid AI response: missing tasks array");
  }

  const validQuadrants = new Set(["Q1_DO", "Q2_SCHEDULE", "Q3_DELEGATE", "Q4_DELETE"]);

  return {
    tasks: parsed.tasks
      .filter(
        (t: Record<string, unknown>) =>
          typeof t.text === "string" &&
          typeof t.quadrant === "string" &&
          validQuadrants.has(t.quadrant),
      )
      .map((t: Record<string, unknown>) => ({
        text: t.text as string,
        quadrant: t.quadrant as EisenhowerQuadrant,
        confidence: typeof t.confidence === "number" ? t.confidence : 0.5,
        reason: typeof t.reason === "string" ? (t.reason as string) : "",
      })),
  };
}
