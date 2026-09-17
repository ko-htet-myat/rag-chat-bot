import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { bots, conversations, messages, widgetConfigs } from "@/db/schema";
import { buildRagSystemPrompt } from "@/ai/prompts/system";
import { buildRagContext } from "@/ai/rag/context/builder";
import { retrieve } from "@/ai/rag/retrieval/retriever";
import { streamResponse } from "@/ai/runtime/stream";
import { generateResponse } from "@/ai/runtime/generate";
import { isOriginAllowed } from "@/server/widget-origin";
import type { ModelMessage } from "ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WidgetChatParams {
  publicKey: string;
  message: string;
  conversationId?: string;
  requestOrigin?: string;
  requestId?: string;
  abortSignal?: AbortSignal;
}

export interface WidgetChatResult {
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  text: string;
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function resolveWidget(publicKey: string) {
  const [row] = await db
    .select({ widget: widgetConfigs, bot: bots })
    .from(widgetConfigs)
    .innerJoin(bots, eq(bots.id, widgetConfigs.botId))
    .where(eq(widgetConfigs.publicKey, publicKey));
  return row ?? null;
}

async function getOrCreateWidgetConversation(
  botId: string,
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
        ),
      );
    return conversationId;
  }

  const title =
    firstMessage.length > 40 ? `${firstMessage.slice(0, 40)}...` : firstMessage;

  const [conv] = await db
    .insert(conversations)
    .values({ botId, title })
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
  options?: {
    history?: ModelMessage[];
    botName?: string;
    modelId?: string;
    requestId?: string;
    abortSignal?: AbortSignal;
  },
) {
  try {
    return await retrieve(botId, message, 5, 0.5, options);
  } catch (error) {
    console.error("Widget knowledge-base retrieval failed", {
      botId,
      message,
      error,
    });
    return [] as Awaited<ReturnType<typeof retrieve>>;
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const WidgetService = {
  async resolve(publicKey: string, requestOrigin?: string) {
    const row = await resolveWidget(publicKey);
    if (!row) throw new Error("Widget not found");

    const { widget, bot } = row;
    if (!widget.enabled) throw new Error("Widget is disabled");
    if (!isOriginAllowed(widget.allowedOrigins ?? [], requestOrigin)) {
      throw new Error("Origin not allowed");
    }

    return { widget, bot };
  },

  async getConfig(publicKey: string, requestOrigin?: string) {
    const { widget, bot } = await WidgetService.resolve(
      publicKey,
      requestOrigin,
    );
    const theme =
      (widget.theme as { color?: string; displayName?: string }) ?? {};

    return {
      enabled: widget.enabled,
      publicKey: widget.publicKey,
      botName: bot.name,
      displayName: theme.displayName ?? bot.name,
      welcomeMessage:
        widget.welcomeMessage ?? "Hi there! How can I help you today? 👋",
      position: widget.position,
      themeColor: theme.color ?? "#6366f1",
    };
  },

  /**
   * Streams a widget chat reply.
   * RAG runs in parallel with history load and user message saving
   * before the LLM is called to minimize TTFT.
   */
  async streamReply(params: WidgetChatParams): Promise<{
    response: Response;
    conversationId: string;
    userMessageId: string;
  }> {
    const {
      publicKey,
      message,
      conversationId: incomingConvId,
      requestOrigin,
      requestId,
      abortSignal,
    } = params;

    const { bot } = await WidgetService.resolve(publicKey, requestOrigin);
    const convId = await getOrCreateWidgetConversation(
      bot.id,
      message,
      incomingConvId,
    );

    const history = incomingConvId
      ? await loadHistory(convId)
      : ([] as ModelMessage[]);

    // RAG retrieval and user message persistence run in parallel
    const [chunks, userMsg] = await Promise.all([
      retrieveKnowledgeBase(bot.id, message, {
        history,
        botName: bot.name,
        modelId: bot.model,
        requestId,
        abortSignal,
      }),
      saveMessage(convId, "user", message),
    ]);

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
   * Non-streaming widget chat (returns full text).
   */
  async generateReply(params: WidgetChatParams): Promise<WidgetChatResult> {
    const {
      publicKey,
      message,
      conversationId: incomingConvId,
      requestOrigin,
      requestId,
      abortSignal,
    } = params;

    const { bot } = await WidgetService.resolve(publicKey, requestOrigin);
    const convId = await getOrCreateWidgetConversation(
      bot.id,
      message,
      incomingConvId,
    );

    const history = incomingConvId
      ? await loadHistory(convId)
      : ([] as ModelMessage[]);

    // RAG retrieval and user message persistence run in parallel
    const [chunks, userMsg] = await Promise.all([
      retrieveKnowledgeBase(bot.id, message, {
        history,
        botName: bot.name,
        modelId: bot.model,
        requestId,
        abortSignal,
      }),
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
};
