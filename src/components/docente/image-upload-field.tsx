'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

// Campo de imagen reutilizable: sube el archivo a /api/images/upload
// apenas se elige (no espera al submit del formulario que lo
// contiene) y guarda la URL pública resultante en un input hidden con
// el `name` pedido, para que viaje junto al resto del formulario.
export function ImageUploadField({ name, label = 'Imagen (opcional)', defaultUrl = '' }: { name: string; label?: string; defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl);
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
        setUrl(data.url);
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-foreground/70">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={manejarArchivo} className="hidden" />
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} loading={subiendo}>
          {url ? 'Cambiar imagen' : 'Subir imagen'}
        </Button>
        {url && <img src={url} alt="" className="h-10 w-10 rounded-lg border border-border object-cover" />}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
