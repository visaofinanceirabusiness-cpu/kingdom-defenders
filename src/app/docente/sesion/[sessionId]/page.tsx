import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PizarraFlotante } from '@/components/pizarra/pizarra-flotante';
import { PresenciaClase } from '@/components/presencia/presencia-clase';

// Vista en vivo del docente para acompañar a un alumno en el momento
// (clase particular) con la pizarra compartida abierta — la sala de
// la pizarra es la CLASE (lesson.id), no esta sesión puntual, así
// coincide con la que usa el editor y con la del alumno. No
// reemplaza /resultados (eso es la foto final); esto es "estoy ahora
// mismo con este alumno".
export default async function SesionEnVivoDocentePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, total_score, lesson_id, student_id, lessons(id, title, subject, teacher_id)')
    .eq('id', sessionId)
    .maybeSingle();

  const lesson = session?.lessons as unknown as { id: string; title: string; subject: string | null; teacher_id: string } | null;

  if (!session || !lesson || lesson.teacher_id !== user.id) {
    notFound();
  }

  const [{ data: student }, { data: perfil }] = await Promise.all([
    supabase.from('students').select('display_name').eq('id', session.student_id).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/docente/clases/${lesson.id}/resultados`} className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver a resultados
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">{lesson.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {lesson.subject && <Badge tone="brand">{lesson.subject}</Badge>}
            {student && <Badge tone="accent">👤 {student.display_name}</Badge>}
            <Badge tone={session.status === 'completed' ? 'success' : 'warning'}>{session.status === 'completed' ? 'Completada' : 'En curso'}</Badge>
          </div>
        </div>
      </div>

      <PresenciaClase roomId={lesson.id} nombre={perfil?.full_name ?? 'Docente'} rol="docente" />

      <Card className="mt-6">
        <p className="text-sm text-foreground/60">
          Abrí la pizarra (ícono flotante abajo a la derecha) para dibujar en vivo junto con{' '}
          {student?.display_name ?? 'el alumno'} — ambos ven lo mismo en tiempo real mientras los dos tengan esta
          pantalla (o la clase) abierta.
        </p>
      </Card>

      <PizarraFlotante roomId={lesson.id} nombre={perfil?.full_name ?? 'Docente'} />
    </div>
  );
}
