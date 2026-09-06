"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bots } from "@/db/schema/bots";
import { authClient } from "@/lib/safe-action";
import { deleteBotSchema } from "../validations";

export const deleteBotAction = authClient
  .inputSchema(deleteBotSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.auth.user.id;

    const [deletedBot] = await db
      .delete(bots)
      .where(and(eq(bots.id, parsedInput.id), eq(bots.userId, userId)))
      .returning({ id: bots.id, name: bots.name });

    if (!deletedBot) {
      throw new Error("Bot not found or you do not have permission to delete it.");
    }

    revalidatePath("/bots");

    return {
      success: true,
      bot: deletedBot,
    };
  });
