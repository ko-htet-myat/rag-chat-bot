import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { bots } from "./bots";
import { documents } from "./documents";

export const knowledgeBases = pgTable(
  "knowledge_bases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("knowledge_bases_bot_id_idx").on(table.botId)],
);

export const knowledgeBaseRelations = relations(
  knowledgeBases,
  ({ one, many }) => ({
    bot: one(bots, {
      fields: [knowledgeBases.botId],
      references: [bots.id],
    }),
    documents: many(documents),
  }),
);
