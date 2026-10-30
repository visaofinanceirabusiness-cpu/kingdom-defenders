'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

// Versión controlada de la subida de imagen — para usar dentro de
// filas de un array en estado de React (preguntas, afirmaciones,
// etc.), donde no hay un <form> único que juntar con FormData.
export function ImageUploadButton({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSubiendo(true);

    const formData = new FormData();
    formData.set('file', file);

    try {
      const res = await fetch('/api/images/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'No se pudo subir la imagen.');
      } else {
        onChange(data.url);
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={manejarArchivo} className="hidden" />
      <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} loading={subiendo}>
        {value ? 'Cambiar imagen' : '+ Imagen'}
      </Button>
      {value && <img src={value} alt="" className="h-8 w-8 rounded-lg border border-border object-cover" />}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
