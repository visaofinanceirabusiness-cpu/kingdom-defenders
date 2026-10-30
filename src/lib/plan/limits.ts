// Límites por plan — fijos en código (decisión tomada con el
// usuario): cambiar un número es un commit chico, no hace falta
// editarlos desde Supabase. Si en el futuro hace falta venderlos o
// que el docente los vea en detalle, esto es lo único que hay que
// tocar.
export type PlanId = 'free' | 'pro';

export type PlanLimits = {
  label: string;
  aiGenerationsPerMonth: number;
  maxActiveStudents: number;
  maxSavedLessons: number;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: { label: 'Gratis', aiGenerationsPerMonth: 15, maxActiveStudents: 5, maxSavedLessons: 10 },
  pro: { label: 'Pro', aiGenerationsPerMonth: 300, maxActiveStudents: 100, maxSavedLessons: 300 },
};

export function limitsForPlan(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[plan as PlanId] ?? PLAN_LIMITS.free;
}
