'use server';

import { createAdminClient } from '@/lib/supabase/admin';

// Ambas rutas corren con el cliente admin (el alumno no tiene sesión
// de Supabase Auth) y validan a mano que la actividad pertenezca a la
// clase de esta sesión antes de escribir nada — ver admin.ts.
export async function registrarRespuestaAction(
  sessionId: string,
  activityId: string,
  correctas: number,
  total: number,
  duracionSegundos?: number
): Promise<{ error?: string }> {
  const admin = createAdminClient();

  const { data: session } = await admin
    .from('sessions')
    .select('id, lesson_id, status')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session || session.status !== 'in_progress') {
    return { error: 'Esta sesión ya no está activa.' };
  }

  const { data: activity } = await admin
    .from('activities')
    .select('id, lesson_id, max_score')
    .eq('id', activityId)
    .eq('lesson_id', session.lesson_id)
    .maybeSingle();

  if (!activity) {
    return { error: 'Esta actividad no pertenece a la clase en curso.' };
  }

  const score = total > 0 ? Math.round((correctas / total) * activity.max_score) : 0;

  const { error } = await admin.from('student_responses').insert({
    session_id: sessionId,
    activity_id: activityId,
    response: { correctas, total },
    score,
    is_correct: correctas === total,
    duration_seconds: duracionSegundos ?? null,
  });

  if (error) {
    return { error: `No se pudo guardar tu respuesta: ${error.message}` };
  }

  return {};
}

export async function finalizarSesionAction(sessionId: string): Promise<{ error?: string; totalScore?: number }> {
  const admin = createAdminClient();

  const { data: session } = await admin.from('sessions').select('id, status').eq('id', sessionId).maybeSingle();

  if (!session) {
    return { error: 'Sesión no encontrada.' };
  }

  if (session.status === 'completed') {
    const { data } = await admin.from('sessions').select('total_score').eq('id', sessionId).single();
    return { totalScore: data?.total_score ?? 0 };
  }

  // El puntaje final se calcula del lado del servidor sumando lo que
  // ya quedó guardado en student_responses — nunca se confía en un
  // puntaje que mande el navegador del alumno.
  const { data: respuestas } = await admin.from('student_responses').select('score').eq('session_id', sessionId);
  const totalScore = (respuestas ?? []).reduce((acc, r) => acc + r.score, 0);

  const { error } = await admin
    .from('sessions')
    .update({ status: 'completed', completed_at: new Date().toISOString(), total_score: totalScore })
    .eq('id', sessionId);

  if (error) {
    return { error: `No se pudo cerrar la sesión: ${error.message}` };
  }

  return { totalScore };
}
