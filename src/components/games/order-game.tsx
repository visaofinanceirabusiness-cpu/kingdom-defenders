'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GameConfigFor } from '@/lib/games/schemas';

function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function OrderGame({
  config,
  title,
  onTerminar,
}: {
  config: GameConfigFor<'order'>;
  title: string;
  onTerminar?: (puntaje: number, total: number) => void;
}) {
  const [etapa, setEtapa] = useState<'intro' | 'jugando' | 'resultado'>('intro');
  const itemsBarajados = useMemo(() => barajar(config.items), [config.items]);
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [correctos, setCorrectos] = useState(0);

  function elegir(indice: number) {
    if (elegidos.includes(indice)) return;
    const nuevos = [...elegidos, indice];
    setElegidos(nuevos);

    if (nuevos.length === itemsBarajados.length) {
      const cantidadCorrectos = nuevos.filter((idx, posicion) => itemsBarajados[idx].correct_position === posicion).length;
      setCorrectos(cantidadCorrectos);
      setEtapa('resultado');
      onTerminar?.(cantidadCorrectos, itemsBarajados.length);
    }
  }

  if (etapa === 'intro') {
    return (
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="text-5xl">🔢</span>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="max-w-md text-foreground/60">{config.instruction || 'Tocá los elementos en el orden correcto.'}</p>
        <Button size="lg" onClick={() => setEtapa('jugando')}>
          ¡Empezar! 🚀
        </Button>
      </Card>
    );
  }

  if (etapa === 'resultado') {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-5xl">{correctos === itemsBarajados.length ? '🏆' : '💪'}</span>
        <h2 className="text-2xl font-black">¡Listo!</h2>
        <p className="text-4xl font-black text-brand-600">
          {correctos}/{itemsBarajados.length}
        </p>
        <p className="text-foreground/60">en la posición correcta.</p>
        <div className="mt-4 w-full max-w-sm space-y-1.5 text-left">
          {[...config.items]
            .sort((a, b) => a.correct_position - b.correct_position)
            .map((it, i) => (
              <p key={i} className="rounded-lg bg-surface-muted px-3 py-1.5 text-sm">
                {i + 1}. {it.label}
              </p>
            ))}
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-4 text-sm text-foreground/60">Tocalos en el orden que creas correcto.</p>
      <div className="space-y-2">
        {itemsBarajados.map((item, indice) => {
          const posicionElegida = elegidos.indexOf(indice);
          const elegido = posicionElegida !== -1;
          return (
            <button
              key={indice}
              type="button"
              onClick={() => elegir(indice)}
              disabled={elegido}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-semibold transition-colors',
                elegido ? 'border-brand-400 bg-brand-50 text-brand-700 opacity-70' : 'border-border bg-surface hover:border-brand-300'
              )}
            >
              {elegido && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-black text-white">
                  {posicionElegida + 1}
                </span>
              )}
              {item.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
