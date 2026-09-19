/* =========================================================================
   KINGDOM DEFENDERS — CONFIG CENTRAL
   Toda la data ajustable del juego vive acá. La lógica (game.js, entities.js)
   NUNCA debe tener números mágicos: siempre lee de estos objetos.
   Para agregar contenido nuevo en fases futuras, se agregan entradas acá,
   no se toca la lógica.
   ========================================================================= */

// ---- Mapas ----
// Cada mapa define su propio path (waypoints que recorren los enemigos),
// buildSpots (posiciones fijas para construir torres) y castle. Agregar un
// mapa nuevo es agregar una entrada acá: el selector de mapa (index.html) y
// el render (game.js) son genéricos y no necesitan tocarse.
const MAPS = {
  forest: {
    id: "forest",
    name: "Bosque de Ingleses",
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
    castle: { x: 900, y: 270 },
    terrainColors: { top: "#3f5c34", bottom: "#2f4527" },
    decorationType: "tree",
    decorations: [
      { x: 70, y: 60 },
      { x: 70, y: 460 },
      { x: 300, y: 480 },
      { x: 620, y: 70 },
      { x: 930, y: 90 },
      { x: 930, y: 470 },
      { x: 350, y: 350 },
      { x: 630, y: 250 }
    ]
  },
  mountain: {
    id: "mountain",
    name: "Desfiladero de Montaña",
    width: 960,
    height: 540,
    path: [
      { x: 480, y: -20 },
      { x: 480, y: 150 },
      { x: 200, y: 150 },
      { x: 200, y: 400 },
      { x: 650, y: 400 },
      { x: 650, y: 180 },
      { x: 865, y: 180 },
      { x: 865, y: 270 }
    ],
    pathWidth: 46,
    buildSpots: [
      { x: 340, y: 150 },
      { x: 60, y: 270 },
      { x: 340, y: 270 },
      { x: 200, y: 470 },
      { x: 480, y: 470 },
      { x: 760, y: 300 },
      { x: 760, y: 120 },
      { x: 900, y: 100 }
    ],
    castle: { x: 900, y: 270 },
    terrainColors: { top: "#5a5850", bottom: "#39372f" },
    decorationType: "rock",
    decorations: [
      { x: 100, y: 100 },
      { x: 80, y: 400 },
      { x: 550, y: 60 },
      { x: 780, y: 420 },
      { x: 910, y: 330 },
      { x: 600, y: 470 },
      { x: 340, y: 40 },
      { x: 900, y: 470 }
    ]
  }
};

const DEFAULT_MAP_ID = "forest";

// ---- Proyección isométrica ----
// El mapa (path, buildSpots, castle) sigue viviendo en coordenadas "de mundo"
// (0-960, 0-540): la lógica del juego (movimiento, colisión, rango) no cambia.
// Solo el render proyecta esas coordenadas a pantalla con esta transformación.
// canvasWidth/canvasHeight son mayores que el mundo porque la vista isométrica
// necesita espacio extra arriba (para la altura de sprites) y a los costados
// (el rombo resultante es más ancho que el rectángulo original).
const ISO_CONFIG = {
  canvasWidth: 960,
  canvasHeight: 670, // 640 + margen para el grosor de las paredes de la plataforma
  scaleX: 0.5,
  scaleY: 0.28,
  offsetX: 375,
  offsetY: 180
};

// ---- Castillo ----
const CASTLE_CONFIG = {
  maxHp: 150
};

// ---- Economía ----
const ECONOMY_CONFIG = {
  startingGold: 180
};

// ---- Progresión del jugador ----
// El nivel/XP del jugador persiste entre partidas (localStorage), a diferencia
// del oro/torres de una partida en curso, que se reinician con restart().
// xpToNextLevel(nivel) = round(baseXp * xpGrowth^(nivel-1)).
const PLAYER_CONFIG = {
  baseXp: 15,
  xpGrowth: 1.4,
  maxLevel: 8
};

