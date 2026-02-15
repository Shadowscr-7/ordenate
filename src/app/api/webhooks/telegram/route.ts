// ============================================================
// Telegram Webhook — Receives messages from Telegram Bot API
// ============================================================
// Conversational flow:
//   /start OD-XXXX  → Links Telegram account
//   Text message    → Extract tasks → Create in backlog
//   Photo messages  → OCR → Extract tasks → Create in backlog
//   Voice/Audio     → Transcribe → Extract tasks → Create in backlog
// ============================================================
import { NextRequest, NextResponse } from "next/server";

import { extractTextFromImage, normalizeText, transcribeAudio } from "@/lib/ai";
import { db } from "@/lib/db";
import { hasProAccess } from "@/lib/plan-gate";
import {
  type TelegramUpdate,
  extractLinkCode,
  getFileUrl,
  sendMessage,
} from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    const message = update.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text ?? "";

    // ─── /start ──────────────────────────────────────────────
    if (text.startsWith("/start")) {
      await handleStart(chatId, text, message.from);
      return NextResponse.json({ ok: true });
    }

    // ─── Voice/Audio message ──────────────────────────────────
    if (message.voice || message.audio) {
      const voice = message.voice || message.audio;
      if (voice) {
        await handleVoiceMessage(chatId, voice.file_id, voice.mime_type);
        return NextResponse.json({ ok: true });
      }
    }

    // ─── Photo message ───────────────────────────────────────
    if (message.photo && message.photo.length > 0) {
      const caption = message.caption ?? "";
      const largestPhoto = message.photo[message.photo.length - 1];
      await handlePhotoMessage(chatId, largestPhoto.file_id, caption);
      return NextResponse.json({ ok: true });
    }

    // ─── Text message ────────────────────────────────────────
    if (text && !text.startsWith("/")) {
      await handleTextMessage(chatId, text);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    return NextResponse.json({ ok: true });
  }
}

// ─── Helpers ──────────────────────────────────────────────────

function getUserWithWorkspace(chatId: number) {
  return db.user.findUnique({
    where: { telegramChatId: String(chatId) },
    include: {
      memberships: {
        include: { workspace: { include: { subscription: true } } },
        take: 1,
      },
    },
  });
}

/** Check Pro subscription. Returns workspace if allowed, or sends denial message and returns null. */
async function requirePro(
  chatId: number,
  user: NonNullable<Awaited<ReturnType<typeof getUserWithWorkspace>>>,
): Promise<string | null> {
  const workspace = user.memberships[0]?.workspace;
  if (!workspace) {
    await sendMessage(chatId, `❌ No se encontró tu workspace. Contacta soporte.`);
    return null;
  }
  const gate = await hasProAccess(workspace.id);
  if (!gate.allowed) {
    await sendMessage(
      chatId,
      `🔒 <b>Función Pro</b>\n\nEl bot de Telegram es una función exclusiva del plan Pro.\nActualiza tu plan desde la app web para usarlo. ✨`,
    );
    return null;
  }
  return workspace.id;
}

// ─── Handlers ─────────────────────────────────────────────────

async function handleStart(
  chatId: number,
  text: string,
  from: { first_name: string; username?: string },
) {
  const code = extractLinkCode(text);

  if (!code) {
    await sendMessage(
      chatId,
      `👋 ¡Hola ${from.first_name}!\n\n` +
        `Soy el bot de <b>Ordénate</b>.\n\n` +
        `Para vincular tu cuenta, escanea el código QR desde tu dashboard en la app web.\n\n` +
        `Una vez vinculado, podrás enviarme:\n` +
        `📝 <b>Texto</b> → tareas escritas\n` +
        `📷 <b>Foto</b> → extraigo tareas de imágenes\n` +
        `🎤 <b>Audio</b> → transcribo tus ideas\n\n` +
        `¡Empieza ahora! 🧠`,
    );
    return;
  }

  const codeLC = code.toLowerCase();
  const user = await db.user.findFirst({
    where: { id: { startsWith: codeLC } },
  });

  if (!user) {
    await sendMessage(
      chatId,
      `❌ Código de vinculación no válido.\nAsegúrate de escanear el QR desde tu dashboard.`,
    );
    return;
  }

  const existingLink = await db.user.findUnique({
    where: { telegramChatId: String(chatId) },
  });

  if (existingLink && existingLink.id !== user.id) {
    await sendMessage(
      chatId,
      `⚠️ Esta cuenta de Telegram ya está vinculada a otro usuario.\nDesvincula primero desde la app web.`,
    );
    return;
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      telegramChatId: String(chatId),
      telegramLinkedAt: new Date(),
    },
  });

  await sendMessage(
    chatId,
    `✅ ¡Cuenta vinculada exitosamente!\n\n` +
      `Hola <b>${user.name ?? user.email}</b>, ahora puedes:\n\n` +
      `📝 Enviarme <b>texto</b> con tus tareas\n` +
      `📷 Enviarme una <b>foto</b> y la proceso con OCR\n` +
      `🎤 Enviarme un <b>audio</b> y lo transcribo\n\n` +
      `¡Empieza ahora! Escríbeme lo que tengas en mente. 🧠`,
  );
}

