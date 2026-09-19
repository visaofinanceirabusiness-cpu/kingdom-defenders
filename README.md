# Kingdom Defenders

> Defiende tu reino. Mejora tus defensas. Sobrevive a las hordas.

Tower Defense medieval jugable directamente en el navegador. Render 3D real con Three.js/WebGL (sin build, pero con una dependencia externa vía CDN — ver "Render 3D" más abajo).

## Estructura

- `index.html` — HUD, canvas y arranque del juego
- `style.css` — estilos e identidad visual
- `config.js` — **toda** la data ajustable del juego (mapa, torres, enemigos, oleadas, castillo, economía, escena 3D). Agregar contenido nuevo es agregar entradas acá, no tocar la lógica.
- `entities.js` — clases `Enemy`, `Tower`, `Projectile` (estado y lógica; ya no dibujan su propio cuerpo) y los efectos visuales (`Particle`, `FloatingText`, `LightningEffect`), que sí se dibujan (en el overlay 2D)
- `render3d.js` — motor de render 3D (Three.js): escena, cámara, luces/sombras, geometría de mapa/torres/enemigos/proyectiles, y el overlay 2D (barras de vida, texto flotante, rayos)
- `game.js` — motor del juego: loop, oleadas, castillo, economía, input (delega el dibujo a `render3d.js`)

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

## Render 3D

El render pasó de una proyección isométrica dibujada en canvas 2D a una escena 3D real hecha con [Three.js](https://threejs.org/) (WebGL). El mapa, las torres, los enemigos y los proyectiles son geometría 3D de verdad (cajas, conos, esferas, cilindros), con luz direccional y sombras en tiempo real. La lógica del juego (oleadas, economía, combate, guardado) sigue viviendo en las mismas coordenadas de mundo de siempre y no se tocó — solo cambió cómo se dibuja:

- `SCENE_CONFIG` (`config.js`) define la escena: escala de unidades, posición/ángulo de cámara, niebla y color de cielo.
- `render3d.js` (clase `Renderer3D`) arma la escena de Three.js: convierte coordenadas de mundo (x, y en píxeles) a coordenadas de escena (x, y=altura, z=profundidad), construye el terreno/camino/castillo/decoraciones una sola vez por mapa, y cada frame sincroniza las mallas de torres/enemigos/proyectiles con el estado del juego (crea, actualiza y descarta mallas según haga falta).
- Los clics se traducen de pantalla a mundo con *raycasting* (`screenToWorld`), más preciso que la proyección isométrica anterior.
- Un `<canvas>` transparente superpuesto (`overlayCanvas`) sigue dibujando en 2D las barras de vida, el texto flotante y los rayos, ubicados sobre la escena 3D con `Vector3.project(camera)`.

**Costo de esta mejora:** el juego ahora depende de cargar Three.js desde un CDN (`cdn.jsdelivr.net`) — necesita internet la primera vez y ya no es 100% offline/sin dependencias como antes. También es más pesado en celulares viejos.
