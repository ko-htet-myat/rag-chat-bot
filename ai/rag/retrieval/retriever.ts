import { embedText } from "@/ai/runtime/embeddings";
import { rewriteQueryForRetrieval } from "@/ai/query/rewriter";
import {
  hybridSearch,
  type VectorSearchResult,
  type WeightedKeyword,
} from "./pg-vector";

export type { VectorSearchResult };

import type { ModelMessage } from "ai";

/**
 * Common bilingual intent dictionary to bridge Burmese user queries
 * with English document chunks (e.g. "ဆက်သွယ်" -> contact, phone, hotline).
 */
const BILINGUAL_INTENT_MAP: Record<string, string[]> = {
  ဆက်သွယ်: ["contact", "call", "phone", "email", "hotline"],
  ဖုန်း: ["phone", "hotline", "call", "mobile", "tel"],
  အီးမေးလ်: ["email", "mail"],
  လိပ်စာ: ["address", "location", "visit", "office"],
  ရုံး: ["office", "building", "location", "address"],
  စျေးနှုန်း: ["price", "pricing", "cost", "fee", "rate"],
  ဝန်ဆောင်မှု: ["service", "services", "solution", "solutions"],
};

export interface RetrieveOptions {
  history?: ModelMessage[];
  botName?: string;
}

const RAG_DEBUG_ENABLED = process.env.RAG_DEBUG === "true";

/**
 * Extracts searchable keywords from the query.
 * Strips common Burmese grammatical particles and compound suffixes so root words
 * (e.g. "နွားထိုးကြီး" from "နွားထိုးကြီးမြို့ရဲ့") match text in the knowledge base.
 */
export function extractKeywords(text: string): string[] {
  const particles = [
    "အကြောင်း",
    "များ",
    "မြို့ရဲ့",
    "ရွာရဲ့",
    "မြို့၏",
    "ရွာ၏",
    "မြို့",
    "ရွာ",
    "ရဲ့",
    "၏",
    "မှာ",
    "တွင်",
    "က",
    "ကို",
    "သို့",
    "နှင့်",
    "နဲ့",
    "အခြေအနေ",
    "ဆိုတာ",
    "ဘာလဲ",
    "ဘယ်လို",
  ];

  const clean = text.replace(/[၊။!?,.:;'"()]/g, " ");
  const words = clean.split(/\s+/).filter((w) => w.length >= 2);
  const terms = new Set<string>();

  for (const w of words) {
    terms.add(w);
    let stripped = w;
    for (const p of particles) {
      if (stripped.endsWith(p) && stripped.length > p.length + 1) {
        stripped = stripped.slice(0, -p.length);
        terms.add(stripped);
      }
    }
  }

  return Array.from(terms).filter((t) => t.length >= 2);
}

/**
 * Retrieves the most relevant knowledge-base chunks for a given query using Hybrid Search:
 * Dense vector embeddings + Lexical keyword matching.
 *
 * Automatically:
 * 1. Enriches short / follow-up queries with recent conversation subject entities.
 * 2. Maps common bilingual intents (e.g. Burmese "ဆက်သွယ်" -> English "contact", "phone").
 * 3. Adapts the similarity floor for multilingual / Burmese queries.
 */
export async function retrieve(
  botId: string,
  query: string,
  topK = 5,
  threshold = 0.5,
  options?: RetrieveOptions,
): Promise<VectorSearchResult[]> {
  const rewritten = rewriteQueryForRetrieval({
    query,
    history: options?.history,
    botName: options?.botName,
  });
  const retrievalQuery = rewritten.standaloneQuery;
  const isNonLatin = /[^\u0000-\u007F]/.test(retrievalQuery);

  // Cross-lingual embedding naturally yields lower cosine similarity (~0.18 - 0.28).
  const effectiveFloor = isNonLatin
    ? Math.min(threshold, 0.18)
    : Math.min(threshold, 0.3);

  // 1. Extract base keywords from current query
  const keywords = extractKeywords(retrievalQuery);

  // 2. Expand with bilingual intent synonyms (e.g. "ဆက်သွယ်" -> "contact", "phone")
  const intentKeywords: string[] = [];
  for (const [burmeseTerm, englishTerms] of Object.entries(
    BILINGUAL_INTENT_MAP,
  )) {
    if (retrievalQuery.includes(burmeseTerm)) {
      intentKeywords.push(...englishTerms);
    }
  }

  // 3. Extract contextual entities from prior turns (e.g. "innovix")
  const historyEntities = rewritten.historyEntities;

  // Combine keywords for lexical search with prioritized weighting:
  // - Current query words & Intent synonyms (e.g. "contact", "phone", "call") get high weight (3.0)
  // - Broad background entity names (e.g. "innovix" repeated on every chunk) get lower weight (1.0)
  //   so they provide context without crowding out specific intent chunks.
  const weightedKeywords: WeightedKeyword[] = [
    ...keywords.map((k) => ({ term: k, weight: 3.0 })),
    ...intentKeywords.map((k) => ({ term: k, weight: 3.0 })),
    ...historyEntities.map((e) => ({ term: e, weight: 1.0 })),
  ];

  // 4. Enrich query for dense vector embedding
  const enrichmentParts = [retrievalQuery];
  if (!rewritten.isFollowUp && historyEntities.length > 0) {
    enrichmentParts.push(historyEntities.join(" "));
  }
  if (intentKeywords.length > 0) {
    enrichmentParts.push(intentKeywords.slice(0, 3).join(" "));
  }
  const enrichedQuery = enrichmentParts.join(" ");

  const embedding = await embedText(enrichedQuery);

  const matches = await hybridSearch(
    botId,
    embedding,
    weightedKeywords,
    topK,
    effectiveFloor,
  );

  logRetrievalDebug({
    botId,
    originalQuery: query,
    retrievalQuery,
    enrichedQuery,
    effectiveFloor,
    topK,
    keywords,
    intentKeywords,
    historyEntities,
    isFollowUp: rewritten.isFollowUp,
    matches,
  });

  return matches;
}

function logRetrievalDebug(params: {
  botId: string;
  originalQuery: string;
  retrievalQuery: string;
  enrichedQuery: string;
  effectiveFloor: number;
  topK: number;
  keywords: string[];
  intentKeywords: string[];
  historyEntities: string[];
  isFollowUp: boolean;
  matches: VectorSearchResult[];
}) {
  if (!RAG_DEBUG_ENABLED) return;

  const {
    botId,
    originalQuery,
    retrievalQuery,
    enrichedQuery,
    effectiveFloor,
    topK,
    keywords,
    intentKeywords,
    historyEntities,
    isFollowUp,
    matches,
  } = params;

  console.info("[RAG] retrieval", {
    botId,
    originalQuery,
    retrievalQuery,
    enrichedQuery,
    isFollowUp,
    effectiveFloor,
    topK,
    keywords,
    intentKeywords,
    historyEntities,
    matchCount: matches.length,
    matches: matches.map((match, index) => ({
      rank: index + 1,
      chunkId: match.chunkId,
      documentId: match.documentId,
      documentName: match.documentName,
      chunkIndex: match.chunkIndex,
      heading: match.heading,
      similarity: Number(match.similarity.toFixed(4)),
      preview: createPreview(match.content),
    })),
  });
}

function createPreview(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, 180);
}
