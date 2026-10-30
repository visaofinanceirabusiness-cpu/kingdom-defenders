import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditStudentForm } from '@/components/docente/edit-student-form';

export default async function EditarAlumnoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: alumno } = await supabase
    .from('students')
    .select('id, display_name, school_year, level, subjects')
    .eq('id', studentId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!alumno) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/docente/alumnos/${studentId}`} className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver al alumno
      </Link>
      <h1 className="mt-3 mb-6 text-3xl font-black text-foreground">Editar alumno</h1>
      <EditStudentForm alumno={alumno} />
    </div>
  );
}
