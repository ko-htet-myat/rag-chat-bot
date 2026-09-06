"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bots } from "@/db/schema/bots";
import { authClient } from "@/lib/safe-action";
import { updateBotSchema } from "../validations";

export const updateBotAction = authClient
  .inputSchema(updateBotSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.auth.user.id;

    const [updatedBot] = await db
      .update(bots)
      .set({
        name: parsedInput.name.trim(),
        description: parsedInput.description?.trim() || null,
        systemPrompt: parsedInput.systemPrompt.trim(),
        modelProvider: parsedInput.modelProvider,
        model: parsedInput.model.trim(),
        temperature: parsedInput.temperature,
        maxTokens: parsedInput.maxTokens ?? null,
      })
      .where(and(eq(bots.id, parsedInput.id), eq(bots.userId, userId)))
      .returning();

    if (!updatedBot) {
      throw new Error("Bot not found or unauthorized");
    }

    revalidatePath("/bots");
    revalidatePath(`/bots/${parsedInput.id}`);

    return {
      success: true,
      bot: updatedBot,
    };
  });
