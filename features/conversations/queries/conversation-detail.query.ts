import { asc, eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bots, conversations, messages } from "@/db/schema";

export interface ConversationMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  createdAt: Date;
  timeDisplay: string;
}

export interface ConversationDetailData {
  conversation: {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
  };
  bot: {
    id: string;
    name: string;
    model: string;
  };
  messages: ConversationMessage[];
  stats: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
}

function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export async function getConversationDetail(
  conversationId: string,
  userId: string,
): Promise<ConversationDetailData | null> {
  // Fetch all bot IDs owned by this user for ownership check
  const userBots = await db
    .select({ id: bots.id, name: bots.name, model: bots.model })
    .from(bots)
    .where(eq(bots.userId, userId));

  const userBotIds = userBots.map((b) => b.id);

  if (userBotIds.length === 0) return null;

  // Fetch conversation and verify it belongs to one of the user's bots
  const [conv] = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        inArray(conversations.botId, userBotIds),
      ),
    );

  if (!conv) return null;

  const bot = userBots.find((b) => b.id === conv.botId)!;

  // Fetch messages in chronological order, excluding system messages from display
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  const formattedMessages: ConversationMessage[] = rows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    model: m.model,
    inputTokens: m.inputTokens,
    outputTokens: m.outputTokens,
    createdAt: m.createdAt,
    timeDisplay: formatMessageTime(m.createdAt),
  }));

  const userMessages = rows.filter((m) => m.role === "user").length;
  const assistantMessages = rows.filter((m) => m.role === "assistant").length;
  const totalInputTokens = rows.reduce(
    (acc, m) => acc + (m.inputTokens ?? 0),
    0,
  );
  const totalOutputTokens = rows.reduce(
    (acc, m) => acc + (m.outputTokens ?? 0),
    0,
  );

  return {
    conversation: {
      id: conv.id,
      title: conv.title || "Untitled Conversation",
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    },
    bot: {
      id: bot.id,
      name: bot.name,
      model: bot.model,
    },
    messages: formattedMessages,
    stats: {
      totalMessages: rows.length,
      userMessages,
      assistantMessages,
      totalInputTokens,
      totalOutputTokens,
    },
  };
}
