// Proveedor con OpenAI (ChatGPT). Usa Chat Completions con
// response_format: json_object (modo JSON nativo de OpenAI, más
// confiable que pedir JSON "a mano" en el prompt) y valida todo con
// Zod antes de devolverlo — mismo principio que AnthropicAIProvider:
// nunca se confía en el JSON tal cual viene del proveedor.
import OpenAI from 'openai';
import type { AIProvider, GenerateLessonInput } from './provider';
import { lessonGenerationSchema, materialAnalysisSchema, type LessonGeneration, type MaterialAnalysis } from './schemas';

// Configurable por variable de entorno por si el día de mañana
// conviene otro modelo de OpenAI — "gpt-4o" es el default porque
// soporta bien response_format json_object y salida en español.
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  readonly isDemo = false;
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  private async pedirJsonValidado<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: { message: string }[] } } }
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const texto = response.choices[0]?.message?.content;

    if (!texto) {
      throw new Error('ChatGPT no devolvió contenido.');
    }

    let json: unknown;

    try {
      json = JSON.parse(texto);
    } catch {
      throw new Error('La respuesta de ChatGPT no es JSON válido.');
    }

    const resultado = schema.safeParse(json);

    if (!resultado.success || resultado.data === undefined) {
      throw new Error(
        `La respuesta de ChatGPT no tiene la forma esperada: ${resultado.error?.issues.map((i) => i.message).join('; ') ?? 'error desconocido'}`
      );
    }

    return resultado.data;
  }

  async analyzeMaterial(input: {
    text: string;
    teacherHintTopic?: string;
    schoolYear?: string;
  }): Promise<MaterialAnalysis> {
    const systemPrompt =
      'Sos un asistente pedagógico para docentes de nivel secundario. Respondé siempre en español, únicamente con un objeto JSON válido, sin texto adicional.';

    const userPrompt = `Analizá el siguiente material de estudio y devolvé un JSON con esta forma exacta:

{
  "subject": "materia (ej. Matemática, Historia, Biología)",
  "topic": "tema específico del material",
  "summary": "resumen breve del contenido (2-4 oraciones)",
  "learning_objectives": ["objetivo 1", "objetivo 2", ...],
  "key_concepts": ["concepto 1", "concepto 2", ...],
  "recommended_difficulty": "easy" | "medium" | "hard",
  "recommended_school_year": "año escolar recomendado (ej. 3er año)"
}

${input.teacherHintTopic ? `La profesora indicó que el tema es: "${input.teacherHintTopic}".` : ''}
${input.schoolYear ? `El año escolar indicado es: "${input.schoolYear}".` : ''}

Material:
"""
${input.text.slice(0, 12000)}
"""`;

    return this.pedirJsonValidado(systemPrompt, userPrompt, materialAnalysisSchema);
  }

  async generateLesson(input: GenerateLessonInput): Promise<LessonGeneration> {
    const systemPrompt =
      'Sos un asistente pedagógico para docentes de nivel secundario, especializado en armar clases interactivas. Respondé siempre en español, únicamente con un objeto JSON válido, sin texto adicional.';

    const userPrompt = `A partir del análisis y el material de abajo, armá una clase completa e interactiva. Devolvé un JSON con esta forma exacta:

{
  "introduction": "texto de introducción al tema, motivador, 2-3 párrafos",
  "theory": "explicación teórica clara, adaptada al nivel indicado",
  "examples": "2-3 ejemplos prácticos resueltos",
  "activities": [
    {
      "gameType": "trivia" | "true_or_false" | "fill_in_the_blank" | "memory_match" | "order",
      "title": "título de la actividad",
      "config": { ... configuración específica del tipo de juego, ver abajo ... }
    }
  ],
  "finalChallenge": {
    "gameType": "trivia" | "true_or_false" | "fill_in_the_blank" | "memory_match" | "order",
    "title": "título del desafío final (más difícil que las actividades anteriores)",
    "config": { ... }
  },
  "evaluationSummary": "breve resumen de qué evalúa esta clase y cómo"
}

Generá entre 2 y 8 actividades (no solo una), todas del tema de la clase. Todas son optativas para el alumno (no hace falta que cubran todo el temario), así que priorizá variedad de gameType por sobre cantidad — está bien repetir un tipo más de una vez si tiene sentido, pero nunca más de 5 veces el mismo.

Formato de "config" según gameType:
- trivia: { "duration_seconds": number, "questions": [{ "question": string, "options": string[] (2 a 6), "correct_answer": string (debe estar en options), "explanation": string }] }
- true_or_false: { "statements": [{ "statement": string, "is_true": boolean, "explanation": string }] }
- fill_in_the_blank: { "items": [{ "text_with_blank": string (con "___" marcando el espacio), "correct_answer": string, "hints": string[] }] }
- memory_match: { "pairs": [{ "a": string, "b": string }] (mínimo 3 pares — conceptos relacionados, ej. término/definición) }
- order: { "instruction": string, "items": [{ "label": string, "correct_position": number (0 en adelante, el orden correcto) }] (mínimo 2) }

Datos de la clase:
- Materia: ${input.subject}
- Tema: ${input.topic}
- Resumen: ${input.summary}
- Objetivos de aprendizaje: ${input.learningObjectives.join('; ')}
- Nivel de dificultad: ${input.difficulty}

Material original (para que las actividades sean fieles al contenido real, no genéricas):
"""
${input.text.slice(0, 10000)}
"""`;

    return this.pedirJsonValidado(systemPrompt, userPrompt, lessonGenerationSchema);
  }
}
