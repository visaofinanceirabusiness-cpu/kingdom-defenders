'use client';

// GameRenderer — único punto que decide qué componente de juego usar
// para una actividad, según su game_template_id. Nada más en el
// resto de la app debería tener un switch sobre esto (ver
// RENDERABLE_GAME_TYPE_IDS en lib/games/registry.ts).
import { TriviaGame } from './trivia-game';
import { TrueOrFalseGame } from './true-or-false-game';
import { FillInTheBlankGame } from './fill-in-the-blank-game';
import { MemoryMatchGame } from './memory-match-game';
import { OrderGame } from './order-game';
import {
  triviaConfigSchema,
  trueOrFalseConfigSchema,
  fillInTheBlankConfigSchema,
  memoryMatchConfigSchema,
  orderConfigSchema,
} from '@/lib/games/schemas';

export function GameRenderer({
  gameTemplateId,
  title,
  config,
  onTerminar,
}: {
  gameTemplateId: string;
  title: string;
  config: unknown;
  onTerminar?: (puntaje: number, total: number) => void;
}) {
  switch (gameTemplateId) {
    case 'trivia': {
      const parsed = triviaConfigSchema.safeParse(config);
      if (!parsed.success) return <ConfigInvalida mensaje={parsed.error.message} />;
      return <TriviaGame config={parsed.data} title={title} onTerminar={onTerminar} />;
    }
    case 'true_or_false': {
      const parsed = trueOrFalseConfigSchema.safeParse(config);
      if (!parsed.success) return <ConfigInvalida mensaje={parsed.error.message} />;
      return <TrueOrFalseGame config={parsed.data} title={title} onTerminar={onTerminar} />;
    }
    case 'fill_in_the_blank': {
      const parsed = fillInTheBlankConfigSchema.safeParse(config);
      if (!parsed.success) return <ConfigInvalida mensaje={parsed.error.message} />;
      return <FillInTheBlankGame config={parsed.data} title={title} onTerminar={onTerminar} />;
    }
    case 'memory_match': {
      const parsed = memoryMatchConfigSchema.safeParse(config);
      if (!parsed.success) return <ConfigInvalida mensaje={parsed.error.message} />;
      return <MemoryMatchGame config={parsed.data} title={title} onTerminar={onTerminar} />;
    }
    case 'order': {
      const parsed = orderConfigSchema.safeParse(config);
      if (!parsed.success) return <ConfigInvalida mensaje={parsed.error.message} />;
      return <OrderGame config={parsed.data} title={title} onTerminar={onTerminar} />;
    }
    default:
      return (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El juego &quot;{gameTemplateId}&quot; todavía no tiene un componente de render implementado — llega en una
          próxima fase.
        </div>
      );
  }
}

function ConfigInvalida({ mensaje }: { mensaje: string }) {
  return (
    <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
      Esta actividad tiene una configuración inválida y no se puede mostrar: {mensaje}
    </div>
  );
}
