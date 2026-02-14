# 🧠 Ordénate SaaS — Plan Maestro de Implementación

> Tu mente, en orden — Sistema de Priorización Inteligente: Brain Dump + Eisenhower + Pareto

---

## Visión

Aplicación web SaaS que transforma ideas desordenadas en tareas priorizadas y ejecutables mediante IA, la Matriz de Eisenhower y el Principio de Pareto.

**Core Loop:** `Brain Dump → IA → Priorizar → Foco → Ejecutar → Completar`

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript + TailwindCSS v4 + shadcn/ui |
| Interactividad | dnd-kit (drag & drop), React Flow |
| DB | PostgreSQL (Supabase) + Prisma ORM v6 |
| Jobs Async | Inngest o Trigger.dev |
| Storage | S3 / Cloudflare R2 |
| IA / OCR | OpenAI Vision + OpenAI LLM (JSON estricto) |
| Auth | Supabase Auth (SSR) |
| Billing | Stripe Subscriptions |
| Notificaciones | Telegram Bot API, WhatsApp Business API |
| Calendario | Google Calendar API |

---

## Modelo de Datos (resumen)

```
User ──┬── Workspace ──┬── BrainDump ──── TaskLine
       │               │
       │               ├── AuditLog
       │               │
       └── Subscription
```

- **User**: datos auth, perfil
- **Workspace**: aislamiento multi-tenant
- **Subscription**: plan, estado, stripe IDs
- **BrainDump**: texto crudo / URL imagen, estado procesamiento
- **TaskLine**: texto limpio, cuadrante Eisenhower, flag Pareto, fecha vencimiento, estado
- **AuditLog**: registro de acciones

---

## Pantallas Principales

1. Landing + Pricing
2. Dashboard (resumen)
3. Nuevo Brain Dump (texto / imagen / bot)
4. Revisión de líneas extraídas
5. Tablero Eisenhower (4 cuadrantes, drag & drop)
6. Vista Foco Pareto (20% que genera 80%)
7. Historial de dumps y tareas
8. Settings + Gestión de Suscripción

---

## Planes de Suscripción

| Feature | Basic | Pro |
|---|---|---|
| Brain Dumps / mes | 10 | Ilimitados |
| Tablero Eisenhower | ✅ | ✅ |
| Vista Pareto | ❌ | ✅ |
| Google Calendar | ❌ | ✅ |
| Bots (Telegram/WA) | ❌ | ✅ |
| Precio | Gratis / bajo | ~$9/mes |

---

## Seguridad

- Rate limiting en API
- Validación estricta de payloads (Zod)
- URLs firmadas para storage
- Aislamiento de datos por Workspace
- Tokens protegidos (env vars, no client-side)

---

## UX

- Estilo Linear / Notion (minimalista, limpio)
- Sidebar colapsable mínima
- Atajos de teclado (Cmd+K, etc.)
- Animaciones suaves (Framer Motion)
- Mobile-first responsive

---

---

# 📋 PLAN DE IMPLEMENTACIÓN POR FASES

---

## FASE 0 — Setup del Proyecto ✅ COMPLETADA

**Objetivo:** Tener el monorepo configurado, listo para desarrollar.

