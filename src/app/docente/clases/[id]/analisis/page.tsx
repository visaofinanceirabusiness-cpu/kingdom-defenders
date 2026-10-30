import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAIProvider } from '@/lib/ai/service';
import { Card } from '@/components/ui/card';
import { LessonAnalysisForm } from '@/components/docente/lesson-analysis-form';
import { GenerateLessonButton } from '@/components/docente/generate-lesson-button';

export default async function AnalisisClasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, subject, topic, school_year, difficulty, summary, learning_objectives')
    .eq('id', id)
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (!lesson) {
    notFound();
  }

  const esDemo = getAIProvider().isDemo;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/docente/clases/nueva" className="text-sm font-semibold text-brand-600 hover:underline">
        ← Cargar otro material
      </Link>

      <h1 className="mt-3 text-3xl font-black text-foreground">Revisá el análisis</h1>
      <p className="mt-1 text-foreground/60">Paso 2 de 2 — corregí lo que haga falta antes de seguir.</p>

      {esDemo && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>⚠️ Modo DEMO:</strong> no hay una clave de IA configurada (ANTHROPIC_API_KEY), así que este análisis
          es contenido de ejemplo, no un análisis real del material. Configurá la variable de entorno para usar IA
          de verdad.
        </div>
      )}

      <Card className="mt-6">
        <LessonAnalysisForm
          lesson={{ ...lesson, learning_objectives: (lesson.learning_objectives as string[]) ?? [] }}
        />
      </Card>

      <Card className="mt-6 bg-brand-50/50">
        <p className="mb-4 text-sm text-foreground/70">
          Cuando el análisis esté bien, generá la clase completa: introducción, teoría, ejemplos, actividades
          interactivas, desafío final y evaluación.
        </p>
        <GenerateLessonButton lessonId={lesson.id} />
      </Card>
    </div>
  );
}
