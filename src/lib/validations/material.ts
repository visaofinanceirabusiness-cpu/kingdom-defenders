import { z } from 'zod';

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/pdf',
] as const;

export const manualTopicSchema = z.object({
  topic: z.string().min(4, 'Describí el tema con un poco más de detalle.').max(300),
  schoolYear: z.string().max(40).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  courseId: z.string().uuid().optional(),
});

export type ManualTopicInput = z.infer<typeof manualTopicSchema>;
