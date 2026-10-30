'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOutAction } from '@/app/(auth)/actions';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/docente', label: 'Dashboard', icon: '🏠' },
  { href: '/docente/cursos', label: 'Mis cursos', icon: '📚' },
];

export function DocenteNav({ teacherName }: { teacherName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/docente" className="flex items-center">
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
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/60 hover:bg-surface-muted"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
