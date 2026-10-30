'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema } from '@/lib/validations/auth';

export type AuthActionState = { error: string } | null;

export async function registerAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    schoolName: formData.get('schoolName') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  const { fullName, email, password, schoolName } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'No se pudo crear la cuenta — intentá de nuevo.' };
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    full_name: fullName,
    school_name: schoolName || null,
  });

  if (profileError) {
    return { error: `La cuenta se creó pero no se pudo armar el perfil: ${profileError.message}` };
  }

  redirect('/docente');
}

export async function loginAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: 'Email o contraseña incorrectos.' };
  }

  redirect('/docente');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
