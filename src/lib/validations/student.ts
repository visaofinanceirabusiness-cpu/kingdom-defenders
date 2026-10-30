import { z } from 'zod';

export const codigoClaseSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(6, 'El código tiene 6 caracteres.');

export const unirseSchema = z.object({
  accessCode: codigoClaseSchema,
  displayName: z
    .string()
    .trim()
    .min(2, 'Ingresá tu nombre.')
    .max(60, 'Nombre demasiado largo.'),
});
