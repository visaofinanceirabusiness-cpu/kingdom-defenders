'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCourseAction } from '@/app/docente/cursos/actions';
import { cn } from '@/lib/utils';

export function DeleteCourseButton({
  courseId,
  courseName,
  variant = 'card',
  redirectAfter,
}: {
  courseId: string;
  courseName: string;
  variant?: 'card' | 'inline';
  redirectAfter?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function eliminar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar el curso "${courseName}"? Las clases y materiales no se borran, quedan sin curso asignado.`)) return;

    setError(null);
    startTransition(async () => {
      const resultado = await deleteCourseAction(courseId);
      if (resultado && 'error' in resultado) {
        setError(resultado.error);
        return;
      }
      if (redirectAfter) router.push(redirectAfter);
    });
  }

  return (
    <div className={cn(variant === 'card' && 'absolute right-3 top-3')}>
      <button
        type="button"
        onClick={eliminar}
        disabled={pending}
        title="Eliminar curso"
        className={cn(
          'rounded-lg px-2 py-1 text-red-500 hover:bg-red-50 disabled:opacity-50',
          variant === 'inline' ? 'text-xs font-semibold' : 'text-sm'
        )}
      >
        {variant === 'inline' ? 'Eliminar curso' : '🗑️'}
      </button>
      {error && <p className="mt-1 max-w-[220px] text-xs text-red-600">{error}</p>}
    </div>
  );
}
