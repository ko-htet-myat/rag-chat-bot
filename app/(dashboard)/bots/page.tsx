import { headers } from "next/headers";
import { count, desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bots, conversations, widgetConfigs } from "@/db/schema";
import { BotsList } from "@/features/bots/components/bots-list";
import type { BotItem } from "@/features/bots/components/bots-list-shared";

export const metadata = {
  title: "My Bots",
};

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return "just now";

  const units: [number, string][] = [
    [60, "minute"],
    [60 * 60, "hour"],
    [60 * 60 * 24, "day"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24 * 30, "month"],
  ];

  for (const [size, label] of units) {
    const value = Math.round(abs / size);
    if (value >= 1) {
      return `${value} ${label}${value > 1 ? "s" : ""} ago`;
    }
  }
  return date.toLocaleDateString();
}

async function getBots(userId: string): Promise<BotItem[]> {
  const rows = await db
    .select({
      bot: bots,
      conversationCount: count(conversations.id),
      widgetEnabled: widgetConfigs.enabled,
    })
    .from(bots)
    .leftJoin(conversations, eq(conversations.botId, bots.id))
    .leftJoin(widgetConfigs, eq(widgetConfigs.botId, bots.id))
    .where(eq(bots.userId, userId))
    .groupBy(bots.id, widgetConfigs.enabled)
    .orderBy(desc(bots.updatedAt));

  return rows.map(({ bot, conversationCount, widgetEnabled }) => ({
    id: bot.id,
    name: bot.name,
    description: bot.description,
    model: bot.model,
    status: widgetEnabled ? "active" : "inactive",
    conversations: conversationCount,
    updatedAt: formatRelativeTime(bot.updatedAt),
  }));
}

export default async function BotsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const bots = session ? await getBots(session.user.id) : [];

  return <BotsList bots={bots} />;
}
