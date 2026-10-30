import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

  const { count: alumnosCount } =
    courseIds.length > 0
      ? await supabase.from('course_members').select('id', { count: 'exact', head: true }).in('course_id', courseIds)
      : { count: 0 };

  const { count: actividadesRealizadasCount } =
    courseIds.length > 0
      ? await supabase
          .from('sessions')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .in(
            'lesson_id',
            // sub-select implícito: sessions están ligadas a lessons del
            // propio docente a través de lessons.teacher_id — filtramos
            // directo por lessons del docente actual.
            (await supabase.from('lessons').select('id').eq('teacher_id', user.id)).data?.map((l) => l.id) ?? []
          )
      : { count: 0 };

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
