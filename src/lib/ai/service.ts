// AIService — punto de entrada único para todo lo que necesite IA en
// el resto de la app. Por decisión del producto, el contenido de las
// clases lo genera ChatGPT (OpenAI) — Anthropic queda en el código
// como alternativa (sirvió para armar el sistema y sigue
// implementando la misma interfaz), pero no es el default. Orden de
// prioridad: OPENAI_API_KEY > ANTHROPIC_API_KEY > DemoProvider. Así
// el resto del código nunca pregunta "¿qué proveedor hay?", solo
// llama a aiService.analyzeMaterial(...)/generateLesson(...) y listo.
import { AnthropicAIProvider } from './anthropic-provider';
import { OpenAIProvider } from './openai-provider';
import { DemoProvider } from './demo-provider';
import type { AIProvider } from './provider';

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openaiKey) {
    cachedProvider = new OpenAIProvider(openaiKey);
  } else if (anthropicKey) {
    cachedProvider = new AnthropicAIProvider(anthropicKey);
  } else {
    cachedProvider = new DemoProvider();
  }

  return cachedProvider;
}

export const aiService = {
  get provider() {
    return getAIProvider();
  },
  analyzeMaterial: (...args: Parameters<AIProvider['analyzeMaterial']>) => getAIProvider().analyzeMaterial(...args),
  generateLesson: (...args: Parameters<AIProvider['generateLesson']>) => getAIProvider().generateLesson(...args),
};
