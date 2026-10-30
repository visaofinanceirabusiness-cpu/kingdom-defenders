// GameRegistry — único lugar que sabe "qué tipos de juego existen".
// Nada en el resto de la app debería tener un switch/if hardcodeado
// sobre game_type: todo pasa por acá, para poder sumar un juego nuevo
// agregando una entrada (y su componente de render) sin tocar el
// resto del código.
//
// Las etiquetas (label, icon, category) son el único dato realmente
// estático acá — el resto de la metadata "de negocio" (materias
// compatibles, dificultad recomendada, descripción) vive en la tabla
// game_templates, que es la fuente de verdad para el catálogo que ve
// la profesora.
import { gameConfigSchemas, type GameTypeId } from './schemas';

export type GameDefinition = {
  id: GameTypeId;
  label: string;
  icon: string;
  category: 'quiz' | 'matching' | 'sequencing' | 'random' | 'adventure' | 'arcade';
};

export const GAME_DEFINITIONS: Record<GameTypeId, GameDefinition> = {
  trivia: { id: 'trivia', label: 'Trivia', icon: '🧠', category: 'quiz' },
  true_or_false: { id: 'true_or_false', label: 'Verdadero o Falso', icon: '✅', category: 'quiz' },
  memory_match: { id: 'memory_match', label: 'Memotest', icon: '🃏', category: 'matching' },
  relate: { id: 'relate', label: 'Relacionar', icon: '🔗', category: 'matching' },
  order: { id: 'order', label: 'Ordenar', icon: '🔢', category: 'sequencing' },
  fill_in_the_blank: { id: 'fill_in_the_blank', label: 'Completar', icon: '✏️', category: 'quiz' },
  roulette: { id: 'roulette', label: 'Ruleta', icon: '🎡', category: 'random' },
  escape_room: { id: 'escape_room', label: 'Escape Room', icon: '🔐', category: 'adventure' },
  race: { id: 'race', label: 'Carrera', icon: '🏁', category: 'arcade' },
  time_challenge: { id: 'time_challenge', label: 'Desafío Contrarreloj', icon: '⏱️', category: 'arcade' },
};

export const GAME_TYPE_IDS = Object.keys(GAME_DEFINITIONS) as GameTypeId[];

// De los 10 tipos del catálogo, estos son los que YA tienen un
// componente de render implementado (ver src/components/games/) —
// son los únicos que el generador de clases (Fase 2) le puede pedir a
// la IA, para no terminar con una actividad guardada que la profesora
// no puede ni previsualizar. Sumar un renderer nuevo es agregar su
// id acá (y el componente, y el case en GameRenderer) — el resto del
// catálogo (memory_match, relate, order, roulette, escape_room, race,
// time_challenge) ya tiene su schema de configuración listo, falta
// solo el componente visual.
export const RENDERABLE_GAME_TYPE_IDS: GameTypeId[] = ['trivia', 'true_or_false', 'fill_in_the_blank', 'memory_match', 'order'];

export function isValidGameType(id: string): id is GameTypeId {
  return id in GAME_DEFINITIONS;
}

export function isRenderableGameType(id: string): boolean {
  return (RENDERABLE_GAME_TYPE_IDS as string[]).includes(id);
}

export type ValidationResult =
  | { success: true; config: unknown }
  | { success: false; error: string };

// Valida una configuración de actividad contra el schema del tipo de
// juego correspondiente — se usa tanto al guardar lo que edita la
// profesora como al validar lo que devuelve la IA (ver AIService),
// así nunca se persiste ni se renderiza una config con forma inválida.
export function validateGameConfig(gameType: string, config: unknown): ValidationResult {
  if (!isValidGameType(gameType)) {
    return { success: false, error: `Tipo de juego desconocido: "${gameType}".` };
  }

  const schema = gameConfigSchemas[gameType];
  const result = schema.safeParse(config);

  if (!result.success) {
    return { success: false, error: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }

  return { success: true, config: result.data };
}
