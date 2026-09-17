import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: ContentfulStatusCode,
    readonly code: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;

  const message = error instanceof Error ? error.message : "Internal server error";

  switch (message) {
    case "Bot not found":
    case "Conversation not found":
    case "Widget not found":
      return new HttpError(message, 404, "not_found");
    case "Origin not allowed":
    case "Widget is disabled":
      return new HttpError(message, 403, "forbidden");
    case "Model request timed out":
      return new HttpError(message, 504, "model_timeout");
    default:
      return new HttpError(message, 500, "internal_error");
  }
}
