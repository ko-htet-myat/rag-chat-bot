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

export interface WeightedKeyword {
  term: string;
  weight: number;
}

/**
 * Performs lexical / keyword search against document_chunks with weighted scoring.
 * Intent keywords (e.g. phone, email, contact) are weighted higher than ubiquitous entity names (e.g. company name)
 * and results are ordered by relevance score descending so the most specific chunks rank highest.
 */
export async function keywordSearch(
  botId: string,
  keywords: Array<string | WeightedKeyword>,
  topK = 5,
): Promise<VectorSearchResult[]> {
  if (keywords.length === 0) return [];

  const kbs = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.botId, botId));

  if (kbs.length === 0) return [];
  const kbIds = kbs.map((kb) => kb.id);

  const docs = await db
    .select({ id: documents.id, name: documents.name })
    .from(documents)
    .where(inArray(documents.knowledgeBaseId, kbIds));

  if (docs.length === 0) return [];
  const docIds = docs.map((d) => d.id);
  const docNameMap = new Map(docs.map((d) => [d.id, d.name]));

  const normalized: WeightedKeyword[] = keywords.map((k) =>
    typeof k === "string" ? { term: k, weight: 1.0 } : k,
  );

  // Build ILIKE conditions
  const conditions = normalized.map((k) => sql`content ILIKE ${`%${k.term}%`}`);
  const combinedCondition = sql.join(conditions, sql` OR `);

  // Build weighted score formula
  const scoreParts = normalized.map(
    (k) => sql`(CASE WHEN content ILIKE ${`%${k.term}%`} THEN ${k.weight} ELSE 0.0 END)`,
  );
  const combinedScore = sql.join(scoreParts, sql` + `);

  const rows = await db.execute<{
    id: string;
    content: string;
    document_id: string;
    score: number;
  }>(sql`
    SELECT
      id,
      content,
      document_id,
      (${combinedScore}) AS score
    FROM document_chunks
    WHERE document_id = ANY(${sql.raw(`ARRAY[${docIds.map((id) => `'${id}'`).join(",")}]::uuid[]`)})
      AND (${combinedCondition})
    ORDER BY (${combinedScore}) DESC
    LIMIT ${topK * 2}
  `);

  return (rows.rows ?? []).map((row) => ({
    chunkId: row.id,
    content: row.content,
    documentName: docNameMap.get(row.document_id) ?? "Unknown",
    similarity: Math.min(0.7 + Number(row.score) * 0.05, 0.95),
  }));
}

/**
 * Hybrid retrieval combining dense vector similarity with weighted lexical keyword search.
 * Deduplicates chunks and boosts items that match both vector semantics and exact keywords.
 */
export async function hybridSearch(
  botId: string,
  embedding: number[],
  keywords: Array<string | WeightedKeyword>,
  topK = 5,
  threshold = 0.5,
): Promise<VectorSearchResult[]> {
  const [vectorMatches, keywordMatches] = await Promise.all([
    vectorSearch(botId, embedding, topK * 2, threshold),
    keywordSearch(botId, keywords, topK),
  ]);

  const resultMap = new Map<string, VectorSearchResult>();

  for (const match of vectorMatches) {
    resultMap.set(match.chunkId, { ...match });
  }

  for (const match of keywordMatches) {
    const existing = resultMap.get(match.chunkId);
    if (existing) {
      // Chunk matched both dense vector AND exact keyword -> strongly boost score
      existing.similarity = Math.max(existing.similarity + 0.35, match.similarity);
    } else {
      resultMap.set(match.chunkId, match);
    }
  }

  return Array.from(resultMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}


