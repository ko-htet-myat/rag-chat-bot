"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bots, widgetConfigs } from "@/db/schema";
import { authClient } from "@/lib/safe-action";
import { saveWidgetConfigSchema } from "../validations";

export const saveWidgetConfigAction = authClient
  .inputSchema(saveWidgetConfigSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.auth.user.id;

    // 1. Verify user owns the bot
    const [bot] = await db
      .select({ id: bots.id })
      .from(bots)
      .where(and(eq(bots.id, parsedInput.botId), eq(bots.userId, userId)));

    if (!bot) {
      throw new Error("Bot not found or unauthorized");
    }

    // 2. Update widget configuration
    const [updated] = await db
      .update(widgetConfigs)
      .set({
        enabled: parsedInput.enabled,
        welcomeMessage: parsedInput.welcomeMessage,
        position: parsedInput.position,
        theme: {
          color: parsedInput.themeColor,
          displayName: parsedInput.displayName,
        },
        allowedOrigins: parsedInput.allowedOrigins,
        updatedAt: new Date(),
      })
      .where(eq(widgetConfigs.botId, parsedInput.botId))
      .returning();

    revalidatePath("/widget");
    revalidatePath("/bots");

    return {
      success: true,
      widgetConfig: updated,
    };
  });
