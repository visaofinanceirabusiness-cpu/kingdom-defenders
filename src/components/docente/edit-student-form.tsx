'use client';

import { useActionState } from 'react';
import { updateStudentAction, type StudentActionState } from '@/app/docente/alumnos/actions';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Alumno = { id: string; display_name: string; school_year: string | null; level: string | null; subjects: unknown };

export function EditStudentForm({ alumno }: { alumno: Alumno }) {
  const accion = async (prevState: StudentActionState, formData: FormData) => updateStudentAction(alumno.id, prevState, formData);
  const [state, formAction, pending] = useActionState(accion, null);
  const subjectsTexto = Array.isArray(alumno.subjects) ? (alumno.subjects as string[]).join(', ') : '';

  return (
    <Card>
      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="displayName">Nombre</Label>
          <Input id="displayName" name="displayName" required defaultValue={alumno.display_name} />
        </div>
        <div>
          <Label htmlFor="subjects">Materias (separadas por coma)</Label>
          <Input id="subjects" name="subjects" defaultValue={subjectsTexto} placeholder="Matemática, Física" />
        </div>
        <div>
          <Label htmlFor="schoolYear">Año escolar</Label>
          <Input id="schoolYear" name="schoolYear" defaultValue={alumno.school_year ?? ''} placeholder="3er año" />
        </div>
        <div>
          <Label htmlFor="level">Nivel</Label>
          <Input id="level" name="level" defaultValue={alumno.level ?? ''} placeholder="Básico / Intermedio / Avanzado" />
        </div>

        {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

        <div className="sm:col-span-2">
          <Button type="submit" loading={pending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Card>
  );
}
