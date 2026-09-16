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
  ကုမ္ပဏီ: ["company", "business", "organization"],
  အဖွဲ့အစည်း: ["organization", "company", "team"],
  တည်ထောင်: ["founded", "established", "started"],
  စတင်: ["started", "launched", "founded"],
  နှစ်: ["year", "date"],
  အချိန်: ["hours", "time", "schedule"],
  ဖွင့်: ["open", "opening", "available"],
  ပိတ်: ["closed", "closing", "unavailable"],
  နေရာ: ["location", "address", "place"],
  ဘယ်မှာ: ["where", "location", "address"],
  ဘယ်သူ: ["who", "person", "founder", "owner"],
  ဘာ: ["what", "information", "details"],
  အကျိုးကျေးဇူး: ["benefit", "advantage", "value"],
  လုပ်ဆောင်ချက်: ["feature", "function", "capability"],
  ရည်ရွယ်ချက်: ["purpose", "mission", "goal"],
};

const ENGLISH_TO_BURMESE_INTENT_MAP: Record<string, string[]> = {
  contact: ["ဆက်သွယ်", "ဖုန်း", "အီးမေးလ်"],
  phone: ["ဖုန်း", "ဆက်သွယ်"],
  email: ["အီးမေးလ်", "ဆက်သွယ်"],
  address: ["လိပ်စာ", "နေရာ"],
  location: ["လိပ်စာ", "နေရာ", "ဘယ်မှာ"],
  price: ["စျေးနှုန်း"],
  pricing: ["စျေးနှုန်း"],
  cost: ["စျေးနှုန်း"],
  service: ["ဝန်ဆောင်မှု"],
  services: ["ဝန်ဆောင်မှု"],
  company: ["ကုမ္ပဏီ"],
  founded: ["တည်ထောင်", "စတင်"],
  established: ["တည်ထောင်"],
  founder: ["ဘယ်သူ", "တည်ထောင်"],
  year: ["နှစ်"],
  hours: ["အချိန်", "ဖွင့်", "ပိတ်"],
  feature: ["လုပ်ဆောင်ချက်"],
  features: ["လုပ်ဆောင်ချက်"],
  purpose: ["ရည်ရွယ်ချက်"],
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
  const historyEntities = rewritten.historyEntities;
  const queryVariants = buildQueryVariants({
    retrievalQuery,
    historyEntities,
    botName: options?.botName,
    threshold,
    isFollowUp: rewritten.isFollowUp,
  });

  const variantMatches = await Promise.all(
    queryVariants.map(async (variant) => {
      const embedding = await embedText(variant.enrichedQuery);
      const matches = await hybridSearch(
        botId,
        embedding,
        variant.weightedKeywords,
        Math.max(topK, 8),
        variant.effectiveFloor,
      );

      return { variant, matches };
    }),
  );

  const matches = mergeAndDiversifyResults(variantMatches, topK);

  logRetrievalDebug({
    botId,
    originalQuery: query,
    retrievalQuery,
    topK,
    historyEntities,
    isFollowUp: rewritten.isFollowUp,
    queryVariants,
    matches,
  });

  return matches;
}

interface QueryVariant {
  label: "primary" | "english-bridge" | "burmese-bridge";
  query: string;
  enrichedQuery: string;
  effectiveFloor: number;
  keywords: string[];
  intentKeywords: string[];
  weightedKeywords: WeightedKeyword[];
}

function buildQueryVariants(params: {
  retrievalQuery: string;
  historyEntities: string[];
  botName?: string;
  threshold: number;
  isFollowUp: boolean;
}): QueryVariant[] {
  const {
    retrievalQuery,
    historyEntities,
    botName,
    threshold,
    isFollowUp,
  } = params;
  const isNonLatin = /[^\u0000-\u007F]/.test(retrievalQuery);
  const effectiveFloor = isNonLatin
    ? Math.min(threshold, 0.18)
    : Math.min(threshold, 0.3);
  const keywords = extractKeywords(retrievalQuery);
  const intentKeywords = expandIntentKeywords(retrievalQuery, isNonLatin);
  const primaryEnrichmentParts = [retrievalQuery];

  if (!isFollowUp && historyEntities.length > 0) {
    primaryEnrichmentParts.push(historyEntities.join(" "));
  }
  if (intentKeywords.length > 0) {
    primaryEnrichmentParts.push(intentKeywords.slice(0, 6).join(" "));
  }

  const variants: QueryVariant[] = [
    {
      label: "primary",
      query: retrievalQuery,
      enrichedQuery: primaryEnrichmentParts.join(" "),
      effectiveFloor,
      keywords,
      intentKeywords,
      weightedKeywords: buildWeightedKeywords(
        keywords,
        intentKeywords,
        historyEntities,
      ),
    },
  ];

  const bridgeTerms = isNonLatin
    ? expandMyanmarToEnglish(retrievalQuery)
    : expandEnglishToMyanmar(retrievalQuery);

  if (bridgeTerms.length > 0) {
    const contextTerms = [
      ...bridgeTerms,
      ...historyEntities.filter((term) => /[a-z0-9_-]/i.test(term)),
    ];
    if (botName && contextTerms.length > 0) {
      contextTerms.push(botName);
    }

    variants.push({
      label: isNonLatin ? "english-bridge" : "burmese-bridge",
      query: unique(contextTerms).join(" "),
      enrichedQuery: unique([retrievalQuery, ...contextTerms]).join(" "),
      effectiveFloor: isNonLatin ? Math.min(threshold, 0.16) : effectiveFloor,
      keywords: unique(contextTerms),
      intentKeywords: bridgeTerms,
      weightedKeywords: buildWeightedKeywords(
        unique(contextTerms),
        bridgeTerms,
        historyEntities,
      ),
    });
  }

  return variants;
}

