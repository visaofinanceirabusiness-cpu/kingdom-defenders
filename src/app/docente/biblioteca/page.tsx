import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AsignarSesionButton } from '@/components/docente/asignar-sesion-button';
import { DuplicarLessonButton } from '@/components/docente/duplicar-lesson-button';

export default async function BibliotecaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: clases }, { data: alumnos }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, subject, topic, status')
      .eq('teacher_id', user.id)
      .in('status', ['ready_for_review', 'published'])
      .order('updated_at', { ascending: false }),
    supabase.from('students').select('id, display_name').eq('teacher_id', user.id).order('display_name'),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground">Mi biblioteca</h1>
        <p className="mt-1 text-foreground/60">
          Tus clases generadas, listas para reusar con cualquier alumno — reusarlas no gasta una generación de IA nueva.
        </p>
      </div>

      {clases && clases.length > 0 ? (
        <div className="grid gap-4">
          {clases.map((clase) => (
            <Card key={clase.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{clase.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {clase.subject && <Badge tone="brand">{clase.subject}</Badge>}
                    {clase.topic && <Badge tone="neutral">{clase.topic}</Badge>}
                    {clase.status === 'published' && <Badge tone="success">Publicada</Badge>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/docente/clases/${clase.id}/editor`} className="text-sm font-semibold text-brand-600 hover:underline">
                    Ver / editar
                  </Link>
                  <DuplicarLessonButton lessonId={clase.id} />
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <AsignarSesionButton lessonId={clase.id} alumnos={alumnos ?? []} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">📚</span>
          <h2 className="text-xl font-bold">Tu biblioteca está vacía</h2>
          <p className="max-w-md text-foreground/60">
            Generá el contenido completo de una clase para que aparezca acá y puedas reusarla con tus alumnos.
          </p>
          <Link href="/docente/clases/nueva" className="font-semibold text-brand-600 hover:underline">
            + Crear nueva clase
          </Link>
        </Card>
      )}
    </div>
  );
}
