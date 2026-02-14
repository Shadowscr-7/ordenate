// ============================================================
// Eisenhower Board Page — Placeholder (Phase 2)
// ============================================================

import { Kanban } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Tablero Eisenhower",
};

export default function EisenhowerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tablero Eisenhower</h1>
        <p className="text-muted-foreground mt-1">
          Organiza tus tareas en 4 cuadrantes por urgencia e importancia.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Kanban className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-semibold">Próximamente — Fase 2</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            El tablero Eisenhower con drag &amp; drop estará disponible en la siguiente fase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