function buildWeightedKeywords(
  keywords: string[],
  intentKeywords: string[],
  historyEntities: string[],
): WeightedKeyword[] {
  return [
    ...keywords.map((term) => ({ term, weight: 3.0 })),
    ...intentKeywords.map((term) => ({ term, weight: 3.0 })),
    ...historyEntities.map((term) => ({ term, weight: 1.0 })),
  ];
}

function expandIntentKeywords(query: string, isNonLatin: boolean) {
  return isNonLatin ? expandMyanmarToEnglish(query) : expandEnglishToMyanmar(query);
}

function expandMyanmarToEnglish(query: string) {
  const terms: string[] = [];
  for (const [burmeseTerm, englishTerms] of Object.entries(BILINGUAL_INTENT_MAP)) {
    if (query.includes(burmeseTerm)) {
      terms.push(...englishTerms);
    }
  }
  return unique(terms);
}

function expandEnglishToMyanmar(query: string) {
  const lowerQuery = query.toLowerCase();
  const terms: string[] = [];
  for (const [englishTerm, burmeseTerms] of Object.entries(
    ENGLISH_TO_BURMESE_INTENT_MAP,
  )) {
    if (lowerQuery.includes(englishTerm)) {
      terms.push(...burmeseTerms);
    }
  }
  return unique(terms);
}

function mergeAndDiversifyResults(
  variantMatches: Array<{ variant: QueryVariant; matches: VectorSearchResult[] }>,
  topK: number,
) {
  const resultMap = new Map<
    string,
    VectorSearchResult & { score: number; queryLabels: string[] }
  >();

  for (const { variant, matches } of variantMatches) {
    matches.forEach((match, index) => {
      const rankBoost = 1 / (60 + index + 1);
      const bridgeBoost = variant.label === "primary" ? 0 : 0.015;
      const score = match.similarity + rankBoost + bridgeBoost;
      const existing = resultMap.get(match.chunkId);

      if (existing) {
        existing.score = Math.max(existing.score, score);
        existing.similarity = Math.max(existing.similarity, match.similarity);
        if (!existing.queryLabels.includes(variant.label)) {
          existing.queryLabels.push(variant.label);
        }
      } else {
        resultMap.set(match.chunkId, {
          ...match,
          score,
          queryLabels: [variant.label],
        });
      }
    });
  }

  const ranked = Array.from(resultMap.values()).sort(
    (a, b) => b.score - a.score || b.similarity - a.similarity,
  );

  return diversifyByDocument(ranked, Math.max(topK, 6)).map(
    ({ score: _score, queryLabels: _queryLabels, ...result }) => result,
  );
}

function diversifyByDocument<T extends VectorSearchResult>(
  matches: T[],
  limit: number,
) {
  const selected: T[] = [];
  const overflow: T[] = [];
  const counts = new Map<string, number>();
  const maxPerDocument = 3;

  for (const match of matches) {
    const key = match.documentId ?? match.documentName;
    const count = counts.get(key) ?? 0;

    if (count >= maxPerDocument) {
      overflow.push(match);
      continue;
    }

    selected.push(match);
    counts.set(key, count + 1);
    if (selected.length >= limit) return selected;
  }

  for (const match of overflow) {
    selected.push(match);
    if (selected.length >= limit) break;
  }

  return selected;
}

function unique(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function logRetrievalDebug(params: {
  botId: string;
  originalQuery: string;
  retrievalQuery: string;
  topK: number;
  historyEntities: string[];
  isFollowUp: boolean;
  queryVariants: QueryVariant[];
  matches: VectorSearchResult[];
}) {
  if (!RAG_DEBUG_ENABLED) return;

  const {
    botId,
    originalQuery,
    retrievalQuery,
    topK,
    historyEntities,
    isFollowUp,
    queryVariants,
    matches,
  } = params;

  console.info("[RAG] retrieval", {
    botId,
    originalQuery,
    retrievalQuery,
    isFollowUp,
    topK,
    historyEntities,
    matchCount: matches.length,
    queryVariants: queryVariants.map((variant) => ({
      label: variant.label,
      effectiveFloor: variant.effectiveFloor,
      query: variant.query,
      enrichedQuery: variant.enrichedQuery,
      keywords: variant.keywords,
      intentKeywords: variant.intentKeywords,
    })),
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
