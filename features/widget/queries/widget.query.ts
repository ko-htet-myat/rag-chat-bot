import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bots, widgetConfigs } from "@/db/schema";
import type { BotOption, WidgetConfigData } from "../types";

export async function getUserBots(userId: string): Promise<BotOption[]> {
  const userBots = await db
    .select({
      id: bots.id,
      name: bots.name,
    })
    .from(bots)
    .where(eq(bots.userId, userId))
    .orderBy(desc(bots.createdAt));

  return userBots;
}

export async function getOrCreateWidgetConfig(
  botId: string,
  userId: string,
): Promise<WidgetConfigData | null> {
  // 1. Verify user owns the bot
  const [bot] = await db
    .select({
      id: bots.id,
      name: bots.name,
    })
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.userId, userId)));

  if (!bot) {
    return null;
  }

  // 2. Fetch existing widget config
  const [existingConfig] = await db
    .select()
    .from(widgetConfigs)
    .where(eq(widgetConfigs.botId, botId));

  if (existingConfig) {
    const theme = (existingConfig.theme as { color?: string; displayName?: string }) || {};
    return {
      id: existingConfig.id,
      botId: existingConfig.botId,
      publicKey: existingConfig.publicKey,
      enabled: existingConfig.enabled,
      allowedOrigins: existingConfig.allowedOrigins ?? [],
      displayName: theme.displayName || bot.name,
      welcomeMessage:
        existingConfig.welcomeMessage || "Hi there! How can I help you today? 👋",
      position:
        existingConfig.position === "bottom-left" ? "bottom-left" : "bottom-right",
      themeColor: theme.color || "#6366f1",
      createdAt: existingConfig.createdAt,
      updatedAt: existingConfig.updatedAt,
    };
  }

  // 3. Create default widget config if not yet existing
  const randomSuffix = randomBytes(10).toString("hex");
  const defaultPublicKey = `pk_live_${randomSuffix}`;

  const [newConfig] = await db
    .insert(widgetConfigs)
    .values({
      botId,
      publicKey: defaultPublicKey,
      enabled: true,
      welcomeMessage: "Hi there! How can I help you today? 👋",
      position: "bottom-right",
      theme: {
        color: "#6366f1",
        displayName: bot.name,
      },
    })
    .returning();

  const theme = (newConfig.theme as { color?: string; displayName?: string }) || {};

  return {
    id: newConfig.id,
    botId: newConfig.botId,
    publicKey: newConfig.publicKey,
    enabled: newConfig.enabled,
    allowedOrigins: newConfig.allowedOrigins ?? [],
    displayName: theme.displayName || bot.name,
    welcomeMessage: newConfig.welcomeMessage || "Hi there! How can I help you today? 👋",
    position: newConfig.position === "bottom-left" ? "bottom-left" : "bottom-right",
    themeColor: theme.color || "#6366f1",
    createdAt: newConfig.createdAt,
    updatedAt: newConfig.updatedAt,
  };
}
