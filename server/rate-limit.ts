const windows = new Map<string, { count: number; expiresAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

export function getClientAddress(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export function consumeRateLimit(key: string): boolean {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || current.expiresAt <= now) {
    windows.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return true;
  }

  if (current.count >= MAX_REQUESTS) return false;

  current.count += 1;
  return true;
}
