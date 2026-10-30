'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { addSectionSchema, type SectionType } from '@/lib/validations/lesson-manual';
import { validateGameConfig } from '@/lib/games/registry';
import type { GameTypeId } from '@/lib/games/schemas';
import type { Json } from '@/types/database';

export type ConstruirActionState = { error: string } | { success: true } | null;

const POSICION_SECCION: Record<SectionType, number> = { introduction: 0, theory: 1, examples: 2, evaluation: 5 };
const TITULO_SECCION: Record<SectionType, string> = {
  introduction: 'Introducción',
  theory: 'Explicación teórica',
  examples: 'Ejemplos prácticos',
  evaluation: 'Evaluación',
};

// Agregar una sección "reemplaza" la anterior del mismo tipo (una
// clase tiene a lo sumo una introducción, una teoría, etc.) — así el
// docente puede volver y corregir el texto sin acumular duplicados.
export async function agregarSeccionAction(lessonId: string, _prevState: ConstruirActionState, formData: FormData): Promise<ConstruirActionState> {
  const parsed = addSectionSchema.safeParse({
    sectionType: formData.get('sectionType'),
    title: formData.get('title') || TITULO_SECCION[formData.get('sectionType') as SectionType],
    text: formData.get('text'),
    imageUrl: formData.get('imageUrl') || undefined,
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

  const { data: lesson } = await supabase.from('lessons').select('id').eq('id', lessonId).eq('teacher_id', user.id).maybeSingle();
  if (!lesson) {
    return { error: 'Clase no encontrada.' };
  }

  await supabase.from('lesson_sections').delete().eq('lesson_id', lessonId).eq('section_type', parsed.data.sectionType);

  const content: Json = parsed.data.imageUrl ? { text: parsed.data.text, image_url: parsed.data.imageUrl } : { text: parsed.data.text };

  const { error } = await supabase.from('lesson_sections').insert({
    lesson_id: lessonId,
    section_type: parsed.data.sectionType,
    title: parsed.data.title,
    position: POSICION_SECCION[parsed.data.sectionType],
    content,
  });

  if (error) {
    return { error: `No se pudo guardar la sección: ${error.message}` };
  }

  revalidatePath(`/docente/clases/${lessonId}/construir`);
  return { success: true };
}

export async function eliminarSeccionAction(lessonId: string, sectionId: string): Promise<ConstruirActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { data: lesson } = await supabase.from('lessons').select('id').eq('id', lessonId).eq('teacher_id', user.id).maybeSingle();
  if (!lesson) {
    return { error: 'Clase no encontrada.' };
  }

  const { error } = await supabase.from('lesson_sections').delete().eq('id', sectionId).eq('lesson_id', lessonId);
  if (error) {
    return { error: `No se pudo eliminar: ${error.message}` };
  }

  revalidatePath(`/docente/clases/${lessonId}/construir`);
  return { success: true };
}

// Todas las actividades manuales van a una única sección "activity"
// (se crea la primera vez que hace falta) — en modo manual no se
// distingue actividad regular de desafío final, para no complicar el
// flujo; el docente puede armar tantas como quiera.
async function obtenerOcrearSeccionActividades(supabase: Awaited<ReturnType<typeof createClient>>, lessonId: string): Promise<string | { error: string }> {
  const { data: existente } = await supabase
    .from('lesson_sections')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('section_type', 'activity')
    .maybeSingle();

  if (existente) return existente.id;

  const { data: nueva, error } = await supabase
    .from('lesson_sections')
    .insert({ lesson_id: lessonId, section_type: 'activity', title: 'Actividades interactivas', position: 3, content: {} })
    .select('id')
    .single();

  if (error || !nueva) {
    return { error: `No se pudo crear la sección de actividades: ${error?.message ?? 'error desconocido'}` };
  }

  return nueva.id;
}

export async function agregarActividadAction(
  lessonId: string,
  gameType: GameTypeId,
  title: string,
  config: unknown
): Promise<ConstruirActionState> {
  if (!title.trim()) {
    return { error: 'Ponele un título a la actividad.' };
  }

  const validacion = validateGameConfig(gameType, config);
  if (!validacion.success) {
    return { error: `Configuración inválida: ${validacion.error}` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Tu sesión expiró — volvé a iniciar sesión.' };
  }

  const { data: lesson } = await supabase.from('lessons').select('id').eq('id', lessonId).eq('teacher_id', user.id).maybeSingle();
  if (!lesson) {
    return { error: 'Clase no encontrada.' };
  }

  const seccionId = await obtenerOcrearSeccionActividades(supabase, lessonId);
  if (typeof seccionId !== 'string') {
    return seccionId;
  }

  const { count: posicionActual } = await supabase
    .from('activities')
    .select('id', { count: 'exact', head: true })
    .eq('lesson_id', lessonId);

  const { error } = await supabase.from('activities').insert({
    lesson_id: lessonId,
    lesson_section_id: seccionId,
    game_template_id: gameType,
    title: title.trim(),
    position: posicionActual ?? 0,
    config: config as Json,
  });

  if (error) {
    return { error: `No se pudo guardar la actividad: ${error.message}` };
  }

  revalidatePath(`/docente/clases/${lessonId}/construir`);
  return { success: true };
}
