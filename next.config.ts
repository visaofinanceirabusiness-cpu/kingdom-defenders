import type { NextConfig } from "next";

// Cache Components (PPR) queda apagado a propósito: casi todas las
// pantallas de este MVP son dinámicas por naturaleza (dependen de la
// sesión del docente y leen la base en cada visita) — activarlo
// exigiría envolver cada página en Suspense/"use cache" sin ganar
// nada todavía. Se puede reconsiderar más adelante si aparecen
// páginas realmente estáticas que valga la pena cachear así.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
