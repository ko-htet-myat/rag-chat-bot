import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bots, documents, knowledgeBases } from "@/db/schema";
import type { KnowledgeBaseItem } from "../types";

function formatRelativeTime(date: Date): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return "just now";

  const units: [number, string][] = [
    [60, "minute"],
    [60 * 60, "hour"],
    [60 * 60 * 24, "day"],
    [60 * 60 * 24 * 7, "week"],
    [60 * 60 * 24 * 30, "month"],
    [60 * 60 * 24 * 365, "year"],
  ];

  for (const [size, label] of units) {
    const value = Math.round(abs / size);
    if (value >= 1) {
      return `${value} ${label}${value > 1 ? "s" : ""} ago`;
    }
  }
  return date.toLocaleDateString();
}

export async function getKnowledgeBases(
  userId: string,
): Promise<KnowledgeBaseItem[]> {
  const rows = await db
    .select({
      id: knowledgeBases.id,
      name: knowledgeBases.name,
      description: knowledgeBases.description,
      updatedAt: knowledgeBases.updatedAt,
      botId: bots.id,
      botName: bots.name,
      documentCount: count(documents.id),
    })
    .from(knowledgeBases)
    .innerJoin(bots, eq(knowledgeBases.botId, bots.id))
    .leftJoin(documents, eq(documents.knowledgeBaseId, knowledgeBases.id))
    .where(eq(bots.userId, userId))
    .groupBy(knowledgeBases.id, bots.id, bots.name)
    .orderBy(desc(knowledgeBases.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    documentCount: Number(row.documentCount),
    updatedAt: formatRelativeTime(row.updatedAt),
    botId: row.botId,
    botName: row.botName,
  }));
}
