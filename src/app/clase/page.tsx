'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export default function IngresarCodigoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');

  function enviar(e: FormEvent) {
    e.preventDefault();
    const limpio = codigo.trim().toUpperCase();
    if (limpio.length !== 6) return;
    router.push(`/clase/${limpio}`);
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--fondo-app, linear-gradient(135deg, #ede9fe 0%, #fdf4ff 50%, #eff6ff 100%))' }}
    >
      <Card className="w-full max-w-sm text-center">
        <Image src="/logo-icon.png" alt="AulaPlay" width={64} height={64} className="mx-auto" />
        <h1 className="mt-3 text-2xl font-black text-foreground">Entrar a una clase</h1>
        <p className="mt-2 text-sm text-foreground/60">Pedile el código a tu docente — son 6 letras o números.</p>

        <form onSubmit={enviar} className="mt-6 text-left">
          <Label htmlFor="codigo">Código de la clase</Label>
          <Input
            id="codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            autoFocus
            autoComplete="off"
            className="text-center text-2xl font-black tracking-[0.3em]"
          />
          <Button type="submit" size="lg" className="mt-4 w-full" disabled={codigo.trim().length !== 6}>
            Entrar →
          </Button>
        </form>
      </Card>
    </main>
  );
}
