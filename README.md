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
- [x] **Fase 2** — economía activa: mejora y venta de torres (con niveles), Torre de Guerreros (ralentiza), Torre de Magos (daño en área), enemigo Orco, Oleada 2 con mezcla de enemigos.
- [x] **Fase 3** — XP y nivel del jugador (persiste en localStorage), desbloqueo de torres por nivel (Torre de Magos desde nivel 2), 3 habilidades especiales con cooldown: Congelar, Lluvia de Fuego y Rayo en Cadena.
- [x] **Fase 4** — 10 oleadas con jefe final (Señor de la Guerra) en la Oleada 10, 2 enemigos nuevos (Caballero Oscuro, Troll), Torre de Artillería (nivel 4), selector de 2 mapas (Bosque de Ingleses / Desfiladero de Montaña) con botón para cambiar de mapa en cualquier momento, castillo y economía reajustados para la campaña más larga.
- [x] **Fase 5** — partículas y texto flotante (muerte de enemigos, impactos, oro/XP ganado, subida de nivel), flash de daño al castillo, efectos propios por habilidad (chispas de hielo, ráfaga de fuego, rayo en cadena), sonido sintetizado con Web Audio (sin archivos de audio) con botón de silenciar, mejoras táctiles (sin delay de doble-tap, sin resaltado azul), y guardado/reanudación de partida en curso (mapa, oro, vida del castillo, oleada y torres) vía localStorage.
- [ ] **Fase 6** — optimización y preparación para publicación.
- [ ] **Fase 6** — optimización y preparación para publicación.
