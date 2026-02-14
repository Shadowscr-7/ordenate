// ============================================================
// Telegram Bot — Pending Sessions Store (In-Memory)
// ============================================================
// In production, use Redis or similar for distributed sessions

interface PendingSession {
  tasks: string[];
  timestamp: number;
  source: "TEXT" | "IMAGE" | "VOICE";
}

const pendingSessions = new Map<string, PendingSession>();

// Auto-cleanup old sessions (older than 1 hour)
setInterval(
  () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, session] of pendingSessions.entries()) {
      if (session.timestamp < oneHourAgo) {
        pendingSessions.delete(key);
      }
    }
  },
  5 * 60 * 1000,
); // Every 5 minutes

export function setPendingSession(
  chatId: number,
  tasks: string[],
  source: "TEXT" | "IMAGE" | "VOICE",
): void {
  pendingSessions.set(String(chatId), {
    tasks,
    timestamp: Date.now(),
    source,
  });
}

export function getPendingSession(chatId: number): PendingSession | null {
  return pendingSessions.get(String(chatId)) ?? null;
}

export function clearPendingSession(chatId: number): void {
  pendingSessions.delete(String(chatId));
}
