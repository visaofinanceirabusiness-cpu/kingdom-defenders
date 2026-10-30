// Proveedor real con Anthropic Claude. Le pide a Claude una respuesta
// en JSON puro (sin markdown, sin texto alrededor) y la valida contra
// materialAnalysisSchema antes de devolverla — si no valida, es un
// error (no se "arregla" el JSON a mano ni se le hace creer al
// llamador que todo salió bien). La IA nunca recibe permiso para
// ejecutar nada: esto es texto entrada, JSON validado salida, punto.
import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, GenerateLessonInput } from './provider';
import { lessonGenerationSchema, materialAnalysisSchema, type LessonGeneration, type MaterialAnalysis } from './schemas';

const MODEL = 'claude-sonnet-5';

function extraerJson(texto: string): unknown {
  // Claude puede envolver el JSON en ```json ... ``` pese a la
  // instrucción — se lo saca si aparece, en vez de fallar de entrada.
  const sinMarkdown = texto.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(sinMarkdown);
}

export class AnthropicAIProvider implements AIProvider {
  readonly name = 'anthropic';
  readonly isDemo = false;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  // Núcleo compartido: le manda el prompt a Claude, le pide JSON puro,
  // lo parsea y lo valida contra el schema que le pasen. Tanto
  // analyzeMaterial como generateLesson pasan por acá — nunca se
  // devuelve nada de Claude sin pasar por un safeParse de Zod primero.
  private async pedirJsonValidado<T>(prompt: string, schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: { message: string }[] } } }): Promise<T> {
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Claude no devolvió una respuesta de texto.');
    }

    let json: unknown;

    try {
      json = extraerJson(textBlock.text);
    } catch {
      throw new Error('La respuesta de Claude no es JSON válido.');
    }

    const resultado = schema.safeParse(json);

    if (!resultado.success || resultado.data === undefined) {
      throw new Error(
        `La respuesta de Claude no tiene la forma esperada: ${resultado.error?.issues.map((i) => i.message).join('; ') ?? 'error desconocido'}`
      );
    }

    return resultado.data;
  }

  async analyzeMaterial(input: {
    text: string;
    teacherHintTopic?: string;
    schoolYear?: string;
  }): Promise<MaterialAnalysis> {
    const prompt = `Sos un asistente pedagógico para docentes de nivel secundario. Analizá el siguiente material de estudio y devolvé ÚNICAMENTE un JSON (sin texto antes ni después, sin bloque de markdown) con esta forma exacta:

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

    return this.pedirJsonValidado(prompt, materialAnalysisSchema);
  }

  async generateLesson(input: GenerateLessonInput): Promise<LessonGeneration> {
    const prompt = `Sos un asistente pedagógico para docentes de nivel secundario. A partir del análisis y el material de abajo, armá una clase completa e interactiva. Devolvé ÚNICAMENTE un JSON (sin texto antes ni después, sin bloque de markdown) con esta forma exacta:

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

Generá entre 2 y 8 actividades (no solo una), todas del tema de la clase. Todas son optativas para el alumno, así que priorizá variedad de gameType por sobre cantidad — está bien repetir un tipo más de una vez si tiene sentido, pero nunca más de 5 veces el mismo.

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

    return this.pedirJsonValidado(prompt, lessonGenerationSchema);
  }
}
