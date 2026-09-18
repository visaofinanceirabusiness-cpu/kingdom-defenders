/* =========================================================================
   KINGDOM DEFENDERS — CONFIG CENTRAL
   Toda la data ajustable del juego vive acá. La lógica (game.js, entities.js)
   NUNCA debe tener números mágicos: siempre lee de estos objetos.
   Para agregar contenido nuevo en fases futuras, se agregan entradas acá,
   no se toca la lógica.
   ========================================================================= */

// ---- Mapa ----
// path: lista de waypoints (centro del camino) que recorren los enemigos.
// buildSpots: posiciones fijas donde se puede construir una torre.
const MAP_CONFIG = {
  width: 960,
  height: 540,
  path: [
    { x: -20, y: 270 },
    { x: 200, y: 270 },
    { x: 200, y: 110 },
    { x: 500, y: 110 },
    { x: 500, y: 430 },
    { x: 760, y: 430 },
    { x: 760, y: 270 },
    { x: 865, y: 270 }
  ],
  pathWidth: 46,
  buildSpots: [
    { x: 110, y: 190 },
    { x: 330, y: 60 },
    { x: 360, y: 200 },
    { x: 420, y: 340 },
    { x: 600, y: 480 },
    { x: 690, y: 190 },
    { x: 840, y: 340 },
    { x: 850, y: 180 }
  ],
  castle: { x: 900, y: 270 }
};

// ---- Castillo ----
const CASTLE_CONFIG = {
  maxHp: 100
};

// ---- Economía ----
const ECONOMY_CONFIG = {
  startingGold: 150
};

// ---- Torres ----
// damage: daño por disparo. fireRate: disparos por segundo.
// range: radio de alcance en px. cost: oro para construir.
const TOWER_TYPES = {
  archer: {
    id: "archer",
    name: "Torre de Arqueros",
    description: "Ataque rápido, daño medio, alcance medio.",
    cost: 50,
    damage: 8,
    range: 130,
    fireRate: 1.2,
    projectileSpeed: 420,
    color: "#6b4a2f",
    accentColor: "#caa25a",
    projectileColor: "#f2e2a8"
  }
};

// ---- Enemigos ----
// hp: vida total. speed: px/segundo. reward: oro al morir. xp: experiencia al morir.
const ENEMY_TYPES = {
  goblin: {
    id: "goblin",
    name: "Goblin",
    hp: 22,
    speed: 62,
    reward: 5,
    xp: 2,
    radius: 11,
    bodyColor: "#4c7a3a",
    darkColor: "#345226",
    damageToCastle: 5
  }
};

// ---- Oleadas ----
// Cada oleada es una lista de grupos de spawn: { type, count, interval, delay }
// interval: segundos entre cada spawn del grupo. delay: espera antes de iniciar el grupo.
const WAVE_CONFIG = [
  {
    label: "Oleada 1",
    groups: [
      { type: "goblin", count: 10, interval: 0.9, delay: 0 }
    ]
  }
];

// ---- Constantes generales del loop ----
const GAME_CONFIG = {
  countdownBeforeWave: 3, // segundos de cuenta regresiva antes de iniciar
  targetFPS: 60
};
