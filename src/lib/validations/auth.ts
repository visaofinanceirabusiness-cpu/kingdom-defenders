import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Ingresá tu nombre completo.'),
  email: z.string().email('Ingresá un email válido.'),
  password: z.string().min(8, 'La contraseña tiene que tener al menos 8 caracteres.'),
  schoolName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Ingresá un email válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
