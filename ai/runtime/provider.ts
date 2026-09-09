import { createOpenRouter } from "@openrouter/ai-sdk-provider";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY environment variable is not set");
}

/**
 * The single OpenRouter provider instance for the entire application.
 *
 * This is the ONLY place in the codebase that:
 * - imports from @openrouter/ai-sdk-provider
 * - reads OPENROUTER_API_KEY
 *
 * All other layers must go through ai/runtime/models.ts or ai/runtime/stream.ts.
 */
export const openrouterProvider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  appName: "Inno Chat Bot",
});
