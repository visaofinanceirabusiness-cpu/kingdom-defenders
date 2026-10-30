'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createCourseAction } from '@/app/docente/cursos/actions';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function NewCourseForm() {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(createCourseAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const yaEstabaPendiente = useRef(false);

  // Cuando termina un submit exitoso (pending pasa de true a false sin
  // error), cierra el formulario y lo limpia — evita depender de
  // revalidatePath para saber "terminó bien".
  useEffect(() => {
    if (yaEstabaPendiente.current && !pending && !state?.error) {
      setAbierto(false);
      formRef.current?.reset();
    }
    yaEstabaPendiente.current = pending;
  }, [pending, state]);

  if (!abierto) {
    return (
      <Button onClick={() => setAbierto(true)} size="lg">
        + Nuevo curso
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold">Nuevo curso</h2>
      <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre del curso</Label>
          <Input id="name" name="name" required placeholder="3er año B" />
        </div>
        <div>
          <Label htmlFor="subject">Materia</Label>
          <Input id="subject" name="subject" placeholder="Biología" />
        </div>
        <div>
          <Label htmlFor="schoolYear">Año escolar</Label>
          <Input id="schoolYear" name="schoolYear" placeholder="3er año" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea id="description" name="description" placeholder="Notas sobre este curso..." />
        </div>

        {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" loading={pending}>
            Crear curso
          </Button>
          <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
