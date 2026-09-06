import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { knowledgeBases } from "./knowledge-bases";
import { documentChunks } from "./document-chunks";

export const documentSourceTypeEnum = pgEnum("document_source_type", [
  "upload",
  "url",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBases.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sourceType: documentSourceTypeEnum("source_type").notNull(),
    sourceUrl: text("source_url"),
    mimeType: text("mime_type"),
    size: integer("size"),
    status: documentStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("documents_knowledge_base_id_idx").on(table.knowledgeBaseId),
    index("documents_status_idx").on(table.status),
  ],
);

export const documentRelations = relations(documents, ({ one, many }) => ({
  knowledgeBase: one(knowledgeBases, {
    fields: [documents.knowledgeBaseId],
    references: [knowledgeBases.id],
  }),
  chunks: many(documentChunks),
}));
