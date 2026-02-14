// ============================================================
// Telegram Webhook — Receives messages from Telegram Bot API
// ============================================================
// Conversational flow:
//   /start OD-XXXX  → Links Telegram account
//   /cancelar       → Cancels pending brain dump
//   Text message     → Save pending text → show inline keyboard
//                      with existing brain dumps + "Crear nuevo"
//   Callback query   → User tapped a button:
//                        "new"    → ask for title
//                        "bd:ID"  → add tasks to existing dump
//                        "cancel" → discard pending
//   Title reply      → When state=AWAITING_TITLE, creates dump
//   Photo messages   → Creates a BrainDump with image reference
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  type TelegramUpdate,
  type InlineKeyboardButton,
  sendMessage,
  sendMessageWithKeyboard,
  answerCallbackQuery,
  extractLinkCode,
  getFileUrl,
} from "@/lib/telegram";
import { normalizeText, classifyTasks, extractTextFromImage } from "@/lib/ai";
import { hasProAccess } from "@/lib/plan-gate";

export async function POST(request: NextRequest) {
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    // ─── Callback query (inline keyboard button press) ───────
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

    // ─── /cancelar ───────────────────────────────────────────
    if (text === "/cancelar") {
      await handleCancel(chatId);
      return NextResponse.json({ ok: true });
    }

    // ─── Text message ────────────────────────────────────────
    if (text && !text.startsWith("/")) {
      await handleTextMessage(chatId, text);
      return NextResponse.json({ ok: true });
    }

    // ─── Photo message ───────────────────────────────────────
    if (message.photo && message.photo.length > 0) {
      const caption = message.caption ?? "";
      const largestPhoto = message.photo[message.photo.length - 1];
      await handlePhotoMessage(chatId, largestPhoto.file_id, caption);
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

// Pending text format: "STATE:rawtext"
//   AWAITING_CHOICE:text  → waiting for user to pick dump / new
//   AWAITING_TITLE:text   → waiting for user to type title
function encodePending(
  state: "AWAITING_CHOICE" | "AWAITING_TITLE",
  text: string,
) {
  return `${state}:${text}`;
}

function decodePending(
  raw: string | null,
): { state: "AWAITING_CHOICE" | "AWAITING_TITLE"; text: string } | null {
  if (!raw) return null;
  const idx = raw.indexOf(":");
  if (idx === -1) return { state: "AWAITING_CHOICE", text: raw };
  const state = raw.substring(0, idx);
  const text = raw.substring(idx + 1);
  if (state === "AWAITING_CHOICE" || state === "AWAITING_TITLE") {
    return { state, text };
  }
  return { state: "AWAITING_CHOICE", text: raw };
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
        `Una vez vinculado, podrás enviarme texto o fotos y crearé brain dumps automáticamente. 🧠`,
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
      `📝 Enviarme <b>texto</b> → creo un brain dump\n` +
      `📷 Enviarme una <b>foto</b> → la proceso como brain dump\n\n` +
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

  const workspace = user.memberships[0]?.workspace;
  if (!workspace) return;

  const pending = decodePending(user.telegramPendingText);

  // ── State: AWAITING_TITLE → This message is the title ──────
  if (pending?.state === "AWAITING_TITLE") {
    const rawText = pending.text;
    const title = text.trim();
    const lines = parseLines(rawText);

    await db.brainDump.create({
      data: {
        title,
        rawText,
        source: "TELEGRAM",
        status: "PROCESSED",
        workspaceId: workspace.id,
        tasks: {
          create: lines.map((line, index) => ({
            text: line,
            sortOrder: index,
            status: "PENDING",
          })),
        },
      },
    });

    await db.user.update({
      where: { id: user.id },
      data: { telegramPendingText: null },
    });

    await sendMessage(
      chatId,
      `✅ <b>Brain dump creado</b>\n\n` +
        `📋 <b>${title}</b>\n` +
        `Se crearon <b>${lines.length}</b> ${lines.length === 1 ? "tarea" : "tareas"}.\n\n` +
        `Abre la app para clasificarlas con la Matriz Eisenhower. 🎯`,
    );
    return;
  }

  // ── First message (or new text while AWAITING_CHOICE) ──────
  // Save text and show inline keyboard with existing dumps
  await db.user.update({
    where: { id: user.id },
    data: { telegramPendingText: encodePending("AWAITING_CHOICE", text) },
  });

  const lines = parseLines(text);

  // Fetch recent brain dumps for the keyboard
  const recentDumps = await db.brainDump.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      createdAt: true,
      _count: { select: { tasks: true } },
    },
  });

  // Build inline keyboard
  const keyboard: InlineKeyboardButton[][] = [];

  for (const dump of recentDumps) {
    const label = dump.title || "Brain Dump";
    const count = dump._count.tasks;
    const date = dump.createdAt.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    keyboard.push([
      {
        text: `📋 ${label} (${count}) · ${date}`,
        callback_data: `bd:${dump.id}`,
      },
    ]);
  }

  keyboard.push([
    { text: "✨ Crear nuevo Brain Dump", callback_data: "new" },
  ]);
  keyboard.push([{ text: "❌ Cancelar", callback_data: "cancel" }]);

  const taskWord = lines.length === 1 ? "tarea" : "tareas";

  await sendMessageWithKeyboard(
    chatId,
    `📝 <b>Recibí ${lines.length} ${taskWord}</b>\n\n` +
      (recentDumps.length > 0
        ? `¿Pertenecen a un brain dump existente o es uno nuevo?`
        : `No tienes brain dumps aún. ¿Creamos uno nuevo?`),
    keyboard,
  );
}

