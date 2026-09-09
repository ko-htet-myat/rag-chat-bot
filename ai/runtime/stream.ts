import { streamText, createTextStreamResponse } from "ai";
import type { ModelMessage } from "ai";
import { getModel } from "./models";

export interface StreamParams {
  modelId: string;
  systemPrompt: string;
  messages: ModelMessage[];
  temperature?: number;
  maxOutputTokens?: number;
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
    maxOutputTokens,
    onFinish,
  } = params;

  const result = streamText({
    model: getModel(modelId),
    system: systemPrompt,
    messages,
    temperature,
    maxOutputTokens,
    onFinish: onFinish
      ? async ({ text, usage }) => {
          await onFinish({
            text,
            inputTokens: usage?.inputTokens,
            outputTokens: usage?.outputTokens,
          });
        }
      : undefined,
  });

  // createTextStreamResponse is the AI SDK v7 standalone helper.
  // Each text delta is UTF-8 encoded and sent as a separate chunk.
  // result.textStream is AsyncIterableStream<string> which is also a ReadableStream<string>.
  return createTextStreamResponse({ stream: result.textStream as ReadableStream<string> });
}
