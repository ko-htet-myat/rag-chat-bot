import { embed } from "ai";
import { openrouterProvider } from "./provider";

/** Default embedding model used for vector search throughout the app. */
const EMBEDDING_MODEL = "openai/text-embedding-3-small";

/**
 * Embeds a single text string into a numeric vector.
 *
 * This is the ONLY function allowed to perform text embeddings.
 * RAG ingestion and retrieval must call this — they must never
 * reference the embedding provider directly.
 */
export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openrouterProvider.textEmbeddingModel(EMBEDDING_MODEL),
    value: text,
  });
  return embedding;
}
