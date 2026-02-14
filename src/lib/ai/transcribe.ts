// ============================================================
// Audio Transcription with OpenAI Whisper API
// ============================================================

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<{ text: string }> {
  try {
    // Determine file extension from mime type
    let extension = "ogg";
    if (mimeType.includes("mpeg")) extension = "mp3";
    else if (mimeType.includes("m4a")) extension = "m4a";
    else if (mimeType.includes("wav")) extension = "wav";

    // Convert Buffer to Blob for File constructor
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    const file = new File([blob], `audio.${extension}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "es", // Spanish
      response_format: "json",
    });

    return { text: transcription.text };
  } catch (error) {
    console.error("[Whisper API] Transcription error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error("OPENAI_API_KEY not configured");
      }
      if (error.message.includes("quota") || error.message.includes("billing")) {
        throw new Error("OpenAI quota exceeded");
      }
      if (error.message.includes("model")) {
        throw new Error("Model not available");
      }
    }
    
    throw new Error("Failed to transcribe audio");
  }
}