const SAVE_CONFIG = {
  playerProgressKey: "kingdomDefenders.playerProgress",
  runStateKey: "kingdomDefenders.runState",
  soundMutedKey: "kingdomDefenders.soundMuted"
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
    unlockLevel: 2,
    levels: [
      { cost: 90, damage: 10, range: 120, fireRate: 0.8 },
      { cost: 110, damage: 16, range: 130, fireRate: 0.85 },
      { cost: 160, damage: 24, range: 140, fireRate: 0.9 }
    ]
  },
  artillery: {
    id: "artillery",
    name: "Torre de Artillería",
    icon: "💣",
    description: "Disparo lento pero muy dañino, con área de impacto. Ideal contra enemigos resistentes.",
    color: "#4a4a3a",
    accentColor: "#8a7a3a",
    projectileColor: "#d9c27a",
    projectileSpeed: 260,
    splashRadius: 65,
    maxTargets: 4,
    sellRefund: 0.55,
    unlockLevel: 4,
    levels: [
      { cost: 130, damage: 38, range: 140, fireRate: 0.45 },
      { cost: 150, damage: 55, range: 150, fireRate: 0.5 },
      { cost: 210, damage: 78, range: 160, fireRate: 0.55 }
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
  },
  darkKnight: {
    id: "darkKnight",
    name: "Caballero Oscuro",
    hp: 90,
    speed: 50,
    reward: 14,
    xp: 6,
    radius: 14,
    bodyColor: "#3a3a42",
    darkColor: "#1c1c22",
    damageToCastle: 10
  },
  troll: {
    id: "troll",
    name: "Troll",
    hp: 220,
    speed: 32,
    reward: 25,
    xp: 10,
    radius: 18,
    bodyColor: "#5a6b3a",
    darkColor: "#333d20",
    damageToCastle: 15
  },
  boss: {
    id: "boss",
    name: "Señor de la Guerra",
    hp: 900,
    speed: 28,
    reward: 150,
    xp: 60,
    radius: 26,
    bodyColor: "#6b1f2a",
    darkColor: "#3a0f14",
    damageToCastle: 30,
    isBoss: true
  }
};

// ---- Oleadas ----
// Cada oleada es una lista de grupos de spawn: { type, count, interval, delay }
// interval: segundos entre cada spawn del grupo. delay: espera antes de iniciar el grupo.
const WAVE_CONFIG = [
  {
    label: "Oleada 1",
    groups: [{ type: "goblin", count: 10, interval: 0.9, delay: 0 }]
  },
  {
    label: "Oleada 2",
    groups: [
      { type: "goblin", count: 12, interval: 0.7, delay: 0 },
      { type: "orco", count: 6, interval: 1.3, delay: 3 }
    ]
  },
  {
    label: "Oleada 3",
    groups: [
      { type: "goblin", count: 14, interval: 0.6, delay: 0 },
      { type: "orco", count: 8, interval: 1.1, delay: 2 }
    ]
  },
  {
    label: "Oleada 4",
    groups: [
      { type: "orco", count: 10, interval: 1, delay: 0 },
      { type: "darkKnight", count: 3, interval: 1.8, delay: 4 }
    ]
  },
  {
    label: "Oleada 5",
    groups: [
      { type: "goblin", count: 10, interval: 0.6, delay: 0 },
      { type: "orco", count: 10, interval: 0.9, delay: 2 },
      { type: "darkKnight", count: 5, interval: 1.6, delay: 6 }
    ]
  },
  {
    label: "Oleada 6",
    groups: [
      { type: "orco", count: 8, interval: 0.9, delay: 0 },
      { type: "darkKnight", count: 8, interval: 1.4, delay: 3 }
    ]
  },
  {
    label: "Oleada 7",
    groups: [
      { type: "darkKnight", count: 10, interval: 1.2, delay: 0 },
      { type: "troll", count: 2, interval: 2.5, delay: 6 }
    ]
  },
  {
    label: "Oleada 8",
    groups: [
      { type: "orco", count: 14, interval: 0.8, delay: 0 },
      { type: "darkKnight", count: 8, interval: 1.3, delay: 4 },
      { type: "troll", count: 3, interval: 2.2, delay: 9 }
    ]
  },
  {
    label: "Oleada 9",
    groups: [
      { type: "darkKnight", count: 10, interval: 1.1, delay: 0 },
      { type: "troll", count: 5, interval: 2, delay: 5 }
    ]
  },
  {
    label: "Oleada 10 — ¡Jefe final!",
    groups: [
      { type: "goblin", count: 6, interval: 0.8, delay: 0 },
      { type: "orco", count: 4, interval: 1, delay: 2 },
      { type: "boss", count: 1, interval: 0, delay: 8 }
    ]
  }
];

