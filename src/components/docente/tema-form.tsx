'use client';

import { useActionState } from 'react';
import { guardarTemaAction, type ConstruirActionState } from '@/app/docente/clases/[id]/construir/actions';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { ImageUploadField } from '@/components/docente/image-upload-field';

export function TemaForm({
  lessonId,
  temaId,
  title,
  theory,
  examples,
  imagenUrl,
  onGuardado,
}: {
  lessonId: string;
  temaId?: string;
  title?: string;
  theory?: string;
  examples?: string;
  imagenUrl?: string;
  onGuardado?: () => void;
}) {
  const accion = async (prevState: ConstruirActionState, formData: FormData) => {
    const resultado = await guardarTemaAction(lessonId, temaId ?? null, prevState, formData);
    if (resultado && 'success' in resultado) onGuardado?.();
    return resultado;
  };
  const [state, formAction, pending] = useActionState(accion, null);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border p-4">
      <div>
        <Label htmlFor={`tema-title-${temaId ?? 'nuevo'}`}>Título del tema</Label>
        <Input id={`tema-title-${temaId ?? 'nuevo'}`} name="title" defaultValue={title} placeholder="Ej: Fracciones equivalentes" required />
      </div>
      <div>
        <Label htmlFor={`tema-theory-${temaId ?? 'nuevo'}`}>Explicación teórica</Label>
        <Textarea id={`tema-theory-${temaId ?? 'nuevo'}`} name="theory" defaultValue={theory} placeholder="El contenido teórico de este tema..." required className="min-h-28" />
      </div>
      <div>
        <Label htmlFor={`tema-examples-${temaId ?? 'nuevo'}`}>Ejemplo práctico</Label>
        <Textarea id={`tema-examples-${temaId ?? 'nuevo'}`} name="examples" defaultValue={examples} placeholder="Un ejemplo resuelto de este tema..." required className="min-h-24" />
      </div>
      <ImageUploadField name="imageUrl" defaultUrl={imagenUrl} />

      {state && 'error' in state && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" size="sm" loading={pending}>
        {temaId ? 'Guardar cambios' : 'Agregar tema'}
      </Button>
    </form>
  );
}
