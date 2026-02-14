// ============================================================
// Welcome Dialog — Onboarding for first-time users
// ============================================================

"use client";

import { useState } from "react";

import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Brain, Kanban, Sparkles, Target, Zap } from "lucide-react";

import { ROUTES } from "@/lib/constants";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STEPS = [
  {
    icon: Brain,
    title: "Vacía tu mente",
    description:
      "Escribe todo lo que tengas en la cabeza — tareas, ideas, preocupaciones. Sin orden, sin filtro.",
    color: "text-primary",
    bg: "from-primary/10 to-cyan-400/10",
  },
  {
    icon: Sparkles,
    title: "La IA organiza",
    description:
      "Nuestra IA limpia el texto, normaliza las tareas y sugiere en qué cuadrante Eisenhower va cada una.",
    color: "text-amber-500",
    bg: "from-amber-400/10 to-orange-400/10",
  },
  {
    icon: Kanban,
    title: "Prioriza con Eisenhower",
    description:
      "Arrastra las tareas entre los 4 cuadrantes: Hacer, Programar, Delegar y Eliminar.",
    color: "text-green-500",
    bg: "from-green-400/10 to-emerald-400/10",
  },
  {
    icon: Target,
    title: "Foco Pareto",
    description: "Identifica el 20% de tareas que generan el 80% del impacto. Ejecuta con foco.",
    color: "text-rose-500",
    bg: "from-rose-400/10 to-pink-400/10",
  },
];

interface WelcomeDialogProps {
  userName: string;
}

export function WelcomeDialog({ userName }: WelcomeDialogProps) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {step === 0 ? `¡Bienvenido, ${userName}! 🎉` : current.title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 0 ? "Te mostramos cómo funciona Ordénate en 4 pasos" : ""}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4 py-4"
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${current.bg}`}
            >
              <current.icon className={`h-8 w-8 ${current.color}`} />
            </div>
            <div className="text-center">
              <h3 className="mb-1 text-lg font-semibold">{current.title}</h3>
              <p className="text-muted-foreground text-sm">{current.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "bg-primary w-6" : "bg-muted-foreground/20 w-1.5"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          {!isLast ? (
            <>
              <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
                Saltar
              </Button>
              <Button className="flex-1" onClick={() => setStep(step + 1)}>
                Siguiente
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              asChild
              className="from-primary w-full bg-gradient-to-r to-cyan-500 text-white"
              onClick={() => setOpen(false)}
            >
              <Link href={ROUTES.NEW_DUMP}>
                <Zap className="mr-2 h-4 w-4" />
                Crear mi primer Brain Dump
              </Link>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
