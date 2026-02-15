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

const SYSTEM_PROMPT = `Eres un asistente experto en productividad. Tu trabajo es analizar texto desordenado (brain dumps, transcripciones de audio, notas rápidas) y extraer tareas claras y accionables.

CONTEXTO IMPORTANTE:
- El texto puede venir de una transcripción de audio, así que puede tener estilo conversacional
- Puede incluir muletillas, pausas, correcciones naturales del habla ("o sea", "bueno", "eh", etc.)
- El usuario puede estar pensando en voz alta, así que debes interpretar la intención detrás de las palabras
- Pueden mencionarse múltiples tareas en una sola frase conversacional

REGLAS PARA EXTRAER TAREAS:
1. LEE Y COMPRENDE TODO EL TEXTO antes de extraer tareas
2. Interpreta el SIGNIFICADO y la INTENCIÓN, no solo las palabras literales
3. Cada tarea debe ser una acción clara y concreta (empezar con verbo cuando sea posible)
4. Si una frase menciona múltiples cosas por hacer, sepáralas en tareas individuales
5. Elimina muletillas, pausas y palabras de relleno ("bueno", "entonces", "eh", "o sea", "pues", etc.)
6. Corrige errores de transcripción evidentes (palabras mal escritas por el audio)
7. NO inventes tareas que no estén implícitas o explícitas en el texto
8. Mantén el idioma original del usuario
9. Ignora saludos, despedidas o comentarios que no sean tareas ("hola", "gracias", "eso es todo")
10. Si el usuario dice "tengo que", "necesito", "debo", "hay que" seguido de algo, eso ES una tarea

EJEMPLOS DE INTERPRETACIÓN:
- "Tengo que llamar a Juan y también comprar pan" → ["Llamar a Juan", "Comprar pan"]
- "Bueno eh necesito revisar los emails y pues también terminar el reporte" → ["Revisar los emails", "Terminar el reporte"]
- "Mañana debo ir al médico, ah y también pagar la luz" → ["Ir al médico", "Pagar la luz"]

Responde SOLO con JSON válido, SIN markdown ni bloques de código.`;

const USER_PROMPT = (text: string) =>
  `Analiza este texto y extrae TODAS las tareas mencionadas. El texto puede ser una transcripción de audio, así que interpreta el significado detrás de las palabras:

"""
${text}
"""

IMPORTANTE: Lee TODO el texto cuidadosamente, identifica TODAS las acciones que el usuario necesita hacer, y conviértelas en tareas limpias y accionables.

Responde con este formato JSON exacto:
{
  "title": "título sugerido o null si no hay tema claro",
  "tasks": ["tarea 1", "tarea 2", ...]
}`;

export async function normalizeText(rawText: string): Promise<NormalizeResult> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
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
    tasks: parsed.tasks.filter((t: unknown) => typeof t === "string" && t.trim().length > 0),
    title: typeof parsed.title === "string" ? parsed.title : null,
  };
}
