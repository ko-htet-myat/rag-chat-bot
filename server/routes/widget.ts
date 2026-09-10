import { Hono } from "hono";
import { cors } from "hono/cors";
import { WidgetService } from "@/server/services/widget.service";

export const widgetRoutes = new Hono();

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
  if (!key) {
    return c.json({ error: "Missing public key query parameter 'key'" }, 400);
  }

  try {
    const config = await WidgetService.getConfig(key, c.req.header("origin"));
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
  if (!body?.publicKey || !body?.message) {
    return c.json(
      { error: "Missing publicKey or message in request body" },
      400,
    );
  }

  const {
    publicKey,
    message,
    conversationId: incomingConversationId,
  } = body as {
    publicKey: string;
    message: string;
    conversationId?: string;
  };

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
    if (msg === "Origin not allowed") return c.json({ error: msg }, 403);
    if (msg === "Widget is disabled") return c.json({ error: msg }, 403);
    return c.json({ error: msg }, 500);
  }
});
