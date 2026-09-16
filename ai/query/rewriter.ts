import { extractHistoryEntities, isLikelyFollowUp } from "./analyzer";
import type { QueryRewriteInput, QueryRewriteResult } from "./types";

/**
 * Builds a standalone retrieval query without adding another LLM call to the hot
 * path. Short follow-ups get the recent topic/entities appended so vector and
 * lexical search have enough subject context.
 */
export function rewriteQueryForRetrieval(
  input: QueryRewriteInput,
): QueryRewriteResult {
  const originalQuery = input.query.trim();
  const historyEntities = extractHistoryEntities(input.history);
  const botName = input.botName?.trim();
  const isFollowUp = isLikelyFollowUp(originalQuery);

  const contextTerms = new Set<string>();
  for (const entity of historyEntities) contextTerms.add(entity);
  if (botName && contextTerms.size > 0) {
    contextTerms.add(botName.toLowerCase());
  }

  const standaloneQuery =
    isFollowUp && contextTerms.size > 0
      ? `${originalQuery} ${Array.from(contextTerms).join(" ")}`
      : originalQuery;

  return {
    originalQuery,
    standaloneQuery,
    historyEntities,
    isFollowUp,
  };
}
