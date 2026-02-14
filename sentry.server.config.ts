// ============================================================
// Sentry — Server-side error monitoring
// ============================================================

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Don't send PII
  sendDefaultPii: false,

  environment: process.env.NODE_ENV,
});
