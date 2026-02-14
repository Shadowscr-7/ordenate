"use client";

// ============================================================
// Global Error Boundary — Captures unhandled errors with Sentry
// ============================================================

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="mx-auto max-w-md space-y-4 p-8 text-center">
          <h2 className="text-2xl font-bold">Algo salió mal</h2>
          <p className="text-muted-foreground">
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
          </p>
          <Button onClick={() => reset()}>Intentar de nuevo</Button>
        </div>
      </body>
    </html>
  );
}
