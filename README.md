# AulaPlay 🎮

Plataforma educativa inteligente: transformá cualquier material de
estudio (Word, PDF, o simplemente un tema) en una clase interactiva
con explicaciones, juegos y evaluaciones generadas por IA. Pensada
para docentes de nivel secundario, cualquier materia.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase
(Postgres + Auth + Storage) + Zod + ChatGPT (OpenAI) para generar el
contenido de las clases — con modo DEMO automático si no hay ninguna
clave de IA configurada.

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
| `OPENAI_API_KEY` | No — recomendada, es la que genera el contenido de las clases | [platform.openai.com](https://platform.openai.com) |
| `ANTHROPIC_API_KEY` | No — alternativa si no hay `OPENAI_API_KEY` (no es el default) | [console.anthropic.com](https://console.anthropic.com) |

Sin ninguna de las dos claves de IA, la app corre en modo DEMO (contenido de ejemplo, claramente identificado).

## Estado actual

**Fase 1 — hecha:** identidad visual, esquema de base de datos completo
con RLS, autenticación docente (registro/login), dashboard con
métricas reales, gestión de cursos, y el flujo de crear clase (cargar
Word/PDF o escribir un tema → análisis con IA → revisión y
corrección).

**Fase 2 — hecha (parcial):** generación completa de la clase
(introducción, teoría, ejemplos, actividades, desafío final,
evaluación), editor de clase con previsualización jugable y
publicación (código de acceso), y render real de 3 de los 10 tipos de
juego (Trivia, Verdadero o Falso, Completar). Faltan los otros 7
renders y la edición inline del texto generado.

- 🚧 Acceso de alumnos por código y ejecución de juegos — próxima fase (Fase 3)

Ver `CLAUDE.md` para el detalle técnico completo y las convenciones del proyecto.

## Scripts

- `npm run dev` — levantar en local
- `npm run build` — build de producción
- `npx tsc --noEmit` — typecheck
- `npx eslint .` — lint
