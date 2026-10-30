import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractText } from '@/lib/documents/extract';
import { aiService, getAIProvider } from '@/lib/ai/service';
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES, manualTopicSchema } from '@/lib/validations/material';

// Next 16 con Cache Components: esta ruta ya es dinámica por defecto
// (lee cookies de sesión, sube archivos, escribe en la base) — no
// hace falta (y de hecho rompe el build) declarar `dynamic =
// 'force-dynamic'` como en versiones anteriores de Next.

// PASO 1+2 del flujo "Crear nueva clase": recibe un documento o un
// tema escrito a mano, extrae/usa el texto, le pide a AIService un
// primer análisis pedagógico, y deja todo guardado como una lesson en
// estado 'ready_for_review' — la profesora revisa y corrige ese
// análisis en el paso siguiente (no se genera la clase completa acá
// todavía, eso es la Fase 2).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Tu sesión expiró — volvé a iniciar sesión.' }, { status: 401 });
  }

  const formData = await request.formData();
  const mode = formData.get('mode');
  const schoolYear = (formData.get('schoolYear') as string | null) || undefined;
  const difficultyRaw = (formData.get('difficulty') as string | null) || undefined;
  const courseId = (formData.get('courseId') as string | null) || null;

  let rawText: string;
  let sourceType: 'docx' | 'pdf' | 'manual_topic';
  let originalFilename: string | null = null;
  let storagePath: string | null = null;
  let teacherHintTopic: string | undefined;

  if (mode === 'file') {
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json({ error: 'El archivo supera el tamaño máximo permitido (15MB).' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return NextResponse.json({ error: 'Solo se aceptan archivos Word (.docx) o PDF.' }, { status: 400 });
    }

    sourceType = file.type === 'application/pdf' ? 'pdf' : 'docx';
    originalFilename = file.name;

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractText(buffer, sourceType);

    if (!extraction.success) {
      return NextResponse.json({ error: extraction.error }, { status: 422 });
    }

    rawText = extraction.text;

    storagePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('materials').upload(storagePath, buffer, {
      contentType: file.type,
    });

    if (uploadError) {
      return NextResponse.json({ error: `No se pudo guardar el archivo: ${uploadError.message}` }, { status: 500 });
    }
  } else if (mode === 'topic') {
    const parsed = manualTopicSchema.safeParse({
      topic: formData.get('topic'),
      schoolYear,
      difficulty: difficultyRaw || undefined,
      courseId: courseId || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }, { status: 400 });
    }

    sourceType = 'manual_topic';
    rawText = parsed.data.topic;
    teacherHintTopic = parsed.data.topic;
  } else {
    return NextResponse.json({ error: 'Modo de carga inválido.' }, { status: 400 });
  }

  const { data: material, error: materialError } = await supabase
    .from('materials')
    .insert({
      teacher_id: user.id,
      course_id: courseId,
      source_type: sourceType,
      original_filename: originalFilename,
      storage_path: storagePath,
      raw_text: rawText,
      extraction_status: 'done',
    })
    .select('id')
    .single();

  if (materialError) {
    return NextResponse.json({ error: `No se pudo guardar el material: ${materialError.message}` }, { status: 500 });
  }

  let analysis;

  try {
    analysis = await aiService.analyzeMaterial({ text: rawText, teacherHintTopic, schoolYear });
  } catch (e) {
    return NextResponse.json(
      { error: `No se pudo analizar el contenido: ${e instanceof Error ? e.message : 'error desconocido'}` },
      { status: 502 }
    );
  }

  const difficulty = (difficultyRaw as 'easy' | 'medium' | 'hard' | undefined) || analysis.recommended_difficulty;

  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .insert({
      teacher_id: user.id,
      course_id: courseId,
      material_id: material.id,
      title: analysis.topic,
      subject: analysis.subject,
      topic: analysis.topic,
      school_year: schoolYear || analysis.recommended_school_year,
      difficulty,
      summary: analysis.summary,
      learning_objectives: analysis.learning_objectives,
      status: 'ready_for_review',
    })
    .select('id')
    .single();

  if (lessonError) {
    return NextResponse.json({ error: `No se pudo crear la clase: ${lessonError.message}` }, { status: 500 });
  }

  return NextResponse.json({ lessonId: lesson.id, isDemo: getAIProvider().isDemo });
}