// ── Text message handler ─────────────────────────────────────

async function handleTextMessage(chatId: number, text: string) {
  const user = await getUserWithWorkspace(chatId);

  if (!user) {
    await sendMessage(
      chatId,
      `🔗 Tu cuenta de Telegram no está vinculada.\nEscanea el código QR desde tu dashboard en <b>Ordénate</b>.`,
    );
    return;
  }

  const workspaceId = await requirePro(chatId, user);
  if (!workspaceId) return;

  await sendMessage(chatId, `📝 Procesando con IA... ⏳`);

  try {
    // Use AI to extract and normalize tasks
    const normalized = await normalizeText(text);
    const taskLines = normalized.tasks;

    if (taskLines.length === 0) {
      await sendMessage(chatId, `⚠️ No detecté tareas válidas. Envía texto con una o más tareas.`);
      return;
    }

    // Create tasks directly in backlog
    await db.backlogTask.createMany({
      data: taskLines.map((taskText, index) => ({
        text: taskText,
        source: "TELEGRAM",
        sortOrder: index,
        workspaceId,
      })),
    });

    // Show extracted tasks confirmation
    let tasksList = "";
    taskLines.forEach((task, i) => {
      tasksList += `${i + 1}. ${task}\n`;
    });

    const taskWord = taskLines.length === 1 ? "tarea" : "tareas";
    await sendMessage(
      chatId,
      `✅ <b>${taskLines.length} ${taskWord} creadas en el backlog</b>\n\n` +
        `📝 <b>Tareas detectadas:</b>\n\n` +
        `${tasksList}\n` +
        `Abre la app en la sección <b>Backlog</b> para organizarlas. 🎯`,
    );
  } catch (error) {
    console.error("[Telegram] Error processing text:", error);

    let errorMessage = `❌ Error al procesar el texto. Intenta de nuevo.`;

    if (error instanceof Error) {
      if (error.message.includes("OPENAI_API_KEY")) {
        errorMessage = `⚠️ El servicio de IA no está configurado. Contacta al administrador.`;
      } else if (error.message.includes("quota") || error.message.includes("billing")) {
        errorMessage = `⚠️ El servicio de IA ha alcanzado su límite. Intenta más tarde.`;
      }
    }

    await sendMessage(chatId, errorMessage);
  }
}

// ── Voice/Audio handler ─────────────────────────────────────

async function handleVoiceMessage(chatId: number, fileId: string, mimeType?: string) {
  const user = await getUserWithWorkspace(chatId);

  if (!user) {
    await sendMessage(
      chatId,
      `🔗 Tu cuenta de Telegram no está vinculada.\nEscanea el código QR desde tu dashboard en <b>Ordénate</b>.`,
    );
    return;
  }

  const workspaceId = await requirePro(chatId, user);
  if (!workspaceId) return;

  await sendMessage(chatId, `🎤 Audio recibido. Transcribiendo… ⏳`);

  try {
    // 1. Download audio from Telegram
    const fileUrl = await getFileUrl(fileId);
    if (!fileUrl) {
      console.error(`[Telegram] Failed to get file URL for fileId: ${fileId}`);
      await sendMessage(chatId, `❌ No se pudo descargar el audio. Intenta de nuevo.`);
      return;
    }

    const audioResponse = await fetch(fileUrl);
    if (!audioResponse.ok) {
      console.error(`[Telegram] Failed to fetch audio: ${audioResponse.status}`);
      await sendMessage(chatId, `❌ No se pudo descargar el audio. Intenta de nuevo.`);
      return;
    }

    const buffer = Buffer.from(await audioResponse.arrayBuffer());

    // 2. Transcribe with Whisper API
    const transcription = await transcribeAudio(buffer, mimeType || "audio/ogg");
    const transcribedText = transcription.text?.trim();

    if (!transcribedText) {
      await sendMessage(
        chatId,
        `⚠️ No se pudo transcribir el audio.\nIntenta de nuevo o envía el texto directamente.`,
      );
      return;
    }

    // 3. AI Normalize to extract tasks
    const normalized = await normalizeText(transcribedText);
    const taskLines = normalized.tasks;

    if (taskLines.length === 0) {
      await sendMessage(
        chatId,
        `⚠️ No se detectaron tareas en el audio.\n\n` +
          `<i>Transcripción: "${transcribedText}"</i>\n\n` +
          `Intenta con otro audio o envía el texto directamente.`,
      );
      return;
    }

    // Create tasks directly in backlog
    await db.backlogTask.createMany({
      data: taskLines.map((taskText, index) => ({
        text: taskText,
        source: "TELEGRAM",
        sortOrder: index,
        workspaceId,
      })),
    });

    // Show transcribed tasks confirmation
    let tasksList = "";
    taskLines.forEach((task, i) => {
      tasksList += `${i + 1}. ${task}\n`;
    });

    const taskWord = taskLines.length === 1 ? "tarea" : "tareas";
    await sendMessage(
      chatId,
      `✅ <b>${taskLines.length} ${taskWord} creadas en el backlog</b>\n\n` +
        `🎤 <b>Tareas detectadas:</b>\n\n` +
        `${tasksList}\n` +
        `Abre la app en la sección <b>Backlog</b> para organizarlas. 🎯`,
    );
  } catch (err) {
    console.error("[Telegram] Voice processing error:", err);

    let errorMessage = `❌ Error al procesar el audio. Intenta de nuevo o envía el texto directamente.`;

    if (err instanceof Error) {
      if (err.message.includes("OPENAI_API_KEY")) {
        errorMessage = `⚠️ El servicio de transcripción no está configurado. Contacta al administrador.`;
      } else if (err.message.includes("quota") || err.message.includes("billing")) {
        errorMessage = `⚠️ El servicio de transcripción ha alcanzado su límite. Intenta más tarde.`;
      }
    }

    await sendMessage(chatId, errorMessage);
  }
}

