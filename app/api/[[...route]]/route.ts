import { Hono } from "hono";
import { handle } from "hono/vercel";

import { chatRoutes } from "@/server/routes/chat";
import { widgetRoutes } from "@/server/routes/widget";

// Initialize Hono and set the base path matching your Next.js directory
const app = new Hono().basePath("/api");

// Define your API routes
app.get("/hello", (c) => {
  return c.json({
    message: "Hello from Hono!",
  });
});

app.route("/chat", chatRoutes);
app.route("/widget", widgetRoutes);

// Export the handlers for HTTP methods supported by Vercel / Next.js
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
