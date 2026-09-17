import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { bots, conversations, messages } from "@/db/schema";
import { buildRagSystemPrompt } from "@/ai/prompts/system";
import { buildRagContext } from "@/ai/rag/context/builder";
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
  requestId?: string;
  abortSignal?: AbortSignal;
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
    const [conversation] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.botId, botId),
          eq(conversations.userId, userId),
        ),
      );

    if (!conversation) throw new Error("Conversation not found");

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.botId, botId),
          eq(conversations.userId, userId),
        ),
      );
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

async function loadHistory(
  conversationId: string,
  limit = 12,
): Promise<ModelMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return rows.reverse().map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

async function retrieveKnowledgeBase(
  botId: string,
  message: string,
  options?: { history?: ModelMessage[]; botName?: string },
) {
  try {
    return await retrieve(botId, message, 5, 0.5, options);
  } catch (error) {
    console.error("Knowledge-base retrieval failed", {
      botId,
      message,
      error,
    });
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
   *
   * Database updates and RAG retrieval are run in parallel via Promise.all
   * to minimize Time To First Token (TTFT).
   */
  async streamReply(params: SendMessageParams): Promise<{
    response: Response;
    conversationId: string;
    userMessageId: string;
  }> {
    const {
      botId,
      userId,
      message,
      conversationId: incomingConvId,
      requestId,
      abortSignal,
    } = params;

    const bot = await ChatService.getBot(botId, userId);
    const convId = await getOrCreateConversation(
      botId,
      userId,
      message,
      incomingConvId,
    );

    const history = incomingConvId
      ? await loadHistory(convId)
      : ([] as ModelMessage[]);

    // RAG retrieval and user message persistence run in parallel
    const [chunks, userMsg] = await Promise.all([
      retrieveKnowledgeBase(botId, message, { history, botName: bot.name }),
      saveMessage(convId, "user", message),
    ]);

    // Always use RAG prompt — it degrades gracefully when chunks is empty
    const ragContext = buildRagContext(chunks);
    const systemPrompt = buildRagSystemPrompt(bot, ragContext);
    const coreMessages: ModelMessage[] = [
      ...history,
      { role: "user", content: message },
    ];

    const response = streamResponse({
      modelId: bot.model,
      systemPrompt,
      messages: coreMessages,
      temperature: bot.temperature,
      maxOutputTokens: bot.maxTokens || 1000,
      requestId,
      abortSignal,
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
   * Non-streaming reply (used by backward-compatible JSON callers).
   * Same RAG flow as streamReply.
   */
  async generateReply(params: SendMessageParams): Promise<SendMessageResult> {
    const {
      botId,
      userId,
      message,
      conversationId: incomingConvId,
      requestId,
      abortSignal,
    } = params;

    const bot = await ChatService.getBot(botId, userId);
    const convId = await getOrCreateConversation(
      botId,
      userId,
      message,
      incomingConvId,
    );

    const history = incomingConvId
      ? await loadHistory(convId)
      : ([] as ModelMessage[]);

    // RAG retrieval and user message persistence run in parallel
    const [chunks, userMsg] = await Promise.all([
      retrieveKnowledgeBase(botId, message, { history, botName: bot.name }),
      saveMessage(convId, "user", message),
    ]);

    const ragContext = buildRagContext(chunks);
    const systemPrompt = buildRagSystemPrompt(bot, ragContext);
    const coreMessages: ModelMessage[] = [
      ...history,
      { role: "user", content: message },
    ];

    const { text, inputTokens, outputTokens } = await generateResponse({
      modelId: bot.model,
      systemPrompt,
      messages: coreMessages,
      temperature: bot.temperature,
      maxOutputTokens: bot.maxTokens || 1000,
      requestId,
      abortSignal,
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

  async getMessages(conversationId: string, userId: string) {
    return db
      .select({ message: messages })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .innerJoin(bots, eq(conversations.botId, bots.id))
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(conversations.userId, userId),
          eq(bots.userId, userId),
        ),
      )
      .orderBy(asc(messages.createdAt))
      .then((rows) => rows.map(({ message }) => message));
  },
};
