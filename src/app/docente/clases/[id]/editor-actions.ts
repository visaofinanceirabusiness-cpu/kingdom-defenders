'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generarCodigoAcceso } from '@/lib/access-code';
import { createManualLessonSchema } from '@/lib/validations/lesson-manual';

export type EditorActionState = { error: string } | { success: true; accessCode?: string } | null;

export async function deleteActivityAction(lessonId: string, activityId: string): Promise<EditorActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  // El where por lesson_id (en vez de confiar solo en el id de la
  // actividad) evita borrar una actividad de otra clase por un id mal
  // pasado — y la policy de RLS igual exige que la lesson sea del
  // docente logueado.
  const { error } = await supabase.from('activities').delete().eq('id', activityId).eq('lesson_id', lessonId);

  if (error) {
    return { error: `No se pudo eliminar: ${error.message}` };
  }

  revalidatePath(`/docente/clases/${lessonId}/editor`);
  return { success: true };
}

export async function publishLessonAction(lessonId: string): Promise<EditorActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { count: actividadesCount } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId);

  if (!actividadesCount) {
    return { error: 'La clase no tiene actividades generadas todavía — generá la clase completa primero.' };
  }

  // Reintenta con un código nuevo si por casualidad choca con uno ya
  // usado (unique en lessons.access_code) — con 31^6 combinaciones
  // posibles, 5 intentos alcanza de sobra.
  for (let intento = 0; intento < 5; intento++) {
    const accessCode = generarCodigoAcceso();
    const { error } = await supabase
      .from('lessons')
      .update({ status: 'published', access_code: accessCode, published_at: new Date().toISOString() })
      .eq('id', lessonId)
      .eq('teacher_id', user.id);

    if (!error) {
      revalidatePath(`/docente/clases/${lessonId}/editor`);
      return { success: true, accessCode };
    }

    if (error.code !== '23505') {
      return { error: `No se pudo publicar: ${error.message}` };
    }
  }

  return { error: 'No se pudo generar un código de acceso único — probá de nuevo.' };
}

export type LessonMetaActionState = { error: string } | null;

// Edita solo los datos básicos (título/materia/tema/año/dificultad/
// curso) — el contenido (secciones/actividades) se edita desde
// construir/ (manual) o regenerando (IA), no desde acá.
export async function updateLessonMetaAction(lessonId: string, _prevState: LessonMetaActionState, formData: FormData): Promise<LessonMetaActionState> {
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

  const { error } = await supabase
    .from('lessons')
    .update({
      title: parsed.data.title,
      subject: parsed.data.subject || null,
      topic: parsed.data.topic || null,
      school_year: parsed.data.schoolYear || null,
      difficulty: parsed.data.difficulty || null,
      course_id: parsed.data.courseId || null,
    })
    .eq('id', lessonId)
    .eq('teacher_id', user.id);

  if (error) {
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath(`/docente/clases/${lessonId}/editor`);
  revalidatePath('/docente/biblioteca');
  redirect(`/docente/clases/${lessonId}/editor`);
}

// Borra la clase entera — secciones, actividades y sesiones (con
// resultados de alumnos) se van en cascada (ver FKs en la migración).
// No hay forma de deshacerlo, por eso el confirm() del lado del
// cliente antes de llamar a esto.
export async function deleteLessonAction(lessonId: string): Promise<EditorActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { error } = await supabase.from('lessons').delete().eq('id', lessonId).eq('teacher_id', user.id);

  if (error) {
    return { error: `No se pudo eliminar la clase: ${error.message}` };
  }

  revalidatePath('/docente/biblioteca');
  revalidatePath('/docente/cursos');
  revalidatePath('/docente');
  return { success: true };
}
