'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, registerSchema } from '@/lib/validations/auth';

export type AuthActionState = { error: string } | { success: true; needsEmailConfirmation: boolean } | null;
export type LoginActionState = { error: string } | null;

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

  // full_name/school_name viajan en options.data — el perfil se crea
  // solo, vía trigger en auth.users (handle_new_user, ver migración
  // "crear_perfil_automatico_con_trigger"). No se inserta acá: este
  // proyecto exige confirmar el email antes de dar una sesión activa,
  // así que un insert.profiles() de este lado correría sin sesión y
  // la política de RLS lo rechazaría (bug real que pasó esto mismo).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, school_name: schoolName || null } },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'No se pudo crear la cuenta — intentá de nuevo.' };
  }

  if (data.session) {
    // La confirmación de email está desactivada en este proyecto —
    // ya hay sesión activa, se puede entrar directo.
    redirect('/docente');
  }

  return { success: true, needsEmailConfirmation: true };
}

export async function loginAction(_prevState: LoginActionState, formData: FormData): Promise<LoginActionState> {
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
