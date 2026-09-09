"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { bots, documents, knowledgeBases } from "@/db/schema";
import { authClient } from "@/lib/safe-action";

const deleteDocumentSchema = z.object({
  id: z.string().uuid("Invalid document ID"),
  knowledgeBaseId: z.string().uuid("Invalid knowledge base ID"),
});

export const deleteDocumentAction = authClient
  .inputSchema(deleteDocumentSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.auth.user.id;

    // Verify ownership: document belongs to knowledge base which belongs to bot owned by user
    const [target] = await db
      .select({
        id: documents.id,
        name: documents.name,
      })
      .from(documents)
      .innerJoin(knowledgeBases, eq(documents.knowledgeBaseId, knowledgeBases.id))
      .innerJoin(bots, eq(knowledgeBases.botId, bots.id))
      .where(
        and(
          eq(documents.id, parsedInput.id),
          eq(knowledgeBases.id, parsedInput.knowledgeBaseId),
          eq(bots.userId, userId),
        ),
      );

    if (!target) {
      throw new Error(
        "Document not found or you do not have permission to delete it.",
      );
    }

    await db.delete(documents).where(eq(documents.id, parsedInput.id));

    revalidatePath(`/knowledge/${parsedInput.knowledgeBaseId}`);
    revalidatePath("/knowledge");

    return {
      success: true,
      document: target,
    };
  });
