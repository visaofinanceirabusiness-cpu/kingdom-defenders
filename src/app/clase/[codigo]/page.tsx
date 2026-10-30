import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/card';
import { UnirseForm } from '@/components/alumno/unirse-form';

export default async function CodigoClasePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const accessCode = codigo.toUpperCase();
  const admin = createAdminClient();

  const { data: lesson } = await admin
    .from('lessons')
    .select('title, subject')
    .eq('access_code', accessCode)
    .eq('status', 'published')
    .maybeSingle();

  return (
    <main
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: 'var(--fondo-app, linear-gradient(135deg, #ede9fe 0%, #fdf4ff 50%, #eff6ff 100%))' }}
    >
      <Card className="w-full max-w-sm text-center">
        {lesson ? (
          <>
            <span className="text-5xl">👋</span>
            <h1 className="mt-3 text-2xl font-black text-foreground">{lesson.title}</h1>
            {lesson.subject && <p className="mt-1 text-sm text-foreground/60">{lesson.subject}</p>}
            <UnirseForm accessCode={accessCode} />
          </>
        ) : (
          <>
            <span className="text-5xl">🤔</span>
            <h1 className="mt-3 text-xl font-bold text-foreground">Código no válido</h1>
            <p className="mt-2 text-sm text-foreground/60">
              &quot;{accessCode}&quot; no corresponde a ninguna clase publicada. Revisalo con tu docente.
            </p>
            <Link href="/clase" className="mt-4 inline-block font-semibold text-brand-600 hover:underline">
              ← Probar con otro código
            </Link>
          </>
        )}
      </Card>
    </main>
  );
}
