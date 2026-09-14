import { embed, embedMany } from "ai";
import { openrouterProvider } from "./provider";

/** Default embedding model used for vector search throughout the app. */
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
// const EMBEDDING_MODEL = "google/gemini-embedding-001";

/**
 * Embeds a single text string into a numeric vector.
 *
 * This and embedManyTexts are the ONLY functions allowed to perform text embeddings.
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

/**
 * Embeds multiple text strings into numeric vectors in batches.
 *
 * Used during document ingestion to embed all chunks efficiently in a single or
 * batched network call rather than individual round-trips.
 */
export async function embedManyTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // Batch in chunks of 50 to avoid request size limits
  const BATCH_SIZE = 50;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const { embeddings } = await embedMany({
      model: openrouterProvider.textEmbeddingModel(EMBEDDING_MODEL),
      values: batch,
    });
    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
}
