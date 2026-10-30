'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GameConfigFor } from '@/lib/games/schemas';

type Carta = { id: string; pairIndex: number; label: string };

function barajar<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function MemoryMatchGame({
  config,
  title,
  onTerminar,
}: {
  config: GameConfigFor<'memory_match'>;
  title: string;
  onTerminar?: (puntaje: number, total: number) => void;
}) {
  const [etapa, setEtapa] = useState<'intro' | 'jugando' | 'resultado'>('intro');
  const cartas = useMemo<Carta[]>(
    () => barajar(config.pairs.flatMap((p, i) => [{ id: `${i}-a`, pairIndex: i, label: p.a }, { id: `${i}-b`, pairIndex: i, label: p.b }])),
    [config.pairs]
  );
  const [volteadas, setVolteadas] = useState<string[]>([]);
  const [resueltas, setResueltas] = useState<Set<number>>(new Set());
  const [bloqueado, setBloqueado] = useState(false);

  function elegir(carta: Carta) {
    if (bloqueado || volteadas.includes(carta.id) || resueltas.has(carta.pairIndex)) return;

    const nuevas = [...volteadas, carta.id];
    setVolteadas(nuevas);

    if (nuevas.length === 2) {
      setBloqueado(true);
      const a = cartas.find((c) => c.id === nuevas[0])!;
      const b = cartas.find((c) => c.id === nuevas[1])!;

      if (a.pairIndex === b.pairIndex) {
        const nuevasResueltas = new Set(resueltas);
        nuevasResueltas.add(a.pairIndex);
        setTimeout(() => {
          setResueltas(nuevasResueltas);
          setVolteadas([]);
          setBloqueado(false);
          if (nuevasResueltas.size === config.pairs.length) {
            setEtapa('resultado');
            onTerminar?.(nuevasResueltas.size, config.pairs.length);
          }
        }, 600);
      } else {
        setTimeout(() => {
          setVolteadas([]);
          setBloqueado(false);
        }, 900);
      }
    }
  }

  if (etapa === 'intro') {
    return (
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="text-5xl">🃏</span>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="max-w-md text-foreground/60">Encontrá las {config.pairs.length} parejas que van juntas.</p>
        <Button size="lg" onClick={() => setEtapa('jugando')}>
          ¡Empezar! 🚀
        </Button>
      </Card>
    );
  }

  if (etapa === 'resultado') {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-5xl">🏆</span>
        <h2 className="text-2xl font-black">¡Listo!</h2>
        <p className="text-4xl font-black text-brand-600">
          {resueltas.size}/{config.pairs.length}
        </p>
        <p className="text-foreground/60">Parejas encontradas.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 text-center text-sm font-bold text-foreground/50">
        {resueltas.size}/{config.pairs.length} parejas encontradas
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {cartas.map((carta) => {
          const visible = volteadas.includes(carta.id) || resueltas.has(carta.pairIndex);
          return (
            <button
              key={carta.id}
              type="button"
              onClick={() => elegir(carta)}
              disabled={visible}
              className={cn(
                'flex h-20 items-center justify-center rounded-xl border-2 px-2 text-center text-sm font-bold transition-all',
                visible
                  ? resueltas.has(carta.pairIndex)
                    ? 'border-success-500 bg-success-500/10 text-success-600'
                    : 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-border bg-surface-muted text-transparent hover:border-brand-300'
              )}
            >
              {visible ? carta.label : '?'}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
