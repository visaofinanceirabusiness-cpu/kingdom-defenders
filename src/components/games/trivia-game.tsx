'use client';

import { useState } from 'react';
import { GameShell } from './game-shell';
import { cn } from '@/lib/utils';
import type { GameConfigFor } from '@/lib/games/schemas';

export function TriviaGame({ config, title }: { config: GameConfigFor<'trivia'>; title: string }) {
  return (
    <GameShell
      icon="🧠"
      title={title}
      instructions={`Respondé ${config.questions.length} pregunta${config.questions.length === 1 ? '' : 's'} eligiendo la opción correcta.`}
      totalPreguntas={config.questions.length}
    >
      {({ onRespuesta, indice }) => <Pregunta key={indice} pregunta={config.questions[indice]} onRespuesta={onRespuesta} />}
    </GameShell>
  );
}

function Pregunta({
  pregunta,
  onRespuesta,
}: {
  pregunta: GameConfigFor<'trivia'>['questions'][number];
  onRespuesta: (correcta: boolean) => void;
}) {
  const [elegida, setElegida] = useState<string | null>(null);

  function elegir(opcion: string) {
    if (elegida) return;
    setElegida(opcion);
    setTimeout(() => onRespuesta(opcion === pregunta.correct_answer), 1100);
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold">{pregunta.question}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {pregunta.options.map((opcion) => {
          const esCorrecta = opcion === pregunta.correct_answer;
          const esElegida = opcion === elegida;
          const mostrarResultado = elegida !== null;

          return (
            <button
              key={opcion}
              type="button"
              onClick={() => elegir(opcion)}
              disabled={elegida !== null}
              className={cn(
                'rounded-xl border-2 px-4 py-3 text-left font-semibold transition-colors',
                !mostrarResultado && 'border-border bg-surface hover:border-brand-400 hover:bg-brand-50',
                mostrarResultado && esCorrecta && 'border-success-500 bg-success-500/10 text-success-600',
                mostrarResultado && esElegida && !esCorrecta && 'border-red-400 bg-red-50 text-red-600',
                mostrarResultado && !esCorrecta && !esElegida && 'border-border bg-surface opacity-50'
              )}
            >
              {opcion}
            </button>
          );
        })}
      </div>
      {elegida && pregunta.explanation && <p className="mt-4 text-sm text-foreground/60">💡 {pregunta.explanation}</p>}
    </div>
  );
}
