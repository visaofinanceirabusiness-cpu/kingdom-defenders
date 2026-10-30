'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createStudentAction } from '@/app/docente/alumnos/actions';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function NewStudentForm() {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(createStudentAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const yaEstabaPendiente = useRef(false);

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
        + Nuevo alumno
      </Button>
    );
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-4 text-lg font-bold">Nuevo alumno</h2>
      <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="displayName">Nombre</Label>
          <Input id="displayName" name="displayName" required placeholder="Ej: Martina Pérez" />
        </div>
        <div>
          <Label htmlFor="subjects">Materias (separadas por coma)</Label>
          <Input id="subjects" name="subjects" placeholder="Matemática, Física" />
        </div>
        <div>
          <Label htmlFor="schoolYear">Año escolar</Label>
          <Input id="schoolYear" name="schoolYear" placeholder="3er año" />
        </div>
        <div>
          <Label htmlFor="level">Nivel</Label>
          <Input id="level" name="level" placeholder="Básico / Intermedio / Avanzado" />
        </div>

        {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" loading={pending}>
            Registrar alumno
          </Button>
          <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
