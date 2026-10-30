# CLAUDE.md

AulaPlay — plataforma educativa inteligente (Next.js + Supabase).
Transforma material de estudio (Word/PDF o un tema escrito a mano) en
una clase interactiva con explicaciones, juegos y evaluaciones
generadas por IA. Docentes de nivel secundario, cualquier materia.

## Comandos
- `npm run dev` — levantar en local
- `npm run build` — build de producción
- `npx tsc --noEmit` — typecheck (correr siempre antes de pushear)
- `npx eslint .` — lint

## Stack
- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
  (tema en `src/app/globals.css`, `@theme inline` — colores `brand`/
  `accent`/`success`, sin librería de componentes externa)
- Supabase (Postgres + Auth + Storage) — project ref
  `fxttpvaobpjogchkhpdp`, proyecto separado de cualquier otro producto
- Validación: Zod en todos los límites (formularios, API routes,
  configuración de juegos, respuestas de IA)
- IA: ChatGPT (OpenAI) vía capa propia (`src/lib/ai/`) — decisión del
  producto: OpenAI genera el contenido de las clases, Anthropic queda
  como alternativa en el código (no es el default). Modo DEMO
  automático si no hay ninguna de las dos claves. Orden de prioridad
  en `service.ts`: `OPENAI_API_KEY` > `ANTHROPIC_API_KEY` > demo.
- Next 16 usa el archivo `src/proxy.ts` (no `middleware.ts`, convención
  vieja deprecada) para refrescar la sesión de Supabase en cada
  request
- `cacheComponents`/Partial Prerendering de Next 16 están APAGADOS a
  propósito en `next.config.ts` — casi todas las pantallas dependen de
  la sesión del docente, activarlo exigiría Suspense en todos lados
  sin beneficio real todavía

## Convenciones del código
- Español — es el idioma inicial del producto (ver spec original);
  dejar la internacionalización a portugués preparada pero no
  implementada todavía (no hay capa de i18n armada aún)
- Comentarios solo para el PORQUÉ, nunca el QUÉ
- `src/app/<ruta>/page.tsx` + componentes grandes extraídos a
  `src/components/docente/` cuando tienen estado propio — no todo
  vive en el page.tsx
- Motor de juegos (`src/lib/games/`): `registry.ts` (qué tipos de
  juego existen, un solo lugar) + `schemas.ts` (Zod por tipo de
  juego) — sumar un juego nuevo es agregar una entrada en los dos +
  su fila en `game_templates` (DB) + su componente de render (cuando
  se implemente el render, Fase 2/3). Nunca un `switch` de game_type
  hardcodeado en otro lado.
- IA (`src/lib/ai/`): todo pasa por la interfaz `AIProvider`
  (`provider.ts`) — `OpenAIProvider` (default si hay clave),
  `AnthropicAIProvider` (alternativa) o `DemoProvider` (sin ninguna
  clave). `service.ts` elige cuál. Toda respuesta de IA se valida con
  Zod (`schemas.ts`) antes de usarse — nunca se confía en el JSON tal
  cual viene. La IA NUNCA genera código ejecutable (JS/HTML), solo
  configuración JSON validada contra los schemas de juegos.
- Documentos (`src/lib/documents/extract.ts`): `mammoth` para .docx,
  `pdf-parse` v2 (API nueva, clase `PDFParse`, no la vieja función —
  ver comentario en el archivo) para PDF.
- RLS en TODAS las tablas — un docente solo ve sus propios cursos/
  clases/materiales/alumnos inscriptos. Los alumnos (MVP sin cuenta)
  nunca leen/escriben tablas directo: todo pasa por rutas de servidor
  con `src/lib/supabase/admin.ts` (service role), que cada ruta tiene
  que validar a mano (código de acceso correcto, etc.) porque
  bypassea RLS.
- `src/types/database.ts` es generado (`mcp__Supabase__generate_typescript_types`)
  — no editar a mano, regenerar si cambia el esquema.

## Estado del proyecto (ver spec completo en el primer prompt del usuario)

