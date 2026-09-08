import { z } from "zod";

export const deleteKnowledgeBaseSchema = z.object({
  id: z.string().uuid("Invalid knowledge base ID"),
});

export type DeleteKnowledgeBaseInput = z.infer<typeof deleteKnowledgeBaseSchema>;
