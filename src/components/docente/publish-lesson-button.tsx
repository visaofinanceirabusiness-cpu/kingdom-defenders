'use client';

import { useState } from 'react';
import { publishLessonAction } from '@/app/docente/clases/[id]/editor-actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PublishLessonButton({ lessonId }: { lessonId: string }) {
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string | null>(null);

  async function publicar() {
    setPublicando(true);
    setError(null);

    const resultado = await publishLessonAction(lessonId);

    setPublicando(false);

    if (resultado && 'error' in resultado) {
      setError(resultado.error);
      return;
    }

    if (resultado && 'success' in resultado && resultado.accessCode) {
      setAccessCode(resultado.accessCode);
    }
  }

  if (accessCode) {
    return (
      <Card className="border-2 border-success-500 bg-success-500/10 text-center">
        <p className="font-bold text-success-600">🎉 ¡Clase publicada!</p>
        <p className="mt-2 text-sm text-foreground/60">Compartí este código con tus alumnos para que entren:</p>
        <p className="mt-2 text-4xl font-black tracking-widest text-brand-700">{accessCode}</p>
      </Card>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Button size="lg" className="w-full" onClick={publicar} loading={publicando}>
        🚀 Publicar clase
      </Button>
    </div>
  );
}