**Fase 1 — hecha:**
- Identidad visual (Tailwind theme, landing)
- Esquema completo de base de datos (12 tablas) + RLS + bucket privado
  de materiales + catálogo inicial de 10 tipos de juego
  (`game_templates`, con `config_schema` en JSON Schema espejando los
  Zod schemas de `src/lib/games/schemas.ts`)
- Auth docente (registro/login/logout) con Supabase Auth — el perfil
  se crea con un trigger en `auth.users` (`handle_new_user`,
  SECURITY DEFINER), NO desde el cliente después de `signUp()`: este
  proyecto exige confirmar el email antes de dar sesión activa, así
  que un insert desde el cliente justo después de registrarse corre
  sin sesión y la política de RLS lo rechaza (bug real, encontrado
  probando el deploy — ver commit del fix).
- Dashboard docente (métricas reales, no inventadas)
- Mis cursos (crear/listar/detalle)
- Crear nueva clase — Paso 1 (cargar Word/PDF o escribir un tema) +
  Paso 2 (ver y corregir el análisis que arma la IA)

**Fase 2 — hecha (parcial, ver "Pendiente" abajo):**
- Generación completa de la clase (`api/lessons/[id]/generate`):
  introducción, teoría, ejemplos, actividades, desafío final y
  evaluación, a partir del análisis aprobado — se guarda como
  `lesson_sections` + `activities`. Cada actividad se valida DOS
  veces antes de guardarse: forma general (`lessonGenerationSchema`,
  en el proveedor de IA) y configuración específica de su tipo de
  juego (`validateGameConfig`, `lib/games/registry.ts`) — si algo no
  valida, no se guarda nada (todo o nada).
- Editor de clase (`docente/clases/[id]/editor`): ve las secciones
  generadas, previsualiza cada actividad jugándola de verdad (no una
  maqueta), puede eliminar actividades, y publicar (genera
  `access_code` de 6 caracteres + `published_at`).
- Render real de 3 de los 10 tipos de juego: **Trivia**, **Verdadero
  o Falso**, **Completar** (`src/components/games/`) — cada uno con
  pantalla de intro, mecánica interactiva, feedback visual inmediato,
  puntaje y resultado final, como pide el spec. `GameRenderer`
  (`game-renderer.tsx`) es el único lugar que decide qué componente
  usar según `game_template_id` — mismo patrón "un solo lugar
  central" que `GameRegistry`.
- `RENDERABLE_GAME_TYPE_IDS` (`lib/games/registry.ts`) limita a estos
  3 lo que la IA puede proponer al generar una clase — para no
  terminar con una actividad guardada que nadie puede previsualizar
  todavía. Memotest/Relacionar/Ordenar/Ruleta/Escape Room/Carrera/
  Contrarreloj ya tienen su schema de configuración listo
  (`lib/games/schemas.ts`), les falta el componente de render.

**Fase 3 — hecha:**
- Acceso de alumno sin cuenta (`/clase` → `/clase/[codigo]` →
  `/clase/sesion/[sessionId]`): ingresa el código de 6 de la clase
  publicada, pone su nombre, y entra a jugar. Crea una fila en
  `students` (con su propio `access_code` de 8, para uso futuro),
  en `course_members` si la clase tiene curso, y una `sessions` en
  `in_progress`.
- `ClasePlayer` (`src/components/alumno/clase-player.tsx`): arma la
  secuencia completa de la clase (secciones de texto + actividades)
  como una serie de "pasos" y la recorre una por una, reusando
  `GameRenderer` (mismo componente que el preview del docente) con un
  `onTerminar` nuevo que dispara el guardado de cada respuesta.
- Puntaje: cada actividad guarda su resultado en `student_responses`
  (`registrarRespuestaAction`), y al terminar la clase
  `finalizarSesionAction` SUMA esos puntajes del lado del servidor
  para cerrar la `sessions` (status `completed` + `total_score`) —
  nunca se confía en un puntaje calculado en el navegador del alumno.
