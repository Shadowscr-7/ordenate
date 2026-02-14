// ============================================================
// Sentry — Client-side error monitoring
// ============================================================

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Don't send PII
  sendDefaultPii: false,

  environment: process.env.NODE_ENV,
});
