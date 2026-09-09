import { sql, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { documentChunks, documents, knowledgeBases } from "@/db/schema";

export interface VectorSearchResult {
  chunkId: string;
  content: string;
  documentName: string;
  similarity: number;
}

/**
 * Performs cosine similarity search against document_chunks for a given bot's
 * knowledge base(s).
 *
 * This is the ONLY place in the codebase that writes raw SQL — required
 * because Drizzle ORM does not expose the pgvector <=> operator natively.
 *
 * @param botId      The bot whose knowledge bases to search
 * @param embedding  Query embedding vector (must be 1536 dimensions)
 * @param topK       Number of closest chunks to return (default 5)
 * @param threshold  Minimum similarity score 0-1 (default 0.5)
 */
export async function vectorSearch(
  botId: string,
  embedding: number[],
  topK = 5,
  threshold = 0.5,
): Promise<VectorSearchResult[]> {
  // 1. Find all knowledge base IDs belonging to this bot
  const kbs = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.botId, botId));

  if (kbs.length === 0) return [];

  const kbIds = kbs.map((kb) => kb.id);

  // 2. Find all document IDs inside those knowledge bases
  const docs = await db
    .select({ id: documents.id, name: documents.name })
    .from(documents)
    .where(inArray(documents.knowledgeBaseId, kbIds));

  if (docs.length === 0) return [];

  const docIds = docs.map((d) => d.id);
  const docNameMap = new Map(docs.map((d) => [d.id, d.name]));

  // 3. Vector similarity search using pgvector cosine distance (<=>)
  //    1 - distance = similarity (cosine similarity)
  const embeddingLiteral = `[${embedding.join(",")}]`;

  const rows = await db.execute<{
    id: string;
    content: string;
    document_id: string;
    similarity: number;
  }>(sql`
    SELECT
      id,
      content,
      document_id,
      1 - (embedding <=> ${sql.raw(`'${embeddingLiteral}'::vector`)}) AS similarity
    FROM document_chunks
    WHERE document_id = ANY(${sql.raw(`ARRAY[${docIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})
      AND 1 - (embedding <=> ${sql.raw(`'${embeddingLiteral}'::vector`)}) >= ${threshold}
    ORDER BY embedding <=> ${sql.raw(`'${embeddingLiteral}'::vector`)}
    LIMIT ${topK}
  `);

  return (rows.rows ?? []).map((row) => ({
    chunkId: row.id,
    content: row.content,
    documentName: docNameMap.get(row.document_id) ?? "Unknown",
    similarity: Number(row.similarity),
  }));
}
