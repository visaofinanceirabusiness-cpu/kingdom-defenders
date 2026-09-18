# Kingdom Defenders

> Defiende tu reino. Mejora tus defensas. Sobrevive a las hordas.

Tower Defense medieval jugable directamente en el navegador (HTML5 Canvas, sin dependencias ni build).

## Estructura

- `index.html` — HUD, canvas y arranque del juego
- `style.css` — estilos e identidad visual
- `config.js` — **toda** la data ajustable del juego (mapa, torres, enemigos, oleadas, castillo, economía). Agregar contenido nuevo es agregar entradas acá, no tocar la lógica.
- `entities.js` — clases `Enemy`, `Tower`, `Projectile`
- `game.js` — motor del juego: loop, oleadas, castillo, input, render

## Jugar

Abrir `index.html` directamente en el navegador, o servir la carpeta con cualquier servidor estático.

## Progreso por fases

- [x] **Fase 1** — núcleo jugable: mapa, camino, castillo, 1 enemigo (Goblin), 1 torre (Arqueros), sistema de ataque, sistema de oleadas, victoria/derrota.
- [ ] **Fase 2** — oro gastable (mejoras y venta de torres), nuevas torres (Guerreros, Magos), nuevos enemigos (Orco), oleada 2 con mezcla de enemigos.
- [ ] **Fase 3** — XP, nivel del jugador, desbloqueos, habilidades especiales.
- [ ] **Fase 4** — jefes, nuevos mapas, progresión avanzada.
- [ ] **Fase 5** — animaciones, efectos, sonido, pulido visual, responsive táctil, guardado.
- [ ] **Fase 6** — optimización y preparación para publicación.
