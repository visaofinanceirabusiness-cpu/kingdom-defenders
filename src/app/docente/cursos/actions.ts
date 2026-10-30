'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createCourseSchema } from '@/lib/validations/course';

export type CourseActionState = { error: string } | null;

export async function createCourseAction(_prevState: CourseActionState, formData: FormData): Promise<CourseActionState> {
  const parsed = createCourseSchema.safeParse({
    name: formData.get('name'),
    subject: formData.get('subject') || undefined,
    schoolYear: formData.get('schoolYear') || undefined,
    description: formData.get('description') || undefined,
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

  const { error } = await supabase.from('courses').insert({
    teacher_id: user.id,
    name: parsed.data.name,
    subject: parsed.data.subject || null,
    school_year: parsed.data.schoolYear || null,
    description: parsed.data.description || null,
  });

  if (error) {
    return { error: `No se pudo crear el curso: ${error.message}` };
  }

  revalidatePath('/docente/cursos');
  revalidatePath('/docente');
  return null;
}
