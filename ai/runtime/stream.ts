import { streamText, createTextStreamResponse } from "ai";
import type { ModelMessage } from "ai";
import { createRuntimeCacheKey, getRuntimeCache, setRuntimeCache } from "./cache";
import { getModel } from "./models";

export interface StreamParams {
  modelId: string;
  systemPrompt: string;
  messages: ModelMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  abortSignal?: AbortSignal;
  requestId?: string;
  onFinish?: (params: {
    text: string;
    inputTokens?: number;
    outputTokens?: number;
  }) => void | Promise<void>;
}

/**
 * Streams a text response and returns a standard web `Response` object
 * suitable for returning directly from a Hono route handler.
 *
 * This is the ONLY place in the app that calls `streamText` from the AI SDK.
 * Chat and widget routes delegate here — they never import streamText directly.
 */
export function streamResponse(params: StreamParams): Response {
  const {
    modelId,
    systemPrompt,
    messages,
    temperature,
    maxOutputTokens = 1000,
    abortSignal,
    requestId,
    onFinish,
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

  if (cached) {
    const stream = new ReadableStream<string>({
      async start(controller) {
        controller.enqueue(cached.text);
        if (onFinish) await onFinish(cached);
        controller.close();
      },
    });

    return createTextStreamResponse({ stream });
  }

  const result = streamText({
    model: getModel(modelId),
    system: systemPrompt,
    messages,
    temperature,
    maxOutputTokens: resolvedMaxOutputTokens,
    maxRetries: 2,
    streamRetries: 1,
    abortSignal,
    timeout: { totalMs: 60_000, stepMs: 30_000, firstChunkMs: 15_000, chunkMs: 20_000 },
    onError: ({ error }) => {
      console.error("Model stream error", { requestId, modelId, error });
    },
    onFinish: onFinish
      ? async ({ text, usage }) => {
          const value = {
            text,
            inputTokens: usage?.inputTokens,
            outputTokens: usage?.outputTokens,
          };
          setRuntimeCache(cacheKey, value);
          await onFinish(value);
        }
      : undefined,
  });

  // createTextStreamResponse is the AI SDK v7 standalone helper.
  // Each text delta is UTF-8 encoded and sent as a separate chunk.
  // result.textStream is AsyncIterableStream<string> which is also a ReadableStream<string>.
  return createTextStreamResponse({ stream: result.textStream as ReadableStream<string> });
}