// ── Callback query handler (button presses) ──────────────────

async function handleCallbackQuery(
  query: NonNullable<TelegramUpdate["callback_query"]>,
) {
  const chatId = query.message?.chat.id;
  if (!chatId) return;

  const data = query.data ?? "";

  // Acknowledge the button press
  await answerCallbackQuery(query.id);

  const user = await getUserWithWorkspace(chatId);
  if (!user) {
    await sendMessage(chatId, `🔗 Tu cuenta no está vinculada.`);
    return;
  }

  const pending = decodePending(user.telegramPendingText);
  if (!pending) {
    await sendMessage(
      chatId,
      `ℹ️ No hay tareas pendientes. Envíame texto para empezar.`,
    );
    return;
  }

  const workspace = user.memberships[0]?.workspace;
  if (!workspace) {
    await sendMessage(chatId, `❌ No se encontró tu workspace.`);
    return;
  }

  const rawText = pending.text;
  const lines = parseLines(rawText);

  // ── Cancel ─────────────────────────────────────────────────
  if (data === "cancel") {
    await db.user.update({
      where: { id: user.id },
      data: { telegramPendingText: null },
    });
    await sendMessage(
      chatId,
      `🗑️ Descartado. Envíame otro texto cuando quieras.`,
    );
    return;
  }

  // ── Create new → ask for title ─────────────────────────────
  if (data === "new") {
    await db.user.update({
      where: { id: user.id },
      data: {
        telegramPendingText: encodePending("AWAITING_TITLE", rawText),
      },
    });

    await sendMessage(
      chatId,
      `✨ <b>Nuevo brain dump</b>\n\n` +
        `Envíame un <b>título o contexto</b>.\n` +
        `Ejemplo: <i>"Tareas de la semana"</i>, <i>"Ideas proyecto X"</i>\n\n` +
        `O envía /cancelar para descartarlo.`,
    );
    return;
  }

  // ── Add to existing dump (bd:ID) ───────────────────────────
  if (data.startsWith("bd:")) {
    const dumpId = data.slice(3);

    const existingDump = await db.brainDump.findFirst({
      where: { id: dumpId, workspaceId: workspace.id },
      include: { tasks: { orderBy: { sortOrder: "desc" }, take: 1 } },
    });

    if (!existingDump) {
      await sendMessage(
        chatId,
        `❌ Brain dump no encontrado. Intenta de nuevo.`,
      );
      return;
    }

    const maxOrder = existingDump.tasks[0]?.sortOrder ?? -1;

    // Add tasks to the existing dump
    await db.task.createMany({
      data: lines.map((line, index) => ({
        text: line,
        sortOrder: maxOrder + 1 + index,
        status: "PENDING" as const,
        brainDumpId: dumpId,
      })),
    });

    // Append raw text
    const updatedRawText = existingDump.rawText
      ? existingDump.rawText + "\n" + rawText
      : rawText;

    await db.brainDump.update({
      where: { id: dumpId },
      data: { rawText: updatedRawText },
    });

    // Clear pending state
    await db.user.update({
      where: { id: user.id },
      data: { telegramPendingText: null },
    });

    const dumpTitle = existingDump.title || "Brain Dump";
    const taskWord =
      lines.length === 1 ? "tarea agregada" : "tareas agregadas";

    await sendMessage(
      chatId,
      `✅ <b>${lines.length} ${taskWord}</b> a:\n\n` +
        `📋 <b>${dumpTitle}</b>\n\n` +
        `Abre la app para verlas y clasificarlas. 🎯`,
    );
    return;
  }
}

