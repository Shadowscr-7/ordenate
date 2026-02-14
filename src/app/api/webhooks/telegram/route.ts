// ============================================================
// Telegram Webhook — Receives messages from Telegram Bot API
// ============================================================
// Handles:
//   /start OD-XXXX → Links Telegram account to user
//   Text messages  → Creates a new BrainDump
//   Photo messages → Creates a BrainDump with image reference
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  type TelegramUpdate,
  sendMessage,
  extractLinkCode,
} from "@/lib/telegram";

export async function POST(request: NextRequest) {
  // Optional: verify secret token from Telegram
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    const message = update.message;

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text ?? "";

    // ─── /start OD-XXXX → Link account ───────────────────────
    if (text.startsWith("/start")) {
      await handleStart(chatId, text, message.from);
      return NextResponse.json({ ok: true });
    }

    // ─── Regular text message → Create BrainDump ─────────────
    if (text && !text.startsWith("/")) {
      await handleTextMessage(chatId, text);
      return NextResponse.json({ ok: true });
    }

    // ─── Photo message → Create BrainDump with image ─────────
    if (message.photo && message.photo.length > 0) {
      const caption = message.caption ?? "";
      // Use the largest photo (last in array)
      const largestPhoto = message.photo[message.photo.length - 1];
      await handlePhotoMessage(chatId, largestPhoto.file_id, caption);
      return NextResponse.json({ ok: true });
    }

    // Unknown message type
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    return NextResponse.json({ ok: true }); // Always 200 to prevent retries
  }
}

// ─── Handlers ─────────────────────────────────────────────────

async function handleStart(
  chatId: number,
  text: string,
  from: { first_name: string; username?: string },
) {
  const code = extractLinkCode(text);

  if (!code) {
    // Simple /start without code
    await sendMessage(
      chatId,
      `👋 ¡Hola ${from.first_name}!\n\n` +
        `Soy el bot de <b>Ordénate</b>.\n\n` +
        `Para vincular tu cuenta, escanea el código QR desde tu dashboard en la app web.\n\n` +
        `Una vez vinculado, podrás enviarme texto o fotos y crearé brain dumps automáticamente. 🧠`,
    );
    return;
  }

  // code is the first 8 chars of the userId (uppercased)
  // Search for user whose id starts with that code (case-insensitive)
  const codeLC = code.toLowerCase();
  const user = await db.user.findFirst({
    where: {
      id: { startsWith: codeLC },
    },
  });

  if (!user) {
    await sendMessage(
      chatId,
      `❌ Código de vinculación no válido.\n\n` +
        `Asegúrate de escanear el QR desde tu dashboard o usa el enlace directo.`,
    );
    return;
  }

  // Check if this Telegram account is already linked to another user
  const existingLink = await db.user.findUnique({
    where: { telegramChatId: String(chatId) },
  });

  if (existingLink && existingLink.id !== user.id) {
    await sendMessage(
      chatId,
      `⚠️ Esta cuenta de Telegram ya está vinculada a otro usuario.\n\n` +
        `Si necesitas cambiarla, primero desvincula desde la app web.`,
    );
    return;
  }

  // Link the Telegram account
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

async function handleTextMessage(chatId: number, text: string) {
  // Find user by Telegram chatId
  const user = await db.user.findUnique({
    where: { telegramChatId: String(chatId) },
    include: {
      memberships: {
        include: { workspace: true },
        take: 1,
      },
    },
  });

  if (!user) {
    await sendMessage(
      chatId,
      `🔗 Tu cuenta de Telegram no está vinculada.\n\n` +
        `Escanea el código QR desde tu dashboard en <b>Ordénate</b> para vincularla.`,
    );
    return;
  }

  const workspace = user.memberships[0]?.workspace;
  if (!workspace) {
    await sendMessage(chatId, `❌ No se encontró tu workspace. Contacta soporte.`);
    return;
  }

  // Create the brain dump
  const dump = await db.brainDump.create({
    data: {
      rawText: text,
      source: "TELEGRAM",
      status: "DRAFT",
      workspaceId: workspace.id,
    },
  });

  await sendMessage(
    chatId,
    `✅ <b>Brain dump creado</b>\n\n` +
      `📝 "${text.length > 100 ? text.slice(0, 100) + "..." : text}"\n\n` +
      `Abre la app para clasificarlo con la Matriz Eisenhower y Pareto. 🎯`,
  );
}

async function handlePhotoMessage(
  chatId: number,
  fileId: string,
  caption: string,
) {
  // Find user by Telegram chatId
  const user = await db.user.findUnique({
    where: { telegramChatId: String(chatId) },
    include: {
      memberships: {
        include: { workspace: true },
        take: 1,
      },
    },
  });

  if (!user) {
    await sendMessage(
      chatId,
      `🔗 Tu cuenta de Telegram no está vinculada.\n\n` +
        `Escanea el código QR desde tu dashboard en <b>Ordénate</b> para vincularla.`,
    );
    return;
  }

  const workspace = user.memberships[0]?.workspace;
  if (!workspace) {
    await sendMessage(chatId, `❌ No se encontró tu workspace. Contacta soporte.`);
    return;
  }

  // Store the Telegram file_id as the imageUrl for now
  // In Phase 3, this will be downloaded and processed with OCR/AI
  const dump = await db.brainDump.create({
    data: {
      rawText: caption || null,
      imageUrl: `telegram:${fileId}`,
      source: "TELEGRAM",
      status: "DRAFT",
      workspaceId: workspace.id,
    },
  });

  await sendMessage(
    chatId,
    `✅ <b>Brain dump con imagen creado</b>\n\n` +
      (caption ? `📝 "${caption}"\n\n` : "") +
      `📷 Imagen guardada. Abre la app para procesarla. 🎯`,
  );
}
