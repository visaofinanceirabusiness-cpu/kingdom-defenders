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
const PROPOSED_GAME_TYPES = ['trivia', 'true_or_false', 'fill_in_the_blank'] as const;

const proposedActivitySchema = z.object({
  gameType: z.enum(PROPOSED_GAME_TYPES),
  title: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
});

export const lessonGenerationSchema = z.object({
  introduction: z.string().min(1),
  theory: z.string().min(1),
  examples: z.string().min(1),
  activities: z.array(proposedActivitySchema).min(1).max(4),
  finalChallenge: proposedActivitySchema,
  evaluationSummary: z.string().min(1),
});

export type LessonGeneration = z.infer<typeof lessonGenerationSchema>;
export type ProposedActivity = z.infer<typeof proposedActivitySchema>;
