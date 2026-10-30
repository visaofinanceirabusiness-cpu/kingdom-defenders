// Contrato que cualquier proveedor de IA tiene que cumplir —
// AIService (service.ts) programa contra esta interfaz, nunca contra
// un SDK de proveedor puntual. Hoy existe AnthropicProvider y
// DemoProvider; sumar OpenAI/Gemini/lo que sea el día de mañana es
// escribir una clase nueva que implemente esto, sin tocar quien la
// usa.
import type { LessonGeneration, MaterialAnalysis } from './schemas';

export type GenerateLessonInput = {
  text: string;
  subject: string;
  topic: string;
  summary: string;
  learningObjectives: string[];
  difficulty: 'easy' | 'medium' | 'hard';
};

export type AIProvider = {
  readonly name: string;
  readonly isDemo: boolean;
  analyzeMaterial(input: { text: string; teacherHintTopic?: string; schoolYear?: string }): Promise<MaterialAnalysis>;
  generateLesson(input: GenerateLessonInput): Promise<LessonGeneration>;
};
