'use client';

import { useActionState } from 'react';
import { updateCourseAction, type CourseActionState } from '@/app/docente/cursos/actions';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Curso = { id: string; name: string; subject: string | null; school_year: string | null; description: string | null };

export function EditCourseForm({ curso }: { curso: Curso }) {
  const accion = async (prevState: CourseActionState, formData: FormData) => updateCourseAction(curso.id, prevState, formData);
  const [state, formAction, pending] = useActionState(accion, null);

  return (
    <Card>
      <form action={formAction} className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nombre del curso</Label>
          <Input id="name" name="name" required defaultValue={curso.name} />
        </div>
        <div>
          <Label htmlFor="subject">Materia</Label>
          <Input id="subject" name="subject" defaultValue={curso.subject ?? ''} />
        </div>
        <div>
          <Label htmlFor="schoolYear">Año escolar</Label>
          <Input id="schoolYear" name="schoolYear" defaultValue={curso.school_year ?? ''} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description">Descripción (opcional)</Label>
          <Textarea id="description" name="description" defaultValue={curso.description ?? ''} />
        </div>

        {state?.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" loading={pending}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Card>
  );
}
