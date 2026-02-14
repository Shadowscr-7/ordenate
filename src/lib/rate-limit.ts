// ============================================================
// Rate Limiter — In-memory sliding window for API protection
// ============================================================
// Usage in API routes:
//   const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
//   const ip = getClientIp(request);
//   const { ok } = limiter.check(ip);
//   if (!ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
// ============================================================

interface RateLimiterOptions {
  /** Max requests per window */
  maxRequests: number;
  /** Window duration in ms */
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter({ maxRequests, windowMs }: RateLimiterOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Cleanup stale entries every 60 seconds
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        if (entry.resetAt <= now) store.delete(key);
      }
    }, 60_000);
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const existing = store.get(key);

      if (!existing || existing.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, remaining: maxRequests - 1, resetAt: now + windowMs };
      }

      existing.count++;
      if (existing.count > maxRequests) {
        return { ok: false, remaining: 0, resetAt: existing.resetAt };
      }

      return { ok: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
    },
  };
}

/** Extract client IP from Next.js request headers */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// ─── Pre-configured limiters ────────────────────────────────

/** General API: 60 req/min */
export const apiLimiter = createRateLimiter({ maxRequests: 60, windowMs: 60_000 });

/** AI endpoints: 20 req/min */
export const aiLimiter = createRateLimiter({ maxRequests: 20, windowMs: 60_000 });

/** Auth endpoints: 10 req/min */
export const authLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

/** Webhook endpoints: 100 req/min */
export const webhookLimiter = createRateLimiter({ maxRequests: 100, windowMs: 60_000 });
