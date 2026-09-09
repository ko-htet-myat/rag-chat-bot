import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { bots, conversations, messages } from "@/db/schema";
import { buildRagSystemPrompt } from "@/ai/prompts/system";
import { retrieve } from "@/ai/rag/retrieval/retriever";
import { streamResponse } from "@/ai/runtime/stream";
import { generateResponse } from "@/ai/runtime/generate";
import type { ModelMessage } from "ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendMessageParams {
  botId: string;
  userId: string;
  message: string;
  conversationId?: string;
}

export interface SendMessageResult {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  text: string;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function fetchBot(botId: string, userId: string) {
  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)));
  return bot ?? null;
}

async function getOrCreateConversation(
  botId: string,
  userId: string,
  firstMessage: string,
  conversationId?: string,
): Promise<string> {
  if (conversationId) {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
    return conversationId;
  }

  const title =
    firstMessage.length > 40 ? `${firstMessage.slice(0, 40)}...` : firstMessage;

  const [conv] = await db
    .insert(conversations)
    .values({ botId, userId, title })
    .returning();

  return conv.id;
}

async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  model?: string,
  inputTokens?: number,
  outputTokens?: number,
) {
  const [msg] = await db
    .insert(messages)
    .values({ conversationId, role, content, model, inputTokens, outputTokens })
    .returning();
  return msg;
}

async function loadHistory(conversationId: string): Promise<ModelMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return rows.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

async function retrieveKnowledgeBase(botId: string, message: string) {
  try {
    return await retrieve(botId, message);
  } catch {
    return [] as Awaited<ReturnType<typeof retrieve>>;
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const ChatService = {
  async getBot(botId: string, userId: string) {
    const bot = await fetchBot(botId, userId);
    if (!bot) throw new Error("Bot not found");
    return bot;
  },

  /**
   * Streams a reply. RAG is run first: the query is embedded, relevant
   * chunks are retrieved from the bot's knowledge base, and the system
   * prompt is enriched with that context before calling the LLM.
   */
  async streamReply(params: SendMessageParams): Promise<{
    response: Response;
    conversationId: string;
    userMessageId: string;
  }> {
    const { botId, userId, message, conversationId: incomingConvId } = params;

    const bot = await ChatService.getBot(botId, userId);
    const convId = await getOrCreateConversation(
      botId,
      userId,
      message,
      incomingConvId,
    );

    const [history, chunks] = await Promise.all([
      incomingConvId
        ? loadHistory(convId)
        : Promise.resolve<ModelMessage[]>([]),
      retrieveKnowledgeBase(botId, message),
    ]);

    const userMsg = await saveMessage(convId, "user", message);

    // Always use RAG prompt — it degrades gracefully when chunks is empty
    const systemPrompt = buildRagSystemPrompt(bot, chunks);
    const coreMessages: ModelMessage[] = [
      ...history,
      { role: "user", content: message },
    ];

    const response = streamResponse({
      modelId: bot.model,
      systemPrompt,
      messages: coreMessages,
      temperature: bot.temperature,
      maxOutputTokens: bot.maxTokens ?? undefined,
      onFinish: async ({ text, inputTokens, outputTokens }) => {
        await saveMessage(
          convId,
          "assistant",
          text,
          bot.model,
          inputTokens,
          outputTokens,
        );
      },
    });

    return { response, conversationId: convId, userMessageId: userMsg.id };
  },

  /**
   * Non-streaming reply (used by the dashboard test chat).
   * Same RAG flow as streamReply.
   */
  async generateReply(params: SendMessageParams): Promise<SendMessageResult> {
    const { botId, userId, message, conversationId: incomingConvId } = params;

    const bot = await ChatService.getBot(botId, userId);
    const convId = await getOrCreateConversation(
      botId,
      userId,
      message,
      incomingConvId,
    );

    const [history, chunks] = await Promise.all([
      incomingConvId
        ? loadHistory(convId)
        : Promise.resolve<ModelMessage[]>([]),
      retrieveKnowledgeBase(botId, message),
    ]);

    const userMsg = await saveMessage(convId, "user", message);

    const systemPrompt = buildRagSystemPrompt(bot, chunks);
    const coreMessages: ModelMessage[] = [
      ...history,
      { role: "user", content: message },
    ];

    const { text, inputTokens, outputTokens } = await generateResponse({
      modelId: bot.model,
      systemPrompt,
      messages: coreMessages,
      temperature: bot.temperature,
      maxOutputTokens: bot.maxTokens ?? undefined,
    });

    const assistantMsg = await saveMessage(
      convId,
      "assistant",
      text,
      bot.model,
      inputTokens,
      outputTokens,
    );

    return {
      conversationId: convId,
      userMessageId: userMsg.id,
      assistantMessageId: assistantMsg.id,
      text,
    };
  },

  async getMessages(conversationId: string) {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  },
};
