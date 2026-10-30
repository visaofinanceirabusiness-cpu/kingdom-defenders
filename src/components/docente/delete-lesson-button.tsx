'use client';

import { useState, useTransition } from 'react';
import { deleteLessonAction } from '@/app/docente/clases/[id]/editor-actions';

export function DeleteLessonButton({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function eliminar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar la clase "${lessonTitle}"? Se borran también sus resultados de alumnos. No se puede deshacer.`)) return;

    setError(null);
    startTransition(async () => {
      const resultado = await deleteLessonAction(lessonId);
      if (resultado && 'error' in resultado) {
        setError(resultado.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={eliminar}
        disabled={pending}
        title="Eliminar clase"
        className="rounded-lg px-2 py-1 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
      >
        🗑️
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
