import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { WidgetService } from "@/server/services/widget.service";
import { consumeRateLimit, getClientAddress } from "@/server/rate-limit";
import { toHttpError } from "@/server/http-errors";
import { getRequestId, withRequestId } from "@/server/request-tracing";

export const widgetRoutes = new Hono();

const publicKeySchema = z.string().trim().min(1).max(128);
const widgetChatSchema = z.object({
  publicKey: publicKeySchema,
  message: z.string().trim().min(1).max(4_000),
  conversationId: z.string().uuid().nullish(),
});

// CORS stays in the route — it is transport-level config, not business logic.
widgetRoutes.use(
  "*",
  cors({
    origin: (origin) => origin || null,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposeHeaders: ["X-Conversation-Id", "X-Request-Id"],
  }),
);

widgetRoutes.options(
  "*",
  (c) => {
    const origin = c.req.header("origin");
    const headers: HeadersInit = {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id",
      "Access-Control-Expose-Headers": "X-Conversation-Id, X-Request-Id",
      Vary: "Origin",
    };

    if (origin) headers["Access-Control-Allow-Origin"] = origin;

    return new Response(null, {
      status: 204,
      headers,
    });
  },
);

/**
 * GET /api/widget/config?key=pk_live_...
 *
 * Thin route: validate key → WidgetService.getConfig → respond.
 * Origin validation lives in the service.
 */
widgetRoutes.get("/config", async (c) => {
  const requestId = getRequestId(c.req.raw.headers);
  const key = c.req.query("key");
  const parsedKey = publicKeySchema.safeParse(key);
  if (!parsedKey.success) {
    return c.json({ error: "Invalid public key", requestId }, 400, {
      "X-Request-Id": requestId,
    });
  }

  if (
    !consumeRateLimit(
      `widget-config:${parsedKey.data}:${getClientAddress(c.req.raw.headers)}`,
    )
  ) {
    return c.json({ error: "Too many requests", requestId }, 429, {
      "X-Request-Id": requestId,
    });
  }

  try {
    const config = await WidgetService.getConfig(
      parsedKey.data,
      c.req.header("origin"),
    );
    return c.json(config, 200, { "X-Request-Id": requestId });
  } catch (err) {
    const httpError = toHttpError(err);
    console.error("Widget config request failed", {
      requestId,
      publicKey: parsedKey.data,
      origin: c.req.header("origin"),
      error: err,
    });
    return c.json(
      { error: httpError.message, code: httpError.code, requestId },
      httpError.status,
      { "X-Request-Id": requestId },
    );
  }
});

/**
 * POST /api/widget/chat
 *
 * Thin route: validate body → WidgetService.streamReply → return stream.
 * Zero DB calls, zero AI SDK imports, zero OpenRouter references here.
 */
widgetRoutes.post("/chat", async (c) => {
  const requestId = getRequestId(c.req.raw.headers);
  const body = await c.req.json().catch(() => null);
  const parsed = widgetChatSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid chat request", requestId }, 400, {
      "X-Request-Id": requestId,
    });
  }

  const {
    publicKey,
    message,
    conversationId: incomingConversationId,
  } = parsed.data;
  const conversationId = incomingConversationId ?? undefined;

  if (
    !consumeRateLimit(
      `widget-chat:${publicKey}:${getClientAddress(c.req.raw.headers)}`,
    )
  ) {
    return c.json({ error: "Too many requests", requestId }, 429, {
      "X-Request-Id": requestId,
    });
  }

  try {
    const { response, conversationId: responseConversationId } =
      await WidgetService.streamReply({
        publicKey,
        message,
        conversationId,
        requestOrigin: c.req.header("origin"),
        requestId,
        abortSignal: c.req.raw.signal,
      });

    const headers = withRequestId(response.headers, requestId);
    headers.set("X-Conversation-Id", responseConversationId);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    const httpError = toHttpError(err);
    console.error("Widget chat request failed", {
      requestId,
      publicKey,
      messageLength: message.length,
      conversationId: incomingConversationId,
      origin: c.req.header("origin"),
      error: err,
    });
    return c.json(
      { error: httpError.message, code: httpError.code, requestId },
      httpError.status,
      { "X-Request-Id": requestId },
    );
  }
});
