'use client';

import { useState, useTransition } from 'react';
import { generarVarianteAction, type NivelVariante } from '@/app/docente/biblioteca/actions';
import { Button } from '@/components/ui/button';

const NIVELES: { value: NivelVariante; label: string }[] = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export function GenerarVarianteButton({ lessonId }: { lessonId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [nivel, setNivel] = useState<NivelVariante>('intermedio');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generar() {
    setError(null);
    startTransition(async () => {
      const resultado = await generarVarianteAction(lessonId, nivel);
      // Si todo sale bien, la acción redirige (no vuelve acá). Solo
      // llegamos a leer `resultado` cuando falló.
      if (resultado && 'error' in resultado) {
        setError(resultado.error);
      }
    });
  }

  if (!abierto) {
    return (
      <Button size="sm" variant="outline" onClick={() => setAbierto(true)}>
        Crear variante por nivel
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={nivel}
        onChange={(e) => setNivel(e.target.value as NivelVariante)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
      >
        {NIVELES.map((n) => (
          <option key={n.value} value={n.value}>
            {n.label}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={generar} loading={pending}>
        Generar con IA
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
