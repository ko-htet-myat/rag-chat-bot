import { embedText } from "@/ai/runtime/embeddings";
import { vectorSearch, type VectorSearchResult } from "./pg-vector";

export type { VectorSearchResult };

/**
 * Retrieves the most relevant knowledge-base chunks for a given query.
 *
 * Flow:
 *   query string
 *     → embedText()        (ai/runtime/embeddings)
 *     → vectorSearch()     (pgvector cosine similarity)
 *     → VectorSearchResult[]
 *
 * Services call this — they never call embedText or vectorSearch directly.
 *
 * Returns an empty array when the bot has no knowledge base or no
 * chunks exceed the similarity threshold.
 */
export async function retrieve(
  botId: string,
  query: string,
  topK = 5,
  threshold = 0.5,
): Promise<VectorSearchResult[]> {
  const embedding = await embedText(query);
  const matches = await vectorSearch(botId, embedding, topK, threshold);
  if (matches.length > 0 || threshold !== 0.5) return matches;

  // Multilingual queries can score lower against an English knowledge base.
  return vectorSearch(botId, embedding, topK, 0.3);
}