// ── Photo handler ─────────────────────────────────────────────

async function handlePhotoMessage(chatId: number, fileId: string, _caption: string) {
  const user = await getUserWithWorkspace(chatId);

  if (!user) {
    await sendMessage(
      chatId,
      `🔗 Tu cuenta de Telegram no está vinculada.\nEscanea el código QR desde tu dashboard en <b>Ordénate</b>.`,
    );
    return;
  }

  const workspaceId = await requirePro(chatId, user);
  if (!workspaceId) return;

  await sendMessage(chatId, `📷 Imagen recibida. Procesando con IA… ⏳`);

  try {
    // 1. Download image from Telegram
    const fileUrl = await getFileUrl(fileId);
    if (!fileUrl) {
      console.error(`[Telegram] Failed to get file URL for fileId: ${fileId}`);
      await sendMessage(chatId, `❌ No se pudo descargar la imagen. Intenta de nuevo.`);
      return;
    }

    const imgResponse = await fetch(fileUrl);
    if (!imgResponse.ok) {
      console.error(`[Telegram] Failed to fetch image: ${imgResponse.status}`);
      await sendMessage(chatId, `❌ No se pudo descargar la imagen. Intenta de nuevo.`);
      return;
    }

    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    const base64 = buffer.toString("base64");

    // Ensure we have a valid image MIME type
    let contentType = imgResponse.headers.get("content-type") ?? "";
    // Validate and normalize MIME type
    if (!contentType || !contentType.startsWith("image/")) {
      // Detect from file signature if possible
      const signature = buffer.slice(0, 4).toString("hex");
      if (signature.startsWith("ffd8ff")) {
        contentType = "image/jpeg";
      } else if (signature.startsWith("89504e47")) {
        contentType = "image/png";
      } else if (signature.startsWith("47494638")) {
        contentType = "image/gif";
      } else if (signature.startsWith("52494646") && buffer.slice(8, 12).toString() === "WEBP") {
        contentType = "image/webp";
      } else {
        contentType = "image/jpeg"; // Default fallback
      }
    }

    // 2. OCR — extract text from image
    const ocr = await extractTextFromImage(base64, contentType);
    const extractedText = ocr.text?.trim();

    if (!extractedText) {
      await sendMessage(
        chatId,
        `⚠️ No se pudo extraer texto de la imagen.\nIntenta con una foto más clara o envía el texto directamente.`,
      );
      return;
    }

    // 3. AI Normalize + Classify
    const normalized = await normalizeText(extractedText);
    const taskLines = normalized.tasks;

    if (taskLines.length === 0) {
      await sendMessage(
        chatId,
        `⚠️ No se detectaron tareas en la imagen.\nIntenta con otra imagen o envía el texto directamente.`,
      );
      return;
    }

    // Create tasks directly in backlog
    await db.backlogTask.createMany({
      data: taskLines.map((taskText, index) => ({
        text: taskText,
        source: "TELEGRAM",
        sortOrder: index,
        workspaceId,
      })),
    });

    // Show extracted tasks confirmation
    let tasksList = "";
    taskLines.forEach((task, i) => {
      tasksList += `${i + 1}. ${task}\n`;
    });

    const taskWord = taskLines.length === 1 ? "tarea" : "tareas";
    await sendMessage(
      chatId,
      `✅ <b>${taskLines.length} ${taskWord} creadas en el backlog</b>\n\n` +
        `📷 <b>Tareas detectadas:</b>\n\n` +
        `${tasksList}\n` +
        `Abre la app en la sección <b>Backlog</b> para organizarlas. 🎯`,
    );
  } catch (err) {
    console.error("[Telegram] Photo processing error:", err);

    let errorMessage = `❌ Error al procesar la imagen. Intenta de nuevo o envía el texto directamente.`;

    if (err instanceof Error) {
      if (err.message.includes("OPENAI_API_KEY")) {
        errorMessage = `⚠️ El servic de OCR no está configurado. Contacta al administrador.`;
      } else if (err.message.includes("quota") || err.message.includes("billing")) {
        errorMessage = `⚠️ El servicio de OCR ha alcanzado su límite. Intenta más tarde.`;
      }
    }

    await sendMessage(chatId, errorMessage);
  }
}
