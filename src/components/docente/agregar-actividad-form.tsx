'use client';

import { useState, useTransition } from 'react';
import { agregarActividadAction } from '@/app/docente/clases/[id]/construir/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { ImageUploadButton } from '@/components/docente/image-upload-button';
import type { GameTypeId } from '@/lib/games/schemas';

type Pregunta = { question: string; options: string[]; correct_answer: string; explanation: string; image_url: string };
type Afirmacion = { statement: string; is_true: boolean; explanation: string; image_url: string };
type Consigna = { text_with_blank: string; correct_answer: string; image_url: string };

const PREGUNTA_VACIA = (): Pregunta => ({ question: '', options: ['', ''], correct_answer: '', explanation: '', image_url: '' });
const AFIRMACION_VACIA = (): Afirmacion => ({ statement: '', is_true: true, explanation: '', image_url: '' });
const CONSIGNA_VACIA = (): Consigna => ({ text_with_blank: '', correct_answer: '', image_url: '' });

export function AgregarActividadForm({ lessonId }: { lessonId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [gameType, setGameType] = useState<GameTypeId>('trivia');
  const [title, setTitle] = useState('');
  const [preguntas, setPreguntas] = useState<Pregunta[]>([PREGUNTA_VACIA()]);
  const [afirmaciones, setAfirmaciones] = useState<Afirmacion[]>([AFIRMACION_VACIA()]);
  const [consignas, setConsignas] = useState<Consigna[]>([CONSIGNA_VACIA()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function limpiarYCerrar() {
    setTitle('');
    setPreguntas([PREGUNTA_VACIA()]);
    setAfirmaciones([AFIRMACION_VACIA()]);
    setConsignas([CONSIGNA_VACIA()]);
    setAbierto(false);
  }

  function guardar() {
    setError(null);

    let config: unknown;
    if (gameType === 'trivia') {
      config = { questions: preguntas.map((p) => ({ ...limpiarCampos(p), options: p.options.filter((o) => o.trim()) })) };
    } else if (gameType === 'true_or_false') {
      config = { statements: afirmaciones.map(limpiarCampos) };
    } else {
      config = { items: consignas.map(limpiarCampos) };
    }

    startTransition(async () => {
      const resultado = await agregarActividadAction(lessonId, gameType, title, config);
      if (resultado && 'error' in resultado) {
        setError(resultado.error);
        return;
      }
      limpiarYCerrar();
    });
  }

  if (!abierto) {
    return (
      <Button onClick={() => setAbierto(true)} variant="outline">
        + Agregar actividad
      </Button>
    );
  }

  return (
    <Card>
      <h3 className="mb-4 font-bold">Nueva actividad</h3>

      <div className="mb-4 flex gap-2 rounded-xl bg-surface-muted p-1">
        {(
          [
            { id: 'trivia' as const, label: '🧠 Trivia' },
            { id: 'true_or_false' as const, label: '✅ V o F' },
            { id: 'fill_in_the_blank' as const, label: '✏️ Completar' },
          ]
        ).map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGameType(g.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${gameType === g.id ? 'bg-surface shadow-sm text-brand-700' : 'text-foreground/60'}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <Label htmlFor="activity-title">Título de la actividad</Label>
      <Input id="activity-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Repaso de fracciones" />

      <div className="mt-4 space-y-4">
        {gameType === 'trivia' &&
          preguntas.map((p, i) => (
            <PreguntaEditor
              key={i}
              pregunta={p}
              onChange={(nueva) => setPreguntas(preguntas.map((x, j) => (j === i ? nueva : x)))}
              onQuitar={preguntas.length > 1 ? () => setPreguntas(preguntas.filter((_, j) => j !== i)) : undefined}
            />
          ))}
        {gameType === 'true_or_false' &&
          afirmaciones.map((a, i) => (
            <AfirmacionEditor
              key={i}
              afirmacion={a}
              onChange={(nueva) => setAfirmaciones(afirmaciones.map((x, j) => (j === i ? nueva : x)))}
              onQuitar={afirmaciones.length > 1 ? () => setAfirmaciones(afirmaciones.filter((_, j) => j !== i)) : undefined}
            />
          ))}
        {gameType === 'fill_in_the_blank' &&
          consignas.map((c, i) => (
            <ConsignaEditor
              key={i}
              consigna={c}
              onChange={(nueva) => setConsignas(consignas.map((x, j) => (j === i ? nueva : x)))}
              onQuitar={consignas.length > 1 ? () => setConsignas(consignas.filter((_, j) => j !== i)) : undefined}
            />
          ))}
      </div>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="mt-3"
        onClick={() => {
          if (gameType === 'trivia') setPreguntas([...preguntas, PREGUNTA_VACIA()]);
          else if (gameType === 'true_or_false') setAfirmaciones([...afirmaciones, AFIRMACION_VACIA()]);
          else setConsignas([...consignas, CONSIGNA_VACIA()]);
        }}
      >
        + Agregar {gameType === 'trivia' ? 'pregunta' : gameType === 'true_or_false' ? 'afirmación' : 'consigna'}
      </Button>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex gap-3">
        <Button onClick={guardar} loading={pending}>
          Guardar actividad
        </Button>
        <Button type="button" variant="outline" onClick={limpiarYCerrar}>
          Cancelar
        </Button>
      </div>
    </Card>
  );
}

function limpiarCampos<T extends { explanation?: string; image_url: string }>(obj: T): T {
  return {
    ...obj,
    explanation: obj.explanation || undefined,
    image_url: obj.image_url || undefined,
  } as T;
}

function PreguntaEditor({ pregunta, onChange, onQuitar }: { pregunta: Pregunta; onChange: (p: Pregunta) => void; onQuitar?: () => void }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <Input value={pregunta.question} onChange={(e) => onChange({ ...pregunta, question: e.target.value })} placeholder="Pregunta..." />
        {onQuitar && (
          <button type="button" onClick={onQuitar} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">
            Quitar
          </button>
        )}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {pregunta.options.map((opcion, i) => (
          <Input
            key={i}
            value={opcion}
            onChange={(e) => {
              const options = [...pregunta.options];
              options[i] = e.target.value;
              onChange({ ...pregunta, options });
            }}
            placeholder={`Opción ${i + 1}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {pregunta.options.length < 6 && (
          <button
            type="button"
            onClick={() => onChange({ ...pregunta, options: [...pregunta.options, ''] })}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            + opción
          </button>
        )}
      </div>
      <div className="mt-2">
        <Label className="text-xs">Respuesta correcta (tiene que ser igual a una de las opciones)</Label>
        <Input value={pregunta.correct_answer} onChange={(e) => onChange({ ...pregunta, correct_answer: e.target.value })} placeholder="Respuesta correcta" />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Input
          value={pregunta.explanation}
          onChange={(e) => onChange({ ...pregunta, explanation: e.target.value })}
          placeholder="Explicación (opcional)"
          className="flex-1"
        />
        <ImageUploadButton value={pregunta.image_url} onChange={(url) => onChange({ ...pregunta, image_url: url })} />
      </div>
    </div>
  );
}

function AfirmacionEditor({ afirmacion, onChange, onQuitar }: { afirmacion: Afirmacion; onChange: (a: Afirmacion) => void; onQuitar?: () => void }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <Input value={afirmacion.statement} onChange={(e) => onChange({ ...afirmacion, statement: e.target.value })} placeholder="Afirmación..." />
        {onQuitar && (
          <button type="button" onClick={onQuitar} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">
            Quitar
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4">
        <label className="flex items-center gap-1.5 text-sm font-medium">
          <input type="radio" checked={afirmacion.is_true} onChange={() => onChange({ ...afirmacion, is_true: true })} /> Verdadera
        </label>
        <label className="flex items-center gap-1.5 text-sm font-medium">
          <input type="radio" checked={!afirmacion.is_true} onChange={() => onChange({ ...afirmacion, is_true: false })} /> Falsa
        </label>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Input
          value={afirmacion.explanation}
          onChange={(e) => onChange({ ...afirmacion, explanation: e.target.value })}
          placeholder="Explicación (opcional)"
          className="flex-1"
        />
        <ImageUploadButton value={afirmacion.image_url} onChange={(url) => onChange({ ...afirmacion, image_url: url })} />
      </div>
    </div>
  );
}

function ConsignaEditor({ consigna, onChange, onQuitar }: { consigna: Consigna; onChange: (c: Consigna) => void; onQuitar?: () => void }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <Input
          value={consigna.text_with_blank}
          onChange={(e) => onChange({ ...consigna, text_with_blank: e.target.value })}
          placeholder="Texto con ___ marcando el espacio en blanco"
          className="flex-1"
        />
        {onQuitar && (
          <button type="button" onClick={onQuitar} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">
            Quitar
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Input
          value={consigna.correct_answer}
          onChange={(e) => onChange({ ...consigna, correct_answer: e.target.value })}
          placeholder="Respuesta correcta"
          className="flex-1"
        />
        <ImageUploadButton value={consigna.image_url} onChange={(url) => onChange({ ...consigna, image_url: url })} />
      </div>
    </div>
  );
}
