'use client';

import { useActionState } from 'react';
import { unirseAction } from '@/app/clase/[codigo]/actions';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';

export function UnirseForm({ accessCode }: { accessCode: string }) {
  const [state, formAction, pending] = useActionState(unirseAction, null);

  return (
    <form action={formAction} className="mt-6 text-left">
      <input type="hidden" name="accessCode" value={accessCode} />
      <Label htmlFor="displayName">Tu nombre</Label>
      <Input id="displayName" name="displayName" placeholder="Ej: Sofía Gómez" autoFocus autoComplete="off" required />

      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}

      <Button type="submit" size="lg" className="mt-4 w-full" loading={pending}>
        ¡Empezar! 🚀
      </Button>
    </form>
  );
}
