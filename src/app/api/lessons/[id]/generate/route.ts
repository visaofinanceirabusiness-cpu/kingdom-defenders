import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiService, getAIProvider } from '@/lib/ai/service';
import { validateGameConfig } from '@/lib/games/registry';
import type { ProposedActivity } from '@/lib/ai/schemas';
import type { Json } from '@/types/database';

// Fase 2 — PASO 3 del flujo "Crear nueva clase": a partir del
// análisis ya revisado y corregido por la profesora (lessons.summary/
// topic/subject/learning_objectives), le pide a AIService la clase
// completa (introducción, teoría, ejemplos, actividades, desafío
// final, evaluación) y la guarda como lesson_sections + activities.
//
// Cada actividad propuesta por la IA se valida DOS veces antes de
// guardarse: la forma general (lessonGenerationSchema, en el
// proveedor) y la configuración específica de su tipo de juego
// (validateGameConfig acá) — si cualquiera de las dos falla, no se
// guarda nada (todo o nada, nunca una clase a medio generar).
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Tu sesión expiró — volvé a iniciar sesión.' }, { status: 401 });
  }

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, subject, topic, summary, learning_objectives, difficulty, material_id')
    .eq('id', lessonId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (lessonError) {
    return NextResponse.json({ error: lessonError.message }, { status: 500 });
  }

  if (!lesson) {
    return NextResponse.json({ error: 'Clase no encontrada.' }, { status: 404 });
  }

  if (!lesson.subject || !lesson.topic || !lesson.summary) {
    return NextResponse.json({ error: 'Falta completar el análisis (materia/tema/resumen) antes de generar la clase.' }, { status: 422 });
  }

  const { data: material } = lesson.material_id
    ? await supabase.from('materials').select('raw_text').eq('id', lesson.material_id).maybeSingle()
    : { data: null };

  await supabase.from('lessons').update({ status: 'generating' }).eq('id', lessonId);

  let generation;

  try {
    generation = await aiService.generateLesson({
      text: material?.raw_text ?? lesson.topic,
      subject: lesson.subject,
      topic: lesson.topic,
      summary: lesson.summary,
      learningObjectives: (lesson.learning_objectives as string[]) ?? [],
      difficulty: (lesson.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
    });
  } catch (e) {
    await supabase
      .from('lessons')
      .update({ status: 'ready_for_review', generation_error: e instanceof Error ? e.message : 'Error desconocido' })
      .eq('id', lessonId);
    return NextResponse.json(
      { error: `No se pudo generar la clase: ${e instanceof Error ? e.message : 'error desconocido'}` },
      { status: 502 }
    );
  }

  // Validación de cada actividad contra el schema específico de su
  // gameType — si alguna no pasa, se aborta todo (no se guarda una
  // clase con una actividad rota).
  const todasLasActividades = [...generation.activities, generation.finalChallenge];
  for (const actividad of todasLasActividades) {
    const resultado = validateGameConfig(actividad.gameType, actividad.config);
    if (!resultado.success) {
      await supabase
        .from('lessons')
        .update({ status: 'ready_for_review', generation_error: `Actividad "${actividad.title}" inválida: ${resultado.error}` })
        .eq('id', lessonId);
      return NextResponse.json(
        { error: `La IA propuso una actividad con formato inválido ("${actividad.title}"): ${resultado.error}` },
        { status: 502 }
      );
    }
  }

  // Limpia secciones/actividades de una generación anterior (si la
  // profesora pide "regenerar") antes de insertar las nuevas — evita
  // ir acumulando duplicados.
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
    return NextResponse.json({ error: `No se pudieron guardar las secciones: ${seccionesError?.message}` }, { status: 500 });
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
    return NextResponse.json({ error: `No se pudieron guardar las actividades: ${actividadesError.message}` }, { status: 500 });
  }

  await supabase.from('lessons').update({ status: 'ready_for_review', generation_error: null }).eq('id', lessonId);

  return NextResponse.json({ ok: true, isDemo: getAIProvider().isDemo });
}
