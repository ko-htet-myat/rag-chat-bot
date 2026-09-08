"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bots, knowledgeBases } from "@/db/schema";
import { authClient } from "@/lib/safe-action";
import { deleteKnowledgeBaseSchema } from "../validations";

export const deleteKnowledgeBaseAction = authClient
  .inputSchema(deleteKnowledgeBaseSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.auth.user.id;

    // Verify ownership: knowledgeBase belongs to a bot owned by the authenticated user
    const [target] = await db
      .select({
        id: knowledgeBases.id,
        name: knowledgeBases.name,
      })
      .from(knowledgeBases)
      .innerJoin(bots, eq(knowledgeBases.botId, bots.id))
      .where(
        and(eq(knowledgeBases.id, parsedInput.id), eq(bots.userId, userId)),
      );

    if (!target) {
      throw new Error(
        "Knowledge base not found or you do not have permission to delete it.",
      );
    }

    await db
      .delete(knowledgeBases)
      .where(eq(knowledgeBases.id, parsedInput.id));

    revalidatePath("/knowledge");

    return {
      success: true,
      knowledgeBase: target,
    };
  });