// ── Cancel command ───────────────────────────────────────────

async function handleCancel(chatId: number) {
  const user = await db.user.findUnique({
    where: { telegramChatId: String(chatId) },
  });

  if (!user) {
    await sendMessage(chatId, `🔗 Tu cuenta no está vinculada.`);
    return;
  }

  if (!user.telegramPendingText) {
    await sendMessage(
      chatId,
      `ℹ️ No hay ningún brain dump pendiente para cancelar.`,
    );
    return;
  }

  await db.user.update({
    where: { id: user.id },
    data: { telegramPendingText: null },
  });

  await sendMessage(
    chatId,
    `🗑️ Brain dump descartado. Puedes enviarme otro cuando quieras.`,
  );
}

// ── Photo handler — OCR → AI normalize → classify → create dump ──

async function handlePhotoMessage(
  chatId: number,
  fileId: string,
  caption: string,
) {
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
      await sendMessage(chatId, `❌ No se pudo descargar la imagen. Intenta de nuevo.`);
      return;
    }

    const imgResponse = await fetch(fileUrl);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    const base64 = buffer.toString("base64");
    const contentType = imgResponse.headers.get("content-type") ?? "image/jpeg";

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
    const suggestedTitle = caption || normalized.title || `Dump foto ${new Date().toLocaleDateString("es-ES")}`;

    let aiClassifications: { text: string; quadrant: string; confidence: number; reason: string }[] = [];
    if (taskLines.length > 0) {
      const classified = await classifyTasks(taskLines);
      aiClassifications = classified.tasks;
    }

    // 4. Create BrainDump with classified tasks
    const tasksData = taskLines.map((text, index) => {
      const classification = aiClassifications.find(
        (c) => c.text.toLowerCase().trim() === text.toLowerCase().trim(),
      );
      return {
        text,
        sortOrder: index,
        status: "PENDING" as const,
        quadrant: classification
          ? (classification.quadrant as "Q1_DO" | "Q2_SCHEDULE" | "Q3_DELEGATE" | "Q4_DELETE")
          : undefined,
      };
    });

    await db.brainDump.create({
      data: {
        title: suggestedTitle,
        rawText: extractedText,
        imageUrl: `telegram:${fileId}`,
        source: "TELEGRAM",
        status: "PROCESSED",
        workspaceId,
        tasks: {
          create: tasksData,
        },
      },
    });

    await sendMessage(
      chatId,
      `✅ <b>Brain dump creado desde imagen</b>\n\n` +
        `📋 <b>${suggestedTitle}</b>\n` +
        `Se crearon <b>${taskLines.length}</b> ${taskLines.length === 1 ? "tarea" : "tareas"} con clasificación Eisenhower.\n\n` +
        `Abre la app para verlo. 🎯`,
    );
  } catch (err) {
    console.error("[Telegram] Photo processing error:", err);
    await sendMessage(
      chatId,
      `❌ Error al procesar la imagen. Intenta de nuevo o envía el texto directamente.`,
    );
  }
}
