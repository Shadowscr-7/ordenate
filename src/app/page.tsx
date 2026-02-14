// ============================================================
// Landing Page — Ordénate
// ============================================================
import Image from "next/image";
import Link from "next/link";

import {
  Infinity,
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Headphones,
  Kanban,
  Lightbulb,
  ListTodo,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/* ─── Data ─────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Brain,
    title: "Brain Dump",
    description:
      "Escribe todo lo que tienes en la cabeza o toma una foto de tus notas. Sin filtro, sin orden. Solo suelta.",
    gradient: "from-primary/20 to-cyan-400/20",
    iconColor: "text-primary",
  },
  {
    icon: Sparkles,
    title: "IA que Organiza",
    description:
      "GPT-4 Vision convierte tu caos en tareas limpias, clasificadas y con fechas sugeridas automáticamente.",
    gradient: "from-amber-400/20 to-orange-400/20",
    iconColor: "text-amber-500",
  },
  {
    icon: Kanban,
    title: "Matriz Eisenhower",
    description:
      "Arrastra y suelta en 4 cuadrantes: Urgente+Importante, Planificar, Delegar, Eliminar.",
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: Target,
    title: "Foco Pareto",
    description: "Identifica automáticamente el 20% de tareas que genera el 80% de tus resultados.",
    gradient: "from-green-400/20 to-emerald-400/20",
    iconColor: "text-green-500",
  },
];

const STEPS = [
  {
    step: 1,
    icon: FileText,
    title: "Vacía tu mente",
    description:
      "Escribe todo lo que tengas en la cabeza. Ideas, tareas, recordatorios, lo que sea. También puedes tomar una foto de tus notas escritas a mano.",
    color: "from-primary to-blue-400",
    inputTypes: [
      { icon: FileText, label: "Texto libre" },
      { icon: Camera, label: "Foto de notas" },
      { icon: MessageSquare, label: "Mensaje de voz" },
    ],
  },
  {
    step: 2,
    icon: Sparkles,
    title: "La IA organiza",
    description:
      "OpenAI analiza tu brain dump y extrae tareas individuales. Las limpia, las clasifica por categoría y sugiere fechas de vencimiento.",
    color: "from-amber-500 to-orange-400",
    outputTags: ["Trabajo", "Personal", "Urgente", "Proyecto X", "Salud"],
  },
  {
    step: 3,
    icon: Kanban,
    title: "Prioriza con Eisenhower",
    description:
      "Tus tareas se organizan en la Matriz de Eisenhower. Arrastra y suelta entre cuadrantes. Visualiza qué importa realmente.",
    color: "from-blue-500 to-indigo-500",
    quadrants: [
      { label: "Hacer ya", icon: Zap, color: "bg-red-500/20 text-red-400" },
      {
        label: "Planificar",
        icon: Clock,
        color: "bg-blue-500/20 text-blue-400",
      },
      {
        label: "Delegar",
        icon: Users,
        color: "bg-amber-500/20 text-amber-400",
      },
      {
        label: "Eliminar",
        icon: Trash2,
        color: "bg-neutral-500/20 text-neutral-400",
      },
    ],
  },
  {
    step: 4,
    icon: Target,
    title: "Enfócate con Pareto",
    description:
      "Ordénate identifica el 20% de tareas que produce el 80% de impacto. Ejecuta solo lo que moverá la aguja.",
    color: "from-green-500 to-emerald-400",
    stats: [
      { value: "20%", label: "de tus tareas" },
      { value: "80%", label: "de tus resultados" },
    ],
  },
];

const INTEGRATIONS = [
  {
    icon: Bot,
    label: "Telegram",
    sublabel: "Bot integrado",
    description: "Envía brain dumps y recibe recordatorios desde Telegram.",
  },
  {
    icon: Bot,
    label: "WhatsApp",
    sublabel: "Bot Business",
    description: "Captura ideas rápidas por WhatsApp. Siempre a la mano.",
  },
  {
    icon: Calendar,
    label: "Google Calendar",
    sublabel: "Sincronización",
    description: "Bloquea tiempo en tu calendario para tareas prioritarias.",
  },
  {
    icon: Zap,
    label: "OpenAI",
    sublabel: "GPT-4 Vision",
    description: "IA que entiende texto, fotos y contexto para organizar.",
  },
];

const PRICING = [
  {
    name: "Básico",
    price: "$9",
    period: "/mes",
    description: "Para empezar a organizar tu mente",
    popular: false,
    features: [
      { text: "10 Brain Dumps al mes", included: true },
      { text: "Matriz Eisenhower completa", included: true },
      { text: "Vista Pareto", included: true },
      { text: "Historial de 30 días", included: true },
      { text: "Brain Dumps ilimitados", included: false },
      { text: "Integraciones (Telegram, WhatsApp)", included: false },
      { text: "Google Calendar sync", included: false },
      { text: "IA avanzada con Vision", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mes",
    description: "Para profesionales que necesitan el máximo foco",
    popular: true,
    features: [
      { text: "Brain Dumps ilimitados", included: true },
      { text: "Matriz Eisenhower completa", included: true },
      { text: "Vista Pareto avanzada", included: true },
      { text: "Historial ilimitado", included: true },
      { text: "Bot Telegram + WhatsApp", included: true },
      { text: "Google Calendar sync", included: true },
      { text: "IA avanzada con GPT-4 Vision", included: true },
      { text: "Soporte prioritario", included: true },
    ],
  },
];

const FAQ = [
  {
    q: "¿Qué es un Brain Dump?",
    a: "Es una técnica de productividad donde vacías TODO lo que tienes en la cabeza — sin filtro, sin orden. Ordénate toma ese caos y lo convierte en tareas priorizadas usando IA.",
  },
  {
    q: "¿Cómo funciona la IA?",
    a: "Usamos GPT-4 Vision de OpenAI. Puedes escribir texto libre, pegar notas, o incluso enviar una foto de notas escritas a mano. La IA extrae tareas individuales, las categoriza y sugiere fechas.",
  },
  {
    q: "¿Qué es la Matriz de Eisenhower?",
    a: "Es un método de priorización que clasifica tareas en 4 cuadrantes según su urgencia e importancia: Hacer ya (urgente + importante), Planificar (importante, no urgente), Delegar (urgente, no importante), y Eliminar (ni urgente ni importante).",
  },
  {
    q: "¿Y el Principio de Pareto?",
    a: "El Principio 80/20 dice que el 20% de tus acciones produce el 80% de los resultados. Ordénate analiza tus tareas y marca las que tendrán mayor impacto, para que te enfoques solo en lo que importa.",
  },
  {
    q: "¿Puedo usar Ordénate desde Telegram o WhatsApp?",
    a: "¡Sí! Con el plan Pro puedes enviar brain dumps directamente desde Telegram o WhatsApp. También recibes recordatorios de tareas prioritarias.",
  },
  {
    q: "¿Hay plan gratuito?",
    a: "Ofrecemos una prueba gratuita para que veas cómo funciona. Después, el plan Básico desde $9/mes te da todo lo esencial para organizar tu mente.",
  },
];

/* ─── Component ─────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
            <Image
              src="/images/logo.png"
              alt="Ordénate"
              width={120}
              height={48}
              className="h-12 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="text-muted-foreground hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="#como-funciona" className="hover:text-foreground transition-colors">
              Cómo funciona
            </Link>
            <Link href="#features" className="hover:text-foreground transition-colors">
              Funcionalidades
            </Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Precios
            </Link>
            <Link href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Iniciar sesión</Link>
            </Button>
            <Button
              asChild
              className="group from-primary shadow-primary/25 hover:shadow-primary/30 bg-gradient-to-r to-cyan-500 text-white shadow-lg transition-all hover:shadow-xl"
            >
              <Link href="/signup">
                Comenzar gratis
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center lg:py-28">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/5 absolute top-20 -left-40 h-80 w-80 rounded-full blur-3xl" />
          <div className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-cyan-400/5 blur-3xl" />
          <div className="absolute top-1/4 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/5 blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="animate-fade-in-down border-primary/20 bg-primary/5 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Potenciado por IA
          </div>

          {/* Logo */}
          <div className="animate-fade-in mb-8 flex justify-center">
            <Image
              src="/images/logo.png"
              alt="Ordénate Logo"
              width={280}
              height={280}
              className="animate-float h-auto w-48 object-contain drop-shadow-2xl sm:w-56 lg:w-64"
              priority
            />
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            De ideas caóticas a{" "}
            <span className="animate-gradient from-primary to-primary bg-gradient-to-r via-cyan-500 bg-[length:200%_auto] bg-clip-text text-transparent">
              acción enfocada
            </span>
          </h1>

          <p className="animate-fade-in-up stagger-2 text-muted-foreground mx-auto mt-6 max-w-2xl text-lg sm:text-xl">
            Captura todo lo que tienes en la cabeza. La IA lo organiza. Tú priorizas con Eisenhower
            y Pareto. Ejecuta solo lo que importa.
          </p>

          <p className="animate-fade-in-up stagger-3 text-primary/80 mt-2 text-sm font-medium">
            Tu mente, en orden.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in-up stagger-4 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              asChild
              className="group from-primary shadow-primary/25 hover:shadow-primary/30 h-12 bg-gradient-to-r to-cyan-500 px-8 text-white shadow-lg transition-all hover:shadow-xl"
            >
              <Link href="/signup">
                Empezar gratis
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 px-8">
              <Link href="#como-funciona">
                Ver cómo funciona
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="animate-fade-in-up stagger-5 mt-12 flex flex-col items-center gap-3">
            <div className="flex -space-x-2">
              {[
                "bg-gradient-to-br from-primary to-cyan-500",
                "bg-gradient-to-br from-amber-400 to-orange-500",
                "bg-gradient-to-br from-green-400 to-emerald-500",
                "bg-gradient-to-br from-purple-400 to-pink-500",
                "bg-gradient-to-br from-blue-400 to-indigo-500",
              ].map((gradient, i) => (
                <div
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${gradient} ring-background text-xs font-bold text-white ring-2`}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-semibold">+500</span> personas ya organizan su
              mente con Ordénate
            </p>
          </div>
        </div>
      </section>

      {/* ── Core Flow Visual ───────────────────────────────── */}
      <section className="bg-muted/20 border-y py-16">
        <div className="mx-auto max-w-5xl px-4">
          <p className="text-muted-foreground mb-10 text-center text-sm font-semibold tracking-widest uppercase">
            El flujo completo
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {[
              {
                icon: Brain,
                label: "Brain Dump",
                color: "from-primary to-cyan-500",
              },
              {
                icon: Sparkles,
                label: "IA Organiza",
                color: "from-amber-500 to-orange-400",
              },
              {
                icon: Kanban,
                label: "Eisenhower",
                color: "from-blue-500 to-indigo-500",
              },
              {
                icon: Target,
                label: "Pareto",
                color: "from-green-500 to-emerald-500",
              },
              {
                icon: CheckCircle2,
                label: "¡Ejecuta!",
                color: "from-emerald-500 to-teal-500",
              },
            ].map((item, idx, arr) => (
              <div key={item.label} className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} p-3 shadow-lg sm:h-16 sm:w-16`}
                  >
                    <item.icon className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                  </div>
                  <span className="text-[11px] font-semibold sm:text-xs">{item.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="text-muted-foreground/40 h-5 w-5" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works (4 Steps) ─────────────────────────── */}
      <section id="como-funciona" className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-20 text-center">
            <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <Lightbulb className="h-3.5 w-3.5" />
              Paso a paso
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              ¿Cómo funciona{" "}
              <span className="from-primary bg-gradient-to-r to-cyan-500 bg-clip-text text-transparent">
                Ordénate
              </span>
              ?
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              En 4 pasos simples, pasas del caos mental a la acción enfocada.
            </p>
          </div>

          <div className="space-y-28">
            {STEPS.map((step, idx) => (
              <div
                key={step.step}
                className={`flex flex-col items-center gap-12 lg:flex-row ${
                  idx % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Text side */}
                <div className="flex-1 space-y-5">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${step.color} px-4 py-1.5 text-sm font-bold text-white`}
                  >
                    Paso {step.step}
                  </div>
                  <h3 className="text-2xl font-bold sm:text-3xl">{step.title}</h3>
                  <p className="text-muted-foreground max-w-lg text-base leading-relaxed sm:text-lg">
                    {step.description}
                  </p>

                  {/* Step 1 — Input types */}
                  {step.inputTypes && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      {step.inputTypes.map((input) => (
                        <div
                          key={input.label}
                          className="bg-card flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                        >
                          <input.icon className="text-primary h-4 w-4" />
                          {input.label}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Step 2 — Output tags */}
                  {step.outputTags && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {step.outputTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-3 py-1 text-xs font-semibold text-amber-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visual side */}
                <div className="flex-1">
                  {/* Step 1 — Brain dump visual */}
                  {step.step === 1 && (
                    <div className="relative mx-auto max-w-sm">
                      <div className="bg-card rounded-2xl border p-5 shadow-xl">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-red-400" />
                          <div className="h-3 w-3 rounded-full bg-amber-400" />
                          <div className="h-3 w-3 rounded-full bg-green-400" />
                        </div>
                        <div className="text-muted-foreground space-y-2 font-mono text-sm">
                          <p>Llamar al dentista</p>
                          <p>Entregar propuesta del cliente X</p>
                          <p>Comprar regalo para mamá</p>
                          <p>Revisar métricas de ventas</p>
                          <p>Hacer ejercicio 3 veces/semana</p>
                          <p>Responder emails pendientes</p>
                          <p className="text-primary animate-pulse">|</p>
                        </div>
                      </div>
                      {/* Floating camera badge */}
                      <div className="from-primary absolute -top-3 -right-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br to-cyan-500 shadow-lg">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Step 2 — AI processing visual */}
                  {step.step === 2 && (
                    <div className="relative mx-auto max-w-sm">
                      <div className="bg-card rounded-2xl border p-5 shadow-xl">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          IA procesando...
                        </div>
                        <div className="space-y-3">
                          {[
                            {
                              task: "Entregar propuesta cliente X",
                              cat: "Trabajo",
                              catColor: "bg-blue-500/10 text-blue-500",
                              priority: "Alta",
                            },
                            {
                              task: "Revisar métricas de ventas",
                              cat: "Trabajo",
                              catColor: "bg-blue-500/10 text-blue-500",
                              priority: "Alta",
                            },
                            {
                              task: "Llamar al dentista",
                              cat: "Personal",
                              catColor: "bg-green-500/10 text-green-500",
                              priority: "Media",
                            },
                            {
                              task: "Comprar regalo para mamá",
                              cat: "Personal",
                              catColor: "bg-green-500/10 text-green-500",
                              priority: "Media",
                            },
                            {
                              task: "Hacer ejercicio",
                              cat: "Salud",
                              catColor: "bg-amber-500/10 text-amber-500",
                              priority: "Baja",
                            },
                          ].map((item, i) => (
                            <div
                              key={i}
                              className="bg-muted/30 flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span className="font-medium">{item.task}</span>
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.catColor}`}
                              >
                                {item.cat}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Sparkle decoration */}
                      <div className="absolute top-1/2 -left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Step 3 — Eisenhower Matrix visual */}
                  {step.step === 3 && (
                    <div className="mx-auto max-w-sm">
                      <div className="bg-card grid grid-cols-2 gap-2 rounded-2xl border p-4 shadow-xl">
                        {step.quadrants!.map((q) => (
                          <div
                            key={q.label}
                            className={`flex flex-col items-center gap-2 rounded-xl ${q.color} p-4`}
                          >
                            <q.icon className="h-6 w-6" />
                            <span className="text-xs font-bold">{q.label}</span>
                            <div className="flex flex-col gap-1">
                              {[1, 2].map((n) => (
                                <div
                                  key={n}
                                  className="h-2 w-16 rounded-full bg-current opacity-20"
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                        {/* Labels */}
                        <div className="text-muted-foreground col-span-2 mt-2 flex justify-between px-2 text-[10px] font-semibold uppercase">
                          <span>← Menos urgente</span>
                          <span>Más urgente →</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4 — Pareto visual */}
                  {step.step === 4 && (
                    <div className="mx-auto max-w-sm">
                      <div className="bg-card rounded-2xl border p-5 shadow-xl">
                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                          <Target className="h-4 w-4 text-green-500" />
                          Foco Pareto
                        </div>
                        <div className="flex gap-4">
                          {/* 20% column */}
                          <div className="flex-1">
                            <div className="mb-2 text-center">
                              <span className="text-2xl font-black text-green-500">20%</span>
                              <p className="text-muted-foreground text-[10px]">de tus tareas</p>
                            </div>
                            <div className="space-y-1.5">
                              {["Propuesta cliente", "Métricas ventas"].map((t) => (
                                <div
                                  key={t}
                                  className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-2 py-1.5 text-xs font-medium text-green-500"
                                >
                                  <Star className="h-3 w-3" />
                                  {t}
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Arrow */}
                          <div className="flex items-center">
                            <ArrowRight className="h-6 w-6 text-green-500/50" />
                          </div>
                          {/* 80% column */}
                          <div className="flex-1">
                            <div className="mb-2 text-center">
                              <span className="text-primary text-2xl font-black">80%</span>
                              <p className="text-muted-foreground text-[10px]">de resultados</p>
                            </div>
                            <div className="bg-primary/10 flex items-center justify-center rounded-xl p-4">
                              <TrendingUp className="text-primary h-10 w-10" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────── */}
      <section id="features" className="bg-muted/20 border-t py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <BarChart3 className="h-3.5 w-3.5" />
              Funcionalidades
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que necesitas para{" "}
              <span className="from-primary bg-gradient-to-r to-cyan-500 bg-clip-text text-transparent">
                priorizar con inteligencia
              </span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Un flujo completo desde el caos mental hasta la ejecución enfocada.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, idx) => (
              <div
                key={feature.title}
                className="group bg-card hover:shadow-primary/5 relative overflow-hidden rounded-2xl border p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-30`}
                  />
                </div>
                <div className="relative z-10">
                  <div
                    className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${feature.gradient} p-3 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations ───────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-16 text-center">
            <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5" />
              Integraciones
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Conectado con tus{" "}
              <span className="from-primary bg-gradient-to-r to-cyan-500 bg-clip-text text-transparent">
                herramientas favoritas
              </span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Captura ideas desde donde estés. Ordénate se integra con las herramientas que ya usas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {INTEGRATIONS.map((item) => (
              <div
                key={item.label}
                className="group bg-card hover:shadow-primary/5 rounded-2xl border p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="from-primary/10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br to-cyan-400/10 transition-transform group-hover:scale-110">
                  <item.icon className="text-primary h-7 w-7" />
                </div>
                <h3 className="font-semibold">{item.label}</h3>
                <p className="text-primary mb-2 text-xs font-medium">{item.sublabel}</p>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <section id="pricing" className="bg-muted/20 border-t py-24">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-16 text-center">
            <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              Planes
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Un plan para cada nivel de{" "}
              <span className="from-primary bg-gradient-to-r to-cyan-500 bg-clip-text text-transparent">
                productividad
              </span>
            </h2>
            <p className="text-muted-foreground mx-auto max-w-xl text-lg">
              Empieza gratis. Escala cuando estés listo.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`bg-card relative overflow-hidden rounded-2xl border p-8 transition-all hover:shadow-xl ${
                  plan.popular ? "border-primary/50 shadow-primary/10 shadow-lg" : ""
                }`}
              >
                {plan.popular && (
                  <div className="from-primary absolute top-0 right-0 rounded-bl-xl bg-gradient-to-r to-cyan-500 px-4 py-1.5 text-xs font-bold text-white">
                    Popular
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{plan.description}</p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <Button
                  asChild
                  className={`mb-8 w-full ${
                    plan.popular
                      ? "from-primary shadow-primary/25 bg-gradient-to-r to-cyan-500 text-white shadow-lg"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                >
                  <Link href={plan.popular ? "/signup?plan=PRO" : "/signup?plan=BASIC"}>
                    {plan.popular ? "Elegir Pro" : "Elegir Básico"}
                  </Link>
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      {f.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <div className="border-muted-foreground/20 mt-0.5 h-4 w-4 shrink-0 rounded-full border-2" />
                      )}
                      <span
                        className={`text-sm ${
                          f.included ? "text-foreground" : "text-muted-foreground/50 line-through"
                        }`}
                      >
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-3xl px-4">
          <div className="mb-16 text-center">
            <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold">
              <MessageSquare className="h-3.5 w-3.5" />
              FAQ
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item, idx) => (
              <details
                key={idx}
                className="group bg-card open:shadow-primary/5 rounded-xl border transition-all open:shadow-lg"
              >
                <summary className="hover:text-primary flex cursor-pointer items-center justify-between p-5 text-left font-semibold transition-colors [&::-webkit-details-marker]:hidden">
                  <span className="pr-4">{item.q}</span>
                  <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <div className="text-muted-foreground border-t px-5 py-4 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ──────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="bg-primary/10 absolute top-0 left-1/4 h-64 w-64 rounded-full blur-3xl" />
          <div className="absolute right-1/4 bottom-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-2xl px-4 text-center">
          <Image
            src="/images/logo.png"
            alt="Ordénate"
            width={80}
            height={80}
            className="mx-auto mb-6 h-auto w-20 object-contain"
          />
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            ¿Listo para ordenar{" "}
            <span className="from-primary bg-gradient-to-r to-cyan-500 bg-clip-text text-transparent">
              tu mente
            </span>
            ?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Deja de saltar entre ideas. Empieza a ejecutar lo que importa.
            <br />
            <span className="text-foreground font-semibold">Tu mente, en orden.</span>
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="group from-primary shadow-primary/25 hover:shadow-primary/30 h-14 bg-gradient-to-r to-cyan-500 px-10 text-lg text-white shadow-xl transition-all hover:shadow-2xl"
            >
              <Link href="/signup">
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            Sin tarjeta de crédito • Empezar toma 30 segundos
          </p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Ordénate"
                width={80}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </div>
            <nav className="text-muted-foreground flex flex-wrap items-center gap-6 text-sm">
              <Link href="#como-funciona" className="hover:text-foreground transition-colors">
                Cómo funciona
              </Link>
              <Link href="#features" className="hover:text-foreground transition-colors">
                Funcionalidades
              </Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">
                Precios
              </Link>
              <Link href="#faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
            </nav>
          </div>
          <div className="text-muted-foreground mt-8 border-t pt-6 text-center text-xs">
            © {new Date().getFullYear()} Ordénate. Tu mente, en orden. Todos los derechos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
