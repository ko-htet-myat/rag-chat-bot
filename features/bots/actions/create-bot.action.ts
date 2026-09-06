"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { bots } from "@/db/schema/bots";
import { authClient } from "@/lib/safe-action";
import { createBotSchema } from "../validations";

export const createBotAction = authClient
  .inputSchema(createBotSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.auth.user.id;

    const [newBot] = await db
      .insert(bots)
      .values({
        userId,
        name: parsedInput.name.trim(),
        description: parsedInput.description?.trim() || null,
        systemPrompt: parsedInput.systemPrompt.trim(),
        modelProvider: parsedInput.modelProvider ?? "openrouter",
        model: parsedInput.model.trim(),
        temperature: parsedInput.temperature ?? 0.7,
        maxTokens: parsedInput.maxTokens ?? null,
      })
      .returning();

    revalidatePath("/bots");

    return {
      success: true,
      bot: newBot,
    };
  });
