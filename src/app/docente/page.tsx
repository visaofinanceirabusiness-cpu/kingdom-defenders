import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { limitsForPlan } from '@/lib/plan/limits';

type Metrica = { label: string; value: number; icon: string; href: string };

export default async function DashboardDocentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ count: cursosCount }, { data: cursos }, { count: clasesCount }, { count: clasesPendientesCount }] =
    await Promise.all([
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
      supabase.from('courses').select('id').eq('teacher_id', user.id),
      supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
      supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', user.id)
        .eq('status', 'ready_for_review'),
    ]);

  const courseIds = (cursos ?? []).map((c) => c.id);

  const [{ count: alumnosDeCursosCount }, { count: alumnosPropiosCount }] = await Promise.all([
    courseIds.length > 0
      ? supabase.from('course_members').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
      : Promise.resolve({ count: 0 }),
    supabase.from('students').select('id', { count: 'exact', head: true }).eq('teacher_id', user.id),
  ]);

  const alumnosCount = (alumnosDeCursosCount ?? 0) + (alumnosPropiosCount ?? 0);

  // No depende de tener cursos creados — una clase puede publicarse y
  // jugarse sin estar asociada a ningún curso (course_id es opcional
  // en lessons), así que este conteo no puede quedar atado a
  // courseIds como el de "Mis alumnos".
  const idsDeClases = (await supabase.from('lessons').select('id').eq('teacher_id', user.id)).data?.map((l) => l.id) ?? [];

  const { count: actividadesRealizadasCount } =
    idsDeClases.length > 0
      ? await supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'completed').in('lesson_id', idsDeClases)
      : { count: 0 };

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle();
  const limites = limitsForPlan(profile?.plan);
  const inicioDelMes = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString().slice(0, 10);
  const { data: uso } = await supabase
    .from('ai_usage')
    .select('generations_count')
    .eq('teacher_id', user.id)
    .eq('period_start', inicioDelMes)
    .maybeSingle();
  const { count: clasesGuardadasCount } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('teacher_id', user.id)
    .in('status', ['ready_for_review', 'published']);

  const metricas: Metrica[] = [
    { label: 'Mis cursos', value: cursosCount ?? 0, icon: '📚', href: '/docente/cursos' },
    { label: 'Mis alumnos', value: alumnosCount ?? 0, icon: '🧑‍🎓', href: '/docente/cursos' },
    { label: 'Clases creadas', value: clasesCount ?? 0, icon: '📝', href: '/docente/clases/nueva' },
    { label: 'Pendientes de revisión', value: clasesPendientesCount ?? 0, icon: '⏳', href: '/docente/clases/nueva' },
    { label: 'Actividades realizadas', value: actividadesRealizadasCount ?? 0, icon: '🎮', href: '/docente/cursos' },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground">Tu negocio educativo hoy</h1>
          <p className="mt-1 text-foreground/60">Un resumen rápido de tus cursos y clases.</p>
        </div>
        <Link href="/docente/clases/nueva">
          <Button size="lg">+ Crear nueva clase</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {metricas.map((metrica) => (
          <Link key={metrica.label} href={metrica.href}>
            <Card className="aulaplay-card-hover h-full cursor-pointer">
              <span className="text-2xl">{metrica.icon}</span>
              <p className="mt-3 text-3xl font-black text-foreground">{metrica.value}</p>
              <p className="mt-1 text-sm font-medium text-foreground/60">{metrica.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Tu plan: {limites.label}</h2>
          <Link href="/docente/alumnos" className="text-sm font-semibold text-brand-600 hover:underline">
            Más alumnos o generaciones →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <BarraUso label="Generaciones de IA este mes" usado={uso?.generations_count ?? 0} limite={limites.aiGenerationsPerMonth} />
          <BarraUso label="Alumnos activos" usado={alumnosPropiosCount ?? 0} limite={limites.maxActiveStudents} />
          <BarraUso label="Clases guardadas" usado={clasesGuardadasCount ?? 0} limite={limites.maxSavedLessons} />
        </div>
      </Card>

      {(cursosCount ?? 0) === 0 && (
        <Card className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">👋</span>
          <h2 className="text-xl font-bold">Todavía no creaste ningún curso</h2>
          <p className="max-w-md text-foreground/60">
            Empezá creando un curso para organizar a tus alumnos, o directamente generá tu primera clase.
          </p>
          <div className="mt-2 flex gap-3">
            <Link href="/docente/cursos">
              <Button variant="outline">Crear mi primer curso</Button>
            </Link>
            <Link href="/docente/clases/nueva">
              <Button>+ Crear nueva clase</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function BarraUso({ label, usado, limite }: { label: string; usado: number; limite: number }) {
  const porcentaje = limite > 0 ? Math.min(100, Math.round((usado / limite) * 100)) : 0;
  const cerca = porcentaje >= 90;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-foreground/70">{label}</span>
        <span className="font-semibold">
          {usado}/{limite}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full transition-all ${cerca ? 'bg-amber-500' : 'bg-brand-500'}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
