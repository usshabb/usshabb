
import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// === TABLE DEFINITIONS ===
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  x: integer("x").default(0),
  y: integer("y").default(0),
});

// Documents table for PDFs
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  fileId: text("file_id"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Chat messages for document Q&A
export const docMessages = pgTable("doc_messages", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  referencedDocs: text("referenced_docs").array(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Re-export chat models
export { conversations, messages } from "./models/chat";

// === BASE SCHEMAS ===
export const insertFolderSchema = createInsertSchema(folders).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertDocMessageSchema = createInsertSchema(docMessages).omit({ id: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocMessage = typeof docMessages.$inferSelect;
export type InsertDocMessage = z.infer<typeof insertDocMessageSchema>;

// Request types
export type CreateFolderRequest = InsertFolder;
export type UpdateFolderRequest = Partial<InsertFolder>;

// Response types
export type FolderResponse = Folder;
export type FoldersListResponse = Folder[];
