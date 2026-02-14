// ============================================================
// AI OCR — Extract text from images using OpenAI Vision
// ============================================================
// Accepts a base64-encoded image and extracts text content.
// No external storage needed — image sent directly to GPT-4o.
// ============================================================
import { getOpenAI } from "./openai";

export interface OCRResult {
  text: string;
}

const SYSTEM_PROMPT = `Eres un asistente de OCR especializado. Tu trabajo es extraer TODO el texto visible de una imagen.

REGLAS:
1. Extrae cada línea de texto visible, una por línea
2. Mantener el orden de lectura natural (arriba→abajo, izquierda→derecha)
3. Preservar la estructura del texto (listas, viñetas, numeración)
4. No interpretar ni modificar el texto — transcribir tal cual
5. Si hay texto manuscrito, hacer tu mejor esfuerzo para transcribirlo
6. Si no hay texto visible, responder con texto vacío
7. Ignorar elementos decorativos, logos o imágenes sin texto

Responde SOLO con JSON válido, SIN markdown ni bloques de código.`;

export async function extractTextFromImage(
  base64Image: string,
  mimeType: string = "image/jpeg",
): Promise<OCRResult> {
  const openai = getOpenAI();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Extrae todo el texto visible de esta imagen. Responde con JSON: { "text": "texto extraído" }',
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[OCR] OpenAI returned empty response", { response });
      throw new Error("OpenAI returned empty response");
    }

    const parsed = JSON.parse(content);

    return {
      text: typeof parsed.text === "string" ? parsed.text : "",
    };
  } catch (error) {
    console.error("[OCR] Error extracting text from image:", error);
    if (error instanceof Error) {
      throw new Error(`OCR failed: ${error.message}`);
    }
    throw error;
  }
}
