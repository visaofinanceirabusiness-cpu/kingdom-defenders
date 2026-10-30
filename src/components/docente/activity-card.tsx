'use client';

import { useState } from 'react';
import { deleteActivityAction } from '@/app/docente/clases/[id]/editor-actions';
import { GameRenderer } from '@/components/games/game-renderer';
import { GAME_DEFINITIONS, isValidGameType } from '@/lib/games/registry';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ActivityCard({
  lessonId,
  activity,
}: {
  lessonId: string;
  activity: { id: string; title: string; game_template_id: string; config: unknown };
}) {
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const definicion = isValidGameType(activity.game_template_id) ? GAME_DEFINITIONS[activity.game_template_id] : null;

  async function eliminar() {
    if (!window.confirm(`¿Eliminar la actividad "${activity.title}"?`)) return;
    setEliminando(true);
    await deleteActivityAction(lessonId, activity.id);
    // revalidatePath (dentro de la action) refresca la lista — no hace
    // falta tocar estado local acá, el Server Component vuelve a
    // renderizar sin esta actividad.
  }

  return (
    <Card className={eliminando ? 'opacity-40' : undefined}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{definicion?.icon ?? '🎮'}</span>
          <div>
            <p className="font-bold">{activity.title}</p>
            <Badge tone="brand">{definicion?.label ?? activity.game_template_id}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarPreview((m) => !m)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            {mostrarPreview ? 'Ocultar' : 'Vista previa'}
          </button>
          <button
            type="button"
            onClick={eliminar}
            disabled={eliminando}
            className="rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            🗑️
          </button>
        </div>
      </div>

      {mostrarPreview && (
        <div className="mt-4">
          <GameRenderer gameTemplateId={activity.game_template_id} title={activity.title} config={activity.config} />
        </div>
      )}
    </Card>
  );
}
