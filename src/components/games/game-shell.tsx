'use client';

// Cáscara visual compartida por los 3 juegos implementados — cubre
// las partes que pide el spec para CUALQUIER juego (pantalla de
// introducción, mecánica, puntuación, resultado final), así cada
// juego nuevo solo tiene que implementar su "mecánica" (el medio),
// no reinventar el marco.
import { type ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type GameShellProps = {
  icon: string;
  title: string;
  instructions: string;
  totalPreguntas: number;
  children: (ctx: { onRespuesta: (correcta: boolean) => void; indice: number }) => ReactNode;
  onTerminar?: (puntaje: number, total: number) => void;
};

export function GameShell({ icon, title, instructions, totalPreguntas, children, onTerminar }: GameShellProps) {
  const [etapa, setEtapa] = useState<'intro' | 'jugando' | 'resultado'>('intro');
  const [indice, setIndice] = useState(0);
  const [puntaje, setPuntaje] = useState(0);

  function manejarRespuesta(correcta: boolean) {
    const nuevoPuntaje = correcta ? puntaje + 1 : puntaje;
    setPuntaje(nuevoPuntaje);

    if (indice + 1 >= totalPreguntas) {
      setEtapa('resultado');
      onTerminar?.(nuevoPuntaje, totalPreguntas);
    } else {
      setIndice(indice + 1);
    }
  }

  if (etapa === 'intro') {
    return (
      <Card className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="text-5xl">{icon}</span>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="max-w-md text-foreground/60">{instructions}</p>
        <Button size="lg" onClick={() => setEtapa('jugando')}>
          ¡Empezar! 🚀
        </Button>
      </Card>
    );
  }

  if (etapa === 'resultado') {
    const porcentaje = totalPreguntas > 0 ? Math.round((puntaje / totalPreguntas) * 100) : 0;
    const emoji = porcentaje >= 80 ? '🏆' : porcentaje >= 50 ? '🎉' : '💪';

    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-5xl">{emoji}</span>
        <h2 className="text-2xl font-black">¡Listo!</h2>
        <p className="text-4xl font-black text-brand-600">
          {puntaje}/{totalPreguntas}
        </p>
        <p className="text-foreground/60">{porcentaje}% de respuestas correctas.</p>
        <Button variant="outline" onClick={() => { setEtapa('intro'); setIndice(0); setPuntaje(0); }}>
          Jugar de nuevo
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-foreground/50">
          {indice + 1} / {totalPreguntas}
        </span>
        <span className="text-sm font-bold text-success-600">⭐ {puntaje}</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${(indice / totalPreguntas) * 100}%` }}
        />
      </div>
      {children({ onRespuesta: manejarRespuesta, indice })}
    </Card>
  );
}
