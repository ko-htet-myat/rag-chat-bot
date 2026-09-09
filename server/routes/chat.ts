import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { ChatService } from "@/server/services/chat.service";

export const chatRoutes = new Hono();

/**
 * POST /api/chat/test
 *
 * Internal dashboard endpoint — returns JSON (not a stream) so the
 * BotTestChatTab component can call response.json() and read
 * { conversationId, assistantMessage: { id, content } }.
 *
 * Thin route: auth → validate → ChatService.generateReply → return JSON.
 * Zero DB calls, zero AI SDK imports, zero fetch() calls here.
 */
chatRoutes.post("/test", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => null);
  if (!body?.botId || !body?.message) {
    return c.json({ error: "Missing botId or message" }, 400);
  }

  const { botId, message, conversationId } = body as {
    botId: string;
    message: string;
    conversationId?: string;
  };

  try {
    const result = await ChatService.generateReply({
      botId,
      userId: session.user.id,
      message,
      conversationId,
    });

    // Return the shape the BotTestChatTab component expects:
    // data.conversationId, data.assistantMessage.id, data.assistantMessage.content
    return c.json({
      success: true,
      conversationId: result.conversationId,
      assistantMessage: {
        id: result.assistantMessageId,
        content: result.text,
      },
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
