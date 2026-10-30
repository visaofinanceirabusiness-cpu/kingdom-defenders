'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { signOutAction } from '@/app/(auth)/actions';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/docente', label: 'Dashboard', icon: '🏠' },
  { href: '/docente/cursos', label: 'Mis cursos', icon: '📚' },
  { href: '/docente/alumnos', label: 'Mis alumnos', icon: '🧑‍🎓' },
  { href: '/docente/biblioteca', label: 'Biblioteca', icon: '🗂️' },
];

export function DocenteNav({ teacherName }: { teacherName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esDashboard = pathname === '/docente';

  function volver() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/docente');
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
        {!esDashboard && (
          <button
            type="button"
            onClick={volver}
            className="shrink-0 rounded-lg px-2 py-2 text-sm font-semibold text-foreground/60 hover:bg-surface-muted"
            aria-label="Volver"
          >
            <span className="sm:hidden">←</span>
            <span className="hidden sm:inline">← Volver</span>
          </button>
        )}
        <Link href="/docente" className="mr-auto flex items-center" onClick={() => setMenuAbierto(false)}>
          <Image src="/logo-full.png" alt="AulaPlay" width={132} height={46} priority />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const activo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                  activo ? 'bg-brand-100 text-brand-700' : 'text-foreground/60 hover:bg-surface-muted'
                )}
              >
                {link.icon} {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium text-foreground/70 sm:inline">👋 {teacherName}</span>
          <form action={signOutAction} className="hidden sm:block">
            <button type="submit" className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/60 hover:bg-surface-muted">
              Salir
            </button>
          </form>
          <button
            type="button"
            onClick={() => setMenuAbierto((m) => !m)}
            className="rounded-lg p-2 text-2xl text-foreground/70 hover:bg-surface-muted sm:hidden"
            aria-label="Abrir menú"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <nav className="border-t border-border px-4 py-3 sm:hidden">
          <p className="mb-2 px-1 text-sm font-medium text-foreground/70">👋 {teacherName}</p>
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => {
              const activo = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuAbierto(false)}
                  className={cn(
                    'rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
                    activo ? 'bg-brand-100 text-brand-700' : 'text-foreground/70 hover:bg-surface-muted'
                  )}
                >
                  {link.icon} {link.label}
                </Link>
              );
            })}
            <form action={signOutAction}>
              <button type="submit" className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground/70 hover:bg-surface-muted">
                Salir
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
