// ============================================================
// AI Classify — Suggest Eisenhower quadrant for tasks
// ============================================================
// Takes a list of tasks and returns suggested quadrant
// classifications with confidence scores.
// ============================================================

import { getOpenAI } from "./openai";
import type { EisenhowerQuadrant } from "@/types";

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
- Q1_DO (🔴 Hacer): Urgente + Importante → Acción inmediata requerida, deadline cercano, consecuencias graves si no se hace
- Q2_SCHEDULE (🔵 Planificar): Importante pero NO Urgente → Desarrollo personal, planificación, prevención, relaciones
- Q3_DELEGATE (🟡 Delegar): Urgente pero NO Importante → Interrupciones, reuniones prescindibles, tareas mecánicas urgentes
- Q4_DELETE (⚪ Eliminar): Ni Urgente ni Importante → Distracciones, actividades de escape, tareas triviales

GUÍA DE CLASIFICACIÓN:
- Si tiene deadline explícito o implícito cercano → probablemente urgente
- Si impacta objetivos importantes o metas a largo plazo → importante
- Si es administrativa, mecánica o la puede hacer otro → Q3_DELEGATE
- Si es personal/ocio/trivial sin deadline → Q4_DELETE
- En caso de duda entre Q1 y Q2, preferir Q2 (planificar > reaccionar)
- Asigna un nivel de confianza (0.0 a 1.0) y una razón breve

Responde SOLO con JSON válido, SIN markdown ni bloques de código.`;

const USER_PROMPT = (tasks: string[]) =>
  `Clasifica estas tareas en cuadrantes Eisenhower:

${tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}

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

export async function classifyTasks(
  tasks: string[],
): Promise<ClassifyResult> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 3000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT(tasks) },
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

  const validQuadrants = new Set([
    "Q1_DO",
    "Q2_SCHEDULE",
    "Q3_DELEGATE",
    "Q4_DELETE",
  ]);

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
