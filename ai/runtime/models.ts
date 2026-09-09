import type { OpenRouterChatSettings } from "@openrouter/ai-sdk-provider";
import { openrouterProvider } from "./provider";

/**
 * Returns a configured language model for the given OpenRouter model ID.
 *
 * This is the ONLY function the rest of the application should use to
 * obtain a language model — no other file should call openrouterProvider directly.
 */
export function getModel(
  modelId: string,
  settings?: OpenRouterChatSettings,
) {
  return openrouterProvider.chat(modelId, settings);
}