// ---- Constantes generales del loop ----
const GAME_CONFIG = {
  countdownBeforeWave: 3, // segundos de cuenta regresiva antes de iniciar
  targetFPS: 60,
  castleFlashDuration: 0.25 // segundos que dura el flash rojo al recibir daño el castillo
};

// ---- Habilidades especiales ----
// unlockLevel: nivel de jugador necesario para poder usarla.
// cooldown: segundos de espera entre usos.
// targeted: true -> el jugador debe hacer clic en el mapa para aplicarla ahí.
//           false -> se activa de inmediato sobre todos los enemigos visibles.
const ABILITY_TYPES = {
  freeze: {
    id: "freeze",
    name: "Congelar",
    icon: "❄️",
    description: "Congela a todos los enemigos en pantalla por un tiempo.",
    unlockLevel: 1,
    cooldown: 20,
    targeted: false,
    duration: 2.5
  },
  fireRain: {
    id: "fireRain",
    name: "Lluvia de Fuego",
    icon: "🔥",
    description: "Daño en área en el punto donde hagas clic.",
    unlockLevel: 2,
    cooldown: 18,
    targeted: true,
    damage: 35,
    radius: 70
  },
  lightning: {
    id: "lightning",
    name: "Rayo en Cadena",
    icon: "⚡",
    description: "Golpea al enemigo más cercano al clic y salta a otros cercanos.",
    unlockLevel: 3,
    cooldown: 15,
    targeted: true,
    damage: 28,
    maxTargets: 4,
    chainRadius: 90
  }
};

// ---- Sonido ----
// Sintetizado con Web Audio (osciladores), sin archivos de audio externos.
// wave: forma de onda. freq -> freqEnd: barrido de frecuencia durante duration (segundos).
const SOUND_TYPES = {
  build: { wave: "sine", freq: 440, freqEnd: 660, duration: 0.12, volume: 0.07 },
  upgrade: { wave: "sine", freq: 440, freqEnd: 880, duration: 0.18, volume: 0.08 },
  sell: { wave: "sine", freq: 440, freqEnd: 220, duration: 0.14, volume: 0.06 },
  death: { wave: "sawtooth", freq: 220, freqEnd: 80, duration: 0.15, volume: 0.06 },
  castleHit: { wave: "triangle", freq: 120, duration: 0.15, volume: 0.1 },
  ability: { wave: "sawtooth", freq: 300, freqEnd: 900, duration: 0.2, volume: 0.09 },
  waveStart: { wave: "square", freq: 220, freqEnd: 440, duration: 0.3, volume: 0.08 },
  levelUp: { wave: "sine", freq: 440, freqEnd: 1100, duration: 0.35, volume: 0.1 },
  victory: { wave: "sine", freq: 523, freqEnd: 1046, duration: 0.6, volume: 0.12 },
  defeat: { wave: "sawtooth", freq: 200, freqEnd: 60, duration: 0.6, volume: 0.1 }
};
