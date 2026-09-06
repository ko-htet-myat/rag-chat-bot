import { Hono } from "hono";
import { cors } from "hono/cors";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bots, conversations, messages, widgetConfigs } from "@/db/schema";

export const widgetRoutes = new Hono();

// Enable CORS for all public widget endpoints
widgetRoutes.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Explicit OPTIONS handler for CORS preflight
widgetRoutes.options("*", () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
});

// GET /api/widget/config?key=pk_live_...
widgetRoutes.get("/config", async (c) => {
  const key = c.req.query("key");

  if (!key) {
    return c.json({ error: "Missing public key query parameter 'key'" }, 400);
  }

  const [row] = await db
    .select({
      widget: widgetConfigs,
      bot: bots,
    })
    .from(widgetConfigs)
    .innerJoin(bots, eq(bots.id, widgetConfigs.botId))
    .where(eq(widgetConfigs.publicKey, key));

  if (!row) {
    return c.json({ error: "Widget not found" }, 404);
  }

  const { widget, bot } = row;

  // Origin check if configured (always permits localhost/127.0.0.1 for development)
  const requestOrigin = c.req.header("origin");
  if (
    widget.allowedOrigins &&
    widget.allowedOrigins.length > 0 &&
    requestOrigin
  ) {
    const isLocalhost =
      requestOrigin.startsWith("http://localhost:") ||
      requestOrigin.startsWith("http://127.0.0.1:") ||
      requestOrigin === "http://localhost" ||
      requestOrigin === "http://127.0.0.1";

    const isAllowed =
      isLocalhost ||
      widget.allowedOrigins.some(
        (origin) =>
          origin === requestOrigin ||
          origin === "*" ||
          requestOrigin.endsWith(`.${origin.replace(/^\*\./, "")}`),
      );
    if (!isAllowed) {
      return c.json({ error: "Origin not allowed" }, 403);
    }
  }

  const theme = (widget.theme as { color?: string; displayName?: string }) || {};

  return c.json({
    enabled: widget.enabled,
    publicKey: widget.publicKey,
    botName: bot.name,
    displayName: theme.displayName || bot.name,
    welcomeMessage:
      widget.welcomeMessage || "Hi there! How can I help you today? 👋",
    position: widget.position,
    themeColor: theme.color || "#6366f1",
  });
});

// POST /api/widget/chat
widgetRoutes.post("/chat", async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || !body.publicKey || !body.message) {
    return c.json({ error: "Missing publicKey or message in request body" }, 400);
  }

  const { publicKey, message, conversationId } = body;

  const [row] = await db
    .select({
      widget: widgetConfigs,
      bot: bots,
    })
    .from(widgetConfigs)
    .innerJoin(bots, eq(bots.id, widgetConfigs.botId))
    .where(eq(widgetConfigs.publicKey, publicKey));

  if (!row) {
    return c.json({ error: "Widget not found" }, 404);
  }

  const { widget, bot } = row;

  if (!widget.enabled) {
    return c.json({ error: "This widget is currently disabled" }, 403);
  }

  // Origin validation if configured (always permits localhost/127.0.0.1 for development)
  const requestOrigin = c.req.header("origin");
  if (
    widget.allowedOrigins &&
    widget.allowedOrigins.length > 0 &&
    requestOrigin
  ) {
    const isLocalhost =
      requestOrigin.startsWith("http://localhost:") ||
      requestOrigin.startsWith("http://127.0.0.1:") ||
      requestOrigin === "http://localhost" ||
      requestOrigin === "http://127.0.0.1";

    const isAllowed =
      isLocalhost ||
      widget.allowedOrigins.some(
        (origin) =>
          origin === requestOrigin ||
          origin === "*" ||
          requestOrigin.endsWith(`.${origin.replace(/^\*\./, "")}`),
      );
    if (!isAllowed) {
      return c.json({ error: "Origin not allowed" }, 403);
    }
  }

  let activeConvId = conversationId;

  if (!activeConvId) {
    const title =
      message.length > 40 ? `${message.slice(0, 40)}...` : message;
    const [newConv] = await db
      .insert(conversations)
      .values({
        botId: bot.id,
        title,
      })
      .returning();
    activeConvId = newConv.id;
  } else {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, activeConvId));
  }

  // Insert user message
  const [userMsg] = await db
    .insert(messages)
    .values({
      conversationId: activeConvId,
      role: "user",
      content: message,
    })
    .returning();

  // Generate response
  let replyContent = "";
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: bot.model,
            temperature: bot.temperature,
            max_tokens: bot.maxTokens || 1024,
            messages: [
              { role: "system", content: bot.systemPrompt },
              { role: "user", content: message },
            ],
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        replyContent =
          data.choices?.[0]?.message?.content ||
          "I'm sorry, I couldn't generate a response at this time.";
      }
    } catch {
      // Fallback
    }
  }

  if (!replyContent) {
    if (
      message.toLowerCase().includes("return") ||
      message.toLowerCase().includes("refund")
    ) {
      replyContent =
        "You can return any product within 30 days of delivery for a full refund or exchange. Please contact our support team with your order details.";
    } else if (
      message.toLowerCase().includes("reset") &&
      message.toLowerCase().includes("password")
    ) {
      replyContent =
        "To reset your password, visit the login page and click 'Forgot Password'. A reset link will be sent to your registered email.";
    } else {
      replyContent = `Hello! I am ${bot.name}. How can I assist you with your questions today?`;
    }
  }

  // Insert assistant message
  const [assistantMsg] = await db
    .insert(messages)
    .values({
      conversationId: activeConvId,
      role: "assistant",
      content: replyContent,
      model: bot.model,
    })
    .returning();

  return c.json({
    success: true,
    conversationId: activeConvId,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
  });
});
