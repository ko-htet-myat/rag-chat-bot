"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bots, knowledgeBases } from "@/db/schema";
import { authClient } from "@/lib/safe-action";
import { createKnowledgeBaseSchema } from "../validations";

export const createKnowledgeBaseAction = authClient
  .inputSchema(createKnowledgeBaseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.auth.user.id;

    // Verify target bot belongs to the authenticated user
    const [targetBot] = await db
      .select({ id: bots.id, name: bots.name })
      .from(bots)
      .where(and(eq(bots.id, parsedInput.botId), eq(bots.userId, userId)));

    if (!targetBot) {
      throw new Error(
        "Target bot not found or you do not have permission to attach knowledge to it.",
      );
    }

    const [newKb] = await db
      .insert(knowledgeBases)
      .values({
        botId: parsedInput.botId,
        name: parsedInput.name,
        description: parsedInput.description || null,
      })
      .returning();

    revalidatePath("/knowledge");
    revalidatePath(`/bots/${parsedInput.botId}`);

    return {
      success: true,
      knowledgeBase: newKb,
    };
  });
