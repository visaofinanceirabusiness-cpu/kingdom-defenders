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
// Cada torre define su "levels": un array de estadísticas por nivel.
// levels[0] es el nivel inicial (levels[0].cost = costo de construcción).
// levels[n].cost = costo de mejorar del nivel n al n+1.
// sellRefund: fracción del oro invertido que se recupera al vender.
// Campos opcionales de comportamiento especial (data-driven, sin lógica hardcodeada):
//   slowFactor/slowDuration -> el impacto ralentiza al objetivo.
//   splashRadius/maxTargets -> el impacto también daña enemigos cercanos (hasta maxTargets).
const TOWER_TYPES = {
  archer: {
    id: "archer",
    name: "Torre de Arqueros",
    icon: "🏹",
    description: "Ataque rápido, daño medio, alcance medio.",
    color: "#6b4a2f",
    accentColor: "#caa25a",
    projectileColor: "#f2e2a8",
    projectileSpeed: 420,
    sellRefund: 0.6,
    levels: [
      { cost: 50, damage: 8, range: 130, fireRate: 1.2 },
      { cost: 55, damage: 14, range: 140, fireRate: 1.3 },
      { cost: 85, damage: 22, range: 150, fireRate: 1.4 }
    ]
  },
  warrior: {
    id: "warrior",
    name: "Torre de Guerreros",
    icon: "⚔️",
    description: "Ataque lento, daño alto, ralentiza enemigos.",
    color: "#5a5850",
    accentColor: "#9a2f2f",
    projectileColor: "#e2dede",
    projectileSpeed: 520,
    slowFactor: 0.5,
    slowDuration: 1.5,
    sellRefund: 0.6,
    levels: [
      { cost: 70, damage: 22, range: 95, fireRate: 0.6 },
      { cost: 80, damage: 34, range: 100, fireRate: 0.65 },
      { cost: 120, damage: 50, range: 110, fireRate: 0.7 }
    ]
  },
  mage: {
    id: "mage",
    name: "Torre de Magos",
    icon: "🔮",
    description: "Daño mágico en área, golpea varios enemigos a la vez.",
    color: "#3a2f5a",
    accentColor: "#8a5fd6",
    projectileColor: "#c9a8ff",
    projectileSpeed: 380,
    splashRadius: 55,
    maxTargets: 3,
    sellRefund: 0.55,
    levels: [
      { cost: 90, damage: 10, range: 120, fireRate: 0.8 },
      { cost: 110, damage: 16, range: 130, fireRate: 0.85 },
      { cost: 160, damage: 24, range: 140, fireRate: 0.9 }
    ]
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
  },
  orco: {
    id: "orco",
    name: "Orco",
    hp: 48,
    speed: 46,
    reward: 9,
    xp: 4,
    radius: 13,
    bodyColor: "#7a6a3a",
    darkColor: "#4f4526",
    damageToCastle: 8
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
  },
  {
    label: "Oleada 2",
    groups: [
      { type: "goblin", count: 12, interval: 0.7, delay: 0 },
      { type: "orco", count: 6, interval: 1.3, delay: 3 }
    ]
  }
];

// ---- Constantes generales del loop ----
const GAME_CONFIG = {
  countdownBeforeWave: 3, // segundos de cuenta regresiva antes de iniciar
  targetFPS: 60
};
