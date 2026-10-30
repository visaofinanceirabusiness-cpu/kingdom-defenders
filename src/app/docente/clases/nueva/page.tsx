import { createClient } from '@/lib/supabase/server';
import { ModoCreacionClase } from '@/components/docente/modo-creacion-clase';

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
        Con IA: cargá un material o escribí el tema y revisás lo que arma. Manual: vos escribís y armás todo, sin IA.
      </p>

      <div className="mt-6">
        <ModoCreacionClase courses={cursos ?? []} initialCourseId={courseId} />
      </div>
    </div>
  );
}
