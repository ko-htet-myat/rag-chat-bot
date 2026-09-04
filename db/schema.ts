import {
  pgTable,
  uuid,
  text,
  timestamp,
  vector,
  jsonb,
} from "drizzle-orm/pg-core";

// 1. Multi-tenant Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Chatbots configuration table
export const chatbots = pgTable("chatbots", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Knowledge Base for RAG (Uses pgvector)
export const chatbotKnowledge = pgTable("chatbot_knowledge", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatbotId: uuid("chatbot_id").references(() => chatbots.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(), // The raw text chunk
  embedding: vector("embedding", { dimensions: 1536 }).notNull(), // 1536 for OpenAI models
});

// 4. Chat Message History (Using JSONB for flexible LLM structures)
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatbotId: uuid("chatbot_id").references(() => chatbots.id, {
    onDelete: "cascade",
  }),
  sessionId: text("session_id").notNull(), // Groups a single user conversation
  payload: jsonb("payload").notNull(), // Stores { role: "user", content: "..." }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
