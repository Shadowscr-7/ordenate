// ============================================================
// AI Pareto — Identify the vital 20% of tasks
// ============================================================
// Takes classified tasks and suggests which ones are the
// "vital few" (Pareto 80/20 principle) based on impact.
// ============================================================
import { getOpenAI } from "./openai";

export interface ParetoSuggestion {
  taskText: string;
  isPareto: boolean;
  impactScore: number; // 1-10
  reason: string;
}

export interface ParetoResult {
  suggestions: ParetoSuggestion[];
}

const SYSTEM_PROMPT = `Eres un experto en productividad y el Principio de Pareto (80/20). Tu trabajo es identificar el 20% de tareas más impactantes — las "pocas vitales" que generan el 80% de los resultados.

CRITERIOS PARA MARCAR COMO PARETO:
1. Alto impacto en objetivos importantes
2. Desbloquea otras tareas o proyectos
3. Tiene consecuencias significativas si no se hace
4. Genera valor desproporcionado respecto al esfuerzo
5. Afecta directamente ingresos, relaciones clave o metas estratégicas

CRITERIOS PARA NO MARCAR:
1. Tareas administrativas rutinarias
2. Tareas de bajo impacto o fácilmente delegables
3. Actividades de mantenimiento sin deadline
4. Tareas triviales o de ocio

REGLAS:
- Selecciona MÁXIMO el 20-30% del total de tareas como Pareto
- Asigna un impactScore de 1 a 10 (10 = máximo impacto)
- Solo marca isPareto=true para las tareas realmente vitales
- Proporciona una razón breve y clara para cada decisión

Responde SOLO con JSON válido, SIN markdown ni bloques de código.`;

const USER_PROMPT = (tasks: { text: string; quadrant: string | null }[]) =>
  `Analiza estas tareas y selecciona las "pocas vitales" (Principio de Pareto 80/20):

${tasks.map((t, i) => `${i + 1}. [${t.quadrant ?? "SIN CLASIFICAR"}] ${t.text}`).join("\n")}

Responde con este formato JSON exacto:
{
  "suggestions": [
    {
      "taskText": "texto exacto de la tarea",
      "isPareto": true,
      "impactScore": 8,
      "reason": "razón breve"
    }
  ]
}`;

export async function suggestPareto(
  tasks: { text: string; quadrant: string | null }[],
): Promise<ParetoResult> {
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

  if (!Array.isArray(parsed.suggestions)) {
    throw new Error("Invalid AI response: missing suggestions array");
  }

  return {
    suggestions: parsed.suggestions
      .filter(
        (s: Record<string, unknown>) =>
          typeof s.taskText === "string" && typeof s.isPareto === "boolean",
      )
      .map((s: Record<string, unknown>) => ({
        taskText: s.taskText as string,
        isPareto: s.isPareto as boolean,
        impactScore: typeof s.impactScore === "number" ? s.impactScore : 5,
        reason: typeof s.reason === "string" ? (s.reason as string) : "",
      })),
  };
}
