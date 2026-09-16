import type { VectorSearchResult } from "@/ai/rag/retrieval/retriever";

export interface RagContextChunk {
  content: string;
  documentName: string;
  similarity: number;
  chunkId: string;
  chunkIndex?: number;
  heading?: string;
}

export interface RagContextBuildOptions {
  maxChunks?: number;
  maxCharacters?: number;
  minSimilarity?: number;
}

const DEFAULT_MAX_CHUNKS = 6;
const DEFAULT_MAX_CHARACTERS = 9000;

export function buildRagContext(
  matches: VectorSearchResult[],
  options: RagContextBuildOptions = {},
): RagContextChunk[] {
  const maxChunks = options.maxChunks ?? DEFAULT_MAX_CHUNKS;
  const maxCharacters = options.maxCharacters ?? DEFAULT_MAX_CHARACTERS;
  const minSimilarity = options.minSimilarity ?? 0;
  const seenContent = new Set<string>();
  const context: RagContextChunk[] = [];
  let usedCharacters = 0;

  for (const match of matches) {
    if (match.similarity < minSimilarity) continue;

    const normalized = normalizeContent(match.content);
    if (seenContent.has(normalized)) continue;

    const remaining = maxCharacters - usedCharacters;
    if (remaining <= 0 || context.length >= maxChunks) break;

    const content =
      match.content.length > remaining
        ? trimToBoundary(match.content, remaining)
        : match.content;

    if (content.trim().length <= 20) continue;

    seenContent.add(normalized);
    usedCharacters += content.length;
    context.push({
      chunkId: match.chunkId,
      content,
      documentName: match.documentName,
      similarity: match.similarity,
      chunkIndex: match.chunkIndex,
      heading: match.heading,
    });
  }

  return context;
}

function normalizeContent(content: string) {
  return content.replace(/\s+/g, " ").trim().toLowerCase().slice(0, 500);
}

function trimToBoundary(content: string, maxLength: number) {
  if (maxLength <= 120) return "";

  const slice = content.slice(0, maxLength);
  const boundary = Math.max(
    slice.lastIndexOf("\n\n"),
    slice.lastIndexOf(". "),
    slice.lastIndexOf("။"),
    slice.lastIndexOf(" "),
  );

  const end = boundary > maxLength * 0.6 ? boundary + 1 : maxLength;
  return `${slice.slice(0, end).trim()}...`;
}
