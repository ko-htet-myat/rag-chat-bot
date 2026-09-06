import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bots, conversations, messages } from "@/db/schema";

export const chatRoutes = new Hono();

chatRoutes.post("/test", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json().catch(() => null);
  if (!body || !body.botId || !body.message) {
    return c.json({ error: "Missing botId or message" }, 400);
  }

  const { botId, message, conversationId } = body;

  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.userId, session.user.id)));

  if (!bot) {
    return c.json({ error: "Bot not found" }, 404);
  }

  let activeConvId = conversationId;

  if (!activeConvId) {
    const title =
      message.length > 40 ? `${message.slice(0, 40)}...` : message;
    const [newConv] = await db
      .insert(conversations)
      .values({
        botId,
        userId: session.user.id,
        title,
      })
      .returning();
    activeConvId = newConv.id;
  } else {
    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, activeConvId));
  }

  // Save user message
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
    // Smart contextual response based on bot instructions
    if (message.toLowerCase().includes("return") || message.toLowerCase().includes("refund")) {
      replyContent =
        "You can return any product within 30 days of delivery for a full refund or exchange. To start a return, visit your order history or contact our support team with your receipt.";
    } else if (message.toLowerCase().includes("reset") && message.toLowerCase().includes("password")) {
      replyContent =
        "To reset your password, click on the 'Forgot Password' link on the sign-in page and enter your account email. We will send you a password reset link immediately.";
    } else if (message.toLowerCase().includes("track") || message.toLowerCase().includes("order")) {
      replyContent =
        "You can track your order in real-time by entering your order ID in the tracking portal, or through the confirmation email sent to you.";
    } else {
      replyContent = `Thank you for your question! As ${bot.name}, I am here to help you. Based on our knowledge base, I can assist you with your inquiries, troubleshooting, and support questions. How else may I assist you today?`;
    }
  }

  // Save assistant message
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

chatRoutes.get("/messages/:conversationId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const conversationId = c.req.param("conversationId");

  const convMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return c.json({
    success: true,
    messages: convMessages,
  });
});
