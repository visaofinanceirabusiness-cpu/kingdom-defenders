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
- [x] **Fase 6** — optimización (loop principal sin asignar funciones/arrays nuevos en cada frame, lista de torres cacheada) y preparación para publicación (meta tags, favicon, ayuda rápida en pantalla de selección de mapa).

## Estado

Las 6 fases del plan original están completas: núcleo jugable, economía, progresión del jugador, contenido avanzado (jefe, mapas, torre extra), pulido (efectos/sonido/guardado) y optimización final. El juego es jugable de punta a punta, desde el bosque hasta el Señor de la Guerra en la Oleada 10.

## Vista isométrica

El render pasó de una vista "de arriba" plana a una proyección isométrica, con sombras y degradés (bisel) en torres, enemigos y castillo para dar sensación de volumen. El mapa (camino, spots de construcción, castillo) sigue viviendo en las mismas coordenadas de mundo de siempre — la lógica del juego no cambió, solo cómo se dibuja:

- `ISO_CONFIG` (`config.js`) define la transformación (escala y offset).
- `isoProject(x, y)` / `isoUnproject(sx, sy)` (`game.js`) convierten entre coordenadas de mundo y de pantalla, en las dos direcciones (dibujar, y traducir un clic de vuelta a mundo).
- `_render()` ordena torres/enemigos/proyectiles/castillo por profundidad (algoritmo del pintor) antes de dibujar, para que lo de "adelante" tape correctamente a lo de "atrás".
