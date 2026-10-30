import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { ClasePdf } from '@/lib/pdf/clase-pdf';

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

  const buffer = await renderToBuffer(<ClasePdf lesson={lesson} secciones={secciones ?? []} actividades={actividades ?? []} />);

  const nombreArchivo = `${lesson.title.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'clase'}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
    },
  });
}
