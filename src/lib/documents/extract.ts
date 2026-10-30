// Procesador de documentos — extrae el texto de un .docx o .pdf
// cargado por la profesora. No interpreta el contenido (eso es tarea
// del motor pedagógico / AIService): acá solo se saca el texto plano
// y se detectan documentos vacíos o ilegibles.
import mammoth from 'mammoth';

export type ExtractionResult =
  | { success: true; text: string }
  | { success: false; error: string };

const MIN_CARACTERES_UTILES = 40;

export async function extractTextFromDocx(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const { value } = await mammoth.extractRawText({ buffer });
    const texto = value.trim();

    if (texto.length < MIN_CARACTERES_UTILES) {
      return { success: false, error: 'El documento Word no tiene contenido de texto suficiente para analizar.' };
    }

    return { success: true, text: texto };
  } catch {
    return { success: false, error: 'No se pudo leer el archivo Word — puede estar dañado o en un formato no soportado.' };
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractionResult> {
  try {
    // Import dinámico — mismo motivo que en otros extractores basados
    // en pdfjs: evita cargar el worker de PDF.js en el top-level del
    // archivo si esta función nunca se termina llamando.
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });

    try {
      const resultado = await parser.getText();
      const texto = resultado.text.trim();

      if (texto.length < MIN_CARACTERES_UTILES) {
        return {
          success: false,
          error: 'El PDF no tiene texto extraíble suficiente — puede ser un escaneo de imágenes sin texto real.',
        };
      }

      return { success: true, text: texto };
    } finally {
      await parser.destroy();
    }
  } catch {
    return { success: false, error: 'No se pudo leer el archivo PDF — puede estar dañado, protegido o corrupto.' };
  }
}

export async function extractText(buffer: Buffer, sourceType: 'docx' | 'pdf'): Promise<ExtractionResult> {
  return sourceType === 'docx' ? extractTextFromDocx(buffer) : extractTextFromPdf(buffer);
}
