// ============================================================
// Telegram Bot — Helper utilities
// ============================================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      width: number;
      height: number;
      file_size?: number;
    }>;
    caption?: string;
  };
}

/**
 * Send a text message to a Telegram chat
 */
export async function sendMessage(
  chatId: number | string,
  text: string,
  options?: { parse_mode?: "HTML" | "Markdown" | "MarkdownV2" },
) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode ?? "HTML",
    }),
  });
  return res.json();
}

/**
 * Get a file download URL from Telegram
 */
export async function getFileUrl(fileId: string): Promise<string | null> {
  const res = await fetch(`${TELEGRAM_API}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });
  const data = await res.json();
  if (data.ok && data.result.file_path) {
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
  }
  return null;
}

/**
 * Register (or update) the webhook URL with Telegram
 */
export async function setWebhook(url: string): Promise<{ ok: boolean; description?: string }> {
  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      allowed_updates: ["message"],
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
    }),
  });
  return res.json();
}

/**
 * Get current webhook info
 */
export async function getWebhookInfo() {
  const res = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
  return res.json();
}

/**
 * Extract the link code from a /start command
 * e.g. "/start OD-CMLLJMRO" → "CMLLJMRO"
 */
export function extractLinkCode(text: string): string | null {
  const match = text.match(/^\/start\s+OD-([A-Z0-9]+)$/i);
  return match ? match[1] : null;
}
