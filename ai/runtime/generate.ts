import { generateText } from "ai";
import type { ModelMessage } from "ai";
import { createRuntimeCacheKey, getRuntimeCache, setRuntimeCache } from "./cache";
import { getModel } from "./models";

export interface GenerateParams {
  modelId: string;
  systemPrompt: string;
  messages: ModelMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  abortSignal?: AbortSignal;
  requestId?: string;
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
  const {
    modelId,
    systemPrompt,
    messages,
    temperature,
    maxOutputTokens = 1000,
    abortSignal,
    requestId,
  } = params;

  const resolvedMaxOutputTokens = maxOutputTokens || 1000;
  const cacheKey = createRuntimeCacheKey({
    modelId,
    systemPrompt,
    messages,
    temperature,
    maxOutputTokens: resolvedMaxOutputTokens,
  });
  const cached = getRuntimeCache(cacheKey);
  if (cached) return cached;

  const result = await generateText({
    model: getModel(modelId),
    system: systemPrompt,
    messages,
    temperature,
    maxOutputTokens: resolvedMaxOutputTokens,
    maxRetries: 2,
    abortSignal,
    timeout: { totalMs: 45_000, stepMs: 30_000 },
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.error("Model generation timed out", { requestId, modelId });
      throw new Error("Model request timed out");
    }
    throw error;
  });

  const value = {
    text: result.text,
    inputTokens: result.usage?.inputTokens,
    outputTokens: result.usage?.outputTokens,
  };
  setRuntimeCache(cacheKey, value);
  return value;
}
