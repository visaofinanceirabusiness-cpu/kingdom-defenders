'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Curso = { id: string; name: string };

export function NewLessonForm({ courses, initialCourseId }: { courses: Curso[]; initialCourseId?: string }) {
  const router = useRouter();
  const [modo, setModo] = useState<'file' | 'topic'>('topic');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setEnviando(true);

    formData.set('mode', modo);

    try {
      const res = await fetch('/api/materials/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Ocurrió un error inesperado.');
        setEnviando(false);
        return;
      }

      router.push(`/docente/clases/${data.lessonId}/analisis`);
    } catch {
      setError('No se pudo conectar con el servidor — probá de nuevo.');
      setEnviando(false);
    }
  }

  return (
    <Card>
      <div className="mb-6 flex gap-2 rounded-xl bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => setModo('topic')}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
            modo === 'topic' ? 'bg-surface shadow-sm text-brand-700' : 'text-foreground/60'
          )}
        >
          ✍️ Escribir un tema
        </button>
        <button
          type="button"
          onClick={() => setModo('file')}
          className={cn(
            'flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
            modo === 'file' ? 'bg-surface shadow-sm text-brand-700' : 'text-foreground/60'
          )}
        >
          📄 Subir documento
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {modo === 'topic' ? (
          <div>
            <Label htmlFor="topic">Tema de la clase</Label>
            <Textarea
              id="topic"
              name="topic"
              required
              placeholder="Ej: Matemática — Fracciones y operaciones combinadas"
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="file">Documento (Word o PDF)</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
              required
              className="block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:font-semibold file:text-brand-700"
            />
            <p className="mt-1 text-xs text-foreground/50">Tamaño máximo: 15MB.</p>
          </div>
        )}

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
              <option value="">Que lo sugiera la IA</option>
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

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={enviando}>
          {enviando ? 'Analizando contenido...' : 'Analizar contenido →'}
        </Button>
      </form>
    </Card>
  );
}
