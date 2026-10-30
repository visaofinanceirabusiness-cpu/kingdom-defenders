// Esquemas de validación (Zod) para la configuración de cada tipo de
// juego — son la fuente de verdad en el código (game_templates.config_schema
// en la base es una copia en JSON Schema, para que el motor pueda
// introspeccionar qué campos tiene cada juego sin importar TypeScript).
//
// Toda configuración que viene de la IA (AIService) o del editor de
// clases pasa por acá antes de guardarse o renderizarse — nunca se
// confía en el JSON tal cual llega. Ver GameRegistry.validate().
import { z } from 'zod';

const optionsMin2 = z.array(z.string().min(1)).min(2).max(6);

export const triviaConfigSchema = z.object({
  title: z.string().min(1).optional(),
  duration_seconds: z.number().int().positive().max(3600).default(120),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: optionsMin2,
        correct_answer: z.string().min(1),
        explanation: z.string().optional(),
        image_url: z.string().url().optional(),
      })
    )
    .min(1),
});

export const trueOrFalseConfigSchema = z.object({
  title: z.string().min(1).optional(),
  statements: z
    .array(
      z.object({
        statement: z.string().min(1),
        is_true: z.boolean(),
        explanation: z.string().optional(),
        image_url: z.string().url().optional(),
      })
    )
    .min(1),
});

export const memoryMatchConfigSchema = z.object({
  title: z.string().min(1).optional(),
  pairs: z.array(z.object({ a: z.string().min(1), b: z.string().min(1) })).min(3),
});

export const relateConfigSchema = z.object({
  title: z.string().min(1).optional(),
  pairs: z.array(z.object({ concept: z.string().min(1), definition: z.string().min(1) })).min(3),
});

export const orderConfigSchema = z.object({
  title: z.string().min(1).optional(),
  instruction: z.string().optional(),
  items: z
    .array(z.object({ label: z.string().min(1), correct_position: z.number().int().nonnegative() }))
    .min(2),
});

export const fillInTheBlankConfigSchema = z.object({
  title: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        text_with_blank: z.string().min(1),
        correct_answer: z.string().min(1),
        hints: z.array(z.string()).optional(),
        image_url: z.string().url().optional(),
      })
    )
    .min(1),
});

export const rouletteConfigSchema = z.object({
  title: z.string().min(1).optional(),
  segments: z
    .array(
      z.object({
        label: z.string().min(1),
        question: z.string().min(1),
        correct_answer: z.string().min(1),
      })
    )
    .min(2),
});

export const escapeRoomConfigSchema = z.object({
  title: z.string().min(1).optional(),
  narrative_intro: z.string().optional(),
  stages: z
    .array(
      z.object({
        puzzle: z.string().min(1),
        hint: z.string().optional(),
        correct_answer: z.string().min(1),
      })
    )
    .min(1),
});

export const raceConfigSchema = z.object({
  title: z.string().min(1).optional(),
  track_length: z.number().int().positive().max(50).default(10),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: optionsMin2,
        correct_answer: z.string().min(1),
      })
    )
    .min(1),
});

export const timeChallengeConfigSchema = z.object({
  title: z.string().min(1).optional(),
  duration_seconds: z.number().int().positive().max(600).default(60),
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        options: optionsMin2,
        correct_answer: z.string().min(1),
      })
    )
    .min(1),
});

// Mapa id -> schema — usado por GameRegistry para validar la config
// de una activity antes de guardarla o de pasársela al componente que
// la renderiza. Agregar un juego nuevo es agregar una entrada acá +
// su fila en game_templates + su componente de render — nada más
// necesita tocarse (ver GameRegistry en registry.ts).
export const gameConfigSchemas = {
  trivia: triviaConfigSchema,
  true_or_false: trueOrFalseConfigSchema,
  memory_match: memoryMatchConfigSchema,
  relate: relateConfigSchema,
  order: orderConfigSchema,
  fill_in_the_blank: fillInTheBlankConfigSchema,
  roulette: rouletteConfigSchema,
  escape_room: escapeRoomConfigSchema,
  race: raceConfigSchema,
  time_challenge: timeChallengeConfigSchema,
} as const;

export type GameTypeId = keyof typeof gameConfigSchemas;

export type GameConfigFor<T extends GameTypeId> = z.infer<(typeof gameConfigSchemas)[T]>;
