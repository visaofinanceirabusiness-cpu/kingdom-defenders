'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

export async function updateCourseAction(courseId: string, _prevState: CourseActionState, formData: FormData): Promise<CourseActionState> {
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

  const { error } = await supabase
    .from('courses')
    .update({
      name: parsed.data.name,
      subject: parsed.data.subject || null,
      school_year: parsed.data.schoolYear || null,
      description: parsed.data.description || null,
    })
    .eq('id', courseId)
    .eq('teacher_id', user.id);

  if (error) {
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath('/docente/cursos');
  revalidatePath(`/docente/cursos/${courseId}`);
  redirect(`/docente/cursos/${courseId}`);
}

export type DeleteActionState = { error: string } | { success: true } | null;

// Borrar un curso NO borra sus clases ni materiales — quedan como
// "sin curso" (course_id se pone en null por la FK, ver migración de
// esquema inicial), solo se pierde la organización por curso. Los
// alumnos inscriptos sí se desvinculan (course_members en cascade).
export async function deleteCourseAction(courseId: string): Promise<DeleteActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { error } = await supabase.from('courses').delete().eq('id', courseId).eq('teacher_id', user.id);

  if (error) {
    return { error: `No se pudo eliminar el curso: ${error.message}` };
  }

  revalidatePath('/docente/cursos');
  revalidatePath('/docente');
  return { success: true };
}
