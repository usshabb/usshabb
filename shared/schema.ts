import { z } from "zod";
import mongoose from "mongoose";

// Re-export models
export { FolderModel, type IFolder } from "./models/folder.model";
export { FolderItemModel, type IFolderItem } from "./models/folderItem.model";
export { DocumentModel, type IDocument } from "./models/document.model";
export { DocMessageModel, type IDocMessage } from "./models/docMessage.model";
export { ConversationModel, type IConversation } from "./models/conversation.model";
export { MessageModel, type IMessage } from "./models/message.model";
export { default as MailingListModel, type IMailingList } from "./models/mailingList.model";
export { ContextModel, type IContext } from "./models/context.model";

// Zod schemas for validation (replacing drizzle-zod)
export const insertFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  x: z.number().optional().default(0),
  y: z.number().optional().default(0),
});

export const insertDocumentSchema = z.object({
  name: z.string().min(1, "Document name is required"),
  originalName: z.string().min(1, "Original name is required"),
  content: z.string().min(1, "Content is required"),
  fileUrl: z.string().nullable().optional(),
  fileId: z.string().nullable().optional(),
});

export const insertDocMessageSchema = z.object({
  documentId: z.string().nullable().optional(),
  role: z.string().min(1),
  content: z.string().min(1),
  referencedDocs: z.array(z.string()).nullable().optional(),
});

export const insertConversationSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export const insertMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  role: z.string().min(1),
  content: z.string().min(1),
});

// Type aliases for API contracts (maintaining compatibility)
export type Folder = {
  id: string;
  name: string;
  x: number;
  y: number;
};

export type InsertFolder = z.infer<typeof insertFolderSchema>;

export type Document = {
  id: string;
  name: string;
  originalName: string;
  content: string;
  fileUrl: string | null;
  fileId: string | null;
  createdAt: Date;
};

export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type DocMessage = {
  id: string;
  documentId: string | null;
  role: string;
  content: string;
  referencedDocs: string[] | null;
  createdAt: Date;
};

export type InsertDocMessage = z.infer<typeof insertDocMessageSchema>;

export type Conversation = {
  id: string;
  title: string;
  createdAt: Date;
};

export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: Date;
};

export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const insertMailingListSchema = z.object({
  name: z.string().min(1, "Mailing list name is required"),
  emails: z.array(z.string().email("Invalid email format")).min(1, "At least one email is required"),
});

export type MailingList = {
  id: string;
  name: string;
  emails: string[];
  createdAt: Date;
};

export type InsertMailingList = z.infer<typeof insertMailingListSchema>;

// FolderItem schemas
export const insertFolderItemSchema = z.object({
  folderId: z.string().min(1, "Folder ID is required"),
  type: z.enum(['file', 'bookmark', 'note']),
  name: z.string().min(1, "Name is required"),
  x: z.number().optional().default(0),
  y: z.number().optional().default(0),
  // File fields
  fileUrl: z.string().nullable().optional(),
  fileId: z.string().nullable().optional(),
  originalName: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  // Bookmark fields
  url: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  // Note fields
  content: z.string().nullable().optional(),
});

export type FolderItem = {
  id: string;
  folderId: string;
  type: 'file' | 'bookmark' | 'note';
  name: string;
  x: number;
  y: number;
  // File fields
  fileUrl?: string | null;
  fileId?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  // Bookmark fields
  url?: string | null;
  faviconUrl?: string | null;
  // Note fields
  content?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertFolderItem = z.infer<typeof insertFolderItemSchema>;

// Context schemas
export const insertContextSchema = z.object({
  contextData: z.string().min(1, "Context data is required"),
});

export type Context = {
  id: string;
  contextData: string;
  updatedAt: Date;
};

export type InsertContext = z.infer<typeof insertContextSchema>;

// Request types
export type CreateFolderRequest = InsertFolder;
export type UpdateFolderRequest = Partial<InsertFolder>;

// Response types
export type FolderResponse = Folder;
export type FoldersListResponse = Folder[];
