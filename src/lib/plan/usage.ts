import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { limitsForPlan } from './limits';

function inicioDelPeriodoActual(): string {
  const ahora = new Date();
  return new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

// Chequea el límite de generaciones de IA del mes y, si hay margen,
// lo incrementa en el mismo paso — se llama justo antes de pedirle a
// la IA la clase, nunca después, para que no haya forma de esquivarlo
// llamando a generarContenidoClase directo.
export async function reservarGeneracionDeIA(
  supabase: SupabaseClient<Database>,
  teacherId: string
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', teacherId).maybeSingle();
  const limites = limitsForPlan(profile?.plan);
  const periodStart = inicioDelPeriodoActual();

  const { data: uso } = await supabase
    .from('ai_usage')
    .select('generations_count')
    .eq('teacher_id', teacherId)
    .eq('period_start', periodStart)
    .maybeSingle();

  const usadas = uso?.generations_count ?? 0;

  if (usadas >= limites.aiGenerationsPerMonth) {
    return {
      allowed: false,
      error: `Llegaste al límite de ${limites.aiGenerationsPerMonth} generaciones de IA de tu plan ${limites.label} este mes. Esperá al próximo mes o pedí que te suban de plan.`,
    };
  }

  const { error } = await supabase
    .from('ai_usage')
    .upsert({ teacher_id: teacherId, period_start: periodStart, generations_count: usadas + 1 }, { onConflict: 'teacher_id,period_start' });

  if (error) {
    return { allowed: false, error: `No se pudo registrar el uso de IA: ${error.message}` };
  }

  return { allowed: true };
}

export async function chequearLimiteDeAlumnos(
  supabase: SupabaseClient<Database>,
  teacherId: string
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', teacherId).maybeSingle();
  const limites = limitsForPlan(profile?.plan);

  const { count } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId);

  if ((count ?? 0) >= limites.maxActiveStudents) {
    return {
      allowed: false,
      error: `Llegaste al límite de ${limites.maxActiveStudents} alumnos de tu plan ${limites.label}.`,
    };
  }

  return { allowed: true };
}

export async function chequearLimiteDeClasesGuardadas(
  supabase: SupabaseClient<Database>,
  teacherId: string,
  excluirLessonId: string
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', teacherId).maybeSingle();
  const limites = limitsForPlan(profile?.plan);

  const { count } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .in('status', ['ready_for_review', 'published'])
    .neq('id', excluirLessonId);

  if ((count ?? 0) >= limites.maxSavedLessons) {
    return {
      allowed: false,
      error: `Llegaste al límite de ${limites.maxSavedLessons} clases guardadas de tu plan ${limites.label} — borrá alguna o pedí que te suban de plan.`,
    };
  }

  return { allowed: true };
}
