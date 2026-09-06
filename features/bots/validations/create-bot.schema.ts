import { z } from "zod";

export const createBotSchema = z.object({
  name: z
    .string()
    .min(2, "Bot name must be at least 2 characters")
    .max(100, "Bot name must be 100 characters or fewer"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or fewer")
    .optional(),
  systemPrompt: z
    .string()
    .min(5, "System prompt must be at least 5 characters"),
  modelProvider: z.enum(["openrouter"]),
  model: z
    .string()
    .min(1, "Model identifier is required"),
  temperature: z
    .number()
    .min(0, "Temperature must be between 0.0 and 2.0")
    .max(2, "Temperature must be between 0.0 and 2.0"),
  maxTokens: z
    .number()
    .int("Max tokens must be an integer")
    .min(1, "Max tokens must be at least 1")
    .max(32768, "Max tokens must not exceed 32,768")
    .optional(),
});

export type CreateBotInput = z.infer<typeof createBotSchema>;
