# AulaPlay 🎮

Plataforma educativa inteligente: transformá cualquier material de
estudio (Word, PDF, o simplemente un tema) en una clase interactiva
con explicaciones, juegos y evaluaciones generadas por IA. Pensada
para docentes de nivel secundario, cualquier materia.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase
(Postgres + Auth + Storage) + Zod + Anthropic Claude (con modo DEMO
automático si no hay API key configurada).

## Cómo correr el proyecto

```bash
npm install
cp .env.local.example .env.local   # completar las variables (ver abajo)
npm run dev
```

Abrir http://localhost:3000

## Variables de entorno

| Variable | Obligatoria | Dónde conseguirla |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí (para rutas que actúan en nombre de un alumno) | Supabase Dashboard → Project Settings → API |
| `ANTHROPIC_API_KEY` | No — sin ella, la IA corre en modo DEMO (contenido de ejemplo, claramente identificado) | [console.anthropic.com](https://console.anthropic.com) |

## Estado actual (Fase 1 del MVP)

- ✅ Identidad visual, landing, esquema de base de datos completo con RLS
- ✅ Autenticación docente (registro/login)
- ✅ Dashboard docente con métricas reales
- ✅ Gestión de cursos (crear, listar, ver detalle)
- ✅ Crear nueva clase: cargar Word/PDF o escribir un tema → análisis con IA → revisión y corrección
- ✅ Catálogo inicial de 10 tipos de juego (trivia, memotest, escape room, carrera, etc.) con sus esquemas de configuración validados
- 🚧 Generación completa de la clase (secciones, actividades, render de juegos) — próxima fase
- 🚧 Acceso de alumnos por código y ejecución de juegos — próxima fase

Ver `CLAUDE.md` para el detalle técnico completo y las convenciones del proyecto.

## Scripts

- `npm run dev` — levantar en local
- `npm run build` — build de producción
- `npx tsc --noEmit` — typecheck
- `npx eslint .` — lint