- Resultados para el docente (`docente/clases/[id]/resultados`):
  cuántos alumnos entraron, cuántos completaron, promedio, y el
  detalle por alumno (nombre + puntaje). Nueva policy de RLS
  (`rls_select_students_para_docente`) para que el docente pueda ver
  los nombres de sus alumnos.
- Todas las rutas de alumno (`/clase/**`) usan
  `src/lib/supabase/admin.ts` (service role) porque el alumno no
  tiene sesión de Supabase Auth en el MVP — cada acción valida a mano
  que el código/sesión/actividad corresponda antes de escribir nada.

**Ampliación — Profesor particular (hecha, 1era etapa):**
- `students` ahora admite alumnos propios de un docente (sin curso):
  `teacher_id`, `school_year`, `level`, `subjects` (jsonb). Alumnos de
  curso (entran con código) siguen sin `teacher_id`. Nueva policy RLS
  "un docente administra sus propios alumnos" (ALL, por `teacher_id`).
- `docente/alumnos`: alta de alumnos propios + ficha individual
  (`docente/alumnos/[id]`) con historial de sesiones, clases
  realizadas/pendientes y puntaje — primera versión de "seguimiento
  pedagógico" (lo que falta: tiempo de resolución, temas dominados/a
  reforzar y recomendaciones de IA, quedan para una etapa posterior).
- `docente/biblioteca`: lista las clases ya generadas (reusa `lessons`
  tal cual, no hay tabla nueva de "plantillas") con dos acciones:
  - **Duplicar** (`duplicarLessonAction`): copia `lessons` +
    `lesson_sections` + `activities` con inserts planos — NUNCA llama
    a la IA, así reusar/duplicar no gasta una generación.
  - **Usar con un alumno** (`asignarSesionAction`): crea una
    `sessions` directo para un alumno propio, sin pasar por el código
    de acceso público — da un link `/clase/sesion/[id]` para mandar
    por fuera (reusa el jugador de la Fase 3 sin cambios).
- `sessions` NO cambió de esquema — ya era, conceptualmente, el
  `LessonSession` del pedido: desacopla clase y alumno, cada uso
  genera una fila independiente, y la plantilla original nunca se
  toca al ejecutar una sesión.
- Decisión tomada con el usuario: los límites de plan (alumnos,
  generaciones de IA, clases guardadas) van a quedar fijos en código
  (no editables desde Supabase) cuando se implementen — todavía no
  están implementados, es la siguiente etapa.

**Ampliación — Personalización por nivel (hecha):**
- `lessons.base_lesson_id` (self-FK, nullable) + `lessons.variant_level`
  (`basico`/`intermedio`/`avanzado`). Una variante es otra fila de
  `lessons`, nunca se modifica la original.
- Pipeline de generación extraído a
  `lib/lessons/generar-contenido.ts` (lo comparten `api/lessons/[id]/
  generate` y `generarVarianteAction`) — evita tener la lógica de
  generar+validar+insertar secciones/actividades duplicada en dos
  lugares.
- `generarVarianteAction` (`docente/biblioteca/actions.ts`): toma el
  resumen/objetivos ya aprobados de la clase original, mapea el nivel
  a una dificultad (`basico→easy`, `intermedio→medium`,
  `avanzado→hard`) y le pide a la IA una clase nueva completa para ese
  nivel — a diferencia de duplicar, esto SÍ consume una generación de
  IA real (es contenido nuevo, no una copia).
- Biblioteca: las variantes aparecen agrupadas bajo su clase base como
  chips clickeables, en vez de listarse como clases sueltas.

**Ampliación — Seguimiento pedagógico (hecha, versión simple):**
- `student_responses.duration_seconds`: `ClasePlayer` mide cuánto
  tarda el alumno en cada actividad (desde que se renderiza el paso
  hasta que dispara `onTerminar`) y lo manda a `registrarRespuestaAction`.
- Ficha del alumno (`docente/alumnos/[id]`): suma respuestas
  incorrectas, tiempo promedio, y clasifica cada `topic` jugado como
  "dominado" (≥80% de la última sesión completada de ese tema),
  "a reforzar" (<50%) o en progreso — heurística simple y transparente
  en código, NO es un análisis de IA (eso se dejó para una etapa
  posterior, como pidió el usuario explícitamente).

