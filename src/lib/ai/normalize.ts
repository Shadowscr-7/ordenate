// ============================================================
// AI Normalize — Convert raw text into clean task list
// ============================================================
// Takes messy text (brain dump style) and returns a structured
// list of clean, actionable task strings.
// ============================================================

import { getOpenAI } from "./openai";

export interface NormalizeResult {
  tasks: string[];
  title: string | null;
}

const SYSTEM_PROMPT = `Eres un asistente experto en productividad. Tu trabajo es tomar texto desordenado (un "brain dump") y convertirlo en una lista limpia de tareas claras y accionables.

REGLAS:
1. Cada tarea debe ser una acción clara y concreta (empezar con verbo cuando sea posible)
2. Eliminar duplicados o ideas repetidas
3. Separar ideas compuestas en tareas individuales
4. Limpiar errores de ortografía y gramática
5. Mantener el idioma original del usuario
6. No inventar tareas que no estén en el texto original
7. Si el texto ya tiene formato de lista, simplemente limpiarlo
8. Ignorar texto irrelevante (saludos, relleno, emojis decorativos)
9. Mantener el orden lógico del texto original
10. Si puedes detectar un título o tema general, inclúyelo

Responde SOLO con JSON válido, SIN markdown ni bloques de código.`;

const USER_PROMPT = (text: string) =>
  `Convierte este brain dump en tareas limpias:

"""
${text}
"""

Responde con este formato JSON exacto:
{
  "title": "título sugerido o null si no hay tema claro",
  "tasks": ["tarea 1", "tarea 2", ...]
}`;

export async function normalizeText(rawText: string): Promise<NormalizeResult> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT(rawText) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed = JSON.parse(content);

  // Validate structure
  if (!Array.isArray(parsed.tasks)) {
    throw new Error("Invalid AI response: missing tasks array");
  }

  return {
    tasks: parsed.tasks.filter(
      (t: unknown) => typeof t === "string" && t.trim().length > 0,
    ),
    title: typeof parsed.title === "string" ? parsed.title : null,
  };
}