- [x] Inicializar proyecto Next.js 16 (App Router) + TypeScript + pnpm
- [x] Configurar TailwindCSS v4 + shadcn/ui (theme oscuro/claro, 15 componentes)
- [x] Configurar ESLint + Prettier (con sort-imports y tailwind plugins)
- [x] Configurar Prisma ORM v6 + conexión a PostgreSQL (Supabase)
- [x] Definir schema completo de Prisma (User, Workspace, WorkspaceMember, BrainDump, Task, Subscription, AuditLog)
- [x] Generar Prisma Client
- [x] Configurar Supabase Auth con middleware de protección de rutas
- [x] Crear layout base: sidebar colapsable + header con menú de usuario + theme toggle
- [x] Configurar variables de entorno (.env.local / .env.example) con validación Zod
- [x] Crear página Landing con hero + features
- [x] Crear páginas de Login y Signup
- [x] Crear Dashboard con cards de acciones rápidas
- [x] Crear placeholders para todas las rutas (Eisenhower, Pareto, History, Settings, New Dump)
- [x] Crear API helper (api-response.ts) y validaciones Zod (validations.ts)
- [x] Crear sistema de tipos y constantes (types/index.ts, constants.ts)
- [x] Configurar Next.js con headers de seguridad
- [x] API health check endpoint
- [x] Página 404 personalizada
- [x] Loading skeleton para dashboard
- [x] Setup de estructura de carpetas:
  ```
  src/
  ├── app/
  │   ├── api/health/         # Health check
  │   ├── auth/callback/      # Supabase auth callback
  │   ├── dashboard/          # Protected area
  │   │   ├── eisenhower/     # Tablero (placeholder)
  │   │   ├── history/        # Historial (placeholder)
  │   │   ├── new/            # Nuevo dump (placeholder)
  │   │   ├── pareto/         # Foco Pareto (placeholder)
  │   │   └── settings/       # Configuración
  │   ├── login/              # Login page
  │   └── signup/             # Signup page
  ├── components/
  │   ├── layout/             # AppShell, AppSidebar, AppHeader
  │   ├── providers/          # ThemeProvider
  │   └── ui/                 # 15 shadcn/ui components
  ├── lib/
  │   ├── auth/               # Server actions (signIn, signUp, signOut)
  │   ├── supabase/           # client, server, admin, middleware
  │   ├── api-response.ts     # API helpers
  │   ├── constants.ts        # App constants & routes
  │   ├── db.ts               # Prisma singleton
  │   ├── env.ts              # Env validation (Zod)
  │   ├── utils.ts            # cn(), slugify(), formatDate()...
  │   └── validations.ts      # Zod schemas for API
  ├── types/                  # TypeScript types & Eisenhower metadata
  └── middleware.ts            # Auth protection
  ```

- [x] Push del schema a Supabase PostgreSQL (`prisma db push` exitoso, región us-west-2)

**Entregable:** ✅ Proyecto corriendo en localhost con auth funcional, DB schema sincronizado con Supabase, layout profesional.

---

## FASE 0.5 — Polish Visual y UX ✅ COMPLETADA

**Objetivo:** Pulir la experiencia visual y funcional antes de comenzar el desarrollo de features.

- [x] Paleta de colores basada en el logo Ordénate (blue/cyan oklch, gradientes)
- [x] Animaciones CSS (fadeIn, fadeInUp, fadeInDown, scaleIn, slideIn, float, pulseGlow, shimmer, gradient) + stagger delays
- [x] Componentes Framer Motion: FadeIn, StaggerContainer, StaggerItem, ScaleOnHover, PageTransition, AnimatedNumber, GlowCard
- [x] Componente LoadingButton con spinner integrado (usado en login, signup, header)
- [x] Signup en dos pasos: Paso 1 = credenciales, Paso 2 = selección de plan (Basic $9 / Pro $19)
- [x] Modal de confirmación de email post-registro con animaciones y branding
- [x] Server action `signUp` actualizado: acepta plan seleccionado, no redirige (retorna `{ success: true }` para mostrar modal)
- [x] Componente TelegramLink con QR code, deep link y código de vinculación (solo Pro)
- [x] Dashboard rediseñado con cards de acción con gradientes y CTA de upgrade para Basic
- [x] Landing page rediseñada con hero animado, integraciones y features
- [x] Login/Signup con animaciones Framer Motion y decoraciones de fondo
- [x] Sidebar con logo.png y branding con gradiente
- [x] Header con loading state en signOut y avatar con gradiente
- [x] Página 404 con logo flotante y texto con gradiente
- [x] Branding actualizado de "BrainDump" a "Ordénate — Tu mente, en orden"
- [x] Nuevos componentes:
  ```
  src/components/
  ├── auth/
  │   ├── email-confirmation-modal.tsx   # Modal post-registro
  │   └── plan-selection.tsx             # Selector de plan (Basic/Pro)
  ├── dashboard/
  │   └── telegram-link.tsx              # QR Telegram + vinculación
  └── ui/
      ├── loading-button.tsx             # Botón con loading spinner
      └── motion.tsx                     # Wrappers Framer Motion
  ```

