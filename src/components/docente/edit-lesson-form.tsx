'use client';

import { useActionState } from 'react';
import { updateLessonMetaAction, type LessonMetaActionState } from '@/app/docente/clases/[id]/editor-actions';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Curso = { id: string; name: string };
type Lesson = {
  id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  school_year: string | null;
  difficulty: string | null;
  course_id: string | null;
};

export function EditLessonForm({ lesson, courses }: { lesson: Lesson; courses: Curso[] }) {
  const accion = async (prevState: LessonMetaActionState, formData: FormData) => updateLessonMetaAction(lesson.id, prevState, formData);
  const [state, formAction, pending] = useActionState(accion, null);

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="title">Título de la clase</Label>
          <Input id="title" name="title" required defaultValue={lesson.title} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="subject">Materia</Label>
            <Input id="subject" name="subject" defaultValue={lesson.subject ?? ''} />
          </div>
          <div>
            <Label htmlFor="topic">Tema</Label>
            <Input id="topic" name="topic" defaultValue={lesson.topic ?? ''} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="schoolYear">Año escolar</Label>
            <Input id="schoolYear" name="schoolYear" defaultValue={lesson.school_year ?? ''} />
          </div>
          <div>
            <Label htmlFor="difficulty">Nivel de dificultad</Label>
            <select
              id="difficulty"
              name="difficulty"
              defaultValue={lesson.difficulty ?? ''}
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
            <Label htmlFor="courseId">Curso</Label>
            <select
              id="courseId"
              name="courseId"
              defaultValue={lesson.course_id ?? ''}
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

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

        <Button type="submit" loading={pending}>
          Guardar cambios
        </Button>
      </form>
    </Card>
  );
}
