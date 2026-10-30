'use client';

import { useState } from 'react';
import { GameShell } from './game-shell';
import { cn } from '@/lib/utils';
import type { GameConfigFor } from '@/lib/games/schemas';

export function TrueOrFalseGame({
  config,
  title,
  onTerminar,
}: {
  config: GameConfigFor<'true_or_false'>;
  title: string;
  onTerminar?: (puntaje: number, total: number) => void;
}) {
  return (
    <GameShell
      icon="✅"
      title={title}
      instructions={`Decidí si cada afirmación es verdadera o falsa. Son ${config.statements.length} en total.`}
      totalPreguntas={config.statements.length}
      onTerminar={onTerminar}
    >
      {({ onRespuesta, indice }) => <Afirmacion key={indice} item={config.statements[indice]} onRespuesta={onRespuesta} />}
    </GameShell>
  );
}

function Afirmacion({
  item,
  onRespuesta,
}: {
  item: GameConfigFor<'true_or_false'>['statements'][number];
  onRespuesta: (correcta: boolean) => void;
}) {
  const [elegida, setElegida] = useState<boolean | null>(null);

  function elegir(valor: boolean) {
    if (elegida !== null) return;
    setElegida(valor);
    setTimeout(() => onRespuesta(valor === item.is_true), 1100);
  }

  return (
    <div className="text-center">
      <h3 className="mb-6 text-lg font-bold">{item.statement}</h3>
      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={() => elegir(true)}
          disabled={elegida !== null}
          className={cn(
            'rounded-xl border-2 px-8 py-4 text-xl font-black transition-colors',
            elegida === null && 'border-border bg-surface hover:border-success-500 hover:bg-success-500/10',
            elegida !== null && item.is_true && 'border-success-500 bg-success-500/10 text-success-600',
            elegida === true && !item.is_true && 'border-red-400 bg-red-50 text-red-600',
            elegida !== null && !item.is_true && elegida !== true && 'opacity-50'
          )}
        >
          ✅ Verdadero
        </button>
        <button
          type="button"
          onClick={() => elegir(false)}
          disabled={elegida !== null}
          className={cn(
            'rounded-xl border-2 px-8 py-4 text-xl font-black transition-colors',
            elegida === null && 'border-border bg-surface hover:border-red-400 hover:bg-red-50',
            elegida !== null && !item.is_true && 'border-success-500 bg-success-500/10 text-success-600',
            elegida === false && item.is_true && 'border-red-400 bg-red-50 text-red-600',
            elegida !== null && item.is_true && elegida !== false && 'opacity-50'
          )}
        >
          ❌ Falso
        </button>
      </div>
      {elegida !== null && item.explanation && <p className="mt-4 text-sm text-foreground/60">💡 {item.explanation}</p>}
    </div>
  );
}
