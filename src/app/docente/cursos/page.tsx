import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewCourseForm } from '@/components/docente/new-course-form';
import { DeleteCourseButton } from '@/components/docente/delete-course-button';

export default async function MisCursosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: cursos } = await supabase
    .from('courses')
    .select('id, name, subject, school_year, archived, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground">Mis cursos</h1>
          <p className="mt-1 text-foreground/60">Organizá a tus alumnos por curso.</p>
        </div>
        <NewCourseForm />
      </div>

      {cursos && cursos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cursos.map((curso) => (
            <Card key={curso.id} className="relative h-full">
              <DeleteCourseButton courseId={curso.id} courseName={curso.name} />
              <Link href={`/docente/cursos/${curso.id}`} className="block pr-8">
                <h3 className="text-lg font-bold hover:text-brand-700">{curso.name}</h3>
                {curso.archived && (
                  <Badge tone="neutral" className="mt-1">
                    Archivado
                  </Badge>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {curso.subject && <Badge tone="brand">{curso.subject}</Badge>}
                  {curso.school_year && <Badge tone="accent">{curso.school_year}</Badge>}
                </div>
              </Link>
              <Link href={`/docente/cursos/${curso.id}/editar`} className="mt-3 inline-block text-xs font-semibold text-brand-600 hover:underline">
                Editar
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="text-4xl">📚</span>
          <h2 className="text-xl font-bold">Todavía no tenés cursos</h2>
          <p className="max-w-md text-foreground/60">Creá tu primer curso para empezar a organizar tus clases.</p>
        </Card>
      )}
    </div>
  );
}
