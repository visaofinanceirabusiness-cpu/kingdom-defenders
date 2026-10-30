'use client';

import { useState, useTransition } from 'react';
import { asignarSesionAction } from '@/app/docente/biblioteca/actions';
import { Button } from '@/components/ui/button';

type Alumno = { id: string; display_name: string };

export function AsignarSesionButton({ lessonId, alumnos }: { lessonId: string; alumnos: Alumno[] }) {
  const [abierto, setAbierto] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function asignar() {
    if (!studentId) return;
    setError(null);
    startTransition(async () => {
      const resultado = await asignarSesionAction(lessonId, studentId);
      if (resultado && 'error' in resultado) {
        setError(resultado.error);
        return;
      }
      if (resultado && 'success' in resultado && resultado.sessionId) {
        setLink(`${window.location.origin}/clase/sesion/${resultado.sessionId}`);
      }
    });
  }

  if (alumnos.length === 0) {
    return (
      <p className="text-xs text-foreground/50">
        Registrá un alumno en &quot;Mis alumnos&quot; para poder asignarle esta clase.
      </p>
    );
  }

  if (link) {
    return (
      <div className="rounded-lg bg-success-500/10 px-3 py-2 text-sm">
        <p className="font-semibold text-success-600">¡Sesión creada! Mandale este link:</p>
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1 w-full rounded border border-border bg-surface px-2 py-1 text-xs"
        />
      </div>
    );
  }

  if (!abierto) {
    return (
      <Button size="sm" variant="outline" onClick={() => setAbierto(true)}>
        Usar con un alumno
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm"
      >
        <option value="">Elegí un alumno...</option>
        {alumnos.map((a) => (
          <option key={a.id} value={a.id}>
            {a.display_name}
          </option>
        ))}
      </select>
      <Button size="sm" onClick={asignar} loading={pending} disabled={!studentId}>
        Crear sesión
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
