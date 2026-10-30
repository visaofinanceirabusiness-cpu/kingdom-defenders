// Proveedor DEMO — se usa cuando no hay ANTHROPIC_API_KEY configurada
// (ver service.ts). Nunca debe fingir ser un análisis real: todo el
// contenido que genera queda marcado como demo (ver isDemo), y el
// frontend tiene que mostrar un aviso visible cuando lo usa — no
// ocultarlo como si fuera IA de verdad.
import type { AIProvider } from './provider';
import type { MaterialAnalysis } from './schemas';

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
}
