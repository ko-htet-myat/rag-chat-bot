import { generateText } from "ai";
import type { ModelMessage } from "ai";
import { getModel } from "./models";

export interface GenerateParams {
  modelId: string;
  systemPrompt: string;
  messages: ModelMessage[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateResult {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Generates a complete (non-streaming) text response.
 *
 * This is the ONLY place in the app that calls `generateText` from the AI SDK.
 * Services delegate here — they never import generateText directly.
 */
export async function generateResponse(
  params: GenerateParams,
): Promise<GenerateResult> {
  const { modelId, systemPrompt, messages, temperature, maxOutputTokens } = params;

  const result = await generateText({
    model: getModel(modelId),
    system: systemPrompt,
    messages,
    temperature,
    maxOutputTokens,
  });

  return {
    text: result.text,
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
  };
}