**Entregable:** ✅ App con identidad visual completa de Ordénate, animaciones fluidas, signup con plan selection, Telegram QR linking.

---

## FASE 1 — Brain Dump Básico (Texto) ✅ COMPLETADA

**Objetivo:** El usuario puede crear un brain dump de texto y ver las líneas extraídas.

- [x] Página "Nuevo Brain Dump" con textarea grande
- [x] API Route: `POST /api/braindump` → guardar en DB
- [x] Parseo básico: dividir texto por líneas/saltos
- [x] Página "Revisión de líneas" → lista editable de TaskLines
- [x] CRUD de TaskLines (editar texto, eliminar, reordenar)
- [x] Página Dashboard con lista de Brain Dumps recientes
- [x] Estados de BrainDump: `draft` → `processed` → `archived`
- [x] Estados de TaskLine: `pending` → `done` → `hidden`

**Entregable:** ✅ Flujo completo texto → líneas → revisión.

---

## FASE 2 — Tablero Eisenhower

**Objetivo:** Tablero de 4 cuadrantes con drag & drop funcional.

- [x] Componente `EisenhowerBoard` con 4 columnas:
  - Q1: Urgente + Importante (Hacer)
  - Q2: No Urgente + Importante (Planificar)
  - Q3: Urgente + No Importante (Delegar)
  - Q4: No Urgente + No Importante (Eliminar)
- [x] Integrar dnd-kit para drag & drop entre cuadrantes
- [x] API Route: `PATCH /api/tasks/:id` → actualizar cuadrante
- [x] Persistencia optimista (actualizar UI antes de confirmar API)
- [x] Tarjeta de tarea con: texto, badge de cuadrante, fecha, acciones
- [x] Filtros: mostrar/ocultar completadas
- [x] Acción "Marcar como hecha" → ocultar automáticamente
- [x] Animaciones de transición entre cuadrantes

**Entregable:** Tablero Eisenhower interactivo con persistencia.

---

## FASE 3 — Inteligencia Artificial ✅ COMPLETADA

**Objetivo:** IA procesa texto e imágenes, sugiere clasificación.

- [x] Configurar cliente OpenAI (SDK)
- [x] API Route: `POST /api/ai/normalize` → enviar texto crudo al LLM
  - Prompt: convertir texto desordenado en lista limpia de tareas (JSON)
- [x] API Route: `POST /api/ai/classify` → sugerir cuadrante Eisenhower
  - Prompt: clasificar cada tarea en Q1/Q2/Q3/Q4
- [x] Upload de imagen → directo a OpenAI Vision (base64, sin storage)
- [x] API Route: `POST /api/ai/ocr` → OpenAI Vision extrae texto de imagen
- [x] Pipeline completo: imagen → OCR → normalizar → clasificar → revisión
- [x] UI de "procesando" con progreso/spinner
- [x] Manejo de errores y reintentos
- [x] Output JSON estricto con validación Zod
- [x] Toggle IA en página de nuevo dump (on/off)
- [x] Modo imagen: upload→preview→OCR→editable→procesar
- [x] Botón "Clasificar con IA" en detalle de dump
- [x] Badges de cuadrante Eisenhower en tareas clasificadas

**Entregable:** ✅ Flujo IA end-to-end (texto + foto → tareas clasificadas).

---

## FASE 4 — Vista Pareto + dueDate ✅ COMPLETADA

**Objetivo:** Identificar el 20% clave y asignar fechas límite.

- [x] Algoritmo de selección Pareto con IA:
  - `src/lib/ai/pareto.ts` — GPT-4o-mini identifica tareas vitales (max 20-30%)
  - Evalúa impacto, urgencia y alineación con Q1+Q2
  - Devuelve `impactScore` y `reason` por tarea
- [x] API Routes:
  - `GET /api/pareto` — Obtiene todas las tareas ordenadas por isPareto desc
  - `POST /api/ai/pareto` — Análisis IA de Pareto (sugiere cuáles marcar)
