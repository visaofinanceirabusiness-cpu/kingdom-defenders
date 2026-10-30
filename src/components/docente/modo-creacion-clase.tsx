'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NewLessonForm } from '@/components/docente/new-lesson-form';
import { NewManualLessonForm } from '@/components/docente/new-manual-lesson-form';

type Curso = { id: string; name: string };

export function ModoCreacionClase({ courses, initialCourseId }: { courses: Curso[]; initialCourseId?: string }) {
  const [modo, setModo] = useState<'ia' | 'manual'>('ia');

  return (
    <div>
      <div className="mb-6 flex gap-2 rounded-xl bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => setModo('ia')}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
            modo === 'ia' ? 'bg-surface shadow-sm text-brand-700' : 'text-foreground/60'
          )}
        >
          🤖 Generar con IA
        </button>
        <button
          type="button"
          onClick={() => setModo('manual')}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
            modo === 'manual' ? 'bg-surface shadow-sm text-brand-700' : 'text-foreground/60'
          )}
        >
          ✍️ Crear manualmente
        </button>
      </div>

      {modo === 'ia' ? (
        <NewLessonForm courses={courses} initialCourseId={initialCourseId} />
      ) : (
        <NewManualLessonForm courses={courses} initialCourseId={initialCourseId} />
      )}
    </div>
  );
}
