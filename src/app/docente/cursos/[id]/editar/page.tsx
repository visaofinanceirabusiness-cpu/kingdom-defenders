import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditCourseForm } from '@/components/docente/edit-course-form';

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: curso } = await supabase
    .from('courses')
    .select('id, name, subject, school_year, description')
    .eq('id', courseId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!curso) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/docente/cursos/${courseId}`} className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver al curso
      </Link>
      <h1 className="mt-3 mb-6 text-3xl font-black text-foreground">Editar curso</h1>
      <EditCourseForm curso={curso} />
    </div>
  );
}
