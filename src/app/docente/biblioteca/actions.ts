'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generarContenidoClase } from '@/lib/lessons/generar-contenido';
import type { Json } from '@/types/database';

export type BibliotecaActionState = { error: string } | { success: true; sessionId?: string; lessonId?: string } | null;

export type NivelVariante = 'basico' | 'intermedio' | 'avanzado';

const DIFICULTAD_POR_NIVEL: Record<NivelVariante, 'easy' | 'medium' | 'hard'> = {
  basico: 'easy',
  intermedio: 'medium',
  avanzado: 'hard',
};

const LABEL_NIVEL: Record<NivelVariante, string> = {
  basico: 'nivel básico',
  intermedio: 'nivel intermedio',
  avanzado: 'nivel avanzado',
};

// Copia la clase (secciones + actividades) sin volver a llamar a la
// IA — reusar una clase existente nunca consume una generación. La
// copia nace en borrador, sin access_code ni published_at, para que
// el docente pueda editarla sin afectar la original.
export async function duplicarLessonAction(lessonId: string): Promise<BibliotecaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { data: original } = await supabase
    .from('lessons')
    .select('title, subject, topic, summary, learning_objectives, difficulty, school_year')
    .eq('id', lessonId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!original) {
    return { error: 'Clase no encontrada.' };
  }

  const { data: nuevaLesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      teacher_id: user.id,
      title: `${original.title} (copia)`,
      subject: original.subject,
      topic: original.topic,
      summary: original.summary,
      learning_objectives: original.learning_objectives,
      difficulty: original.difficulty,
      school_year: original.school_year,
      status: 'ready_for_review',
    })
    .select('id')
    .single();

  if (lessonError || !nuevaLesson) {
    return { error: `No se pudo duplicar: ${lessonError?.message ?? 'error desconocido'}` };
  }

  const { data: secciones } = await supabase
    .from('lesson_sections')
    .select('id, section_type, title, content, position')
    .eq('lesson_id', lessonId)
    .order('position');

  const { data: actividades } = await supabase
    .from('activities')
    .select('lesson_section_id, game_template_id, title, position, config, max_score')
    .eq('lesson_id', lessonId)
    .order('position');

  if (secciones && secciones.length > 0) {
    const { data: nuevasSecciones, error: seccionesError } = await supabase
      .from('lesson_sections')
      .insert(secciones.map((s) => ({ lesson_id: nuevaLesson.id, section_type: s.section_type, title: s.title, content: s.content, position: s.position })))
      .select('id, section_type');

    if (seccionesError) {
      return { error: `No se pudieron copiar las secciones: ${seccionesError.message}` };
    }

    const idPorTipo = new Map((nuevasSecciones ?? []).map((s) => [s.section_type, s.id]));
    const idPorTipoOriginal = new Map(secciones.map((s) => [s.id, s.section_type]));

    if (actividades && actividades.length > 0) {
      const filas = actividades.map((a) => {
        const tipo = a.lesson_section_id ? idPorTipoOriginal.get(a.lesson_section_id) : undefined;
        const nuevaSeccionId = tipo ? idPorTipo.get(tipo) : null;
        return {
          lesson_id: nuevaLesson.id,
          lesson_section_id: nuevaSeccionId ?? null,
          game_template_id: a.game_template_id,
          title: a.title,
          position: a.position,
          config: a.config as Json,
          max_score: a.max_score,
        };
      });

      const { error: actividadesError } = await supabase.from('activities').insert(filas);
      if (actividadesError) {
        return { error: `No se pudieron copiar las actividades: ${actividadesError.message}` };
      }
    }
  }

  revalidatePath('/docente/biblioteca');
  return { success: true, lessonId: nuevaLesson.id };
}

// Asigna una clase ya generada directo a un alumno propio, sin pasar
// por el código de acceso público — crea la sesión con el cliente
// admin (igual que el flujo de /clase) porque acá el que actúa es el
// alumno, no el docente, aunque sea el docente quien la dispara;
// valida a mano que la clase y el alumno sean del docente logueado.
export async function asignarSesionAction(lessonId: string, studentId: string): Promise<BibliotecaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const [{ data: lesson }, { data: student }] = await Promise.all([
    supabase.from('lessons').select('id').eq('id', lessonId).eq('teacher_id', user.id).maybeSingle(),
    supabase.from('students').select('id').eq('id', studentId).eq('teacher_id', user.id).maybeSingle(),
  ]);

  if (!lesson) {
    return { error: 'Clase no encontrada.' };
  }
  if (!student) {
    return { error: 'Alumno no encontrado.' };
  }

  const { count: actividadesCount } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId);

  if (!actividadesCount) {
    return { error: 'Esta clase no tiene actividades generadas todavía.' };
  }

  const admin = createAdminClient();
  const { data: session, error } = await admin
    .from('sessions')
    .insert({ lesson_id: lessonId, student_id: studentId, status: 'in_progress' })
    .select('id')
    .single();

  if (error || !session) {
    return { error: `No se pudo crear la sesión: ${error?.message ?? 'error desconocido'}` };
  }

  return { success: true, sessionId: session.id };
}

// Genera una variante adaptada de nivel — a diferencia de duplicar,
// esto SÍ llama a la IA (le pide que reescriba la clase para ese
// nivel), así que cuenta como una generación real. La original
// (lessonId) nunca se toca: la variante nace como una fila nueva de
// lessons con base_lesson_id apuntando a ella.
export async function generarVarianteAction(lessonId: string, nivel: NivelVariante): Promise<BibliotecaActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { data: original } = await supabase
    .from('lessons')
    .select('title, subject, topic, summary, learning_objectives, school_year, material_id')
    .eq('id', lessonId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!original || !original.subject || !original.topic || !original.summary) {
    return { error: 'Clase no encontrada o incompleta.' };
  }

  const { data: material } = original.material_id
    ? await supabase.from('materials').select('raw_text').eq('id', original.material_id).maybeSingle()
    : { data: null };

  const { data: variante, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      teacher_id: user.id,
      title: `${original.title} (${LABEL_NIVEL[nivel]})`,
      subject: original.subject,
      topic: original.topic,
      summary: original.summary,
      learning_objectives: original.learning_objectives,
      school_year: original.school_year,
      material_id: original.material_id,
      difficulty: DIFICULTAD_POR_NIVEL[nivel],
      base_lesson_id: lessonId,
      variant_level: nivel,
      status: 'ready_for_review',
    })
    .select('id')
    .single();

  if (lessonError || !variante) {
    return { error: `No se pudo crear la variante: ${lessonError?.message ?? 'error desconocido'}` };
  }

  const resultado = await generarContenidoClase(supabase, variante.id, user.id, {
    text: material?.raw_text ?? original.topic,
    subject: original.subject,
    topic: original.topic,
    summary: original.summary,
    learningObjectives: (original.learning_objectives as string[]) ?? [],
    difficulty: DIFICULTAD_POR_NIVEL[nivel],
  });

  if ('error' in resultado) {
    return { error: resultado.error };
  }

  revalidatePath('/docente/biblioteca');
  redirect(`/docente/clases/${variante.id}/editor`);
}
