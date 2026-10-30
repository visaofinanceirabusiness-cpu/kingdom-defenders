import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { ClasePdf } from '@/lib/pdf/clase-pdf';
import { resolverImagenes } from '@/lib/pdf/imagenes';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Tu sesión expiró — volvé a iniciar sesión.' }, { status: 401 });
  }

  const { data: lesson } = await supabase
    .from('lessons')
    .select('title, subject, topic, school_year')
    .eq('id', lessonId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!lesson) {
    return NextResponse.json({ error: 'Clase no encontrada.' }, { status: 404 });
  }

  const [{ data: secciones }, { data: actividades }] = await Promise.all([
    supabase.from('lesson_sections').select('section_type, title, content, position').eq('lesson_id', lessonId).order('position'),
    supabase.from('activities').select('title, game_template_id, config, lesson_section_id, position').eq('lesson_id', lessonId).order('position'),
  ]);

  const urlsDeSecciones = (secciones ?? []).map((s) => (s.content as { image_url?: string } | null)?.image_url);
  const urlsDeActividades = (actividades ?? []).flatMap((a) => {
    const config = a.config as { questions?: { image_url?: string }[]; statements?: { image_url?: string }[]; items?: { image_url?: string }[] };
    return [
      ...(config.questions ?? []).map((q) => q.image_url),
      ...(config.statements ?? []).map((s) => s.image_url),
      ...(config.items ?? []).map((it) => it.image_url),
    ];
  });
  const imagenes = await resolverImagenes([...urlsDeSecciones, ...urlsDeActividades]);

  const buffer = await renderToBuffer(
    <ClasePdf lesson={lesson} secciones={secciones ?? []} actividades={actividades ?? []} imagenes={imagenes} />
  );

  const nombreArchivo = `${lesson.title.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'clase'}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    },
  });
}
