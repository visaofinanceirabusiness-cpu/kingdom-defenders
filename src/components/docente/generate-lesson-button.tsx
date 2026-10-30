'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function GenerateLessonButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setGenerando(true);
    setError(null);

    try {
      const res = await fetch(`/api/lessons/${lessonId}/generate`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Ocurrió un error inesperado.');
        setGenerando(false);
        return;
      }

      router.push(`/docente/clases/${lessonId}/editor`);
    } catch {
      setError('No se pudo conectar con el servidor — probá de nuevo.');
      setGenerando(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button size="lg" className="w-full" onClick={generar} loading={generando}>
        {generando ? 'Generando clase (puede tardar un minuto)...' : '🪄 Generar clase completa →'}
      </Button>
    </div>
  );
}
