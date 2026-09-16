import { count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  bots,
  conversations,
  documents,
  knowledgeBases,
  messages,
  widgetConfigs,
} from "@/db/schema";
import type {
  DashboardData,
  RecentBotItem,
  RecentConversationItem,
} from "../types";

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
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
      return `${value}${label} ago`;
    }
  }
  return date.toLocaleDateString();
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

export async function getDashboardData(userId: string): Promise<DashboardData> {
  // 1. Fetch user's bots with conversation count and widget status
  const userBots = await db
    .select({
      bot: bots,
      widgetEnabled: widgetConfigs.enabled,
      conversationCount: count(conversations.id),
    })
    .from(bots)
    .leftJoin(widgetConfigs, eq(widgetConfigs.botId, bots.id))
    .leftJoin(conversations, eq(conversations.botId, bots.id))
    .where(eq(bots.userId, userId))
    .groupBy(bots.id, widgetConfigs.enabled)
    .orderBy(desc(bots.updatedAt));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999,
  );

  const totalBots = userBots.length;
  const botsThisMonth = userBots.filter(
    (b) => b.bot.createdAt >= startOfMonth,
  ).length;

  if (totalBots === 0) {
    return {
      metrics: {
        totalBots: 0,
        botsThisMonth: 0,
        totalConversations: 0,
        conversationsThisMonth: 0,
        conversationsGrowthPercent: null,
        knowledgeDocsCount: 0,
        knowledgeBasesCount: 0,
        isWidgetActive: false,
        widgetStatusText: "Inactive",
        widgetSubtext: "Not deployed",
      },
      recentBots: [],
      recentConversations: [],
    };
  }

  const userBotIds = userBots.map((b) => b.bot.id);
  const botMap = new Map(userBots.map((b) => [b.bot.id, b.bot.name]));

  // 2. Fetch conversations
  const userConversations = await db
    .select({
      id: conversations.id,
      botId: conversations.botId,
      title: conversations.title,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(inArray(conversations.botId, userBotIds))
    .orderBy(desc(conversations.updatedAt));

  const totalConversations = userConversations.length;
  const conversationsThisMonth = userConversations.filter(
    (c) => c.createdAt >= startOfMonth,
  ).length;
  const conversationsLastMonth = userConversations.filter(
    (c) => c.createdAt >= startOfLastMonth && c.createdAt <= endOfLastMonth,
  ).length;

  let conversationsGrowthPercent: number | null = null;
  if (conversationsLastMonth > 0) {
    conversationsGrowthPercent = Number(
      (
        ((conversationsThisMonth - conversationsLastMonth) /
          conversationsLastMonth) *
        100
      ).toFixed(1),
    );
  } else if (conversationsThisMonth > 0) {
    conversationsGrowthPercent = 100;
  }

  // 3. Fetch Knowledge Bases and Documents count
  const userKbs = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(inArray(knowledgeBases.botId, userBotIds));

  const knowledgeBasesCount = userKbs.length;
  let knowledgeDocsCount = 0;

  if (knowledgeBasesCount > 0) {
    const kbIds = userKbs.map((k) => k.id);
    const [docRow] = await db
      .select({ count: count(documents.id) })
      .from(documents)
      .where(inArray(documents.knowledgeBaseId, kbIds));
    knowledgeDocsCount = Number(docRow?.count ?? 0);
  }

  // 4. Widget status
  const isWidgetActive = userBots.some((b) => b.widgetEnabled === true);

  // 5. Recent Bots
  const recentBots: RecentBotItem[] = userBots
    .slice(0, 5)
    .map(({ bot, conversationCount, widgetEnabled }) => ({
      id: bot.id,
      name: bot.name,
      status: widgetEnabled ? "active" : "inactive",
      conversationsCount: Number(conversationCount),
      timeAgo: formatRelativeTime(bot.updatedAt),
    }));

  // 6. Recent Conversations
  const recentConvRows = userConversations.slice(0, 5);
  const convIds = recentConvRows.map((c) => c.id);
  const latestMessageMap = new Map<string, string>();

  if (convIds.length > 0) {
    const recentMessages = await db
      .select({
        conversationId: messages.conversationId,
        content: messages.content,
      })
      .from(messages)
      .where(inArray(messages.conversationId, convIds))
      .orderBy(desc(messages.createdAt));

    for (const msg of recentMessages) {
      if (!latestMessageMap.has(msg.conversationId)) {
        latestMessageMap.set(msg.conversationId, msg.content);
      }
    }
  }

  const recentConversations: RecentConversationItem[] = recentConvRows.map(
    (conv) => ({
      id: conv.id,
      botId: conv.botId,
      botName: botMap.get(conv.botId) || "Bot",
      title: conv.title || "Untitled Conversation",
      lastMessageSnippet:
        latestMessageMap.get(conv.id) ||
        conv.title ||
        "No messages in conversation",
      timeDisplay: formatConversationTime(conv.updatedAt),
      updatedAt: conv.updatedAt,
    }),
  );

  return {
    metrics: {
      totalBots,
      botsThisMonth,
      totalConversations,
      conversationsThisMonth,
      conversationsGrowthPercent,
      knowledgeDocsCount,
      knowledgeBasesCount,
      isWidgetActive,
      widgetStatusText: isWidgetActive ? "Active" : "Inactive",
      widgetSubtext: isWidgetActive ? "Deployed" : "Not deployed",
    },
    recentBots,
    recentConversations,
  };
}
