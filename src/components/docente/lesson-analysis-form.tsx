'use client';

import { useActionState } from 'react';
import { updateLessonAnalysisAction, type UpdateAnalysisState } from '@/app/docente/clases/[id]/actions';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';

type Lesson = {
  id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  school_year: string | null;
  difficulty: string | null;
  summary: string | null;
  learning_objectives: string[];
};

export function LessonAnalysisForm({ lesson }: { lesson: Lesson }) {
  const action = async (_prev: UpdateAnalysisState, formData: FormData) => updateLessonAnalysisAction(lesson.id, formData);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="title">Título de la clase</Label>
        <Input id="title" name="title" defaultValue={lesson.title} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="subject">Materia</Label>
          <Input id="subject" name="subject" defaultValue={lesson.subject ?? ''} required />
        </div>
        <div>
          <Label htmlFor="schoolYear">Año escolar</Label>
          <Input id="schoolYear" name="schoolYear" defaultValue={lesson.school_year ?? ''} />
        </div>
        <div>
          <Label htmlFor="difficulty">Dificultad</Label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={lesson.difficulty ?? 'medium'}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="topic">Tema</Label>
        <Input id="topic" name="topic" defaultValue={lesson.topic ?? ''} required />
      </div>

      <div>
        <Label htmlFor="summary">Resumen</Label>
        <Textarea id="summary" name="summary" defaultValue={lesson.summary ?? ''} required />
      </div>

      <div>
        <Label htmlFor="learningObjectives">Objetivos de aprendizaje (uno por línea)</Label>
        <Textarea
          id="learningObjectives"
          name="learningObjectives"
          defaultValue={lesson.learning_objectives.join('\n')}
          required
          className="min-h-32"
        />
      </div>

      {state && 'error' in state && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state && 'success' in state && (
        <p className="rounded-lg bg-success-500/10 px-3 py-2 text-sm text-success-600">Guardado ✓</p>
      )}

      <Button type="submit" loading={pending}>
        Guardar correcciones
      </Button>
    </form>
  );
}
