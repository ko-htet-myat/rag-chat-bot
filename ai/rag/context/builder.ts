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
  maxChunksPerDocument?: number;
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
  const maxChunksPerDocument = options.maxChunksPerDocument ?? 3;
  const seenContent = new Set<string>();
  const context: RagContextChunk[] = [];
  const overflow: VectorSearchResult[] = [];
  const documentCounts = new Map<string, number>();
  let usedCharacters = 0;

  for (const match of matches) {
    const documentKey = match.documentId ?? match.documentName;
    const documentCount = documentCounts.get(documentKey) ?? 0;

    if (documentCount >= maxChunksPerDocument) {
      overflow.push(match);
      continue;
    }

    if (
      tryAddContextChunk({
        match,
        minSimilarity,
        maxCharacters,
        seenContent,
        context,
        getUsedCharacters: () => usedCharacters,
        setUsedCharacters: (value) => {
          usedCharacters = value;
        },
      })
    ) {
      documentCounts.set(documentKey, documentCount + 1);
    }

    if (context.length >= maxChunks) break;
  }

  for (const match of overflow) {
    if (context.length >= maxChunks) break;
    tryAddContextChunk({
      match,
      minSimilarity,
      maxCharacters,
      seenContent,
      context,
      getUsedCharacters: () => usedCharacters,
      setUsedCharacters: (value) => {
        usedCharacters = value;
      },
    });
  }

  return context;
}

function tryAddContextChunk(params: {
  match: VectorSearchResult;
  minSimilarity: number;
  maxCharacters: number;
  seenContent: Set<string>;
  context: RagContextChunk[];
  getUsedCharacters: () => number;
  setUsedCharacters: (value: number) => void;
}) {
  const {
    match,
    minSimilarity,
    maxCharacters,
    seenContent,
    context,
    getUsedCharacters,
    setUsedCharacters,
  } = params;

  if (match.similarity < minSimilarity) return false;

  const normalized = normalizeContent(match.content);
  if (seenContent.has(normalized)) return false;

  const usedCharacters = getUsedCharacters();
  const remaining = maxCharacters - usedCharacters;
  if (remaining <= 0) return false;

  const content =
    match.content.length > remaining
      ? trimToBoundary(match.content, remaining)
      : match.content;

  if (content.trim().length <= 20) return false;

  seenContent.add(normalized);
  setUsedCharacters(usedCharacters + content.length);
  context.push({
    chunkId: match.chunkId,
    content,
    documentName: match.documentName,
    similarity: match.similarity,
    chunkIndex: match.chunkIndex,
    heading: match.heading,
  });
  return true;
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
