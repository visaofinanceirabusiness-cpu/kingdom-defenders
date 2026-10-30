import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteStudentButton } from '@/components/docente/delete-student-button';

type NivelDominio = 'dominado' | 'reforzar' | 'en_progreso';

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
    .select('id, status, total_score, started_at, completed_at, lesson_id, lessons(title, subject, topic, teacher_id)')
    .eq('student_id', studentId)
    .order('started_at', { ascending: false });

  // sessions no tiene RLS que filtre por docente directo — lo filtramos
  // acá a mano por las dudas de que el alumno haya jugado una clase de
  // otro docente (ej. con curso compartido en el futuro).
  const sesionesDelDocente = (sesiones ?? []).filter((s) => (s.lessons as unknown as { teacher_id: string } | null)?.teacher_id === user.id);
  const completadas = sesionesDelDocente.filter((s) => s.status === 'completed');
  const pendientes = sesionesDelDocente.filter((s) => s.status !== 'completed');

  const lessonIds = [...new Set(sesionesDelDocente.map((s) => s.lesson_id))];
  const sessionIds = sesionesDelDocente.map((s) => s.id);

  const [{ data: actividadesPorClase }, { data: respuestas }] = await Promise.all([
    lessonIds.length > 0
      ? supabase.from('activities').select('lesson_id, max_score').in('lesson_id', lessonIds)
      : Promise.resolve({ data: [] }),
    sessionIds.length > 0
      ? supabase.from('student_responses').select('session_id, is_correct, duration_seconds').in('session_id', sessionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const maxScorePorClase = new Map<string, number>();
  for (const a of actividadesPorClase ?? []) {
    maxScorePorClase.set(a.lesson_id, (maxScorePorClase.get(a.lesson_id) ?? 0) + a.max_score);
  }

  const respuestasIncorrectas = (respuestas ?? []).filter((r) => r.is_correct === false).length;
  const duraciones = (respuestas ?? []).map((r) => r.duration_seconds).filter((d): d is number => typeof d === 'number');
  const duracionPromedio = duraciones.length > 0 ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length) : null;

  // "Tema" = el topic de la clase. Se clasifica por el % de la última
  // sesión completada de ese tema (si lo jugó varias veces, cuenta la
  // más reciente) — ≥80% dominado, <50% a reforzar, el resto en
  // progreso. Es una aproximación simple y transparente, no un
  // análisis de IA (eso queda para una etapa posterior, como se pidió).
  const temaPorSesion = new Map<string, { nivel: NivelDominio; fecha: string }>();
  for (const s of completadas) {
    const lesson = s.lessons as unknown as { topic: string | null } | null;
    const tema = lesson?.topic;
    if (!tema) continue;
    const maxScore = maxScorePorClase.get(s.lesson_id) ?? 0;
    const porcentaje = maxScore > 0 ? s.total_score / maxScore : 0;
    const nivel: NivelDominio = porcentaje >= 0.8 ? 'dominado' : porcentaje < 0.5 ? 'reforzar' : 'en_progreso';
    const fecha = s.completed_at ?? s.started_at;
    const existente = temaPorSesion.get(tema);
    if (!existente || fecha > existente.fecha) {
      temaPorSesion.set(tema, { nivel, fecha });
    }
  }
  const temasDominados = [...temaPorSesion.entries()].filter(([, v]) => v.nivel === 'dominado').map(([t]) => t);
  const temasAReforzar = [...temaPorSesion.entries()].filter(([, v]) => v.nivel === 'reforzar').map(([t]) => t);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/docente/alumnos" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver a mis alumnos
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground">{alumno.display_name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {alumno.level && <Badge tone="brand">{alumno.level}</Badge>}
            {alumno.school_year && <Badge tone="accent">{alumno.school_year}</Badge>}
            <Link href={`/docente/alumnos/${alumno.id}/editar`} className="text-xs font-semibold text-brand-600 hover:underline">
              Editar
            </Link>
            <DeleteStudentButton studentId={alumno.id} studentName={alumno.display_name} variant="inline" redirectAfter="/docente/alumnos" />
          </div>
        </div>
        <Link href="/docente/biblioteca">
          <span className="font-semibold text-brand-600 hover:underline">+ Asignarle una clase →</span>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <Card className="text-center">
          <p className="text-3xl font-black">{completadas.length}</p>
          <p className="text-sm text-foreground/60">Clases realizadas</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-black">{pendientes.length}</p>
          <p className="text-sm text-foreground/60">Pendientes</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-black">{respuestasIncorrectas}</p>
          <p className="text-sm text-foreground/60">Respuestas incorrectas</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-black">{duracionPromedio !== null ? `${duracionPromedio}s` : '—'}</p>
          <p className="text-sm text-foreground/60">Tiempo promedio</p>
        </Card>
      </div>

      {(temasDominados.length > 0 || temasAReforzar.length > 0) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <h2 className="mb-2 text-sm font-bold text-success-600">✅ Temas dominados</h2>
            {temasDominados.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {temasDominados.map((t) => (
                  <Badge key={t} tone="success">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/50">Todavía ninguno.</p>
            )}
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-bold text-amber-700">⚠️ Para reforzar</h2>
            {temasAReforzar.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {temasAReforzar.map((t) => (
                  <Badge key={t} tone="warning">
                    {t}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-foreground/50">Ninguno por ahora.</p>
            )}
          </Card>
        </div>
      )}

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