- [x] Vista "Foco Pareto" (`/dashboard/pareto`):
  - Lista prominente de tareas Pareto (las pocas vitales)
  - Sección colapsable con el resto de tareas
  - Estadísticas: activas, completadas, % del total
  - Botón "Analizar con IA" para sugerencias automáticas
- [x] Toggle manual de flag Pareto en cada tarea (⭐ en todas las vistas)
- [x] Campo dueDate con date picker nativo en vista Pareto
- [x] Badge Pareto (⭐) en Eisenhower board y dump detail
- [x] Marcar tareas como completadas desde vista Pareto
- [x] Ocultar/mostrar tareas completadas

**Entregable:** Vista Pareto funcional con IA + fechas límite + badges en todas las vistas.

---

## FASE 4.5 — Atributos Enriquecidos de Tareas + Eisenhower Rediseñado ✅ COMPLETADA

**Objetivo:** Enriquecer cada tarea con categoría, prioridad, sentimiento y tiempo estimado. Rediseñar el tablero Eisenhower con campos expandidos y clasificación IA.

### Backend
- [x] Prisma schema ampliado:
  - Modelo `Category` (id, name, workspaceId, `@@unique([workspaceId, name])`)
  - Task: campos `priority` (ALTA/MEDIA/BAJA), `feeling` (MUST_DO/WANT_TO/DONT_CARE/LAZY), `estimatedValue`+`estimatedUnit` (MINUTES/HOURS/DAYS), `responsible`, `leaderDecision`, `categoryId` FK
  - Nuevos enums: `TaskPriority`, `TaskFeeling`, `TimeUnit`
- [x] API `GET/POST /api/categories` — listar + crear/upsert categorías
- [x] Validaciones (`updateTaskSchema`) ampliadas con 7 campos opcionales
- [x] Task PATCH API procesa todos los nuevos campos
- [x] Eisenhower API incluye `category` en relación de tareas

### IA
- [x] Prompt de clasificación enriquecido: considera prioridad, sentimiento, tiempo y categoría
- [x] `classifyTasks()` acepta `string[] | ClassifyInput[]` (retrocompatible)
- [x] API classify acepta ambos formatos (union schema)

### Vista Brain Dump Detail
- [x] Filas de tareas expandibles con panel detallado (`TaskDetailPanel`)
- [x] Combo de categoría con opción de crear nueva
- [x] Botones toggle para Prioridad (ALTA/MEDIA/BAJA con colores)
- [x] Botones toggle para Sentimiento (😤/😊/😐/😴)
- [x] Input de tiempo estimado (valor + unidad)
- [x] Badges en cada fila: prioridad, categoría, sentimiento, cuadrante
- [x] Clasificación IA envía datos enriquecidos

### Vista Eisenhower Rediseñada
- [x] Cuadrantes renombrados: "Urgente e Importante", "No urgente pero importante", "Urgente pero no importante", "No es urgente ni importante"
- [x] Tarjetas expandibles con detalle: Estado (Pendiente/En Curso/Finalizado), Responsable, Pareto 20%, Vencimiento, Decisión del Líder
- [x] Badges inline: prioridad, sentimiento, categoría, responsable, vencimiento
- [x] Botón "Clasificar con IA" en la cabecera (clasifica tareas sin cuadrante)
- [x] Nombre de tarea solo-lectura en Eisenhower (editable solo en brain dump)

### Tipos y Constantes
- [x] `PRIORITY_META`, `FEELING_META`, `TIME_UNIT_META`, `TASK_STATUS_META`
- [x] `QUADRANT_META` labels actualizados

**Entregable:** Tareas con atributos ricos, panel expandible en ambas vistas, clasificación IA enriquecida.

---

## FASE 5 — Stripe Billing

**Objetivo:** Sistema de suscripciones con pagos recurrentes.

- [ ] Configurar Stripe: productos, precios (Basic, Pro)
- [ ] Página de Pricing en landing
- [ ] Stripe Checkout Session → redirect a pago
- [ ] Webhook handler: `POST /api/webhooks/stripe`
  - `checkout.session.completed` → crear Subscription
  - `invoice.paid` → renovar
  - `customer.subscription.deleted` → cancelar
