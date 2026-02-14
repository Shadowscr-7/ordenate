// ============================================================
// Pareto View Page — Placeholder (Phase 4)
// ============================================================

import { Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Foco Pareto",
};

export default function ParetoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Foco Pareto</h1>
        <p className="text-muted-foreground mt-1">
          El 20% de tareas que generan el 80% de los resultados.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="text-muted-foreground/50 mb-4 h-12 w-12" />
          <h3 className="mb-1 text-lg font-semibold">Próximamente — Fase 4</h3>
          <p className="text-muted-foreground max-w-sm text-sm">
            La vista de foco Pareto estará disponible en una fase posterior.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
