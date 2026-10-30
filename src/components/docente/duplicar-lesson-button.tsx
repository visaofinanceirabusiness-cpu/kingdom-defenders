'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { duplicarLessonAction } from '@/app/docente/biblioteca/actions';
import { Button } from '@/components/ui/button';

export function DuplicarLessonButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function duplicar() {
    setError(null);
    startTransition(async () => {
      const resultado = await duplicarLessonAction(lessonId);
      if (resultado && 'error' in resultado) {
        setError(resultado.error);
        return;
      }
      if (resultado && 'success' in resultado && resultado.lessonId) {
        router.push(`/docente/clases/${resultado.lessonId}/editor`);
      }
    });
  }

  return (
    <div>
      <Button size="sm" variant="outline" onClick={duplicar} loading={pending}>
        Duplicar
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
