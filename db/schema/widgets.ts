import { relations } from "drizzle-orm";
import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { bots } from "./bots";

export const widgetConfigs = pgTable("widget_configs", {
  id: uuid("id").defaultRandom().primaryKey(),
  botId: uuid("bot_id")
    .notNull()
    .unique()
    .references(() => bots.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  allowedOrigins: text("allowed_origins").array().default([]).notNull(),
  theme: jsonb("theme").$type<Record<string, unknown>>(),
  welcomeMessage: text("welcome_message"),
  position: text("position").default("bottom-right").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const widgetConfigRelations = relations(widgetConfigs, ({ one }) => ({
  bot: one(bots, {
    fields: [widgetConfigs.botId],
    references: [bots.id],
  }),
}));
