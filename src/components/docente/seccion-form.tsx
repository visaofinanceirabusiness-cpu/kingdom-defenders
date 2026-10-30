'use client';

import { useActionState, useTransition } from 'react';
import { agregarSeccionAction, eliminarSeccionAction, type ConstruirActionState } from '@/app/docente/clases/[id]/construir/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { ImageUploadField } from '@/components/docente/image-upload-field';
import type { SectionType } from '@/lib/validations/lesson-manual';

const LABELS: Record<SectionType, { titulo: string; icono: string; placeholder: string }> = {
  introduction: { titulo: 'Introducción', icono: '👋', placeholder: 'Bienvenida a la clase, qué van a aprender hoy...' },
  evaluation: { titulo: 'Evaluación', icono: '📝', placeholder: 'Resumen o consigna de evaluación final...' },
};

export function SeccionForm({
  lessonId,
  sectionType,
  seccionId,
  texto,
  imagenUrl,
}: {
  lessonId: string;
  sectionType: SectionType;
  seccionId?: string;
  texto?: string;
  imagenUrl?: string;
}) {
  const accionConLessonId = async (_prevState: ConstruirActionState, formData: FormData) => agregarSeccionAction(lessonId, _prevState, formData);
  const [state, formAction, pending] = useActionState(accionConLessonId, null);
  const [eliminando, startTransition] = useTransition();
  const { titulo, icono, placeholder } = LABELS[sectionType];

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold">
          <span>{icono}</span>
          {titulo}
        </h3>
        {seccionId && (
          <button
            type="button"
            disabled={eliminando}
            onClick={() => startTransition(async () => { await eliminarSeccionAction(lessonId, seccionId); })}
            className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
          >
            Eliminar
          </button>
        )}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="sectionType" value={sectionType} />
        <input type="hidden" name="title" value={titulo} />
        <Textarea name="text" defaultValue={texto} placeholder={placeholder} required className="min-h-32" />
        <ImageUploadField name="imageUrl" defaultUrl={imagenUrl} />

        {state && 'error' in state && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" size="sm" variant="outline" loading={pending}>
          {texto ? 'Guardar cambios' : 'Agregar sección'}
        </Button>
      </form>
    </div>
  );
}
