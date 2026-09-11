import { and, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bots, conversations, messages } from "@/db/schema";

export interface ConversationItem {
  id: string;
  title: string;
  botId: string;
  botName: string;
  messageCount: number;
  timeDisplay: string;
  updatedAt: Date;
  group: "TODAY" | "YESTERDAY" | "EARLIER";
}

export interface ConversationsData {
  conversations: ConversationItem[];
  bots: { id: string; name: string }[];
}

export interface ConversationsFilters {
  botId?: string;
  search?: string;
}

function formatConversationTime(date: Date): string {
  const now = new Date();
  const isToday =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getDate() === date.getDate() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getFullYear() === date.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getDateGroup(date: Date): ConversationItem["group"] {
  const now = new Date();
  const isToday =
    now.getDate() === date.getDate() &&
    now.getMonth() === date.getMonth() &&
    now.getFullYear() === date.getFullYear();

  if (isToday) return "TODAY";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getDate() === date.getDate() &&
    yesterday.getMonth() === date.getMonth() &&
    yesterday.getFullYear() === date.getFullYear();

  if (isYesterday) return "YESTERDAY";

  return "EARLIER";
}

export async function getConversations(
  userId: string,
  filters: ConversationsFilters = {},
): Promise<ConversationsData> {
  // Fetch all bots owned by this user (for filter dropdown)
  const userBots = await db
    .select({ id: bots.id, name: bots.name })
    .from(bots)
    .where(eq(bots.userId, userId))
    .orderBy(bots.name);

  const userBotIds = userBots.map((b) => b.id);

  if (userBotIds.length === 0) {
    return { conversations: [], bots: [] };
  }

  // Build where conditions
  const conditions = [inArray(conversations.botId, userBotIds)];

  if (filters.botId) {
    conditions.push(eq(conversations.botId, filters.botId));
  }

  if (filters.search) {
    conditions.push(ilike(conversations.title, `%${filters.search}%`));
  }

  // Fetch conversations with message count + bot name
  const rows = await db
    .select({
      conversation: conversations,
      messageCount: count(messages.id),
      botName: bots.name,
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .innerJoin(bots, eq(bots.id, conversations.botId))
    .where(and(...conditions))
    .groupBy(conversations.id, bots.name)
    .orderBy(desc(conversations.updatedAt));

  const items: ConversationItem[] = rows.map(
    ({ conversation, messageCount, botName }) => ({
      id: conversation.id,
      title: conversation.title || "Untitled Conversation",
      botId: conversation.botId,
      botName: botName,
      messageCount: Number(messageCount),
      timeDisplay: formatConversationTime(conversation.updatedAt),
      updatedAt: conversation.updatedAt,
      group: getDateGroup(conversation.updatedAt),
    }),
  );

  return { conversations: items, bots: userBots };
}
