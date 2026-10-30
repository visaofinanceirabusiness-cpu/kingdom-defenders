import { z } from 'zod';

export const createCourseSchema = z.object({
  name: z.string().min(2, 'Ingresá un nombre para el curso.').max(120),
  subject: z.string().max(80).optional(),
  schoolYear: z.string().max(40).optional(),
  description: z.string().max(500).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
