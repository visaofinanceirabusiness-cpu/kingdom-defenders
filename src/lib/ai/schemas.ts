// Formas de respuesta estructurada que espera AIService — tanto el
// proveedor demo como cualquier proveedor real (Anthropic, etc.)
// tienen que devolver algo que pase por estos schemas. Ninguna
// respuesta de IA se usa sin validar acá primero (regla #7 del
// proyecto: "Validar toda respuesta generada por IA antes de
// utilizarla").
import { z } from 'zod';

export const materialAnalysisSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().min(1),
  summary: z.string().min(1),
  learning_objectives: z.array(z.string().min(1)).min(1).max(8),
  key_concepts: z.array(z.string().min(1)).min(1),
  recommended_difficulty: z.enum(['easy', 'medium', 'hard']),
  recommended_school_year: z.string().min(1),
});

export type MaterialAnalysis = z.infer<typeof materialAnalysisSchema>;

// Tipos de juego que el generador de clase puede pedirle a la IA —
// solo los que ya tienen componente de render (ver
// RENDERABLE_GAME_TYPE_IDS en lib/games/registry.ts). El `config` de
// cada actividad se valida aparte, contra el schema específico de su
// gameType (lib/games/schemas.ts) — acá solo se valida la forma
// general de "una actividad propuesta por la IA".
const PROPOSED_GAME_TYPES = ['trivia', 'true_or_false', 'fill_in_the_blank', 'memory_match', 'order'] as const;

const proposedActivitySchema = z.object({
  gameType: z.enum(PROPOSED_GAME_TYPES),
  title: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
});

// Un "tema" agrupa su propia explicación teórica + ejemplo práctico
// — una clase puede tener varios (se muestran apilados en
// desplegables), reemplaza el viejo par único theory/examples.
const temaSchema = z.object({
  title: z.string().min(1),
  theory: z.string().min(1),
  examples: z.string().min(1),
});

// Libre de repetir tipo de juego (antes tendía a salir "una de cada
// una" con solo 3 tipos posibles y 4 actividades como techo) — ahora
// hasta 10 actividades en total, con un tope de 5 por tipo para que
// no se desbalanceen hacia uno solo.
export const lessonGenerationSchema = z.object({
  introduction: z.string().min(1),
  temas: z.array(temaSchema).min(1).max(6),
  activities: z
    .array(proposedActivitySchema)
    .min(1)
    .max(10)
    .refine(
      (actividades) => {
        const porTipo = new Map<string, number>();
        for (const a of actividades) porTipo.set(a.gameType, (porTipo.get(a.gameType) ?? 0) + 1);
        return [...porTipo.values()].every((n) => n <= 5);
      },
      { message: 'No puede haber más de 5 actividades del mismo tipo de juego.' }
    ),
  finalChallenge: proposedActivitySchema,
  evaluationSummary: z.string().min(1),
});

export type LessonGeneration = z.infer<typeof lessonGenerationSchema>;
export type ProposedActivity = z.infer<typeof proposedActivitySchema>;
export type Tema = z.infer<typeof temaSchema>;
