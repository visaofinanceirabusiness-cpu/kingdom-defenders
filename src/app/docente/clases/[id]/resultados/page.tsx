import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ResultadosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, status')
    .eq('id', lessonId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!lesson) {
    notFound();
  }

  const [{ data: sessions }, { count: actividadesCount }, { data: actividades }] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, status, total_score, started_at, completed_at, student_id')
      .eq('lesson_id', lessonId)
      .order('started_at', { ascending: false }),
    supabase.from('activities').select('id', { count: 'exact', head: true }).eq('lesson_id', lessonId),
    supabase.from('activities').select('max_score').eq('lesson_id', lessonId),
  ]);

  const maxScoreTotal = (actividades ?? []).reduce((acc, a) => acc + a.max_score, 0);

  const idsAlumnos = [...new Set((sessions ?? []).map((s) => s.student_id))];
  const { data: alumnos } = idsAlumnos.length
    ? await supabase.from('students').select('id, display_name').in('id', idsAlumnos)
    : { data: [] };
  const nombrePorAlumno = new Map((alumnos ?? []).map((a) => [a.id, a.display_name]));

  const completadas = (sessions ?? []).filter((s) => s.status === 'completed');
  const promedio =
    completadas.length > 0 ? Math.round((completadas.reduce((acc, s) => acc + s.total_score, 0) / completadas.length) * 10) / 10 : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/docente/clases/${lessonId}/editor`} className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver al editor
      </Link>

      <h1 className="mt-3 text-3xl font-black text-foreground">Resultados — {lesson.title}</h1>

      {lesson.status !== 'published' ? (
        <Card className="mt-6">
          <p className="text-foreground/60">Esta clase todavía no está publicada — publicala para que tus alumnos puedan entrar y jugarla.</p>
        </Card>
      ) : !actividadesCount ? (
        <Card className="mt-6">
          <p className="text-foreground/60">Esta clase no tiene actividades generadas.</p>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card className="text-center">
              <p className="text-3xl font-black">{sessions?.length ?? 0}</p>
              <p className="text-sm text-foreground/60">Alumnos que entraron</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-black">{completadas.length}</p>
              <p className="text-sm text-foreground/60">Completaron la clase</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-black">{promedio !== null ? `${promedio}/${maxScoreTotal}` : '—'}</p>
              <p className="text-sm text-foreground/60">Puntaje promedio</p>
            </Card>
          </div>

          <Card className="mt-6">
            <h2 className="mb-4 text-lg font-bold">Por alumno</h2>
            {sessions && sessions.length > 0 ? (
              <ul className="space-y-2">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span className="font-medium">{nombrePorAlumno.get(s.student_id) ?? 'Alumno'}</span>
                    <div className="flex items-center gap-3">
                      {s.status === 'completed' ? (
                        <span className="font-bold text-brand-700">
                          {s.total_score}/{maxScoreTotal}
                        </span>
                      ) : (
                        <Badge tone="warning">En curso</Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-foreground/60">Todavía no entró ningún alumno con el código de esta clase.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
