'use client';

// Pizarra en vivo compartida entre docente y alumno dentro de una
// misma sesión — NO se guarda en la base (es un pizarrón de uso en el
// momento, no un archivo), se sincroniza en tiempo real con un canal
// de Supabase Realtime (broadcast, sin tablas) identificado por
// `roomId` (el id de la sesión). Cualquiera de los dos lados que
// tenga el estado actual se lo manda al otro apenas se conecta, así
// un recién llegado se pone al día.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { colorPorNombre } from '@/lib/color-por-nombre';

type CursorRemoto = { x: number; y: number; nombre: string; color: string; ts: number };

type Punto = { x: number; y: number };
type ElementoBase = { id: string; color: string };
type Trazo = ElementoBase & { tipo: 'trazo'; puntos: Punto[] };
type Linea = ElementoBase & { tipo: 'linea'; a: Punto; b: Punto };
type Forma = ElementoBase & { tipo: 'rectangulo' | 'elipse' | 'triangulo'; a: Punto; b: Punto };
type Angulo = ElementoBase & { tipo: 'angulo'; vertice: Punto; puntoA: Punto; puntoB: Punto };
type TextoElemento = ElementoBase & { tipo: 'texto'; punto: Punto; contenido: string };
type EmojiElemento = ElementoBase & { tipo: 'emoji'; punto: Punto; contenido: string };
type Elemento = Trazo | Linea | Forma | Angulo | TextoElemento | EmojiElemento;

type Fondo = 'blanco' | 'cuadriculado' | 'renglones';
type Herramienta = 'lapiz' | 'linea' | 'rectangulo' | 'elipse' | 'triangulo' | 'angulo' | 'texto' | 'emoji' | 'goma';

const TAMANO_TEXTO = 22;
const TAMANO_EMOJI = 36;
const EMOJIS = ['😀', '😂', '😮', '👏', '🎉', '❤️'];
const COLORES = ['#1f2937', '#dc2626', '#2563eb', '#16a34a', '#d97706'];
const FONDOS: Fondo[] = ['blanco', 'cuadriculado', 'renglones'];
const LABEL_FONDO: Record<Fondo, string> = { blanco: '⬜ Blanca', cuadriculado: '▦ Cuadriculada', renglones: '☰ Renglones' };
const LABEL_HERRAMIENTA: Record<Herramienta, string> = {
  lapiz: '✏️ Lápiz',
  linea: '📏 Línea',
  rectangulo: '▭ Rectángulo',
  elipse: '⬭ Círculo',
  triangulo: '🔺 Triángulo',
  angulo: '📐 Ángulo',
  texto: '🔤 Texto',
  emoji: '😊 Emoji',
  goma: '🧽 Borrar',
};

function distanciaPuntoSegmento(p: Punto, a: Punto, b: Punto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const largo2 = dx * dx + dy * dy;
  let t = largo2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / largo2;
  t = Math.max(0, Math.min(1, t));
  const proy = { x: a.x + t * dx, y: a.y + t * dy };
  return Math.hypot(p.x - proy.x, p.y - proy.y);
}

function distanciaAElemento(p: Punto, el: Elemento): number {
  if (el.tipo === 'trazo') {
    let min = Infinity;
    for (let i = 0; i < el.puntos.length - 1; i++) min = Math.min(min, distanciaPuntoSegmento(p, el.puntos[i], el.puntos[i + 1]));
    return el.puntos.length === 1 ? Math.hypot(p.x - el.puntos[0].x, p.y - el.puntos[0].y) : min;
  }
  if (el.tipo === 'linea') return distanciaPuntoSegmento(p, el.a, el.b);
  if (el.tipo === 'angulo') return Math.min(distanciaPuntoSegmento(p, el.vertice, el.puntoA), distanciaPuntoSegmento(p, el.vertice, el.puntoB));
  // Texto: distancia al punto de anclaje (esquina superior izquierda) — no medimos el ancho real sin el canvas acá, pero alcanza para "tocar cerca del texto para borrar".
  if (el.tipo === 'texto' || el.tipo === 'emoji') return Math.hypot(p.x - el.punto.x, p.y - el.punto.y);
  // Formas: distancia al contorno del rectángulo que las contiene — simple y suficiente para "tocar para borrar".
  const x1 = Math.min(el.a.x, el.b.x);
  const x2 = Math.max(el.a.x, el.b.x);
  const y1 = Math.min(el.a.y, el.b.y);
  const y2 = Math.max(el.a.y, el.b.y);
  const esquinas: [Punto, Punto][] = [
    [{ x: x1, y: y1 }, { x: x2, y: y1 }],
    [{ x: x2, y: y1 }, { x: x2, y: y2 }],
    [{ x: x2, y: y2 }, { x: x1, y: y2 }],
    [{ x: x1, y: y2 }, { x: x1, y: y1 }],
  ];
  return Math.min(...esquinas.map(([a, b]) => distanciaPuntoSegmento(p, a, b)));
}

