import type { ModelMessage } from "ai";

export interface RuntimeCacheKeyInput {
  modelId: string;
  systemPrompt: string;
  messages: ModelMessage[];
  temperature?: number;
  maxOutputTokens: number;
}

export interface RuntimeCacheValue {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

interface RuntimeCacheEntry extends RuntimeCacheValue {
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 100;
const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, RuntimeCacheEntry>();

export function createRuntimeCacheKey(input: RuntimeCacheKeyInput): string {
  return JSON.stringify(input);
}

export function getRuntimeCache(key: string): RuntimeCacheValue | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  cache.delete(key);
  cache.set(key, entry);

  return {
    text: entry.text,
    inputTokens: entry.inputTokens,
    outputTokens: entry.outputTokens,
  };
}

export function setRuntimeCache(key: string, value: RuntimeCacheValue): void {
  cache.set(key, { ...value, expiresAt: Date.now() + CACHE_TTL_MS });

  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
}

