import type { ModelMessage } from "ai";

export interface QueryRewriteInput {
  query: string;
  history?: ModelMessage[];
  botName?: string;
}

export interface QueryRewriteResult {
  originalQuery: string;
  standaloneQuery: string;
  historyEntities: string[];
  isFollowUp: boolean;
}