- [ ] Modelo Subscription en Prisma (plan, status, stripeId, currentPeriodEnd)
- [ ] Middleware de feature gating (verificar plan antes de features Pro)
- [ ] Portal de cliente Stripe (gestionar suscripción)
- [ ] Página Settings con info de suscripción actual
- [ ] Lógica de límites para plan Basic (ej: max 10 dumps/mes)

**Entregable:** Pagos funcionales con control de acceso por plan.

---

## FASE 6 — Bots de Mensajería (Telegram + WhatsApp)

**Objetivo:** Capturar brain dumps desde mensajería.

- [ ] Telegram Bot:
  - Registrar bot con BotFather
  - Webhook: `POST /api/webhooks/telegram`
  - Recibir texto → crear BrainDump → procesar con IA
  - Recibir foto → OCR → crear BrainDump
  - Vincular cuenta Telegram con User (código de enlace)
- [ ] WhatsApp Business API:
  - Configurar webhook
  - Mismo flujo que Telegram
- [ ] Notificaciones de confirmación al usuario
- [ ] Solo disponible en plan Pro

**Entregable:** Brain dumps creados desde Telegram y WhatsApp.

---

## FASE 7 — UX Polish + Lanzamiento

**Objetivo:** Pulir la experiencia y preparar para producción.

- [ ] Animaciones con Framer Motion (transiciones de página, modals, drag)
- [ ] Atajos de teclado:
  - `Cmd+K` → command palette
  - `N` → nuevo dump
  - `1-4` → mover tarea a cuadrante
  - `D` → marcar como done
- [ ] Dark mode / Light mode toggle
- [ ] Responsive completo (mobile-first)
- [ ] Loading skeletons en todas las páginas
- [ ] Toast notifications (sonner)
- [ ] Empty states con ilustraciones
- [ ] Onboarding flow para nuevos usuarios
- [ ] SEO + Open Graph en landing
- [ ] Rate limiting en API routes
- [ ] Tests e2e (Playwright) para flujos críticos
- [ ] Deploy a Vercel (producción)
- [ ] Monitoreo (Sentry para errores)
- [ ] Analytics básico

**Entregable:** App lista para usuarios reales.

---

---

# 🚀 ORDEN DE EJECUCIÓN

```
FASE 0  ━━━━━━━━━━━━━━━━━━━━━━━  Setup
   ↓
FASE 1  ━━━━━━━━━━━━━━━━━━━━━━━  Brain Dump texto
   ↓
FASE 2  ━━━━━━━━━━━━━━━━━━━━━━━  Tablero Eisenhower
   ↓
FASE 3  ━━━━━━━━━━━━━━━━━━━━━━━  IA (OCR + LLM)
   ↓
FASE 4  ━━━━━━━━━━━━━━━━━━━━━━━  Pareto + Calendar
   ↓
FASE 4.5━━━━━━━━━━━━━━━━━━━━━━━  Atributos Enriquecidos + Eisenhower v2
   ↓
FASE 5  ━━━━━━━━━━━━━━━━━━━━━━━  Stripe Billing
   ↓
FASE 6  ━━━━━━━━━━━━━━━━━━━━━━━  Bots mensajería
   ↓
FASE 7  ━━━━━━━━━━━━━━━━━━━━━━━  UX Polish + Deploy
```

Cada fase es un incremento funcional completo y demostrable.

---

# ✅ CHECKLIST PRE-ARRANQUE

Antes de iniciar la Fase 0, necesitas tener listo:

- [ ] **Cuenta Supabase o Neon** → URL de conexión PostgreSQL
- [ ] **Cuenta Clerk** → API keys (publishable + secret)
- [ ] **Cuenta OpenAI** → API key con acceso a GPT-4 Vision
- [ ] **Cuenta Stripe** → API keys (test mode)
- [ ] **Cuenta Cloudflare R2 o AWS S3** → credenciales de storage
- [ ] **Node.js 20+** instalado
- [ ] **pnpm** instalado (`npm install -g pnpm`)

---

> **⏸ ESPERANDO CONFIRMACIÓN PARA INICIAR FASE 0**
