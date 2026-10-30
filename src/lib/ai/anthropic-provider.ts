// Proveedor real con Anthropic Claude. Le pide a Claude una respuesta
// en JSON puro (sin markdown, sin texto alrededor) y la valida contra
// materialAnalysisSchema antes de devolverla — si no valida, es un
// error (no se "arregla" el JSON a mano ni se le hace creer al
// llamador que todo salió bien). La IA nunca recibe permiso para
// ejecutar nada: esto es texto entrada, JSON validado salida, punto.
import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider } from './provider';
import { materialAnalysisSchema, type MaterialAnalysis } from './schemas';

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

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 2000,
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

    const resultado = materialAnalysisSchema.safeParse(json);

    if (!resultado.success) {
      throw new Error(
        `La respuesta de Claude no tiene la forma esperada: ${resultado.error.issues.map((i) => i.message).join('; ')}`
      );
    }

    return resultado.data;
  }
}
