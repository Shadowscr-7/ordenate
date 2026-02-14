// ============================================================
// Telegram Unlink API — Removes Telegram link from user
// ============================================================

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/actions";
import { db } from "@/lib/db";

export async function POST() {
  const authUser = await getSession();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.updateMany({
    where: { authId: authUser.id },
    data: {
      telegramChatId: null,
      telegramLinkedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
