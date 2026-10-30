'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { registerAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registerAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-background to-accent-400/10 px-4 py-10">
      <Card className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-block text-2xl font-black text-brand-700">
          AulaPlay 🎮
        </Link>
        <h1 className="mb-1 text-2xl font-bold">Creá tu cuenta docente</h1>
        <p className="mb-6 text-foreground/60">Empezá a transformar tus clases en minutos.</p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input id="fullName" name="fullName" required placeholder="Ana Pérez" />
          </div>
          <div>
            <Label htmlFor="schoolName">Escuela (opcional)</Label>
            <Input id="schoolName" name="schoolName" placeholder="Escuela N° 12" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="vos@escuela.edu" />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={pending}>
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="font-semibold text-brand-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </Card>
    </main>
  );
}
