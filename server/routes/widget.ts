import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { WidgetService } from "@/server/services/widget.service";
import { consumeRateLimit, getClientAddress } from "@/server/rate-limit";

export const widgetRoutes = new Hono();

const publicKeySchema = z.string().trim().min(1).max(128);
const widgetChatSchema = z.object({
  publicKey: publicKeySchema,
  message: z.string().trim().min(1).max(4_000),
  conversationId: z.string().uuid().optional(),
});

// CORS stays in the route — it is transport-level config, not business logic.
widgetRoutes.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

widgetRoutes.options(
  "*",
  () =>
    new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }),
);

/**
 * GET /api/widget/config?key=pk_live_...
 *
 * Thin route: validate key → WidgetService.getConfig → respond.
 * Origin validation lives in the service.
 */
widgetRoutes.get("/config", async (c) => {
  const key = c.req.query("key");
  const parsedKey = publicKeySchema.safeParse(key);
  if (!parsedKey.success) return c.json({ error: "Invalid public key" }, 400);

  if (
    !consumeRateLimit(
      `widget-config:${parsedKey.data}:${getClientAddress(c.req.raw.headers)}`,
    )
  ) {
    return c.json({ error: "Too many requests" }, 429);
  }

  try {
    const config = await WidgetService.getConfig(
      parsedKey.data,
      c.req.header("origin"),
    );
    return c.json(config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    if (msg === "Widget not found") return c.json({ error: msg }, 404);
    if (msg === "Origin not allowed") return c.json({ error: msg }, 403);
    if (msg === "Widget is disabled") return c.json({ error: msg }, 403);
    return c.json({ error: msg }, 500);
  }
});

/**
 * POST /api/widget/chat
 *
 * Thin route: validate body → WidgetService.streamReply → return stream.
 * Zero DB calls, zero AI SDK imports, zero OpenRouter references here.
 */
widgetRoutes.post("/chat", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = widgetChatSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid chat request" }, 400);

  const {
    publicKey,
    message,
    conversationId: incomingConversationId,
  } = parsed.data;

  if (
    !consumeRateLimit(
      `widget-chat:${publicKey}:${getClientAddress(c.req.raw.headers)}`,
    )
  ) {
    return c.json({ error: "Too many requests" }, 429);
  }

  try {
    const { response, conversationId } = await WidgetService.streamReply({
      publicKey,
      message,
      conversationId: incomingConversationId,
      requestOrigin: c.req.header("origin"),
    });

    const headers = new Headers(response.headers);
    headers.set("X-Conversation-Id", conversationId);
    headers.set("Access-Control-Expose-Headers", "X-Conversation-Id");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    if (msg === "Widget not found") return c.json({ error: msg }, 404);
    if (msg === "Conversation not found") return c.json({ error: msg }, 404);
    if (msg === "Origin not allowed") return c.json({ error: msg }, 403);
    if (msg === "Widget is disabled") return c.json({ error: msg }, 403);
    return c.json({ error: msg }, 500);
  }
});
