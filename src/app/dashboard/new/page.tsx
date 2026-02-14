// ============================================================
// New Brain Dump Page — Placeholder (Phase 1)
// ============================================================

import { Brain } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Nuevo Brain Dump",
};

export default function NewDumpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Brain Dump</h1>
        <p className="text-muted-foreground mt-1">
          Escribe o sube una foto con tus ideas.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Brain className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-semibold">Próximamente — Fase 1</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            La captura de brain dumps se implementará en la siguiente fase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
