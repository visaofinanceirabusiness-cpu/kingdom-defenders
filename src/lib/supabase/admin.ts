// Cliente de Supabase con la service_role key — solo para rutas de
// servidor (API routes), NUNCA se importa desde un Client Component
// (este archivo no tiene 'use client' a propósito, y la clave no
// tiene el prefijo NEXT_PUBLIC_, así que Next.js ya evita que termine
// en el bundle del navegador). Se usa para operar en nombre de un
// alumno (sessions, student_responses), que no tiene sesión de
// Supabase Auth en el MVP — bypassea RLS, así que cada ruta que lo usa
// es responsable de validar a mano que la operación corresponde al
// código de clase/alumno correcto.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'Falta SUPABASE_SERVICE_ROLE_KEY — ver .env.local.example. Sin esto, las rutas que actúan en nombre de un alumno no pueden funcionar.'
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
