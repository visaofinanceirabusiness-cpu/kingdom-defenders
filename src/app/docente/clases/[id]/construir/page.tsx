import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeccionForm } from '@/components/docente/seccion-form';
import { TemasSection } from '@/components/docente/temas-section';
import { AgregarActividadForm } from '@/components/docente/agregar-actividad-form';
import { ActivityCard } from '@/components/docente/activity-card';
import type { GameTypeId } from '@/lib/games/schemas';

export default async function ConstruirClasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, subject, topic, status')
    .eq('id', lessonId)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!lesson) {
    notFound();
  }

  const [{ data: secciones }, { data: actividades }] = await Promise.all([
    supabase.from('lesson_sections').select('id, section_type, title, content, position').eq('lesson_id', lessonId).order('position'),
    supabase.from('activities').select('id, title, game_template_id, config, position').eq('lesson_id', lessonId).order('position'),
  ]);

  const seccionPorTipo = new Map((secciones ?? []).map((s) => [s.section_type, s]));
  const temas = (secciones ?? [])
    .filter((s) => s.section_type === 'tema')
    .map((s) => {
      const contenido = s.content as { theory?: string; examples?: string; image_url?: string } | null;
      return { id: s.id, title: s.title, theory: contenido?.theory, examples: contenido?.examples, image_url: contenido?.image_url };
    });

  const cantidadPorTipo: Partial<Record<GameTypeId, number>> = {};
  for (const a of actividades ?? []) {
    const tipo = a.game_template_id as GameTypeId;
    cantidadPorTipo[tipo] = (cantidadPorTipo[tipo] ?? 0) + 1;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/docente/biblioteca" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Volver a la biblioteca
      </Link>

      <div className="mt-3">
        <h1 className="text-3xl font-black text-foreground">{lesson.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {lesson.subject && <Badge tone="brand">{lesson.subject}</Badge>}
          {lesson.topic && <Badge tone="neutral">{lesson.topic}</Badge>}
          <Badge tone="accent">✍️ Hecha a mano</Badge>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-bold">Introducción</h2>
        {(() => {
          const seccion = seccionPorTipo.get('introduction');
          const contenido = seccion?.content as { text?: string; image_url?: string } | undefined;
          return (
            <SeccionForm
              lessonId={lessonId}
              sectionType="introduction"
              seccionId={seccion?.id}
              texto={contenido?.text}
              imagenUrl={contenido?.image_url}
            />
          );
        })()}
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-bold">Temas (teoría + ejemplo)</h2>
        <p className="-mt-2 text-sm text-foreground/60">
          Cada tema se muestra como un desplegable aparte. Podés agregar los que necesites.
        </p>
        <TemasSection lessonId={lessonId} temas={temas} />
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-bold">Evaluación</h2>
        {(() => {
          const seccion = seccionPorTipo.get('evaluation');
          const contenido = seccion?.content as { text?: string; image_url?: string } | undefined;
          return (
            <SeccionForm
              lessonId={lessonId}
              sectionType="evaluation"
              seccionId={seccion?.id}
              texto={contenido?.text}
              imagenUrl={contenido?.image_url}
            />
          );
        })()}
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-bold">Actividades ({actividades?.length ?? 0})</h2>
        {(actividades ?? []).map((a) => (
          <ActivityCard key={a.id} lessonId={lessonId} activity={a} />
        ))}
        <AgregarActividadForm lessonId={lessonId} cantidadPorTipo={cantidadPorTipo} />
      </div>

      <Card className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/60">Cuando esté lista, andá al editor para previsualizarla y publicarla.</p>
        <Link href={`/docente/clases/${lessonId}/editor`} className="font-semibold text-brand-600 hover:underline">
          Ir al editor →
        </Link>
      </Card>
    </div>
  );
}
