import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bots,
  conversations,
  documents,
  knowledgeBases,
  messages,
  widgetConfigs,
} from "@/db/schema";

export interface BotDetailData {
  bot: {
    id: string;
    name: string;
    description: string | null;
    systemPrompt: string;
    modelProvider: "openrouter";
    model: string;
    temperature: number;
    maxTokens: number | null;
    status: "active" | "inactive";
    createdAt: Date;
    updatedAt: Date;
  };
  metrics: {
    totalConversations: number;
    avgMessagesPerConv: string;
    knowledgeDocsCount: number;
  };
  recentConversations: ConversationDetailItem[];
  allConversations: ConversationDetailItem[];
  knowledgeBases: BotKnowledgeBaseItem[];
}

export interface ConversationDetailItem {
  id: string;
  title: string;
  messageCount: number;
  timeDisplay: string;
  userDisplay: string;
  updatedAt: Date;
}

export interface BotKnowledgeBaseItem {
  id: string;
  name: string;
  description: string | null;
  documentCount: number;
  updatedAtDisplay: string;
  isConnected: boolean;
}

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return "just now";

  const units: [number, string][] = [
    [60, "m"],
    [60 * 60, "h"],
    [60 * 60 * 24, "d"],
    [60 * 60 * 24 * 7, "w"],
    [60 * 60 * 24 * 30, "mo"],
  ];

  for (const [size, label] of units) {
    const value = Math.round(abs / size);
    if (value >= 1) {
      return `Updated ${value}${label} ago`;
    }
  }
  return `Updated ${date.toLocaleDateString()}`;
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

export async function getBotDetail(
  botId: string,
  userId: string,
): Promise<BotDetailData | null> {
  // 1. Fetch bot record
  const [botRow] = await db
    .select({
      bot: bots,
      widgetEnabled: widgetConfigs.enabled,
    })
    .from(bots)
    .leftJoin(widgetConfigs, eq(widgetConfigs.botId, bots.id))
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)));

  if (!botRow) {
    return null;
  }

  const { bot, widgetEnabled } = botRow;

  // 2. Fetch conversations with message count
  const rawConversations = await db
    .select({
      conversation: conversations,
      messageCount: count(messages.id),
    })
    .from(conversations)
    .leftJoin(messages, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.botId, botId))
    .groupBy(conversations.id)
    .orderBy(desc(conversations.updatedAt));

  const totalConversations = rawConversations.length;
  const totalMessages = rawConversations.reduce(
    (acc, c) => acc + Number(c.messageCount),
    0,
  );
  const avgMessagesPerConv =
    totalConversations > 0
      ? (totalMessages / totalConversations).toFixed(1)
      : "0";

  const allConversations: ConversationDetailItem[] = rawConversations.map(
    ({ conversation, messageCount }) => ({
      id: conversation.id,
      title: conversation.title || "Untitled Conversation",
      messageCount: Number(messageCount),
      timeDisplay: formatConversationTime(conversation.updatedAt),
      userDisplay: "Anonymous",
      updatedAt: conversation.updatedAt,
    }),
  );

  const recentConversations = allConversations.slice(0, 5);

  // 3. Fetch knowledge bases connected to this bot
  const kbRows = await db
    .select({
      kb: knowledgeBases,
      documentCount: count(documents.id),
    })
    .from(knowledgeBases)
    .leftJoin(documents, eq(documents.knowledgeBaseId, knowledgeBases.id))
    .where(eq(knowledgeBases.botId, botId))
    .groupBy(knowledgeBases.id)
    .orderBy(desc(knowledgeBases.updatedAt));

  const totalKnowledgeDocs = kbRows.reduce(
    (acc, item) => acc + Number(item.documentCount),
    0,
  );

  const botKnowledgeBases: BotKnowledgeBaseItem[] = kbRows.map(
    ({ kb, documentCount }) => ({
      id: kb.id,
      name: kb.name,
      description: kb.description,
      documentCount: Number(documentCount),
      updatedAtDisplay: formatRelativeTime(kb.updatedAt),
      isConnected: true,
    }),
  );

  return {
    bot: {
      id: bot.id,
      name: bot.name,
      description: bot.description,
      systemPrompt: bot.systemPrompt,
      modelProvider: bot.modelProvider,
      model: bot.model,
      temperature: bot.temperature,
      maxTokens: bot.maxTokens,
      status: (widgetEnabled ?? true) ? "active" : "inactive",
      createdAt: bot.createdAt,
      updatedAt: bot.updatedAt,
    },
    metrics: {
      totalConversations,
      avgMessagesPerConv,
      knowledgeDocsCount: totalKnowledgeDocs,
    },
    recentConversations,
    allConversations,
    knowledgeBases: botKnowledgeBases,
  };
}
