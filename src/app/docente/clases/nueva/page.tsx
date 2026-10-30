import { createClient } from '@/lib/supabase/server';
import { NewLessonForm } from '@/components/docente/new-lesson-form';

export default async function NuevaClasePage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { courseId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: cursos } = await supabase
    .from('courses')
    .select('id, name')
    .eq('teacher_id', user.id)
    .eq('archived', false)
    .order('name');

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-black text-foreground">+ Crear nueva clase</h1>
      <p className="mt-1 text-foreground/60">
        Paso 1 de 2 — cargá un material o escribí el tema, y la IA arma un primer análisis para que revises.
      </p>

      <div className="mt-6">
        <NewLessonForm courses={cursos ?? []} initialCourseId={courseId} />
      </div>
    </div>
  );
}
