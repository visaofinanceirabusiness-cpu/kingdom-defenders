'use client';

// Botón explícito "Finalizar clase" para el docente — separado de
// minimizar la pizarra (antes el feedback se disparaba ahí, pero el
// docente puede minimizarla varias veces sin que eso signifique que
// terminó la clase). Al finalizar, si todavía no calificó esta
// clase, le pide 1-5 estrellas antes de volver a resultados.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FeedbackClase, yaDioFeedback } from '@/components/feedback/feedback-clase';

export function FinalizarClase({ lessonId, volverA }: { lessonId: string; volverA: string }) {
  const router = useRouter();
  const [mostrandoFeedback, setMostrandoFeedback] = useState(false);

  function finalizar() {
    if (yaDioFeedback(lessonId, 'docente')) {
      router.push(volverA);
      return;
    }
    setMostrandoFeedback(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={finalizar}
        className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-semibold text-foreground/70 hover:bg-brand-50"
      >
        🏁 Finalizar clase
      </button>
      {mostrandoFeedback && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm">
            <FeedbackClase lessonId={lessonId} rol="docente" onCerrar={() => router.push(volverA)} />
          </div>
        </div>
      )}
    </>
  );
}