**Ampliación — Límites de plan (hecha):**
- `profiles.plan` (`free`/`pro`, default `free`) + tabla `ai_usage`
  (`teacher_id`, `period_start` = primer día del mes, `generations_count`)
  con policy RLS propia.
- `lib/plan/limits.ts`: `PLAN_LIMITS` fijo en código (decisión tomada
  con el usuario) — `free`: 15 generaciones de IA/mes, 5 alumnos
  activos, 10 clases guardadas; `pro`: 300/100/300. Cambiar un plan es
  editar ese objeto.
- `lib/plan/usage.ts`: `reservarGeneracionDeIA` (chequea Y reserva el
  cupo ANTES de llamar a la IA — nunca después, para que no se pueda
  esquivar llamando al pipeline directo), `chequearLimiteDeAlumnos`,
  `chequearLimiteDeClasesGuardadas`. `generarContenidoClase` ahora
  recibe `teacherId` y corre ambos chequeos (cupo de IA + clases
  guardadas) antes de generar — duplicar una clase NO pasa por acá,
  así que nunca gasta cupo de IA (como pedía el requisito).
- Dashboard: tarjeta "Tu plan" con barras de uso (generaciones de IA
  del mes, alumnos activos, clases guardadas).
- Todavía no hay forma de que el docente pase de plan `free` a `pro`
  desde la UI (no se pidió pago/suscripción todavía) — por ahora se
  cambia a mano: `update profiles set plan = 'pro' where id = '...'`.

Pendiente (ver spec original de AulaPlay):
- Resto de los 7 componentes de render de juegos
- Edición fina de las secciones de texto generadas (hoy se ven, se
  puede borrar una actividad, pero no hay edición inline del texto de
  introducción/teoría/ejemplos — hay que volver a generar para
  cambiarlos)
- Fase 4: pulido, seguridad, responsive, optimización
- Gamificación de alumno: `student_progress` (tabla ya existe en el
  esquema) todavía no se actualiza ni se muestra en ningún lado
- Reintento/reanudación: si un alumno cierra la pestaña a mitad de una
  clase, el link de esa sesión (`/clase/sesion/[id]`) la retoma donde
  quedó, pero no hay forma de volver a encontrar ese link si lo perdió
  (no hay "recordame" ni login de alumno)
- Generación de imágenes para ilustrar actividades (mencionado por el
  usuario, no implementado — quedaría como un método nuevo en
  `AIProvider`, ej. `generateImage`, con su propio proveedor)
- Monetización (idea, no decidida todavía): hoy AulaPlay es gratis e
  ilimitado, el costo de OpenAI lo paga el dueño de la cuenta. Costo
  estimado por clase generada con `gpt-4o`: ~u$s0.04-0.05 (2 llamadas,
  análisis + generación completa; documentos largos pueden llegar a
  u$s0.10-0.15). Con eso, 1.000 docentes activos generando ~15
  clases/mes c/u sale ~u$s600-750/mes en OpenAI (bajaría a ~u$s60-75
  si en algún momento hace falta cambiar a `gpt-4o-mini`, mismo código
  salvo el nombre del modelo). Un plan pago de u$s5-10/docente/mes
  dejaría margen amplio — no está construido (no hay Stripe, planes,
  ni límites de uso todavía), queda como posible feature futura.

## Limitaciones conocidas de este entorno de desarrollo
- Este sandbox NO tiene salida de red directa a `*.supabase.co` (solo
  las herramientas MCP de Supabase pueden hablar con el proyecto) —
  no se pudo probar el flujo de registro/login contra el proyecto real
  corriendo un script aparte; si algo falla ahí, probar primero a mano
  desde el navegador antes de asumir otra causa.
- `SUPABASE_SERVICE_ROLE_KEY` no se puede obtener vía MCP (por
  seguridad) — hay que cargarla a mano en `.env.local` desde el
  Dashboard de Supabase (Project Settings → API) antes de poder correr
  cualquier lógica que use `src/lib/supabase/admin.ts`.
