import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { ChatService } from "@/server/services/chat.service";

export const chatRoutes = new Hono();

/**
 * POST /api/chat/test
 *
 * Internal dashboard endpoint — streams text by default with X-Conversation-Id header.
 * If body contains { stream: false }, falls back to returning full JSON payload.
 *
 * Thin route: auth → validate → ChatService.streamReply / generateReply.
 * Zero DB calls, zero AI SDK imports, zero fetch() calls here.
 */
chatRoutes.post("/test", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => null);
  if (!body?.botId || !body?.message) {
    return c.json({ error: "Missing botId or message" }, 400);
  }

  const { botId, message, conversationId, stream = true } = body as {
    botId: string;
    message: string;
    conversationId?: string;
    stream?: boolean;
  };

  try {
    if (stream === false) {
      const result = await ChatService.generateReply({
        botId,
        userId: session.user.id,
        message,
        conversationId,
      });

      return c.json({
        success: true,
        conversationId: result.conversationId,
        assistantMessage: {
          id: result.assistantMessageId,
          content: result.text,
        },
      });
    }

    const { response, conversationId: convId } = await ChatService.streamReply({
      botId,
      userId: session.user.id,
      message,
      conversationId,
    });

    const headers = new Headers(response.headers);
    headers.set("X-Conversation-Id", convId);
    headers.set("Access-Control-Expose-Headers", "X-Conversation-Id");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    if (msg === "Bot not found") return c.json({ error: msg }, 404);
    return c.json({ error: msg }, 500);
  }
});

/**
 * GET /api/chat/messages/:conversationId
 *
 * Fetches conversation history. Thin: auth → service → respond.
 */
chatRoutes.get("/messages/:conversationId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const conversationId = c.req.param("conversationId");

  const msgs = await ChatService.getMessages(conversationId);
  return c.json({ success: true, messages: msgs });
});
