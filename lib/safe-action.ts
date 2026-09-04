import { createSafeActionClient } from "next-safe-action";
import { betterAuth } from "@next-safe-action/adapter-better-auth";
import { auth } from "./auth";

// Public action client (no auth required)
export const actionClient = createSafeActionClient();

// Authenticated action client
export const authClient = actionClient.use(betterAuth(auth));
