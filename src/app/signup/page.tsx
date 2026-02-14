// ============================================================
// Signup Page — Two-step: Credentials → Plan Selection
// ============================================================

"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { signUp } from "@/lib/auth/actions";

import { EmailConfirmationModal } from "@/components/auth/email-confirmation-modal";
import { PlanSelection } from "@/components/auth/plan-selection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";

type Step = "credentials" | "plan";

export default function SignupPage() {
  const [step, setStep] = useState<Step>("credentials");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Store credentials between steps
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
  });

  function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setCredentials({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
    setError(null);
    setStep("plan");
  }

  async function handlePlanSelect(plan: "BASIC" | "PRO") {
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.set("name", credentials.name);
    formData.set("email", credentials.email);
    formData.set("password", credentials.password);
    formData.set("plan", plan);

    const result = await signUp(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Show email confirmation modal
      setLoading(false);
      setShowEmailModal(true);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute top-1/4 -left-40 h-80 w-80 rounded-full blur-3xl" />
        <div className="absolute -right-40 bottom-1/4 h-80 w-80 rounded-full bg-cyan-400/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/3 blur-3xl" />
      </div>

      <div className="relative z-10 w-full">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Credentials ──────────────────────────── */}
          {step === "credentials" && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="mx-auto max-w-md"
            >
              <Card className="border-primary/10 shadow-primary/5 overflow-hidden shadow-2xl">
                <div className="from-primary to-primary h-1 w-full bg-gradient-to-r via-cyan-400" />

                <CardHeader className="space-y-1 pt-8 pb-4 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="mb-3 flex justify-center"
                  >
                    <Image
                      src="/images/logo.png"
                      alt="Ordénate"
                      width={80}
                      height={80}
                      className="h-16 w-16 drop-shadow-lg"
                    />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
                  <CardDescription>Paso 1 de 2 — Tus datos de acceso</CardDescription>
                </CardHeader>

                <CardContent>
                  {/* Step indicator */}
                  <div className="mb-6 flex items-center justify-center gap-2">
                    <div className="bg-primary h-2 w-12 rounded-full" />
                    <div className="bg-muted h-2 w-12 rounded-full" />
                  </div>

                  <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Tu nombre"
                        required
                        autoComplete="name"
                        defaultValue={credentials.name}
                        className="focus:shadow-primary/10 h-11 transition-shadow focus:shadow-md"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        required
                        autoComplete="email"
                        defaultValue={credentials.email}
                        className="focus:shadow-primary/10 h-11 transition-shadow focus:shadow-md"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="focus:shadow-primary/10 h-11 transition-shadow focus:shadow-md"
                      />
                    </motion.div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                      >
                        {error}
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <LoadingButton
                        type="submit"
                        className="group from-primary shadow-primary/25 hover:shadow-primary/30 h-11 w-full bg-gradient-to-r to-cyan-500 text-white shadow-lg transition-all hover:shadow-xl"
                      >
                        Siguiente — Elegir plan
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </LoadingButton>
                    </motion.div>
                  </form>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center text-sm"
                  >
                    <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                    <Link
                      href="/login"
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Iniciar sesión
                    </Link>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Step 2: Plan Selection ───────────────────────── */}
          {step === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="mx-auto flex max-w-3xl flex-col items-center"
            >
              {/* Step indicator */}
              <div className="mb-6 flex items-center justify-center gap-2">
                <div className="bg-primary h-2 w-12 rounded-full" />
                <div className="bg-primary h-2 w-12 rounded-full" />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mb-4 w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <PlanSelection
                onSelect={handlePlanSelect}
                onBack={() => {
                  setStep("credentials");
                  setError(null);
                }}
                loading={loading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to home link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center"
        >
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Ordénate — Tu mente, en orden.
          </Link>
        </motion.div>
      </div>

      {/* Email Confirmation Modal */}
      <EmailConfirmationModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={credentials.email}
      />
    </div>
  );
}
