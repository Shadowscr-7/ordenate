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
          <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-5 border-2 border-primary/40 shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <span className="text-3xl">👋</span>
              ¡Bienvenido a Ordénate!
            </h3>
          </div>
          <p className="text-[15px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
            Te voy a guiar paso a paso para que aprendas a usar todas las
            funcionalidades de la app.
          </p>
          <div className="text-sm bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <p className="text-slate-800 dark:text-slate-100 flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>Puedes saltar este tour en cualquier momento y acceder a la ayuda desde el botón (?) en cada pantalla.</span>
            </p>
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-xl border-2 border-blue-500/40 shadow-md">
            <span className="text-4xl">📱</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Vincula tu Telegram</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 p-4 rounded-xl border-2 border-purple-500/40 shadow-md">
            <span className="text-4xl">🧠</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Crea tu primer Brain Dump</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-green-500/20 to-green-600/10 p-4 rounded-xl border-2 border-green-500/40 shadow-md">
            <span className="text-4xl">📋</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Tus volcados recientes</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-4 rounded-xl border-2 border-orange-500/40 shadow-md">
            <span className="text-4xl">📝</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">El Backlog</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 p-4 rounded-xl border-2 border-indigo-500/40 shadow-md">
            <span className="text-4xl">✏️</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Crear tareas manualmente</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 p-4 rounded-xl border-2 border-cyan-500/40 shadow-md">
            <span className="text-4xl">📦</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Selección múltiple</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gradient-to-br from-pink-500/20 to-pink-600/10 p-4 rounded-xl border-2 border-pink-500/40 shadow-md">
            <span className="text-4xl">⚡</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Acciones masivas</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-4 rounded-xl border-2 border-emerald-500/40 shadow-md">
            <span className="text-4xl">📊</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Estadísticas generales</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gradient-to-br from-violet-500/20 to-violet-600/10 p-4 rounded-xl border-2 border-violet-500/40 shadow-md">
            <span className="text-4xl">📚</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Lista de Brain Dumps</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-sky-500/20 to-sky-600/10 p-4 rounded-xl border-2 border-sky-500/40 shadow-md">
            <span className="text-4xl">🔍</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Filtrar por Brain Dump</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-red-500/20 to-red-600/10 p-4 rounded-xl border-2 border-red-500/40 shadow-md">
            <span className="text-4xl">🚨</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Q1: Hacer YA</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-xl border-2 border-blue-500/40 shadow-md">
            <span className="text-4xl">📅</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Q2: Programar</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-4 rounded-xl border-2 border-yellow-500/40 shadow-md">
            <span className="text-4xl">⚠️</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Q3: Delegar</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-slate-500/20 to-slate-600/10 p-4 rounded-xl border-2 border-slate-500/40 shadow-md">
            <span className="text-4xl">🗑️</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Q4: Eliminar</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-teal-500/20 to-teal-600/10 p-4 rounded-xl border-2 border-teal-500/40 shadow-md">
            <span className="text-4xl">🔄</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Arrastra y suelta</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
          <div className="flex items-center gap-3 bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-4 rounded-xl border-2 border-amber-500/40 shadow-md">
            <span className="text-4xl">📊</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Principio de Pareto (80/20)</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gradient-to-br from-lime-500/20 to-lime-600/10 p-4 rounded-xl border-2 border-lime-500/40 shadow-md">
            <span className="text-4xl">⭐</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Tareas de alto impacto</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gradient-to-br from-sky-500/20 to-sky-600/10 p-4 rounded-xl border-2 border-sky-500/40 shadow-md">
            <span className="text-4xl">📱</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Escanea el código QR</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
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
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-4 rounded-xl border-2 border-blue-500/40 shadow-md">
            <span className="text-4xl">🤖</span>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">Usa el bot</h3>
          </div>
          <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
            Envía <strong>texto</strong> (lista de tareas),{" "}
            <strong>fotos</strong> (con OCR) o <strong>audio</strong> (con
            transcripción). Todas las tareas van directamente al backlog.
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