function dibujarElemento(ctx: CanvasRenderingContext2D, el: Elemento, w: number, h: number) {
  ctx.strokeStyle = el.color;
  ctx.fillStyle = el.color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const px = (p: Punto) => ({ x: p.x * w, y: p.y * h });

  if (el.tipo === 'trazo') {
    if (el.puntos.length < 2) return;
    ctx.beginPath();
    const p0 = px(el.puntos[0]);
    ctx.moveTo(p0.x, p0.y);
    for (const punto of el.puntos.slice(1)) {
      const p = px(punto);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  } else if (el.tipo === 'linea') {
    const a = px(el.a);
    const b = px(el.b);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  } else if (el.tipo === 'rectangulo') {
    const a = px(el.a);
    const b = px(el.b);
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  } else if (el.tipo === 'elipse') {
    const a = px(el.a);
    const b = px(el.b);
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.abs(b.x - a.x) / 2, Math.abs(b.y - a.y) / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (el.tipo === 'triangulo') {
    const a = px(el.a);
    const b = px(el.b);
    ctx.beginPath();
    ctx.moveTo((a.x + b.x) / 2, a.y);
    ctx.lineTo(a.x, b.y);
    ctx.lineTo(b.x, b.y);
    ctx.closePath();
    ctx.stroke();
  } else if (el.tipo === 'angulo') {
    const v = px(el.vertice);
    const a = px(el.puntoA);
    const b = px(el.puntoB);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(v.x, v.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    const anguloA = Math.atan2(a.y - v.y, a.x - v.x);
    const anguloB = Math.atan2(b.y - v.y, b.x - v.x);
    let diff = ((anguloB - anguloA) * 180) / Math.PI;
    diff = ((diff % 360) + 360) % 360;
    const grados = Math.round(diff > 180 ? 360 - diff : diff);

    ctx.beginPath();
    ctx.arc(v.x, v.y, 26, anguloA, anguloB);
    ctx.stroke();

    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`${grados}°`, v.x + 32, v.y + 4);
  } else if (el.tipo === 'texto') {
    const p = px(el.punto);
    ctx.font = `${TAMANO_TEXTO}px sans-serif`;
    ctx.textBaseline = 'top';
    const lineHeight = TAMANO_TEXTO * 1.25;
    el.contenido.split('\n').forEach((linea, i) => ctx.fillText(linea, p.x, p.y + i * lineHeight));
  } else if (el.tipo === 'emoji') {
    const p = px(el.punto);
    ctx.font = `${TAMANO_EMOJI}px sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(el.contenido, p.x, p.y);
  }
}

export function PizarraFlotante({ roomId, nombre = 'Alguien' }: { roomId: string; nombre?: string }) {
  const [abierta, setAbierta] = useState(false);
  const [herramienta, setHerramienta] = useState<Herramienta>('lapiz');
  const [color, setColor] = useState(COLORES[0]);
  const [fondo, setFondo] = useState<Fondo>('blanco');
  const [elementos, setElementos] = useState<Elemento[]>([]);
  const [cursoresRemotos, setCursoresRemotos] = useState<Record<string, CursorRemoto>>({});
  const [textoEditando, setTextoEditando] = useState<{ punto: Punto; valor: string } | null>(null);
  const [emojiSeleccionado, setEmojiSeleccionado] = useState(EMOJIS[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const confirmandoTextoRef = useRef(false);
  const supabase = useMemo(() => createClient(), []);
  const canalRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const peerIdRef = useRef(crypto.randomUUID());
  const ultimoEnvioCursorRef = useRef(0);

  const dibujandoRef = useRef(false);
  const trazoActualRef = useRef<Trazo | null>(null);
  const inicioFormaRef = useRef<Punto | null>(null);
  const previewRef = useRef<Elemento | null>(null);
  const anguloPasoRef = useRef<0 | 1 | 2>(0);
  const anguloVerticeRef = useRef<Punto | null>(null);
  const anguloPuntoARef = useRef<Punto | null>(null);

  const redibujar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    for (const el of elementos) dibujarElemento(ctx, el, w, h);
    if (previewRef.current) dibujarElemento(ctx, previewRef.current, w, h);
  }, [elementos]);

  useEffect(() => {
    redibujar();
  }, [redibujar]);

  // Mantiene la resolución interna del canvas igual a su tamaño real
  // en pantalla, para que el dibujo no se vea estirado.
  useEffect(() => {
    const canvas = canvasRef.current;
    const contenedor = contenedorRef.current;
    if (!canvas || !contenedor) return;

    const observer = new ResizeObserver(() => {
      canvas.width = contenedor.clientWidth;
      canvas.height = contenedor.clientHeight;
      redibujar();
    });
    observer.observe(contenedor);
    return () => observer.disconnect();
  }, [redibujar, abierta]);

  // Canal de Realtime — se une apenas se abre la pizarra (no antes,
  // para no gastar una conexión por cada alumno que ni siquiera la
  // usó) y pide el estado actual al otro lado.
  useEffect(() => {
    if (!abierta) return;

    const canal = supabase.channel(`pizarra:${roomId}`, { config: { broadcast: { self: false } } });
    canalRef.current = canal;

    canal
      .on('broadcast', { event: 'estado' }, ({ payload }) => {
        setElementos(payload.elementos as Elemento[]);
        setFondo(payload.fondo as Fondo);
      })
      .on('broadcast', { event: 'pedir-estado' }, () => {
        canal.send({ type: 'broadcast', event: 'estado', payload: { elementos, fondo } });
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        setCursoresRemotos((prev) => ({ ...prev, [payload.peerId]: { x: payload.x, y: payload.y, nombre: payload.nombre, color: payload.color, ts: Date.now() } }));
      })
      .on('broadcast', { event: 'cursor-fuera' }, ({ payload }) => {
        setCursoresRemotos((prev) => Object.fromEntries(Object.entries(prev).filter(([peerId]) => peerId !== payload.peerId)));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          canal.send({ type: 'broadcast', event: 'pedir-estado', payload: {} });
        }
      });

    // Cursores ajenos que no mandaron nada en más de 3s (se les cerró
    // la pestaña sin que llegáramos a recibir el "cursor-fuera") se
    // dan de baja solos, para no dejar un puntero fantasma clavado.
    const limpieza = setInterval(() => {
      setCursoresRemotos((prev) => {
        const ahora = Date.now();
        const vivos = Object.fromEntries(Object.entries(prev).filter(([, c]) => ahora - c.ts < 3000));
        return Object.keys(vivos).length === Object.keys(prev).length ? prev : vivos;
      });
    }, 1000);

    return () => {
      clearInterval(limpieza);
      supabase.removeChannel(canal);
      canalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- se re-suscribe solo con abierta/roomId; mandar elementos/fondo actualizados se maneja abajo con enviarEstado.
  }, [abierta, roomId, supabase]);

  function enviarEstado(nuevosElementos: Elemento[], nuevoFondo: Fondo) {
    canalRef.current?.send({ type: 'broadcast', event: 'estado', payload: { elementos: nuevosElementos, fondo: nuevoFondo } });
  }

  function puntoDesdeEvento(e: React.PointerEvent<HTMLCanvasElement>): Punto {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height };
  }

  function manejarPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = puntoDesdeEvento(e);

    if (herramienta === 'goma') {
      const idx = elementos.findIndex((el) => distanciaAElemento(p, el) < 0.025);
      if (idx !== -1) {
        const nuevos = elementos.filter((_, i) => i !== idx);
        setElementos(nuevos);
        enviarEstado(nuevos, fondo);
      }
      return;
    }

    if (herramienta === 'texto') {
      // El canvas no es un elemento "enfocable" — sin esto, el propio
      // navegador le devuelve el foco al body apenas se crea el
      // textarea (reacción por defecto al mousedown sobre algo no
      // enfocable), y el blur dispara confirmarTexto antes de que el
      // usuario llegue a escribir nada.
      e.preventDefault();
      confirmandoTextoRef.current = false;
      setTextoEditando({ punto: p, valor: '' });
      return;
    }

    if (herramienta === 'emoji') {
      const nuevo: EmojiElemento = { id: crypto.randomUUID(), tipo: 'emoji', color, punto: p, contenido: emojiSeleccionado };
      const nuevos = [...elementos, nuevo];
      setElementos(nuevos);
      enviarEstado(nuevos, fondo);
      return;
    }

    if (herramienta === 'angulo') {
      if (anguloPasoRef.current === 0) {
        anguloVerticeRef.current = p;
        anguloPasoRef.current = 1;
      } else if (anguloPasoRef.current === 1) {
        anguloPuntoARef.current = p;
        anguloPasoRef.current = 2;
      } else {
        const nuevo: Angulo = { id: crypto.randomUUID(), tipo: 'angulo', color, vertice: anguloVerticeRef.current!, puntoA: anguloPuntoARef.current!, puntoB: p };
        const nuevos = [...elementos, nuevo];
        setElementos(nuevos);
        enviarEstado(nuevos, fondo);
        anguloPasoRef.current = 0;
        previewRef.current = null;
      }
      return;
    }

    dibujandoRef.current = true;

    if (herramienta === 'lapiz') {
      trazoActualRef.current = { id: crypto.randomUUID(), tipo: 'trazo', color, puntos: [p] };
      previewRef.current = trazoActualRef.current;
    } else {
      inicioFormaRef.current = p;
    }
  }

  function manejarPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = puntoDesdeEvento(e);

    const ahora = Date.now();
    if (ahora - ultimoEnvioCursorRef.current > 50) {
      ultimoEnvioCursorRef.current = ahora;
      canalRef.current?.send({
        type: 'broadcast',
        event: 'cursor',
        payload: { peerId: peerIdRef.current, x: p.x, y: p.y, nombre, color: colorPorNombre(nombre) },
      });
    }

    if (herramienta === 'angulo' && anguloPasoRef.current > 0) {
      if (anguloPasoRef.current === 1) {
        previewRef.current = { id: 'preview', tipo: 'linea', color, a: anguloVerticeRef.current!, b: p };
      } else {
        previewRef.current = { id: 'preview', tipo: 'angulo', color, vertice: anguloVerticeRef.current!, puntoA: anguloPuntoARef.current!, puntoB: p };
      }
      redibujar();
      return;
    }

    if (!dibujandoRef.current) return;

    if (herramienta === 'lapiz' && trazoActualRef.current) {
      trazoActualRef.current.puntos.push(p);
      previewRef.current = trazoActualRef.current;
    } else if (inicioFormaRef.current && (herramienta === 'linea' || herramienta === 'rectangulo' || herramienta === 'elipse' || herramienta === 'triangulo')) {
      previewRef.current = { id: 'preview', tipo: herramienta, color, a: inicioFormaRef.current, b: p };
    }
    redibujar();
  }

  function manejarCursorFuera() {
    canalRef.current?.send({ type: 'broadcast', event: 'cursor-fuera', payload: { peerId: peerIdRef.current } });
    manejarPointerUp();
  }

  function manejarPointerUp() {
    if (!dibujandoRef.current) return;
    dibujandoRef.current = false;

    let nuevo: Elemento | null = null;
    if (herramienta === 'lapiz' && trazoActualRef.current && trazoActualRef.current.puntos.length > 1) {
      nuevo = trazoActualRef.current;
    } else if (previewRef.current && previewRef.current.id === 'preview') {
      nuevo = { ...previewRef.current, id: crypto.randomUUID() };
    }

    trazoActualRef.current = null;
    inicioFormaRef.current = null;
    previewRef.current = null;

    if (nuevo) {
      const nuevos = [...elementos, nuevo];
      setElementos(nuevos);
      enviarEstado(nuevos, fondo);
    } else {
      redibujar();
    }
  }

  // Se llama tanto desde Enter como desde el blur del textarea al
  // desmontarse — confirmandoTextoRef evita que, si las dos
  // dispararan para la misma edición, se duplique el texto.
  function confirmarTexto() {
    if (confirmandoTextoRef.current) return;
    confirmandoTextoRef.current = true;

    if (textoEditando && textoEditando.valor.trim()) {
      const nuevo: TextoElemento = { id: crypto.randomUUID(), tipo: 'texto', color, punto: textoEditando.punto, contenido: textoEditando.valor };
      const nuevos = [...elementos, nuevo];
      setElementos(nuevos);
      enviarEstado(nuevos, fondo);
    }
    setTextoEditando(null);
  }

  function cancelarTexto() {
    confirmandoTextoRef.current = true;
    setTextoEditando(null);
  }

  function limpiarTodo() {
    if (!window.confirm('¿Borrar todo el contenido de la pizarra?')) return;
    setElementos([]);
    enviarEstado([], fondo);
  }

  function cambiarFondo() {
    const siguiente = FONDOS[(FONDOS.indexOf(fondo) + 1) % FONDOS.length];
    setFondo(siguiente);
    enviarEstado(elementos, siguiente);
  }

  const fondoStyle: Record<Fondo, React.CSSProperties> = {
    blanco: { backgroundColor: '#ffffff' },
    cuadriculado: {
      backgroundColor: '#ffffff',
      backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    },
    renglones: {
      backgroundColor: '#ffffff',
      backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)',
      backgroundSize: '100% 28px',
    },
  };

  if (!abierta) {
    return (
      <button
        type="button"
        onClick={() => setAbierta(true)}
        title="Abrir pizarra"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-brand-600 py-3 pl-3 pr-4 text-white shadow-xl shadow-brand-600/30 transition-transform hover:scale-105"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xl">🖊️</span>
        <span className="text-sm font-bold">Pizarra</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex w-[min(92vw,720px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-muted px-3 py-2">
        <span className="text-sm font-bold text-foreground/70">🖊️ Pizarra en vivo</span>
        <button type="button" onClick={() => setAbierta(false)} className="rounded-lg px-2 py-1 text-sm font-semibold text-foreground/60 hover:bg-surface">
          — Minimizar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-3 py-2">
        {(Object.keys(LABEL_HERRAMIENTA) as Herramienta[]).map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => {
              setHerramienta(h);
              anguloPasoRef.current = 0;
              previewRef.current = null;
              redibujar();
            }}
            className={cn(
              'rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
              herramienta === h ? 'bg-brand-600 text-white' : 'bg-surface-muted text-foreground/70 hover:bg-brand-50'
            )}
          >
            {LABEL_HERRAMIENTA[h]}
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-border" />
        {COLORES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            title={c}
            className={cn('h-6 w-6 rounded-full border-2', color === c ? 'border-foreground' : 'border-transparent')}
            style={{ backgroundColor: c }}
          />
        ))}
        {herramienta === 'emoji' && (
          <>
            <div className="mx-1 h-5 w-px bg-border" />
            {EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmojiSeleccionado(em)}
                title={em}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg text-lg',
                  emojiSeleccionado === em ? 'bg-brand-600/20 ring-2 ring-brand-600' : 'hover:bg-surface-muted'
                )}
              >
                {em}
              </button>
            ))}
          </>
        )}
        <div className="mx-1 h-5 w-px bg-border" />
        <button type="button" onClick={cambiarFondo} className="rounded-lg bg-surface-muted px-2 py-1 text-xs font-semibold text-foreground/70 hover:bg-brand-50">
          {LABEL_FONDO[fondo]}
        </button>
        <button type="button" onClick={limpiarTodo} className="rounded-lg bg-surface-muted px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
          🗑️ Borrar todo
        </button>
      </div>

      <div ref={contenedorRef} className="relative h-[min(60vh,440px)] w-full touch-none" style={fondoStyle[fondo]}>
        <canvas
          ref={canvasRef}
          className="h-full w-full cursor-crosshair"
          onPointerDown={manejarPointerDown}
          onPointerMove={manejarPointerMove}
          onPointerUp={manejarPointerUp}
          onPointerLeave={manejarCursorFuera}
        />
        {Object.entries(cursoresRemotos).map(([peerId, c]) => (
          <div
            key={peerId}
            className="pointer-events-none absolute z-10 -translate-x-1 -translate-y-1"
            style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
          >
            <span className="block text-lg leading-none" style={{ color: c.color }}>
              🖱️
            </span>
            <span
              className="ml-3 -mt-1 inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.nombre}
            </span>
          </div>
        ))}
        {textoEditando && (
          <textarea
            ref={textareaRef}
            autoFocus
            value={textoEditando.valor}
            onChange={(e) => setTextoEditando({ ...textoEditando, valor: e.target.value })}
            onBlur={confirmarTexto}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancelarTexto();
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                confirmarTexto();
              }
            }}
            placeholder="Escribí y tocá fuera (o Enter) para confirmar"
            rows={1}
            className="absolute z-20 min-w-[140px] resize rounded border-2 border-brand-500 bg-white px-1.5 py-1 leading-tight shadow-lg outline-none"
            style={{ left: `${textoEditando.punto.x * 100}%`, top: `${textoEditando.punto.y * 100}%`, color, fontSize: TAMANO_TEXTO }}
          />
        )}
      </div>
    </div>
  );
}
