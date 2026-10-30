import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/card';
import { ClasePlayer } from '@/components/alumno/clase-player';
import { PizarraFlotante } from '@/components/pizarra/pizarra-flotante';

export default async function SesionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const admin = createAdminClient();

  const { data: session } = await admin
    .from('sessions')
    .select('id, status, total_score, lesson_id, student_id')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: 'var(--fondo-app, linear-gradient(135deg, #ede9fe 0%, #fdf4ff 50%, #eff6ff 100%))' }}
      >
        <Card className="w-full max-w-sm text-center">
          <span className="text-5xl">🤔</span>
          <h1 className="mt-3 text-xl font-bold text-foreground">No encontramos esta sesión</h1>
          <Link href="/clase" className="mt-4 inline-block font-semibold text-brand-600 hover:underline">
            ← Entrar con un código
          </Link>
        </Card>
      </main>
    );
  }

  const [{ data: lesson }, { data: student }, { data: secciones }, { data: actividades }] = await Promise.all([
    admin.from('lessons').select('title, subject').eq('id', session.lesson_id).maybeSingle(),
    admin.from('students').select('display_name').eq('id', session.student_id).maybeSingle(),
    admin.from('lesson_sections').select('id, section_type, title, content, position').eq('lesson_id', session.lesson_id).order('position'),
    admin.from('activities').select('id, lesson_section_id, title, game_template_id, config, max_score, position').eq('lesson_id', session.lesson_id).order('position'),
  ]);

  const maxScoreTotal = (actividades ?? []).reduce((acc, a) => acc + a.max_score, 0);

  return (
    <main
      className="min-h-screen px-4 py-10"
      style={{ background: 'var(--fondo-app, linear-gradient(135deg, #ede9fe 0%, #fdf4ff 50%, #eff6ff 100%))' }}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-foreground">{lesson?.title}</h1>
          {student && <span className="text-sm font-semibold text-foreground/60">👤 {student.display_name}</span>}
        </div>

        {session.status === 'completed' ? (
          <ResultadoGuardado totalScore={session.total_score} maxScoreTotal={maxScoreTotal} />
        ) : (
          <ClasePlayer sessionId={session.id} secciones={secciones ?? []} actividades={actividades ?? []} />
        )}
      </div>

      {/* La sala es la CLASE (lesson_id), no la sesión — así el docente
          la tiene activa desde el editor sin depender de un link por
          alumno, y cualquiera que entre con el código de esta clase
          cae en la misma pizarra. */}
      <PizarraFlotante roomId={session.lesson_id} />
    </main>
  );
}

function ResultadoGuardado({ totalScore, maxScoreTotal }: { totalScore: number; maxScoreTotal: number }) {
  const porcentaje = maxScoreTotal > 0 ? Math.round((totalScore / maxScoreTotal) * 100) : 0;
  const emoji = porcentaje >= 80 ? '🏆' : porcentaje >= 50 ? '🎉' : '💪';

  return (
    <Card className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="text-6xl">{emoji}</span>
      <h2 className="text-2xl font-black">Ya completaste esta clase</h2>
      <p className="text-4xl font-black text-brand-600">
        {totalScore}/{maxScoreTotal}
      </p>
      <p className="text-foreground/60">{porcentaje}% de puntaje total.</p>
      <Link href="/clase" className="mt-2 font-semibold text-brand-600 hover:underline">
        Entrar a otra clase
      </Link>
    </Card>
  );
}
