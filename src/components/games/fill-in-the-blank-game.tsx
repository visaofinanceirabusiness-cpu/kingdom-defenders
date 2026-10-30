'use client';

import { useState } from 'react';
import { GameShell } from './game-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { GameConfigFor } from '@/lib/games/schemas';

export function FillInTheBlankGame({
  config,
  title,
  onTerminar,
}: {
  config: GameConfigFor<'fill_in_the_blank'>;
  title: string;
  onTerminar?: (puntaje: number, total: number) => void;
}) {
  return (
    <GameShell
      icon="✏️"
      title={title}
      instructions={`Completá el espacio en blanco en cada una de las ${config.items.length} consigna${config.items.length === 1 ? '' : 's'}.`}
      totalPreguntas={config.items.length}
      onTerminar={onTerminar}
    >
      {({ onRespuesta, indice }) => <Item key={indice} item={config.items[indice]} onRespuesta={onRespuesta} />}
    </GameShell>
  );
}

function Item({
  item,
  onRespuesta,
}: {
  item: GameConfigFor<'fill_in_the_blank'>['items'][number];
  onRespuesta: (correcta: boolean) => void;
}) {
  const [valor, setValor] = useState('');
  const [enviado, setEnviado] = useState(false);
  const esCorrecta = valor.trim().toLowerCase() === item.correct_answer.trim().toLowerCase();

  function enviar() {
    if (enviado || !valor.trim()) return;
    setEnviado(true);
    setTimeout(() => onRespuesta(esCorrecta), 1300);
  }

  const partes = item.text_with_blank.split('___');

  return (
    <div>
      {item.image_url && (
        <img src={item.image_url} alt="" className="mb-4 max-h-56 w-full rounded-xl border border-border object-contain" />
      )}
      <p className="mb-4 text-lg font-bold">
        {partes[0]}
        <span className="mx-1 inline-block min-w-24 border-b-2 border-brand-400 text-center text-brand-700">
          {enviado ? item.correct_answer : '______'}
        </span>
        {partes[1]}
      </p>

      {!enviado ? (
        <div className="flex gap-3">
          <Input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviar()}
            placeholder="Tu respuesta..."
            autoFocus
          />
          <Button onClick={enviar} disabled={!valor.trim()}>
            Responder
          </Button>
        </div>
      ) : (
        <p className={cn('text-sm font-bold', esCorrecta ? 'text-success-600' : 'text-red-600')}>
          {esCorrecta ? '✅ ¡Correcto!' : `❌ Tu respuesta: "${valor}"`}
        </p>
      )}
    </div>
  );
}
