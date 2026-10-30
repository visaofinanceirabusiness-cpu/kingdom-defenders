import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Next 16 renombró la convención "middleware.ts" a "proxy.ts" (mismo
// mecanismo, se sigue ejecutando antes de cada request que matchea).
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
