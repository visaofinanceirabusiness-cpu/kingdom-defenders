import { z } from 'zod';

export const createManualLessonSchema = z.object({
  title: z.string().trim().min(3, 'Ponele un título a la clase.').max(200),
  subject: z.string().trim().max(80).optional(),
  topic: z.string().trim().max(300).optional(),
  schoolYear: z.string().trim().max(40).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  courseId: z.string().uuid().optional(),
});

export const SECTION_TYPES = ['introduction', 'theory', 'examples', 'evaluation'] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const addSectionSchema = z.object({
  sectionType: z.enum(SECTION_TYPES),
  title: z.string().trim().min(2).max(120),
  text: z.string().trim().min(1, 'Escribí el contenido de esta sección.').max(8000),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
