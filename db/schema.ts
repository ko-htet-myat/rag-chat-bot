import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const pollTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  option: text("option").notNull(),
  ipAddress: text("ip_address").notNull(),
});
