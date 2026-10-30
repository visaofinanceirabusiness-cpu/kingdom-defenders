import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DocenteNav } from '@/components/docente/nav';

// El middleware (src/lib/supabase/middleware.ts) ya redirige a /login
// si no hay sesión — este chequeo es la segunda barrera (defensa en
// profundidad) y además trae el perfil para mostrar el nombre en el
// nav, que el middleware no hace.
export default async function DocenteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();

  return (
    <div className="min-h-screen bg-surface-muted">
      <DocenteNav teacherName={profile?.full_name ?? 'Docente'} />
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
