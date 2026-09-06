import { z } from "zod";

export const saveWidgetConfigSchema = z.object({
  botId: z.string().uuid("Invalid bot ID"),
  enabled: z.boolean(),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or fewer"),
  welcomeMessage: z
    .string()
    .max(1000, "Welcome message must be 1000 characters or fewer")
    .default("Hi there! How can I help you today? 👋"),
  position: z.enum(["bottom-right", "bottom-left"]),
  themeColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a valid hex color (e.g. #6366f1)"),
});

export type SaveWidgetConfigInput = z.infer<typeof saveWidgetConfigSchema>;
