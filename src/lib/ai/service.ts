// AIService — punto de entrada único para todo lo que necesite IA en
// el resto de la app. Elige el proveedor real (Anthropic) si hay
// ANTHROPIC_API_KEY configurada, o el DemoProvider si no — así el
// resto del código nunca pregunta "¿hay API key?", solo llama a
// aiService.analyzeMaterial(...) y listo.
import { AnthropicAIProvider } from './anthropic-provider';
import { DemoProvider } from './demo-provider';
import type { AIProvider } from './provider';

let cachedProvider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  cachedProvider = apiKey ? new AnthropicAIProvider(apiKey) : new DemoProvider();

  return cachedProvider;
}

export const aiService = {
  get provider() {
    return getAIProvider();
  },
  analyzeMaterial: (...args: Parameters<AIProvider['analyzeMaterial']>) => getAIProvider().analyzeMaterial(...args),
};
