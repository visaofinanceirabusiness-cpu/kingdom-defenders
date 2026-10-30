'use client';

import { useActionState } from 'react';
import { crearClaseManualAction } from '@/app/docente/clases/nueva/manual-actions';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Curso = { id: string; name: string };

export function NewManualLessonForm({ courses, initialCourseId }: { courses: Curso[]; initialCourseId?: string }) {
  const [state, formAction, pending] = useActionState(crearClaseManualAction, null);

  return (
    <Card>
      <p className="mb-4 text-sm text-foreground/60">
        No se usa IA en ningún paso — vos escribís el contenido y armás las actividades a mano en el paso siguiente.
      </p>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="title">Título de la clase</Label>
          <Input id="title" name="title" required placeholder="Ej: Fracciones y operaciones combinadas" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="subject">Materia</Label>
            <Input id="subject" name="subject" placeholder="Matemática" />
          </div>
          <div>
            <Label htmlFor="topic">Tema</Label>
            <Input id="topic" name="topic" placeholder="Fracciones" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="schoolYear">Año escolar</Label>
            <Input id="schoolYear" name="schoolYear" placeholder="3er año" />
          </div>
          <div>
            <Label htmlFor="difficulty">Nivel de dificultad</Label>
            <select
              id="difficulty"
              name="difficulty"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Sin especificar</option>
              <option value="easy">Fácil</option>
              <option value="medium">Medio</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>

        {courses.length > 0 && (
          <div>
            <Label htmlFor="courseId">Curso (opcional)</Label>
            <select
              id="courseId"
              name="courseId"
              defaultValue={initialCourseId ?? ''}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Sin curso asignado</option>
              {courses.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Crear y empezar a construir →
        </Button>
      </form>
    </Card>
  );
}
