import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Refresca la sesión del docente en cada request y redirige a /login
// si entra a una ruta de /docente sin estar logueado. El dashboard
// del alumno (/clase) no pasa por acá: no usa Supabase Auth.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDocenteRoute = request.nextUrl.pathname.startsWith('/docente');
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/registro');

  if (!user && isDocenteRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/docente';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
