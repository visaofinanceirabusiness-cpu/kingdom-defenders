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
