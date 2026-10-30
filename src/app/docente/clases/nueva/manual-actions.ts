'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createManualLessonSchema } from '@/lib/validations/lesson-manual';
import { chequearLimiteDeClasesGuardadas } from '@/lib/plan/usage';

export type ManualLessonActionState = { error: string } | null;

// Crea la clase directo, SIN pasar por materials/analyze/generate —
// no llama a la IA en ningún momento. El docente construye todo a
// mano en el paso siguiente (construir/). Cuenta contra el límite de
// "clases guardadas" del plan igual que una generada con IA (no
// contra el de generaciones de IA, porque no gasta ninguna).
export async function crearClaseManualAction(_prevState: ManualLessonActionState, formData: FormData): Promise<ManualLessonActionState> {
  const parsed = createManualLessonSchema.safeParse({
    title: formData.get('title'),
    subject: formData.get('subject') || undefined,
    topic: formData.get('topic') || undefined,
    schoolYear: formData.get('schoolYear') || undefined,
    difficulty: formData.get('difficulty') || undefined,
    courseId: formData.get('courseId') || undefined,
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

  const limite = await chequearLimiteDeClasesGuardadas(supabase, user.id, '00000000-0000-0000-0000-000000000000');
  if (!limite.allowed) {
    return { error: limite.error };
  }

  const { data: lesson, error } = await supabase
    .from('lessons')
    .insert({
      teacher_id: user.id,
      course_id: parsed.data.courseId || null,
      title: parsed.data.title,
      subject: parsed.data.subject || null,
      topic: parsed.data.topic || null,
      school_year: parsed.data.schoolYear || null,
      difficulty: parsed.data.difficulty || null,
      summary: null,
      status: 'ready_for_review',
    })
    .select('id')
    .single();

  if (error || !lesson) {
    return { error: `No se pudo crear la clase: ${error?.message ?? 'error desconocido'}` };
  }

  redirect(`/docente/clases/${lesson.id}/construir`);
}
