'use client';

// Franja de "quién está conectado ahora" arriba de una clase en vivo
// — usa Presence de Supabase Realtime (no IPs: cada uno se identifica
// con su nombre al entrar, que es justamente lo que pidió el
// usuario). Es un canal propio (presencia:<roomId>), separado del de
// la pizarra, porque tiene que reflejar quién está viendo la clase
// aunque todavía no haya abierto el pizarrón.
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { colorPorNombre } from '@/lib/color-por-nombre';

type Persona = { nombre: string; rol: 'docente' | 'alumno' };
type Conectado = Persona & { key: string };

export function PresenciaClase({ roomId, nombre, rol }: { roomId: string; nombre: string; rol: 'docente' | 'alumno' }) {
  const [conectados, setConectados] = useState<Conectado[]>([]);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const canal = supabase.channel(`presencia:${roomId}`, { config: { presence: { key: `${rol}-${nombre}-${Math.random().toString(36).slice(2, 7)}` } } });

    canal
      .on('presence', { event: 'sync' }, () => {
        const estado = canal.presenceState<Persona>();
        const lista: Conectado[] = Object.entries(estado).map(([key, presencias]) => ({ key, ...presencias[0] }));
        setConectados(lista);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await canal.track({ nombre, rol } satisfies Persona);
        }
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [roomId, nombre, rol, supabase]);

  if (conectados.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
      <span className="flex items-center gap-1.5 text-xs font-bold text-foreground/60">
        <span className="h-2 w-2 rounded-full bg-success-500" />
        En vivo ahora
      </span>
      {conectados.map((p) => (
        <span
          key={p.key}
          title={`${p.nombre} (${p.rol === 'docente' ? 'docente' : 'alumno'})`}
          className={cn(
            'flex items-center gap-1 rounded-full py-1 pl-1 pr-2.5 text-xs font-semibold text-white'
          )}
          style={{ backgroundColor: colorPorNombre(p.nombre) }}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs">
            {p.rol === 'docente' ? '🧑‍🏫' : '🧑‍🎓'}
          </span>
          {p.nombre}
        </span>
      ))}
    </div>
  );
}
