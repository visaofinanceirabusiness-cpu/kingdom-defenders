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
- IA: Anthropic Claude vía capa propia (`src/lib/ai/`), con modo DEMO
  automático si no hay `ANTHROPIC_API_KEY`
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
  (`provider.ts`) — `AnthropicAIProvider` (real) o `DemoProvider`
  (sin API key). `service.ts` elige cuál según haya o no
  `ANTHROPIC_API_KEY`. Toda respuesta de IA se valida con Zod
  (`schemas.ts`) antes de usarse — nunca se confía en el JSON tal
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

## Estado del proyecto (Fase 1 del MVP — ver spec completo en el primer prompt del usuario)
Implementado:
- Identidad visual (Tailwind theme, landing)
- Esquema completo de base de datos (12 tablas) + RLS + bucket privado
  de materiales + catálogo inicial de 10 tipos de juego
  (`game_templates`, con `config_schema` en JSON Schema espejando los
  Zod schemas de `src/lib/games/schemas.ts`)
- Auth docente (registro/login/logout) con Supabase Auth
- Dashboard docente (métricas reales, no inventadas)
- Mis cursos (crear/listar/detalle)
- Crear nueva clase — Paso 1 (cargar Word/PDF o escribir un tema) +
  Paso 2 (ver y corregir el análisis que arma la IA — modo DEMO si no
  hay API key)
- Capa de IA y motor de juegos con su estructura lista (providers,
  registry, schemas) para que la Fase 2 los use de verdad

Pendiente (fases siguientes, ver spec original):
- Fase 2: generación completa de la clase (secciones, actividades,
  juegos) a partir del análisis aprobado; editor de clase; render de
  los 10 juegos
- Fase 3: acceso de alumnos por código, ejecución de juegos, registro
  de resultados, reportes
- Fase 4: pulido, seguridad, responsive, optimización

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
