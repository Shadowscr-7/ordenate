// ============================================================
// Onboarding Tour Steps Configuration
// ============================================================

import type { Step } from "react-joyride";

export const ONBOARDING_STEPS: Record<string, Step[]> = {
  // --- Dashboard Steps ----------------------------------------
  dashboard: [
    {
      target: "body",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg bg-primary/10 dark:bg-primary/20 p-4 border-2 border-primary/30">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">¡Bienvenido a Ordénate! 👋</h3>
          </div>
          <p className="text-slate-900 dark:text-slate-50 font-medium">
            Te voy a guiar paso a paso para que aprendas a usar todas las
            funcionalidades de la app.
          </p>
          <div className="text-sm bg-muted/50 dark:bg-muted/30 p-3 rounded-lg border border-border">
            <p className="text-slate-900 dark:text-slate-50">💡 Puedes saltar este tour en cualquier momento y acceder a la ayuda
            desde el botón (?) en cada pantalla.</p>
          </div>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: "[data-tour='telegram-link']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-blue-500/15 dark:bg-blue-500/25 p-3 rounded-lg border-2 border-blue-500/30 dark:border-blue-400/40">
            <span className="text-2xl">📱</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">Vincula tu Telegram</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Conecta tu cuenta de Telegram para crear tareas desde tu móvil.
            Puedes enviar texto, fotos o audios y la IA los procesará
            automáticamente.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='new-dump']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-purple-500/15 dark:bg-purple-500/25 p-3 rounded-lg border-2 border-purple-500/30 dark:border-purple-400/40">
            <span className="text-2xl">🧠</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">Crea tu primer Brain Dump</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Un Brain Dump es un volcado mental donde colocas todas tus ideas y
            tareas sin orden. La IA te ayudará a organizarlas.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='recent-dumps']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-green-500/15 dark:bg-green-500/25 p-3 rounded-lg border-2 border-green-500/30 dark:border-green-400/40">
            <span className="text-2xl">📋</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">Tus volcados recientes</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Aquí verás tus últimos Brain Dumps con su progreso. Haz clic en uno
            para ver y organizar sus tareas.
          </p>
        </div>
      ),
      placement: "top",
    },
    {
      target: "[data-tour='sidebar-backlog']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-orange-500/15 dark:bg-orange-500/25 p-3 rounded-lg border-2 border-orange-500/30 dark:border-orange-400/40">
            <span className="text-2xl">📝</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">El Backlog</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Aquí llegan todas las tareas sueltas que envíes por Telegram o
            crees manualmente. Luego las puedes organizar en Brain Dumps.
          </p>
        </div>
      ),
      placement: "right",
    },
  ],

  // --- Backlog Steps ------------------------------------------
  backlog: [
    {
      target: "[data-tour='create-task']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✏️</span>
            <h3 className="font-bold text-base">Crear tareas manualmente</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Escribe una tarea y presiona Enter o el botón Agregar. Las tareas
            quedan aquí hasta que las muevas a un Brain Dump.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "[data-tour='task-list']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <h3 className="font-bold text-base">Selección múltiple</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Selecciona varias tareas con los checkboxes. Luego puedes moverlas
            a un Brain Dump existente o crear uno nuevo con ellas.
          </p>
        </div>
      ),
      placement: "top",
    },
    {
      target: "[data-tour='bulk-actions']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Acciones masivas</h3>
          <p className="text-sm">
            Cuando seleccionas tareas, aparecen estas acciones: mover a un dump
            existente, crear nuevo dump, o eliminar.
          </p>
        </div>
      ),
      placement: "bottom",
    },
  ],

  // --- Brain Dumps List Steps ---------------------------------
  dumps: [
    {
      target: "[data-tour='dumps-stats']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h3 className="font-bold text-base">Estadísticas generales</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Ve el resumen de todos tus Brain Dumps: total de volcados, tareas,
            completadas y pendientes.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "[data-tour='dumps-list']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Lista de Brain Dumps</h3>
          <p className="text-sm">
            Cada tarjeta muestra el progreso del dump. Haz clic en "Ver tareas"
            para administrar o "Eisenhower" para priorizar.
          </p>
        </div>
      ),
      placement: "top",
    },
  ],

  // --- Eisenhower Steps ---------------------------------------
  eisenhower: [
    {
      target: "[data-tour='eisenhower-filter']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <h3 className="font-bold text-base">Filtrar por Brain Dump</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Filtra las tareas por un Brain Dump específico o ve todas juntas.
            Útil para enfocarte en un proyecto particular.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "[data-tour='quadrant-1']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-red-500/15 dark:bg-red-500/25 p-3 rounded-lg border-2 border-red-500/30 dark:border-red-400/40">
            <span className="text-2xl">🚨</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">Q1: Hacer YA</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Tareas <strong>urgentes E importantes</strong>: crisis, deadlines,
            problemas críticos. ¡Hazlas primero!
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='quadrant-2']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-blue-500/15 dark:bg-blue-500/25 p-3 rounded-lg border-2 border-blue-500/30 dark:border-blue-400/40">
            <span className="text-2xl">📅</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">Q2: Programar</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Tareas <strong>importantes pero no urgentes</strong>: planificación,
            crecimiento personal, prevención. ¡Dedícales tiempo!
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='quadrant-3']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-yellow-500/15 dark:bg-yellow-500/25 p-3 rounded-lg border-2 border-yellow-500/30 dark:border-yellow-400/40">
            <span className="text-2xl">⚠️</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">Q3: Delegar</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Tareas <strong>urgentes pero no importantes</strong>: interrupciones,
            algunas reuniones. Delégazlas si puedes.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='quadrant-4']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-slate-500/15 dark:bg-slate-500/25 p-3 rounded-lg border-2 border-slate-500/30 dark:border-slate-400/40">
            <span className="text-2xl">🗑️</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">Q4: Eliminar</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Tareas <strong>ni urgentes ni importantes</strong>: distracciones,
            pérdidas de tiempo. Elimínalas o minimízalas.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='drag-drop']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            <h3 className="font-bold text-base">Arrastra y suelta</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            Puedes arrastrar tareas entre cuadrantes para reclasificarlas. La
            matriz se actualiza automáticamente.
          </p>
        </div>
      ),
      placement: "top",
    },
  ],

  // --- Pareto Steps -------------------------------------------
  pareto: [
    {
      target: "[data-tour='pareto-principle']",
      content: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-teal-500/15 dark:bg-teal-500/25 p-3 rounded-lg border-2 border-teal-500/30 dark:border-teal-400/40">
            <span className="text-2xl">📊</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">Principio de Pareto (80/20)</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-900 dark:text-slate-50">
            El 20% de tus tareas genera el 80% de los resultados. Aquí
            identificas y te enfocas en ese 20% crítico.
          </p>
        </div>
      ),
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: "[data-tour='pareto-list']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Tareas de alto impacto</h3>
          <p className="text-sm">
            La IA analiza tus tareas y selecciona las más importantes. Marca
            como Pareto las tareas que realmente mueven la aguja.
          </p>
        </div>
      ),
      placement: "top",
    },
  ],

  // --- Telegram Steps -----------------------------------------
  telegram: [
    {
      target: "[data-tour='telegram-qr']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Escanea el código QR</h3>
          <p className="text-sm">
            Abre tu app de Telegram, escanea este QR y envía el código al bot
            para vincular tu cuenta.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-tour='telegram-bot']",
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold">Usa el bot</h3>
          <p className="text-sm">
            Envía <strong>texto</strong> (lista de tareas),{" "}
            <strong>fotos</strong> (con OCR) o <strong>audio</strong> (con
            transcripción). El bot te preguntará dónde guardarlas.
          </p>
        </div>
      ),
      placement: "top",
    },
  ],
};

export type OnboardingContext =
  | "dashboard"
  | "backlog"
  | "dumps"
  | "eisenhower"
  | "pareto"
  | "telegram";

