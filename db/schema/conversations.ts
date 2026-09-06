import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { bots } from "./bots";
import { user } from "./auth";
import { messages } from "./messages";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    title: text("title"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("conversations_bot_id_idx").on(table.botId),
    index("conversations_user_id_idx").on(table.userId),
    index("conversations_updated_at_idx").on(table.updatedAt),
  ],
);

export const conversationRelations = relations(
  conversations,
  ({ one, many }) => ({
    bot: one(bots, {
      fields: [conversations.botId],
      references: [bots.id],
    }),
    user: one(user, {
      fields: [conversations.userId],
      references: [user.id],
    }),
    messages: many(messages),
  }),
);
