// ============================================================
// Telegram Webhook — Receives messages from Telegram Bot API
// ============================================================
// Conversational flow:
//   /start OD-XXXX  → Links Telegram account
//   Text message    → Extract tasks → Ask destination (brain/backlog)
//   Photo messages  → OCR → Extract tasks → Ask destination
//   Voice/Audio     → Transcribe → Extract tasks → Review → Ask destination
// ============================================================
import { NextRequest, NextResponse } from "next/server";

import { extractTextFromImage, normalizeText, transcribeAudio } from "@/lib/ai";
import { db } from "@/lib/db";
import { hasProAccess } from "@/lib/plan-gate";
import {
  type TelegramUpdate,
  answerCallbackQuery,
  editMessageText,
  extractLinkCode,
  getFileUrl,
  sendMessage,
  sendMessageWithKeyboard,
} from "@/lib/telegram";
import { clearPendingSession, getPendingSession, setPendingSession } from "@/lib/telegram-sessions";

export async function POST(request: NextRequest) {
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    // ─── Callback Query (button press) ────────────────────────
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

function parseLines(text: string): string[] {
  return text
    .split(/\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);
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

  // Check if there's a pending session waiting for brain name
  const session = getPendingSession(chatId);
  if (session) {
    // User is providing the brain dump name
    const brainName = text.trim();

    try {
      // Create brain dump with tasks
      await db.brainDump.create({
        data: {
          title: brainName,
          workspaceId,
          source: "TELEGRAM",
          status: "DRAFT",
          rawText: session.tasks.join("\n"),
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
      await sendMessage(
        chatId,
        `✅ <b>Brain Dump creado</b>\n\n` +
          `📂 Nombre: <b>${brainName}</b>\n` +
          `📝 ${session.tasks.length} ${taskWord} agregadas\n\n` +
          `Abre la app para verlo. 🎯`,
      );
      return;
    } catch (error) {
      console.error("[Telegram] Error creating brain dump:", error);
      await sendMessage(chatId, `❌ Error al crear el brain dump. Intenta de nuevo.`);
      return;
    }
  }

  // Normal text message flow (no pending session)
  const lines = parseLines(text);

  if (lines.length === 0) {
    await sendMessage(chatId, `⚠️ No detecté tareas válidas. Envía texto con una o más tareas.`);
    return;
  }

  // Save pending session
  setPendingSession(chatId, lines, "TEXT");

  // Show tasks and ask destination
  await showTasksAndAskDestination(chatId, lines, "TEXT");
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

    // Save pending session
    setPendingSession(chatId, taskLines, "VOICE");

    // Show transcribed tasks and ask for confirmation
    let tasksList = "";
    taskLines.forEach((task, i) => {
      tasksList += `${i + 1}. ${task}\n`;
    });

    await sendMessage(
      chatId,
      `🎤 <b>Audio transcrito</b>\n\n` +
        `Detecté <b>${taskLines.length}</b> ${taskLines.length === 1 ? "tarea" : "tareas"}:\n\n` +
        `${tasksList}\n` +
        `¿Todo correcto?`,
    );

    // Buttons: Confirm or Correct
    await sendMessageWithKeyboard(chatId, `Elige una opción:`, [
      [
        { text: "✅ Confirmar tareas", callback_data: "confirm_audio" },
        { text: "✏️ Enviar correcciones", callback_data: "cancel_audio" },
      ],
    ]);
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

    // Save pending session
    setPendingSession(chatId, taskLines, "IMAGE");

    // Show tasks and ask destination
    await showTasksAndAskDestination(chatId, taskLines, "IMAGE");
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

// ── Helper: Show tasks and ask destination ───────────────────

async function showTasksAndAskDestination(
  chatId: number,
  tasks: string[],
  source: "TEXT" | "IMAGE" | "VOICE",
) {
  const sourceEmoji = source === "TEXT" ? "📝" : source === "IMAGE" ? "📷" : "🎤";
  let tasksList = "";
  tasks.forEach((task, i) => {
    tasksList += `${i + 1}. ${task}\n`;
  });

  await sendMessage(
    chatId,
    `${sourceEmoji} <b>Tareas detectadas</b>\n\n` +
      `${tasksList}\n` +
      `¿Dónde quieres guardar estas tareas?`,
  );

  await sendMessageWithKeyboard(chatId, `Elige una opción:`, [
    [{ text: "🧠 Crear nuevo Brain Dump", callback_data: "create_brain" }],
    [{ text: "📁 Asociar a Brain existente", callback_data: "associate_brain" }],
    [{ text: "📋 Enviar al Backlog", callback_data: "send_backlog" }],
  ]);
}

// ── Callback Query Handler ────────────────────────────────────

async function handleCallbackQuery(query: NonNullable<TelegramUpdate["callback_query"]>) {
  const chatId = query.message?.chat.id;
  const messageId = query.message?.message_id;
  const data = query.data || "";

  if (!chatId) {
    await answerCallbackQuery(query.id, "Error: no se encontró el chat");
    return;
  }

  const user = await getUserWithWorkspace(chatId);
  if (!user) {
    await answerCallbackQuery(query.id, "Cuenta no vinculada");
    return;
  }

  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) {
    await answerCallbackQuery(query.id, "Workspace no encontrado");
    return;
  }

  const session = getPendingSession(chatId);

  // Audio confirmation
  if (data === "confirm_audio") {
    await answerCallbackQuery(query.id);
    if (!session) {
      await sendMessage(chatId, `⚠️ La sesión expiró. Envía el audio de nuevo.`);
      return;
    }
    // Show destination options
    await showTasksAndAskDestination(chatId, session.tasks, "VOICE");
    return;
  }

  if (data === "cancel_audio") {
    await answerCallbackQuery(query.id, "Envía las correcciones como texto");
    clearPendingSession(chatId);
    if (messageId) {
      await editMessageText(
        chatId,
        messageId,
        `❌ Tareas canceladas. Envía las correcciones como texto normal.`,
      );
    }
    return;
  }

  // Send to backlog
  if (data === "send_backlog") {
    await answerCallbackQuery(query.id);
    if (!session) {
      await sendMessage(chatId, `⚠️ La sesión expiró. Intenta de nuevo.`);
      return;
    }

    try {
      await db.backlogTask.createMany({
        data: session.tasks.map((text, index) => ({
          text,
          source: "TELEGRAM",
          sortOrder: index,
          workspaceId,
        })),
      });

      clearPendingSession(chatId);

      const taskWord = session.tasks.length === 1 ? "tarea" : "tareas";
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          `✅ <b>${session.tasks.length} ${taskWord} enviadas al backlog</b>\n\n` +
            `Abre la app en la sección <b>Backlog</b> para organizarlas. 🎯`,
        );
      }
    } catch (error) {
      console.error("[Telegram] Error saving to backlog:", error);
      await sendMessage(chatId, `❌ Error al guardar las tareas. Intenta de nuevo.`);
    }
    return;
  }

  // Create new brain dump
  if (data === "create_brain") {
    await answerCallbackQuery(query.id);
    if (!session) {
      await sendMessage(chatId, `⚠️ La sesión expiró. Intenta de nuevo.`);
      return;
    }

    if (messageId) {
      await editMessageText(
        chatId,
        messageId,
        `🧠 <b>Crear nuevo Brain Dump</b>\n\nEnvía el nombre para el brain dump:`,
      );
    } else {
      await sendMessage(
        chatId,
        `🧠 <b>Crear nuevo Brain Dump</b>\n\nEnvía el nombre para el brain dump:`,
      );
    }

    // Mark session as waiting for brain name
    setPendingSession(chatId, session.tasks, session.source);
    return;
  }

  // Associate to existing brain
  if (data === "associate_brain") {
    await answerCallbackQuery(query.id);
    if (!session) {
      await sendMessage(chatId, `⚠️ La sesión expiró. Intenta de nuevo.`);
      return;
    }

    // Fetch user's brain dumps
    const brainDumps = await db.brainDump.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true },
    });

    if (brainDumps.length === 0) {
      await sendMessage(
        chatId,
        `⚠️ No tienes brain dumps todavía.\n\n` +
          `Puedes crear uno nuevo o enviar las tareas al backlog.`,
      );
      await showTasksAndAskDestination(chatId, session.tasks, session.source);
      return;
    }

    // Create buttons for each brain dump
    const buttons = brainDumps.map((dump) => [
      { text: dump.title || "Sin título", callback_data: `brain_${dump.id}` },
    ]);

    if (messageId) {
      await editMessageText(chatId, messageId, `📁 <b>Selecciona un Brain Dump:</b>`);
    }

    await sendMessageWithKeyboard(chatId, `Elige dónde agregar las tareas:`, buttons);
    return;
  }

  // Associate to specific brain (brain_<id>)
  if (data.startsWith("brain_")) {
    await answerCallbackQuery(query.id);
    const brainDumpId = data.substring(6); // Remove "brain_" prefix

    if (!session) {
      await sendMessage(chatId, `⚠️ La sesión expiró. Intenta de nuevo.`);
      return;
    }

    try {
      // Get max sortOrder for this brain dump
      const lastTask = await db.task.findFirst({
        where: { brainDumpId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      let nextSortOrder = 0;
      if (lastTask) {
        nextSortOrder = lastTask.sortOrder + 1;
      }

      // Create tasks
      await db.task.createMany({
        data: session.tasks.map((text, index) => ({
          text,
          sortOrder: nextSortOrder + index,
          status: "PENDING",
          brainDumpId,
        })),
      });

      clearPendingSession(chatId);

      const taskWord = session.tasks.length === 1 ? "tarea" : "tareas";
      if (messageId) {
        await editMessageText(
          chatId,
          messageId,
          `✅ <b>${session.tasks.length} ${taskWord} agregadas al brain dump</b>\n\n` +
            `Abre la app para verlas. 🎯`,
        );
      }
    } catch (error) {
      console.error("[Telegram] Error associating to brain:", error);
      await sendMessage(chatId, `❌ Error al agregar las tareas. Intenta de nuevo.`);
    }
    return;
  }

  await answerCallbackQuery(query.id, "Opción no reconocida");
}
