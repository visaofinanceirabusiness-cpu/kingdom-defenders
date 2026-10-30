'use client';

// Resaltador tipo "flúor" sobre el texto de una clase — pensado para
// que la profe le destaque al alumno qué es importante (o al revés),
// en vivo, durante la clase. Por eso se sincroniza igual que la
// pizarra: un canal de broadcast de Supabase Realtime por párrafo
// (no se guarda en la base — si el alumno entra solo más tarde, no
// ve nada resaltado, a propósito, pedido así por el usuario).
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Rango = { inicio: number; fin: number };

const COLOR_RESALTADO = 'rgba(253, 224, 71, 0.6)';

// Cuenta caracteres desde el inicio del contenedor hasta un punto de
// la selección — más confiable que indexOf(texto) porque no se
// confunde si la misma palabra aparece dos veces.
function offsetDesdeRange(contenedor: Node, nodo: Node, offsetEnNodo: number): number {
  const preRange = document.createRange();
  preRange.selectNodeContents(contenedor);
  preRange.setEnd(nodo, offsetEnNodo);
  return preRange.toString().length;
}

function fusionarRangos(rangos: Rango[]): Rango[] {
  const ordenados = [...rangos].sort((a, b) => a.inicio - b.inicio);
  const resultado: Rango[] = [];
  for (const r of ordenados) {
    const ultimo = resultado[resultado.length - 1];
    if (ultimo && r.inicio <= ultimo.fin) {
      ultimo.fin = Math.max(ultimo.fin, r.fin);
    } else {
      resultado.push({ ...r });
    }
  }
  return resultado;
}

export function TextoResaltable({ texto, storageKey, roomId, className }: { texto: string; storageKey: string; roomId: string; className?: string }) {
  const [rangos, setRangos] = useState<Rango[]>([]);
  const contenedorRef = useRef<HTMLParagraphElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const canalRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const rangosRef = useRef<Rango[]>([]);
  useEffect(() => {
    rangosRef.current = rangos;
  }, [rangos]);

  // Un canal por párrafo (no uno por clase entera) para no mandar de
  // más: cada párrafo sincroniza solo sus propios rangos.
  useEffect(() => {
    const canal = supabase.channel(`resaltado:${roomId}:${storageKey}`, { config: { broadcast: { self: false } } });
    canalRef.current = canal;

    canal
      .on('broadcast', { event: 'estado' }, ({ payload }) => {
        setRangos(payload.rangos as Rango[]);
      })
      .on('broadcast', { event: 'pedir-estado' }, () => {
        canal.send({ type: 'broadcast', event: 'estado', payload: { rangos: rangosRef.current } });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          canal.send({ type: 'broadcast', event: 'pedir-estado', payload: {} });
        }
      });

    return () => {
      supabase.removeChannel(canal);
      canalRef.current = null;
    };
  }, [roomId, storageKey, supabase]);

  function enviarEstado(nuevosRangos: Rango[]) {
    canalRef.current?.send({ type: 'broadcast', event: 'estado', payload: { rangos: nuevosRangos } });
  }

  function manejarSeleccion() {
    const seleccion = window.getSelection();
    const contenedor = contenedorRef.current;
    if (!seleccion || seleccion.isCollapsed || !contenedor || seleccion.rangeCount === 0) return;

    const range = seleccion.getRangeAt(0);
    if (!contenedor.contains(range.startContainer) || !contenedor.contains(range.endContainer)) return;

    const inicio = offsetDesdeRange(contenedor, range.startContainer, range.startOffset);
    const fin = offsetDesdeRange(contenedor, range.endContainer, range.endOffset);
    seleccion.removeAllRanges();
    if (fin <= inicio) return;

    const nuevos = fusionarRangos([...rangos, { inicio, fin }]);
    setRangos(nuevos);
    enviarEstado(nuevos);
  }

  function quitarResaltado(objetivo: Rango) {
    const nuevos = rangos.filter((r) => r !== objetivo);
    setRangos(nuevos);
    enviarEstado(nuevos);
  }

  const partes: { texto: string; resaltado: Rango | null }[] = [];
  let cursor = 0;
  for (const r of rangos) {
    if (r.inicio > cursor) partes.push({ texto: texto.slice(cursor, r.inicio), resaltado: null });
    partes.push({ texto: texto.slice(r.inicio, r.fin), resaltado: r });
    cursor = r.fin;
  }
  if (cursor < texto.length) partes.push({ texto: texto.slice(cursor), resaltado: null });

  return (
    <p ref={contenedorRef} onMouseUp={manejarSeleccion} className={className}>
      {partes.map((parte, i) =>
        parte.resaltado ? (
          <mark
            key={i}
            onClick={() => quitarResaltado(parte.resaltado as Rango)}
            title="Tocar para quitar el resaltado"
            style={{ backgroundColor: COLOR_RESALTADO, cursor: 'pointer', borderRadius: '2px' }}
          >
            {parte.texto}
          </mark>
        ) : (
          <span key={i}>{parte.texto}</span>
        )
      )}
    </p>
  );
}
