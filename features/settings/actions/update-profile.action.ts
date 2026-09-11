"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { authClient } from "@/lib/safe-action";
import { updateProfileSchema } from "../validations";

export const updateProfileAction = authClient
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.auth.user.id;

    const [updatedUser] = await db
      .update(user)
      .set({
        name: parsedInput.name.trim(),
        image: parsedInput.image?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();

    if (!updatedUser) {
      throw new Error("User not found or update failed");
    }

    revalidatePath("/settings");

    return {
      success: true,
      user: updatedUser,
    };
  });
