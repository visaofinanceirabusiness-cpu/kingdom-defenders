import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewStudentForm } from '@/components/docente/new-student-form';

export default async function AlumnosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: alumnos } = await supabase
    .from('students')
    .select('id, display_name, school_year, level, subjects, created_at')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground">Mis alumnos</h1>
          <p className="mt-1 text-foreground/60">Alumnos particulares, con su propio historial y resultados.</p>
        </div>
      </div>

      <NewStudentForm />

      {alumnos && alumnos.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alumnos.map((alumno) => (
            <Link key={alumno.id} href={`/docente/alumnos/${alumno.id}`}>
              <Card className="aulaplay-card-hover h-full">
                <h2 className="text-lg font-bold">{alumno.display_name}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {alumno.level && <Badge tone="brand">{alumno.level}</Badge>}
                  {alumno.school_year && <Badge tone="accent">{alumno.school_year}</Badge>}
                </div>
                {Array.isArray(alumno.subjects) && alumno.subjects.length > 0 && (
                  <p className="mt-3 text-sm text-foreground/60">{(alumno.subjects as string[]).join(', ')}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="mt-8 flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">🧑‍🎓</span>
          <h2 className="text-xl font-bold">Todavía no registraste ningún alumno</h2>
          <p className="max-w-md text-foreground/60">
            Registrá a tus alumnos acá para asignarles clases directamente desde tu biblioteca, sin necesidad de un curso.
          </p>
        </Card>
      )}
    </div>
  );
}
