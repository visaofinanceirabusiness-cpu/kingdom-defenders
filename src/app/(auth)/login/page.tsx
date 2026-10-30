'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useActionState } from 'react';
import { loginAction } from '../actions';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-background to-accent-400/10 px-4">
      <Card className="w-full max-w-md">
        <Link href="/" className="mb-6 inline-block">
          <Image src="/logo-full.png" alt="AulaPlay" width={132} height={46} />
        </Link>
        <h1 className="mb-1 text-2xl font-bold">Hola de nuevo</h1>
        <p className="mb-6 text-foreground/60">Entrá con tu cuenta de docente.</p>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="vos@escuela.edu" />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required placeholder="••••••••" />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={pending}>
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          ¿Todavía no tenés cuenta?{' '}
          <Link href="/registro" className="font-semibold text-brand-600 hover:underline">
            Registrate
          </Link>
        </p>
      </Card>
    </main>
  );
}
