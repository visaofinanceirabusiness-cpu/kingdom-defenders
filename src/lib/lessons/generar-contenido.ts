import type { SupabaseClient } from '@supabase/supabase-js';
import { aiService } from '@/lib/ai/service';
import { validateGameConfig } from '@/lib/games/registry';
import type { ProposedActivity } from '@/lib/ai/schemas';
import type { Database, Json } from '@/types/database';

export type GenerarContenidoInput = {
  text: string;
  subject: string;
  topic: string;
  summary: string;
  learningObjectives: string[];
  difficulty: 'easy' | 'medium' | 'hard';
};

// Extraído de api/lessons/[id]/generate — lo comparten esa ruta (clase
// nueva) y generarVarianteAction (variante por nivel de una clase ya
// existente): mismo pipeline de generación + doble validación +
// inserción "todo o nada", solo cambia qué lessonId recibe el
// resultado y qué input se le manda a la IA.
export async function generarContenidoClase(
  supabase: SupabaseClient<Database>,
  lessonId: string,
  input: GenerarContenidoInput
): Promise<{ error: string } | { ok: true }> {
  await supabase.from('lessons').update({ status: 'generating' }).eq('id', lessonId);

  let generation;
  try {
    generation = await aiService.generateLesson(input);
  } catch (e) {
    await supabase
      .from('lessons')
      .update({ status: 'ready_for_review', generation_error: e instanceof Error ? e.message : 'Error desconocido' })
      .eq('id', lessonId);
    return { error: `No se pudo generar la clase: ${e instanceof Error ? e.message : 'error desconocido'}` };
  }

  const todasLasActividades = [...generation.activities, generation.finalChallenge];
  for (const actividad of todasLasActividades) {
    const resultado = validateGameConfig(actividad.gameType, actividad.config);
    if (!resultado.success) {
      await supabase
        .from('lessons')
        .update({ status: 'ready_for_review', generation_error: `Actividad "${actividad.title}" inválida: ${resultado.error}` })
        .eq('id', lessonId);
      return { error: `La IA propuso una actividad con formato inválido ("${actividad.title}"): ${resultado.error}` };
    }
  }

  await supabase.from('lesson_sections').delete().eq('lesson_id', lessonId);

  const secciones: { section_type: string; title: string; position: number; content: Json }[] = [
    { section_type: 'introduction', title: 'Introducción', position: 0, content: { text: generation.introduction } },
    { section_type: 'theory', title: 'Explicación teórica', position: 1, content: { text: generation.theory } },
    { section_type: 'examples', title: 'Ejemplos prácticos', position: 2, content: { text: generation.examples } },
    { section_type: 'activity', title: 'Actividades interactivas', position: 3, content: {} },
    { section_type: 'final_challenge', title: 'Desafío final', position: 4, content: {} },
    { section_type: 'evaluation', title: 'Evaluación', position: 5, content: { text: generation.evaluationSummary } },
  ];

  const { data: seccionesInsertadas, error: seccionesError } = await supabase
    .from('lesson_sections')
    .insert(secciones.map((s) => ({ ...s, lesson_id: lessonId })))
    .select('id, section_type');

  if (seccionesError || !seccionesInsertadas) {
    return { error: `No se pudieron guardar las secciones: ${seccionesError?.message}` };
  }

  const idSeccionActividades = seccionesInsertadas.find((s) => s.section_type === 'activity')!.id;
  const idSeccionDesafio = seccionesInsertadas.find((s) => s.section_type === 'final_challenge')!.id;

  function filaActividad(actividad: ProposedActivity, seccionId: string, position: number) {
    return {
      lesson_id: lessonId,
      lesson_section_id: seccionId,
      game_template_id: actividad.gameType,
      title: actividad.title,
      position,
      config: actividad.config as Json,
    };
  }

  const filasActividades = [
    ...generation.activities.map((a, i) => filaActividad(a, idSeccionActividades, i)),
    filaActividad(generation.finalChallenge, idSeccionDesafio, 0),
  ];

  const { error: actividadesError } = await supabase.from('activities').insert(filasActividades);

  if (actividadesError) {
    return { error: `No se pudieron guardar las actividades: ${actividadesError.message}` };
  }

  await supabase.from('lessons').update({ status: 'ready_for_review', generation_error: null }).eq('id', lessonId);

  return { ok: true };
}
