'use server';

import { createAdminClient } from '@/lib/supabase/admin';

// Corre con el cliente admin, igual que las demás acciones del lado
// del alumno (que no tiene sesión de Supabase Auth) — y la usa
// también el docente para no tener que armar una policy de insert
// aparte: ambos lados escriben feedback_clase por acá.
export async function enviarFeedbackAction(datos: {
  lessonId: string;
  sessionId?: string;
  rol: 'docente' | 'alumno';
  rating: number;
  comentario?: string;
}): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { data: lesson } = await admin.from('lessons').select('id').eq('id', datos.lessonId).maybeSingle();
  if (!lesson) {
    return { error: 'No encontramos la clase.' };
  }

  const { error } = await admin.from('feedback_clase').insert({
    lesson_id: datos.lessonId,
    session_id: datos.sessionId ?? null,
    rol: datos.rol,
    rating: datos.rating,
    comentario: datos.comentario?.trim() || null,
  });

  if (error) {
    return { error: `No se pudo guardar tu calificación: ${error.message}` };
  }

  return {};
}
