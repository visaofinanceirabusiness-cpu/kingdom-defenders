// Proveedor DEMO — se usa cuando no hay ANTHROPIC_API_KEY configurada
// (ver service.ts). Nunca debe fingir ser un análisis real: todo el
// contenido que genera queda marcado como demo (ver isDemo), y el
// frontend tiene que mostrar un aviso visible cuando lo usa — no
// ocultarlo como si fuera IA de verdad.
import type { AIProvider, GenerateLessonInput } from './provider';
import type { LessonGeneration, MaterialAnalysis } from './schemas';

function primeraOracion(texto: string): string {
  const match = texto.match(/[^.!?]+[.!?]/);
  return (match ? match[0] : texto.slice(0, 160)).trim();
}

export class DemoProvider implements AIProvider {
  readonly name = 'demo';
  readonly isDemo = true;

  async analyzeMaterial(input: {
    text: string;
    teacherHintTopic?: string;
    schoolYear?: string;
  }): Promise<MaterialAnalysis> {
    const tema = input.teacherHintTopic?.trim() || primeraOracion(input.text) || 'Tema sin identificar';

    return {
      subject: 'Materia a confirmar (modo DEMO)',
      topic: tema,
      summary: `[Contenido de ejemplo — modo DEMO, sin IA real conectada] Resumen generado automáticamente a partir del material cargado: ${primeraOracion(
        input.text
      )}`,
      learning_objectives: [
        'Comprender los conceptos principales del material cargado (ejemplo demo).',
        'Aplicar lo aprendido en ejercicios prácticos (ejemplo demo).',
      ],
      key_concepts: ['Concepto de ejemplo 1', 'Concepto de ejemplo 2', 'Concepto de ejemplo 3'],
      recommended_difficulty: 'medium',
      recommended_school_year: input.schoolYear?.trim() || 'A confirmar',
    };
  }

  async generateLesson(input: GenerateLessonInput): Promise<LessonGeneration> {
    const aviso = '[Contenido de ejemplo — modo DEMO, sin IA real conectada]';

    return {
      introduction: `${aviso} Bienvenidos a la clase de ${input.subject}: "${input.topic}". Hoy vamos a explorar este tema paso a paso, con ejemplos y actividades.`,
      theory: `${aviso} ${input.summary}\n\nObjetivos de esta clase:\n${input.learningObjectives.map((o) => `• ${o}`).join('\n')}`,
      examples: `${aviso} Ejemplo 1: aplicación básica del concepto central de "${input.topic}".\nEjemplo 2: un caso un poco más avanzado, para los que ya entendieron lo anterior.`,
      activities: [
        {
          gameType: 'trivia',
          title: `Trivia — ${input.topic}`,
          config: {
            duration_seconds: 120,
            questions: [
              {
                question: `(Ejemplo demo) ¿Cuál de estas opciones se relaciona mejor con "${input.topic}"?`,
                options: ['Opción de ejemplo A', 'Opción de ejemplo B', 'Opción de ejemplo C', 'Opción de ejemplo D'],
                correct_answer: 'Opción de ejemplo A',
                explanation: 'Respuesta de ejemplo — modo DEMO.',
              },
            ],
          },
        },
        {
          gameType: 'true_or_false',
          title: `Verdadero o Falso — ${input.subject}`,
          config: {
            statements: [
              { statement: `(Ejemplo demo) Afirmación sobre ${input.topic}.`, is_true: true, explanation: 'Ejemplo DEMO.' },
            ],
          },
        },
      ],
      finalChallenge: {
        gameType: 'fill_in_the_blank',
        title: `Desafío final — ${input.topic}`,
        config: {
          items: [{ text_with_blank: `(Ejemplo demo) Completá: ${input.topic} se relaciona con ___.`, correct_answer: 'ejemplo' }],
        },
      },
      evaluationSummary: `${aviso} Esta clase evalúa comprensión de "${input.topic}" mediante las actividades anteriores — ${input.learningObjectives.length} objetivo(s) de aprendizaje cubiertos.`,
    };
  }
}
