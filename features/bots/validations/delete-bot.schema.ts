import { z } from "zod";

export const deleteBotSchema = z.object({
  id: z.string().uuid("Invalid bot ID"),
});

export type DeleteBotInput = z.infer<typeof deleteBotSchema>;
