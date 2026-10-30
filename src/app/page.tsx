import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const JUEGOS_DESTACADOS = [
  { icon: '🧠', label: 'Trivia' },
  { icon: '🃏', label: 'Memotest' },
  { icon: '🔐', label: 'Escape Room' },
  { icon: '🏁', label: 'Carrera' },
  { icon: '⏱️', label: 'Contrarreloj' },
  { icon: '🎡', label: 'Ruleta' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 via-background to-accent-400/10">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Image src="/logo-full.png" alt="AulaPlay" width={150} height={52} priority />
        <nav className="flex items-center gap-3">
          <Link
            href="/clase"
            className="relative flex items-center gap-1.5 rounded-full border-2 border-brand-400 px-3.5 py-1.5 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Soy alumno
          </Link>
          <Link href="/login" className="text-sm font-semibold text-foreground/70 hover:text-foreground">
            Iniciar sesión
          </Link>
          <Link href="/registro">
            <Button size="sm">Empezar gratis</Button>
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-16 text-center">
        <span className="mb-4 inline-flex rounded-full bg-brand-100 px-4 py-1.5 text-sm font-bold text-brand-700">
          Plataforma educativa con IA 🤖✨
        </span>
        <h1 className="text-4xl font-black leading-tight text-foreground sm:text-6xl">
          Transformá cualquier material en una{' '}
          <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
            clase interactiva
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-foreground/60 sm:text-xl">
          Subí un documento, elegí un tema, y dejá que AulaPlay arme explicaciones, ejercicios, juegos y
          evaluaciones listos para tus alumnos de secundaria. Vos revisás, editás y publicás.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/registro">
            <Button size="lg">+ Crear mi primera clase</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Ya tengo cuenta
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {JUEGOS_DESTACADOS.map((juego) => (
            <Card key={juego.label} className="aulaplay-card-hover flex flex-col items-center gap-2 py-6 text-center">
              <span className="text-3xl">{juego.icon}</span>
              <span className="text-sm font-semibold text-foreground/70">{juego.label}</span>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <span className="text-3xl">📄</span>
            <h3 className="mt-3 text-lg font-bold">1. Cargá tu material</h3>
            <p className="mt-2 text-sm text-foreground/60">
              Subí un Word o PDF, o simplemente escribí el tema que querés enseñar.
            </p>
          </Card>
          <Card>
            <span className="text-3xl">🪄</span>
            <h3 className="mt-3 text-lg font-bold">2. La IA arma la clase</h3>
            <p className="mt-2 text-sm text-foreground/60">
              Explicaciones, ejercicios y juegos adaptados al nivel de tus alumnos — vos revisás todo antes de publicar.
            </p>
          </Card>
          <Card>
            <span className="text-3xl">🚀</span>
            <h3 className="mt-3 text-lg font-bold">3. Publicá y jugá</h3>
            <p className="mt-2 text-sm text-foreground/60">
              Compartí un código de acceso — tus alumnos entran desde cualquier dispositivo, sin necesidad de cuenta.
            </p>
          </Card>
        </div>
      </section>
    </main>
  );
}
