'use server';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { generarCodigoAcceso } from '@/lib/access-code';
import { unirseSchema } from '@/lib/validations/student';

export type UnirseActionState = { error: string } | null;

// El alumno no tiene cuenta (MVP): esta ruta corre con el cliente
// admin (service role) y valida a mano que el código corresponda a
// una clase publicada antes de crear nada — ver el comentario en
// lib/supabase/admin.ts sobre por qué hace falta.
export async function unirseAction(_prevState: UnirseActionState, formData: FormData): Promise<UnirseActionState> {
  const parsed = unirseSchema.safeParse({
    accessCode: formData.get('accessCode'),
    displayName: formData.get('displayName'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  const { accessCode, displayName } = parsed.data;
  const admin = createAdminClient();

  const { data: lesson } = await admin
    .from('lessons')
    .select('id, course_id')
    .eq('access_code', accessCode)
    .eq('status', 'published')
    .maybeSingle();

  if (!lesson) {
    return { error: 'Ese código no corresponde a ninguna clase publicada. Revisalo con tu docente.' };
  }

  const { data: student, error: studentError } = await admin
    .from('students')
    .insert({ display_name: displayName, access_code: generarCodigoAcceso(8) })
    .select('id')
    .single();

  if (studentError || !student) {
    return { error: `No se pudo registrar tu nombre: ${studentError?.message ?? 'error desconocido'}` };
  }

  if (lesson.course_id) {
    await admin.from('course_members').insert({ course_id: lesson.course_id, student_id: student.id });
  }

  const { data: session, error: sessionError } = await admin
    .from('sessions')
    .insert({ lesson_id: lesson.id, student_id: student.id, status: 'in_progress' })
    .select('id')
    .single();

  if (sessionError || !session) {
    return { error: `No se pudo iniciar la clase: ${sessionError?.message ?? 'error desconocido'}` };
  }

  redirect(`/clase/sesion/${session.id}`);
}
