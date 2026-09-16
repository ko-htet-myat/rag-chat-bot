import type { ModelMessage } from "ai";

const FOLLOW_UP_PATTERNS = [
  /\b(it|that|this|they|them|those|there|he|she|its|their)\b/i,
  /\b(how much|what about|tell me more|more details|contact|phone|email)\b/i,
  /^(how|what|where|when|why|which)\b/i,
  /(ဒါ|ဒီ|အဲဒါ|သူ|သူတို့|ဘယ်လို|ဘယ်မှာ|ဘယ်လောက်|ဆက်သွယ်|ဖုန်း)/,
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "you",
  "your",
  "are",
  "was",
  "were",
  "from",
  "that",
  "this",
  "what",
  "where",
  "when",
  "how",
  "please",
  "thanks",
  "hello",
  "about",
]);

export function isLikelyFollowUp(query: string): boolean {
  const trimmed = query.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  return (
    wordCount <= 6 ||
    FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(trimmed))
  );
}

export function extractHistoryEntities(history?: ModelMessage[]): string[] {
  if (!history || history.length === 0) return [];

  const recent = history
    .slice(-6)
    .map((message) =>
      typeof message.content === "string" ? message.content : "",
    )
    .join(" ");

  const latinTerms = recent.match(/[a-zA-Z][a-zA-Z0-9_-]{2,}/g) ?? [];
  const burmeseTerms = recent.match(/[\u1000-\u109F]{3,}/g) ?? [];
  const quotedTerms = Array.from(recent.matchAll(/["'“”]([^"'“”]{3,})["'“”]/g))
    .map((match) => match[1])
    .filter(Boolean);

  const terms = [...quotedTerms, ...latinTerms, ...burmeseTerms]
    .map((term) => normalizeTerm(term))
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));

  return Array.from(new Set(terms)).slice(0, 8);
}

function normalizeTerm(term: string) {
  return term
    .replace(/[၊။!?,.:;'"(){}\[\]]/g, "")
    .trim()
    .toLowerCase();
}
