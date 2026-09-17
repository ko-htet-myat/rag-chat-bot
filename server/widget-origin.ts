type OriginRule =
  | { type: "any" }
  | { type: "exact"; origin: string }
  | { type: "wildcard"; protocol: string; hostname: string; port: string };

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.pathname !== "/" || url.search || url.hash) return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

function parseOriginRule(value: string): OriginRule | null {
  const origin = value.trim().toLowerCase();
  if (origin === "*") return { type: "any" };

  if (!origin.includes("*")) {
    const normalized = normalizeOrigin(origin);
    return normalized ? { type: "exact", origin: normalized } : null;
  }

  try {
    const url = new URL(origin.replace("*.", "wildcard."));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.startsWith("wildcard.")) return null;
    if (url.pathname !== "/" || url.search || url.hash) return null;

    return {
      type: "wildcard",
      protocol: url.protocol,
      hostname: url.hostname.slice("wildcard.".length),
      port: url.port,
    };
  } catch {
    return null;
  }
}

export function normalizeRequestOrigin(requestOrigin: string | undefined): string | null {
  if (!requestOrigin) return null;
  return normalizeOrigin(requestOrigin);
}

export function isOriginAllowed(
  allowedOrigins: string[],
  requestOrigin: string | undefined,
): boolean {
  const normalizedRequestOrigin = normalizeRequestOrigin(requestOrigin);

  if (!allowedOrigins.length) return true;
  if (!normalizedRequestOrigin) return false;

  const requestUrl = new URL(normalizedRequestOrigin);

  return allowedOrigins.some((allowedOrigin) => {
    const rule = parseOriginRule(allowedOrigin);
    if (!rule) return false;
    if (rule.type === "any") return true;
    if (rule.type === "exact") return rule.origin === normalizedRequestOrigin;

    return (
      rule.protocol === requestUrl.protocol &&
      rule.port === requestUrl.port &&
      requestUrl.hostname !== rule.hostname &&
      requestUrl.hostname.endsWith(`.${rule.hostname}`)
    );
  });
}

