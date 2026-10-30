'use client';

// Pedido de calificación al terminar una clase — alumno cuando
// completa la clase, docente cuando cierra la pizarra. Una vez
// enviado (u omitido) queda marcado en localStorage de ese
// navegador para no volver a preguntar en la misma clase.
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { enviarFeedbackAction } from '@/lib/feedback/actions';

function claveLocal(lessonId: string, rol: 'docente' | 'alumno') {
  return `feedback-enviado:${lessonId}:${rol}`;
}

export function yaDioFeedback(lessonId: string, rol: 'docente' | 'alumno'): boolean {
  try {
    return localStorage.getItem(claveLocal(lessonId, rol)) !== null;
  } catch {
    return false;
  }
}

export function FeedbackClase({
  lessonId,
  sessionId,
  rol,
  onCerrar,
}: {
  lessonId: string;
  sessionId?: string;
  rol: 'docente' | 'alumno';
  onCerrar?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function marcarHecho() {
    try {
      localStorage.setItem(claveLocal(lessonId, rol), '1');
    } catch {
      // Ventana privada o localStorage bloqueado — puede volver a preguntar, no rompe nada.
    }
  }

  async function enviar() {
    if (rating === 0) return;
    setEnviando(true);
    setError(null);
    const resultado = await enviarFeedbackAction({ lessonId, sessionId, rol, rating, comentario });
    setEnviando(false);
    if (resultado.error) {
      setError(resultado.error);
      return;
    }
    marcarHecho();
    onCerrar?.();
  }

  function omitir() {
    marcarHecho();
    onCerrar?.();
  }

  return (
    <Card className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="text-3xl">⭐</span>
      <h2 className="text-lg font-bold text-foreground">¿Cómo estuvo la clase?</h2>
      <p className="text-sm text-foreground/60">Tu opinión nos ayuda a mejorar AulaPlay.</p>

      <div className="flex gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
            aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          >
            {(hover || rating) >= n ? '⭐' : '☆'}
          </button>
        ))}
      </div>

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Algún comentario (opcional)"
        rows={2}
        className="w-full max-w-sm resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={enviar} disabled={rating === 0 || enviando}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </Button>
        <button type="button" onClick={omitir} className="text-sm font-semibold text-foreground/50 hover:text-foreground/80 hover:underline">
          Omitir
        </button>
      </div>
    </Card>
  );
}
