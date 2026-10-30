'use client';

import { useState, useTransition } from 'react';
import { eliminarSeccionAction } from '@/app/docente/clases/[id]/construir/actions';
import { Button } from '@/components/ui/button';
import { TemaForm } from '@/components/docente/tema-form';

type Tema = { id: string; title: string; theory?: string; examples?: string; image_url?: string };

export function TemasSection({ lessonId, temas }: { lessonId: string; temas: Tema[] }) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [agregandoNuevo, setAgregandoNuevo] = useState(temas.length === 0);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function eliminar(temaId: string) {
    if (!window.confirm('¿Eliminar este tema?')) return;
    setEliminandoId(temaId);
    startTransition(async () => {
      await eliminarSeccionAction(lessonId, temaId);
      setEliminandoId(null);
    });
  }

  return (
    <div className="space-y-3">
      {temas.map((tema) =>
        editandoId === tema.id ? (
          <TemaForm
            key={tema.id}
            lessonId={lessonId}
            temaId={tema.id}
            title={tema.title}
            theory={tema.theory}
            examples={tema.examples}
            imagenUrl={tema.image_url}
            onGuardado={() => setEditandoId(null)}
          />
        ) : (
          <details key={tema.id} className="group rounded-xl border border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 marker:content-none">
              <span className="font-bold">
                <span className="mr-2 inline-block transition-transform group-open:rotate-90">▶</span>
                {tema.title}
              </span>
              <span className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditandoId(tema.id);
                  }}
                  className="text-xs font-semibold text-brand-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={eliminandoId === tema.id}
                  onClick={(e) => {
                    e.preventDefault();
                    eliminar(tema.id);
                  }}
                  className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                >
                  Eliminar
                </button>
              </span>
            </summary>
            <div className="border-t border-border px-4 py-3 text-sm text-foreground/70">
              {tema.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tema.image_url} alt="" className="mb-3 max-h-48 w-full rounded-xl border border-border object-contain" />
              )}
              <p className="mb-1 text-xs font-bold text-foreground/50">TEORÍA</p>
              <p className="whitespace-pre-line">{tema.theory}</p>
              <p className="mt-3 mb-1 text-xs font-bold text-foreground/50">EJEMPLOS</p>
              <p className="whitespace-pre-line">{tema.examples}</p>
            </div>
          </details>
        )
      )}

      {agregandoNuevo ? (
        <TemaForm lessonId={lessonId} onGuardado={() => setAgregandoNuevo(false)} />
      ) : (
        <Button type="button" variant="outline" onClick={() => setAgregandoNuevo(true)}>
          + Agregar tema
        </Button>
      )}
    </div>
  );
}
