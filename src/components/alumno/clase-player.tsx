'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameRenderer } from '@/components/games/game-renderer';
import { TextoResaltable } from '@/components/texto-resaltable';
import { registrarRespuestaAction, finalizarSesionAction } from '@/app/clase/sesion/[sessionId]/actions';

const TEXTO_SECCION: Record<string, { titulo: string; icono: string }> = {
  introduction: { titulo: 'Introducción', icono: '👋' },
  evaluation: { titulo: 'Para repasar', icono: '📝' },
};

type Seccion = { id: string; section_type: string; content: unknown; title: string; position: number };
type Actividad = { id: string; lesson_section_id: string | null; title: string; game_template_id: string; config: unknown; max_score: number; position: number };

type PasoTexto = { tipo: 'texto'; key: string; icono: string; titulo: string; texto: string; imagenUrl?: string; extraLabel?: string; extra?: string };
type PasoJuego = { tipo: 'juego'; key: string; actividad: Actividad };

export function ClasePlayer({ sessionId, secciones, actividades }: { sessionId: string; secciones: Seccion[]; actividades: Actividad[] }) {
  const router = useRouter();
  const pasos: (PasoTexto | PasoJuego)[] = [];

  for (const seccion of [...secciones].sort((a, b) => a.position - b.position)) {
    if (seccion.section_type in TEXTO_SECCION) {
      const contenido = seccion.content as { text?: string; image_url?: string } | null;
      const texto = contenido?.text ?? '';
      if (!texto) continue;
      pasos.push({ tipo: 'texto', key: seccion.id, ...TEXTO_SECCION[seccion.section_type], texto, imagenUrl: contenido?.image_url });
    } else if (seccion.section_type === 'tema') {
      const contenido = seccion.content as { theory?: string; examples?: string; image_url?: string } | null;
      if (!contenido?.theory) continue;
      pasos.push({
        tipo: 'texto',
        key: seccion.id,
        icono: '📖',
        titulo: seccion.title,
        texto: contenido.theory,
        imagenUrl: contenido.image_url,
        extraLabel: '💡 Ejemplos',
        extra: contenido.examples,
      });
    } else if (seccion.section_type === 'activity' || seccion.section_type === 'final_challenge') {
      const actividadesDeLaSeccion = actividades.filter((a) => a.lesson_section_id === seccion.id).sort((a, b) => a.position - b.position);
      for (const actividad of actividadesDeLaSeccion) {
        pasos.push({ tipo: 'juego', key: actividad.id, actividad });
      }
    }
  }

  const [indice, setIndice] = useState(0);
  const [finalizando, setFinalizando] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<number | null>(null);
  const pendientesRef = useRef<Promise<unknown>[]>([]);
  const inicioPasoRef = useRef<number | null>(null);
  const maxScoreTotal = actividades.reduce((acc, a) => acc + a.max_score, 0);

  useEffect(() => {
    inicioPasoRef.current = Date.now();
  }, [indice]);

  async function avanzar() {
    if (indice + 1 >= pasos.length) {
      setFinalizando(true);
      await Promise.all(pendientesRef.current);
      const resultado = await finalizarSesionAction(sessionId);
      setResultadoFinal(resultado.totalScore ?? 0);
      setFinalizando(false);
    } else {
      setIndice(indice + 1);
    }
  }

  function manejarTerminoJuego(actividadId: string, puntaje: number, total: number) {
    const duracion = inicioPasoRef.current !== null ? Math.round((Date.now() - inicioPasoRef.current) / 1000) : undefined;
    pendientesRef.current.push(registrarRespuestaAction(sessionId, actividadId, puntaje, total, duracion));
    avanzar();
  }

  if (pasos.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-foreground/60">Esta clase todavía no tiene contenido para jugar.</p>
      </Card>
    );
  }

  if (resultadoFinal !== null) {
    const porcentaje = maxScoreTotal > 0 ? Math.round((resultadoFinal / maxScoreTotal) * 100) : 0;
    const emoji = porcentaje >= 80 ? '🏆' : porcentaje >= 50 ? '🎉' : '💪';

    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-6xl">{emoji}</span>
        <h2 className="text-2xl font-black">¡Clase terminada!</h2>
        <p className="text-4xl font-black text-brand-600">
          {resultadoFinal}/{maxScoreTotal}
        </p>
        <p className="text-foreground/60">{porcentaje}% de puntaje total.</p>
        <Button variant="outline" onClick={() => router.push('/clase')} className="mt-2">
          Entrar a otra clase
        </Button>
      </Card>
    );
  }

  if (finalizando) {
    return (
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="text-foreground/60">Guardando tus resultados...</p>
      </Card>
    );
  }

  const paso = pasos[indice];

  return (
    <div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(indice / pasos.length) * 100}%` }} />
      </div>

      {paso.tipo === 'texto' ? (
        <Card key={paso.key}>
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold">
            <span>{paso.icono}</span>
            {paso.titulo}
          </h2>
          {paso.imagenUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={paso.imagenUrl} alt="" className="mb-3 max-h-64 w-full rounded-xl border border-border object-contain" />
          )}
          <TextoResaltable texto={paso.texto} storageKey={`${paso.key}-texto`} className="whitespace-pre-line text-foreground/80" />
          {paso.extra && (
            <>
              <p className="mt-4 mb-1 text-xs font-bold text-foreground/50">{paso.extraLabel}</p>
              <TextoResaltable texto={paso.extra} storageKey={`${paso.key}-extra`} className="whitespace-pre-line text-foreground/80" />
            </>
          )}
          <Button className="mt-6" onClick={avanzar}>
            Siguiente →
          </Button>
        </Card>
      ) : (
        <div key={paso.key}>
          <GameRenderer
            gameTemplateId={paso.actividad.game_template_id}
            title={paso.actividad.title}
            config={paso.actividad.config}
            onTerminar={(puntaje, total) => manejarTerminoJuego(paso.actividad.id, puntaje, total)}
          />
          <button type="button" onClick={avanzar} className="mt-3 text-sm font-semibold text-foreground/50 hover:text-foreground/80 hover:underline">
            Saltar esta actividad →
          </button>
        </div>
      )}
    </div>
  );
}
