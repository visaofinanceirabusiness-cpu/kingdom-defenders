import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/service';
import { generarContenidoClase } from '@/lib/lessons/generar-contenido';

// Fase 2 — PASO 3 del flujo "Crear nueva clase": a partir del
// análisis ya revisado y corregido por la profesora (lessons.summary/
// topic/subject/learning_objectives), le pide a AIService la clase
// completa y la guarda como lesson_sections + activities. El pipeline
// de generación/validación/inserción vive en
// lib/lessons/generar-contenido.ts (lo comparte con las variantes por
// nivel, ver generarVarianteAction).
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

  const resultado = await generarContenidoClase(supabase, lessonId, {
    text: material?.raw_text ?? lesson.topic,
    subject: lesson.subject,
    topic: lesson.topic,
    summary: lesson.summary,
    learningObjectives: (lesson.learning_objectives as string[]) ?? [],
    difficulty: (lesson.difficulty as 'easy' | 'medium' | 'hard') ?? 'medium',
  });

  if ('error' in resultado) {
    return NextResponse.json({ error: resultado.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, isDemo: getAIProvider().isDemo });
}
