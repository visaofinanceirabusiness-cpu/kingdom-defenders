import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AlumnoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: alumno } = await supabase
    .from('students')
    .select('id, display_name, school_year, level, subjects')
    .eq('id', studentId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!alumno) {
    notFound();
  }

  const { data: sesiones } = await supabase
    .from('sessions')
    .select('id, status, total_score, started_at, completed_at, lesson_id, lessons(title, subject, teacher_id)')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false });

  // sessions no tiene RLS que filtre por docente directo — lo filtramos
  // acá a mano por las dudas de que el alumno haya jugado una clase de
  // otro docente (ej. con curso compartido en el futuro).
  const sesionesDelDocente = (sesiones ?? []).filter((s) => (s.lessons as unknown as { teacher_id: string } | null)?.teacher_id === user.id);
  const completadas = sesionesDelDocente.filter((s) => s.status === 'completed');
  const pendientes = sesionesDelDocente.filter((s) => s.status !== 'completed');

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/docente/alumnos" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver a mis alumnos
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground">{alumno.display_name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {alumno.level && <Badge tone="brand">{alumno.level}</Badge>}
            {alumno.school_year && <Badge tone="accent">{alumno.school_year}</Badge>}
          </div>
        </div>
        <Link href="/docente/biblioteca">
          <span className="font-semibold text-brand-600 hover:underline">+ Asignarle una clase →</span>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="text-center">
          <p className="text-3xl font-black">{completadas.length}</p>
          <p className="text-sm text-foreground/60">Clases realizadas</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-black">{pendientes.length}</p>
          <p className="text-sm text-foreground/60">Actividades pendientes</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-bold">Historial</h2>
        {sesionesDelDocente.length > 0 ? (
          <ul className="space-y-2">
            {sesionesDelDocente.map((s) => {
              const lesson = s.lessons as unknown as { title: string; subject: string | null } | null;
              return (
                <li key={s.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <p className="font-medium">{lesson?.title ?? 'Clase'}</p>
                    {lesson?.subject && <p className="text-xs text-foreground/50">{lesson.subject}</p>}
                  </div>
                  {s.status === 'completed' ? (
                    <span className="font-bold text-brand-700">{s.total_score} pts</span>
                  ) : (
                    <Badge tone="warning">En curso</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-foreground/60">Todavía no le asignaste ninguna clase a este alumno.</p>
        )}
      </Card>
    </div>
  );
}
