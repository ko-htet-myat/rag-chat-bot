import { buildSystemPrompt, type BotConfig } from "./system";

export interface RagContext {
  chunks: Array<{ content: string; source?: string }>;
}

/**
 * Builds a system prompt that includes retrieved RAG context.
 *
 * Called by the chat service when the bot has a knowledge base and
 * relevant chunks have been retrieved for the user's query.
 */
export function buildRagPrompt(bot: BotConfig, context: RagContext): string {
  const base = buildSystemPrompt(bot);

  if (context.chunks.length === 0) {
    return base;
  }

  const contextBlock = context.chunks
    .map((chunk, i) => {
      const source = chunk.source ? ` [source: ${chunk.source}]` : "";
      return `[${i + 1}]${source}\n${chunk.content}`;
    })
    .join("\n\n");

  return `${base}

---
Use the following context to answer the user's question. If the answer is not in the context, say so honestly.

CONTEXT:
${contextBlock}
---`;
}
