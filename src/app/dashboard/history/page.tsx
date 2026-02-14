// ============================================================
// History Page — Placeholder (Phase 1)
// ============================================================

import { History } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Historial",
};

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial</h1>
        <p className="text-muted-foreground mt-1">
          Todos tus brain dumps y tareas anteriores.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <History className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-semibold">Sin historial</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            Aquí aparecerán tus brain dumps procesados y tareas completadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
