import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditLessonForm } from '@/components/docente/edit-lesson-form';

export default async function EditarClasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: lesson }, { data: cursos }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, subject, topic, school_year, difficulty, course_id')
      .eq('id', lessonId)
      .eq('teacher_id', user.id)
      .maybeSingle(),
    supabase.from('courses').select('id, name').eq('teacher_id', user.id).eq('archived', false).order('name'),
  ]);

  if (!lesson) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/docente/clases/${lessonId}/editor`} className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver al editor
      </Link>
      <h1 className="mt-3 mb-6 text-3xl font-black text-foreground">Editar clase</h1>
      <EditLessonForm lesson={lesson} courses={cursos ?? []} />
    </div>
  );
}
