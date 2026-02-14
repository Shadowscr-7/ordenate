// ============================================================
// AI Module — Public API barrel export
// ============================================================

export { getOpenAI } from "./openai";
export { normalizeText, type NormalizeResult } from "./normalize";
export { classifyTasks, type ClassifiedTask, type ClassifyResult } from "./classify";
export { extractTextFromImage, type OCRResult } from "./ocr";
export { suggestPareto, type ParetoSuggestion, type ParetoResult } from "./pareto";
