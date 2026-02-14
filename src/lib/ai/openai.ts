// ============================================================
// OpenAI Client — Singleton
// ============================================================

import OpenAI from "openai";
import { serverEnv } from "@/lib/env";

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    const apiKey = serverEnv.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}
