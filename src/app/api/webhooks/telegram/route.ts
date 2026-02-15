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

import { extractTextFromImage, transcribeAudio } from "@/lib/ai";
import { db } from "@/lib/db";
import { hasProAccess } from "@/lib/plan-gate";
import {
  type TelegramUpdate,
  answerCallbackQuery,
  extractLinkCode,
  getFileUrl,
  sendMessage,
  sendMessageWithKeyboard,
} from "@/lib/telegram";
import {
  clearPendingSession,
  getPendingSession,
  setPendingSession,
} from "@/lib/telegram-sessions";

// Threshold: when image OCR extracts this many or more tasks, ask user for choice
const MANY_TASKS_THRESHOLD = 5;

export async function POST(request: NextRequest) {
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    // ─── Handle callback query (button press) ────────────────
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return NextResponse.json({ ok: true });
    }

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

// ── Callback Query handler (button press) ────────────────────

async function handleCallbackQuery(callbackQuery: TelegramUpdate["callback_query"]) {
  if (!callbackQuery) return;

  const chatId = callbackQuery.message?.chat.id;
  if (!chatId) return;

  const data = callbackQuery.data;
  await answerCallbackQuery(callbackQuery.id);

  const user = await getUserWithWorkspace(chatId);
  if (!user) {
    await sendMessage(chatId, `❌ Tu cuenta no está vinculada.`);
    return;
  }

  const workspaceId = await requirePro(chatId, user);
  if (!workspaceId) return;

  const session = getPendingSession(chatId);
  if (!session) {
    await sendMessage(chatId, `⚠️ Sesión expirada. Envía la imagen nuevamente.`);
    return;
  }

  // ── Create in Backlog ────────────────────────────────────────
  if (data === "photo_backlog") {
    try {
      await db.backlogTask.createMany({
        data: session.tasks.map((taskText, index) => ({
          text: taskText,
          source: "TELEGRAM",
          sortOrder: index,
          workspaceId,
        })),
      });

      clearPendingSession(chatId);

      const taskWord = session.tasks.length === 1 ? "tarea" : "tareas";
      let message = `✅ Se ${session.tasks.length === 1 ? 'generó' : 'generaron'} ${session.tasks.length} ${taskWord} en el backlog`;
      
      if (session.tasks.length === 1) {
        message += `:\n\n<i>${session.tasks[0]}</i>`;
      } else {
        message += `:\n\n`;
        session.tasks.forEach((task, index) => {
          message += `${index + 1}. <i>${task}</i>\n`;
        });
      }
      
      await sendMessage(chatId, message);
    } catch (error) {
      console.error("[Telegram] Error creating backlog tasks:", error);
      await sendMessage(chatId, `❌ Error al crear las tareas. Intenta de nuevo.`);
    }
    return;
  }

  // ── Create Brain Dump ────────────────────────────────────────
  if (data === "photo_braindump") {
    // Mark session as awaiting description
    setPendingSession(chatId, session.tasks, session.source, true);
    await sendMessage(
      chatId,
      `🧠 <b>Crear Brain Dump</b>\n\n` +
        `Envíame una descripción o título para este brain dump con ${session.tasks.length} tareas.`,
    );
    return;
  }
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

  // Check if awaiting brain dump description
  const session = getPendingSession(chatId);
  if (session?.awaitingDescription) {
    try {
      const title = text.trim();
      const rawText = session.tasks.join("\n");

      // Create brain dump with tasks
      const brainDump = await db.brainDump.create({
        data: {
          title,
          rawText,
          source: "TELEGRAM",
          status: "PROCESSED",
          workspaceId,
          tasks: {
            create: session.tasks.map((taskText, index) => ({
              text: taskText,
              sortOrder: index,
              status: "PENDING",
            })),
          },
        },
      });

      clearPendingSession(chatId);

      const taskWord = session.tasks.length === 1 ? "tarea" : "tareas";
      let message = `✅ <b>Brain Dump creado exitosamente</b>\n\n` +
        `📝 <b>${title}</b>\n` +
        `📋 ${session.tasks.length} ${taskWord}\n\n`;
      
      if (session.tasks.length === 1) {
        message += `<i>${session.tasks[0]}</i>\n\n`;
      } else {
        session.tasks.forEach((task, index) => {
          message += `${index + 1}. <i>${task}</i>\n`;
        });
        message += `\n`;
      }
      
      message += `ID: <code>${brainDump.id}</code>`;
      
      await sendMessage(chatId, message);
    } catch (error) {
      console.error("[Telegram] Error creating brain dump:", error);
      await sendMessage(chatId, `❌ Error al crear el brain dump. Intenta de nuevo.`);
    }
    return;
  }

  // Normal text processing: create tasks in backlog
  try {
    // Split text by line breaks, or use entire text if no line breaks
    const taskLines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (taskLines.length === 0) {
      await sendMessage(chatId, `⚠️ No se detectó texto válido. Envía al menos una tarea.`);
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

    // Show created tasks confirmation
    const taskWord = taskLines.length === 1 ? "tarea" : "tareas";
    let message = `✅ Se ${taskLines.length === 1 ? 'generó' : 'generaron'} ${taskLines.length} ${taskWord} en el backlog`;
    
    if (taskLines.length === 1) {
      message += `:\n\n<i>${taskLines[0]}</i>`;
    } else {
      message += `:\n\n`;
      taskLines.forEach((task, index) => {
        message += `${index + 1}. <i>${task}</i>\n`;
      });
    }
    
    await sendMessage(chatId, message);
  } catch (error) {
    console.error("[Telegram] Error processing text:", error);
    await sendMessage(chatId, `❌ Error al procesar el texto. Intenta de nuevo.`);
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

    // 3. Split transcription by line breaks, or use entire text if no line breaks
    const taskLines = transcribedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (taskLines.length === 0) {
      await sendMessage(
        chatId,
        `⚠️ No se detectó texto válido en el audio.\nIntenta de nuevo.`,
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

    // Show created tasks confirmation
    const taskWord = taskLines.length === 1 ? "tarea" : "tareas";
    let message = `✅ Se ${taskLines.length === 1 ? 'generó' : 'generaron'} ${taskLines.length} ${taskWord} en el backlog`;
    
    if (taskLines.length === 1) {
      message += `:\n\n<i>${taskLines[0]}</i>`;
    } else {
      message += `:\n\n`;
      taskLines.forEach((task, index) => {
        message += `${index + 1}. <i>${task}</i>\n`;
      });
    }
    
    await sendMessage(chatId, message);
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

    // 3. Split extracted text by line breaks, or use entire text if no line breaks
    const taskLines = extractedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (taskLines.length === 0) {
      await sendMessage(
        chatId,
        `⚠️ No se detectó texto válido en la imagen.\nIntenta con otra imagen o envía el texto directamente.`,
      );
      return;
    }

    // If many tasks detected, ask user: backlog or brain dump?
    if (taskLines.length >= MANY_TASKS_THRESHOLD) {
      setPendingSession(chatId, taskLines, "IMAGE");
      await sendMessageWithKeyboard(
        chatId,
        `📷 <b>Detecté ${taskLines.length} tareas de la imagen</b>\n\n` +
          `¿Qué deseas hacer?`,
        [
          [
            { text: "📋 Crear en Backlog", callback_data: "photo_backlog" },
            { text: "🧠 Crear Brain Dump", callback_data: "photo_braindump" },
          ],
        ],
      );
      return;
    }

    // If few tasks, create directly in backlog
    await db.backlogTask.createMany({
      data: taskLines.map((taskText, index) => ({
        text: taskText,
        source: "TELEGRAM",
        sortOrder: index,
        workspaceId,
      })),
    });

    // Show created tasks confirmation
    const taskWord = taskLines.length === 1 ? "tarea" : "tareas";
    let message = `✅ Se ${taskLines.length === 1 ? 'generó' : 'generaron'} ${taskLines.length} ${taskWord} en el backlog`;
    
    if (taskLines.length === 1) {
      message += `:\n\n<i>${taskLines[0]}</i>`;
    } else {
      message += `:\n\n`;
      taskLines.forEach((task, index) => {
        message += `${index + 1}. <i>${task}</i>\n`;
      });
    }
    
    await sendMessage(chatId, message);
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
