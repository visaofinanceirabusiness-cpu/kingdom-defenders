'use client';

// Resaltador tipo "flúor" sobre el texto de una clase — cada uno
// marca lo que le sirve mientras lee, sin que haga falta ningún
// canal en vivo (a diferencia de la pizarra, esto es personal: lo
// que resalta el alumno no lo ve la profe y viceversa). Se guarda en
// localStorage de este navegador, por sección+campo, así sigue ahí
// la próxima vez que entre a la misma clase.
import { useEffect, useRef, useState } from 'react';

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

export function TextoResaltable({ texto, storageKey, className }: { texto: string; storageKey: string; className?: string }) {
  // Lectura inicial perezosa (no en un efecto) para no disparar un
  // segundo render apenas monta — storageKey es estable por cada
  // instancia (una por párrafo), así que alcanza con leer una vez.
  const [rangos, setRangos] = useState<Rango[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const guardado = localStorage.getItem(`resaltado:${storageKey}`);
      return guardado ? (JSON.parse(guardado) as Rango[]) : [];
    } catch {
      return [];
    }
  });
  const contenedorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(`resaltado:${storageKey}`, JSON.stringify(rangos));
    } catch {
      // Ventana privada o localStorage bloqueado — el resaltado dura solo la visita.
    }
  }, [rangos, storageKey]);

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

    setRangos((prev) => fusionarRangos([...prev, { inicio, fin }]));
  }

  function quitarResaltado(objetivo: Rango) {
    setRangos((prev) => prev.filter((r) => r !== objetivo));
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
