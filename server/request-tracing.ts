const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]{8,128}$/;

export function getRequestId(headers: Headers): string {
  const incoming = headers.get(REQUEST_ID_HEADER)?.trim();

  if (incoming && REQUEST_ID_PATTERN.test(incoming)) {
    return incoming;
  }

  return crypto.randomUUID();
}

export function withRequestId(headers: Headers, requestId: string): Headers {
  const nextHeaders = new Headers(headers);
  nextHeaders.set("X-Request-Id", requestId);
  nextHeaders.append("Access-Control-Expose-Headers", "X-Request-Id");
  return nextHeaders;
}

