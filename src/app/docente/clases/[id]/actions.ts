'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const updateAnalysisSchema = z.object({
  title: z.string().min(2).max(160),
  subject: z.string().min(1).max(80),
  topic: z.string().min(1).max(200),
  schoolYear: z.string().max(40).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  summary: z.string().min(1).max(1000),
  learningObjectives: z.array(z.string().min(1)).min(1),
});

export type UpdateAnalysisState = { error: string } | { success: true } | null;

export async function updateLessonAnalysisAction(lessonId: string, formData: FormData): Promise<UpdateAnalysisState> {
  const objectives = (formData.get('learningObjectives') as string)
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean);

  const parsed = updateAnalysisSchema.safeParse({
    title: formData.get('title'),
    subject: formData.get('subject'),
    topic: formData.get('topic'),
    schoolYear: formData.get('schoolYear') || undefined,
    difficulty: formData.get('difficulty'),
    summary: formData.get('summary'),
    learningObjectives: objectives,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { error } = await supabase
    .from('lessons')
    .update({
      title: parsed.data.title,
      subject: parsed.data.subject,
      topic: parsed.data.topic,
      school_year: parsed.data.schoolYear || null,
      difficulty: parsed.data.difficulty,
      summary: parsed.data.summary,
      learning_objectives: parsed.data.learningObjectives,
    })
    .eq('id', lessonId)
    .eq('teacher_id', user.id);

  if (error) {
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath(`/docente/clases/${lessonId}/analisis`);
  return { success: true };
}
