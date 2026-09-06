import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  real,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { conversations } from "./conversations";
import { knowledgeBases } from "./knowledge-bases";
import { widgetConfigs } from "./widgets";

export const modelProviderEnum = pgEnum("model_provider", ["openrouter"]);

export const bots = pgTable(
  "bots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt").notNull(),
    modelProvider: modelProviderEnum("model_provider")
      .default("openrouter")
      .notNull(),
    model: text("model").notNull(),
    temperature: real("temperature").default(0.7).notNull(),
    maxTokens: integer("max_tokens"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("bots_user_id_idx").on(table.userId)],
);

export const botRelations = relations(bots, ({ one, many }) => ({
  user: one(user, {
    fields: [bots.userId],
    references: [user.id],
  }),
  conversations: many(conversations),
  knowledgeBases: many(knowledgeBases),
  widgetConfig: one(widgetConfigs),
}));
