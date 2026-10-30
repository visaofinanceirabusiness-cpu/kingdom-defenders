import { z } from 'zod';

export const createStudentSchema = z.object({
  displayName: z.string().trim().min(2, 'Ingresá el nombre del alumno.').max(80),
  schoolYear: z.string().max(40).optional(),
  level: z.string().max(40).optional(),
  subjects: z
    .string()
    .max(300)
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [])),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
