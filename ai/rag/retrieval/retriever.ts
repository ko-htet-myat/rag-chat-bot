import { embedText } from "@/ai/runtime/embeddings";
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
 * Extracts entities and proper nouns from recent conversation turns
 * so follow-up questions (e.g. "ဘယ်လိုဆက်သွယ်ရမလဲ") retain the conversation's subject (e.g. "innovix").
 */
function extractContextualEntities(history?: ModelMessage[]): string[] {
  if (!history || history.length === 0) return [];
  const recent = history
    .slice(-4)
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join(" ");
  const latinWords = recent.match(/[a-zA-Z0-9_-]{3,}/g) || [];
  return Array.from(new Set(latinWords.map((w) => w.toLowerCase())));
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
  const isNonLatin = /[^\u0000-\u007F]/.test(query);

  // Cross-lingual embedding naturally yields lower cosine similarity (~0.18 - 0.28).
  const effectiveFloor = isNonLatin
    ? Math.min(threshold, 0.18)
    : Math.min(threshold, 0.3);

  // 1. Extract base keywords from current query
  const keywords = extractKeywords(query);

  // 2. Expand with bilingual intent synonyms (e.g. "ဆက်သွယ်" -> "contact", "phone")
  const intentKeywords: string[] = [];
  for (const [burmeseTerm, englishTerms] of Object.entries(
    BILINGUAL_INTENT_MAP,
  )) {
    if (query.includes(burmeseTerm)) {
      intentKeywords.push(...englishTerms);
    }
  }

  // 3. Extract contextual entities from prior turns (e.g. "innovix")
  const historyEntities = extractContextualEntities(options?.history);

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
  const enrichmentParts = [query];
  if (historyEntities.length > 0) {
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

  return matches;
}
