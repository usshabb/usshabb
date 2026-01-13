
import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // Position coordinates for the desktop grid
  x: integer("x").default(0),
  y: integer("y").default(0),
});

// === BASE SCHEMAS ===
export const insertFolderSchema = createInsertSchema(folders).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Folder = typeof folders.$inferSelect;
export type InsertFolder = z.infer<typeof insertFolderSchema>;

// Request types
export type CreateFolderRequest = InsertFolder;
export type UpdateFolderRequest = Partial<InsertFolder>;

// Response types
export type FolderResponse = Folder;
export type FoldersListResponse = Folder[];
