import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function CursoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: curso } = await supabase
    .from('courses')
    .select('id, name, subject, school_year, description')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!curso) {
    notFound();
  }

  const [{ data: clases }, { count: alumnosCount }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, status, created_at')
      .eq('course_id', id)
      .order('created_at', { ascending: false }),
    supabase.from('course_members').select('id', { count: 'exact', head: true }).eq('course_id', id),
  ]);

  return (
    <div>
      <Link href="/docente/cursos" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver a Mis cursos
      </Link>

      <div className="mt-3 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground">{curso.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {curso.subject && <Badge tone="brand">{curso.subject}</Badge>}
            {curso.school_year && <Badge tone="accent">{curso.school_year}</Badge>}
          </div>
          {curso.description && <p className="mt-3 max-w-xl text-foreground/60">{curso.description}</p>}
        </div>
        <Link href={`/docente/clases/nueva?courseId=${curso.id}`}>
          <Button>+ Crear clase para este curso</Button>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Clases</h2>
          {clases && clases.length > 0 ? (
            <ul className="space-y-2">
              {clases.map((clase) => (
                <li key={clase.id} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="font-medium">{clase.title}</span>
                  <EstadoBadge status={clase.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground/60">Todavía no creaste ninguna clase para este curso.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 text-lg font-bold">Alumnos</h2>
          <p className="text-3xl font-black">{alumnosCount ?? 0}</p>
          <p className="mt-2 text-sm text-foreground/60">
            La incorporación de alumnos por código todavía no está implementada — llega en la próxima fase (acceso de
            alumnos).
          </p>
        </Card>
      </div>
    </div>
  );
}

function EstadoBadge({ status }: { status: string }) {
  const mapa: Record<string, { label: string; tone: 'neutral' | 'warning' | 'success' | 'brand' }> = {
    draft: { label: 'Borrador', tone: 'neutral' },
    generating: { label: 'Generando...', tone: 'warning' },
    ready_for_review: { label: 'Para revisar', tone: 'warning' },
    published: { label: 'Publicada', tone: 'success' },
    archived: { label: 'Archivada', tone: 'neutral' },
  };

  const { label, tone } = mapa[status] ?? { label: status, tone: 'neutral' as const };
  return <Badge tone={tone}>{label}</Badge>;
}
