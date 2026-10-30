// Cliente de Supabase para Server Components, Server Actions y Route
// Handlers — usa cookies() para mantener la sesión del docente.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Llamado desde un Server Component (no puede escribir
            // cookies) — el middleware ya se encarga de refrescar la
            // sesión, así que acá no pasa nada si falla.
          }
        },
      },
    }
  );
}
