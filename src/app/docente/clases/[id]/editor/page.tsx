import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/service';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityCard } from '@/components/docente/activity-card';
import { PublishLessonButton } from '@/components/docente/publish-lesson-button';

const TEXTO_SECCION: Record<string, { titulo: string; icono: string }> = {
  introduction: { titulo: 'Introducción', icono: '👋' },
  theory: { titulo: 'Explicación teórica', icono: '📖' },
  examples: { titulo: 'Ejemplos prácticos', icono: '💡' },
  evaluation: { titulo: 'Evaluación', icono: '📝' },
};

export default async function EditorClasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, subject, topic, status, access_code, generation_error, material_id')
    .eq('id', lessonId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!lesson) {
    notFound();
  }

  const [{ data: secciones }, { data: actividades }] = await Promise.all([
    supabase.from('lesson_sections').select('id, section_type, title, content, position').eq('lesson_id', lessonId).order('position'),
    supabase.from('activities').select('id, lesson_section_id, title, game_template_id, config, position').eq('lesson_id', lessonId).order('position'),
  ]);

  if (!secciones || secciones.length === 0) {
    const esManual = !lesson.material_id;
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">{esManual ? '✍️' : '🪄'}</span>
          <h1 className="text-xl font-bold">Esta clase todavía no tiene contenido</h1>
          <p className="text-foreground/60">
            {esManual
              ? 'Es una clase manual — agregá las secciones y actividades a mano.'
              : lesson.generation_error
                ? `El último intento falló: ${lesson.generation_error}`
                : 'Volvé al análisis y generá la clase completa primero.'}
          </p>
          <Link
            href={esManual ? `/docente/clases/${lessonId}/construir` : `/docente/clases/${lessonId}/analisis`}
            className="font-semibold text-brand-600 hover:underline"
          >
            {esManual ? '→ Ir a construirla' : '← Ir al análisis'}
          </Link>
        </Card>
      </div>
    );
  }

  const actividadesPorSeccion = new Map<string, typeof actividades>();
  for (const actividad of actividades ?? []) {
    const lista = actividadesPorSeccion.get(actividad.lesson_section_id ?? '') ?? [];
    lista.push(actividad);
    actividadesPorSeccion.set(actividad.lesson_section_id ?? '', lista);
  }

  const esManual = !lesson.material_id;
  const esDemo = !esManual && getAIProvider().isDemo;
  const publicada = lesson.status === 'published';

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={esManual ? `/docente/biblioteca` : `/docente/clases/${lessonId}/analisis`}
        className="text-sm font-semibold text-brand-600 hover:underline"
      >
        {esManual ? '← Volver a la biblioteca' : '← Volver al análisis'}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground">{lesson.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {lesson.subject && <Badge tone="brand">{lesson.subject}</Badge>}
            <Badge tone={publicada ? 'success' : 'warning'}>{publicada ? '✅ Publicada' : 'Borrador'}</Badge>
            {esManual && <Badge tone="accent">✍️ Hecha a mano</Badge>}
          </div>
          <Link href={`/docente/clases/${lessonId}/editar`} className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline">
            Editar título/materia/tema →
          </Link>
        </div>
        {esManual && !publicada && (
          <Link href={`/docente/clases/${lessonId}/construir`} className="font-semibold text-brand-600 hover:underline">
            + Agregar más contenido
          </Link>
        )}
      </div>

      {esDemo && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>⚠️ Modo DEMO:</strong> este contenido es de ejemplo, no fue generado por una IA real.
        </div>
      )}

      {publicada && lesson.access_code && (
        <Card className="mt-6 border-2 border-success-500 bg-success-500/10 text-center">
          <p className="text-sm font-semibold text-success-600">Código de acceso para tus alumnos</p>
          <p className="mt-1 text-4xl font-black tracking-widest text-brand-700">{lesson.access_code}</p>
          <Link href={`/docente/clases/${lessonId}/resultados`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Ver resultados de mis alumnos →
          </Link>
        </Card>
      )}

      <div className="mt-6 space-y-6">
        {secciones
          .filter((s) => s.section_type in TEXTO_SECCION)
          .map((seccion) => (
            <Card key={seccion.id}>
              <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
                <span>{TEXTO_SECCION[seccion.section_type].icono}</span>
                {TEXTO_SECCION[seccion.section_type].titulo}
              </h2>
              {(seccion.content as { image_url?: string } | null)?.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(seccion.content as { image_url?: string }).image_url}
                  alt=""
                  className="mb-3 max-h-64 w-full rounded-xl border border-border object-contain"
                />
              )}
              <p className="whitespace-pre-line text-foreground/80">
                {(seccion.content as { text?: string } | null)?.text ?? ''}
              </p>
            </Card>
          ))}

        {secciones
          .filter((s) => s.section_type === 'activity' || s.section_type === 'final_challenge')
          .map((seccion) => {
            const actividadesDeLaSeccion = actividadesPorSeccion.get(seccion.id) ?? [];
            if (actividadesDeLaSeccion.length === 0) return null;

            return (
              <div key={seccion.id}>
                <h2 className="mb-3 text-lg font-bold">
                  {seccion.section_type === 'final_challenge' ? '🏆 Desafío final' : '🎮 Actividades interactivas'}
                </h2>
                <div className="space-y-3">
                  {actividadesDeLaSeccion.map((actividad) => (
                    <ActivityCard key={actividad.id} lessonId={lessonId} activity={actividad} />
                  ))}
                </div>
              </div>
            );
          })}
      </div>

      {!publicada && (
        <div className="mt-8">
          <PublishLessonButton lessonId={lessonId} />
        </div>
      )}
    </div>
  );
}
