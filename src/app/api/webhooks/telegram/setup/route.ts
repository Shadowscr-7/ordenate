// ============================================================
// Telegram Webhook Setup — Register webhook URL with Telegram
// ============================================================
// GET /api/webhooks/telegram/setup → Registers the webhook
// GET /api/webhooks/telegram/setup?info=1 → Shows current webhook info
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getWebhookInfo } from "@/lib/telegram";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Show current webhook info
  if (searchParams.has("info")) {
    const info = await getWebhookInfo();
    return NextResponse.json(info);
  }

  // Register webhook
  const appUrl = searchParams.get("url") || process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json(
      { error: "No APP_URL configured" },
      { status: 400 },
    );
  }

  const webhookUrl = `${appUrl}/api/webhooks/telegram`;
  const result = await setWebhook(webhookUrl);

  return NextResponse.json({
    webhookUrl,
    result,
  });
}
