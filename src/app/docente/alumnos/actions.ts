'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generarCodigoAcceso } from '@/lib/access-code';
import { createStudentSchema } from '@/lib/validations/student-admin';
import { chequearLimiteDeAlumnos } from '@/lib/plan/usage';

export type StudentActionState = { error: string } | null;

export async function createStudentAction(_prevState: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const parsed = createStudentSchema.safeParse({
    displayName: formData.get('displayName'),
    schoolYear: formData.get('schoolYear') || undefined,
    level: formData.get('level') || undefined,
    subjects: formData.get('subjects') || undefined,
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

  const limite = await chequearLimiteDeAlumnos(supabase, user.id);
  if (!limite.allowed) {
    return { error: limite.error };
  }

  const { error } = await supabase.from('students').insert({
    teacher_id: user.id,
    display_name: parsed.data.displayName,
    school_year: parsed.data.schoolYear || null,
    level: parsed.data.level || null,
    subjects: parsed.data.subjects,
    access_code: generarCodigoAcceso(8),
  });

  if (error) {
    return { error: `No se pudo registrar el alumno: ${error.message}` };
  }

  revalidatePath('/docente/alumnos');
  revalidatePath('/docente');
  return null;
}

export async function updateStudentAction(studentId: string, _prevState: StudentActionState, formData: FormData): Promise<StudentActionState> {
  const parsed = createStudentSchema.safeParse({
    displayName: formData.get('displayName'),
    schoolYear: formData.get('schoolYear') || undefined,
    level: formData.get('level') || undefined,
    subjects: formData.get('subjects') || undefined,
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
    .from('students')
    .update({
      display_name: parsed.data.displayName,
      school_year: parsed.data.schoolYear || null,
      level: parsed.data.level || null,
      subjects: parsed.data.subjects,
    })
    .eq('id', studentId)
    .eq('teacher_id', user.id);

  if (error) {
    return { error: `No se pudo guardar: ${error.message}` };
  }

  revalidatePath('/docente/alumnos');
  revalidatePath(`/docente/alumnos/${studentId}`);
  redirect(`/docente/alumnos/${studentId}`);
}

export type DeleteStudentActionState = { error: string } | { success: true } | null;

// Borra al alumno y, en cascada, sus sesiones y respuestas (ver FKs
// de sessions/student_responses) — pierde su historial para siempre,
// por eso pide confirmación del lado del cliente antes de llamar.
export async function deleteStudentAction(studentId: string): Promise<DeleteStudentActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { error } = await supabase.from('students').delete().eq('id', studentId).eq('teacher_id', user.id);

  if (error) {
    return { error: `No se pudo eliminar: ${error.message}` };
  }

  revalidatePath('/docente/alumnos');
  revalidatePath('/docente');
  return { success: true };
}
