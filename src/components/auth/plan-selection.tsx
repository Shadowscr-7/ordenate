// ============================================================
// Plan Selection — Step 2 of signup flow
// ============================================================

"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  Brain,
  Calendar,
  Check,
  Crown,
  Kanban,
  MessageCircle,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";

type Plan = "BASIC" | "PRO";

interface PlanSelectionProps {
  onSelect: (plan: Plan) => void;
  onBack: () => void;
  loading?: boolean;
}

const PLANS = [
  {
    id: "BASIC" as Plan,
    name: "Básico",
    price: 9,
    description: "Todo lo esencial para organizar tus ideas",
    icon: Brain,
    badge: null,
    features: [
      { icon: Brain, label: "Brain Dumps de texto" },
      { icon: Kanban, label: "Tablero Eisenhower" },
      { icon: Target, label: "Vista Pareto" },
      { icon: Check, label: "Hasta 10 dumps/mes" },
    ],
    notIncluded: ["Procesamiento con IA", "Bot de Telegram / WhatsApp", "Google Calendar"],
  },
  {
    id: "PRO" as Plan,
    name: "Pro",
    price: 19,
    description: "Potencia máxima con IA e integraciones",
    icon: Crown,
    badge: "Recomendado",
    features: [
      { icon: Zap, label: "Brain Dumps ilimitados" },
      { icon: Kanban, label: "Tablero Eisenhower" },
      { icon: Target, label: "Vista Pareto" },
      { icon: Sparkles, label: "Procesamiento con IA" },
      { icon: Bot, label: "Bot de Telegram" },
      { icon: MessageCircle, label: "Bot de WhatsApp" },
      { icon: Calendar, label: "Google Calendar" },
      { icon: Crown, label: "Soporte prioritario" },
    ],
    notIncluded: [],
  },
];

export function PlanSelection({ onSelect, onBack, loading }: PlanSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Elige tu plan</h2>
        <p className="text-muted-foreground mt-2">
          Selecciona el plan que mejor se adapte a tus necesidades
        </p>
      </motion.div>

      {/* Plans grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan, idx) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.15 }}
          >
            <button
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "group relative w-full rounded-2xl border-2 p-6 text-left transition-all duration-300",
                selectedPlan === plan.id
                  ? "border-primary bg-primary/5 shadow-primary/10 shadow-lg"
                  : "border-border hover:border-primary/40 hover:bg-accent/30",
                plan.id === "PRO" && "ring-primary/20 ring-1",
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <Badge className="from-primary absolute -top-3 right-4 bg-gradient-to-r to-cyan-400 text-white shadow-md">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {plan.badge}
                </Badge>
              )}

              {/* Selection indicator */}
              <div
                className={cn(
                  "absolute top-6 right-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                  selectedPlan === plan.id
                    ? "border-primary bg-primary text-white"
                    : "border-muted-foreground/30",
                )}
              >
                {selectedPlan === plan.id && <Check className="h-4 w-4" />}
              </div>

              {/* Plan icon + name */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                    plan.id === "PRO"
                      ? "from-primary/20 bg-gradient-to-br to-cyan-400/20"
                      : "bg-primary/10",
                  )}
                >
                  <plan.icon
                    className={cn(
                      "h-6 w-6",
                      plan.id === "PRO" ? "text-primary" : "text-primary/80",
                    )}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-muted-foreground text-xs">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold tracking-tight">${plan.price}</span>
                <span className="text-muted-foreground">/mes</span>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-center gap-3 text-sm">
                    <div className="bg-primary/10 flex h-5 w-5 items-center justify-center rounded-full">
                      <feature.icon className="text-primary h-3 w-3" />
                    </div>
                    <span>{feature.label}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li
                    key={feature}
                    className="text-muted-foreground/60 flex items-center gap-3 text-sm line-through"
                  >
                    <div className="bg-muted flex h-5 w-5 items-center justify-center rounded-full">
                      <Check className="text-muted-foreground/40 h-3 w-3" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center justify-between pt-2"
      >
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <LoadingButton
          loading={loading}
          loadingText="Creando cuenta..."
          disabled={!selectedPlan}
          onClick={() => selectedPlan && onSelect(selectedPlan)}
          size="lg"
          className="min-w-[180px]"
        >
          Continuar con{" "}
          {selectedPlan === "PRO" ? "Pro" : selectedPlan === "BASIC" ? "Básico" : "..."}
        </LoadingButton>
      </motion.div>
    </div>
  );
}
