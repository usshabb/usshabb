
import { db } from "./db";
import { folders, documents, docMessages, type Folder, type InsertFolder, type UpdateFolderRequest, type Document, type InsertDocument, type DocMessage, type InsertDocMessage } from "@shared/schema";
import { eq, desc, inArray } from "drizzle-orm";

export interface IStorage {
  getFolders(): Promise<Folder[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, updates: UpdateFolderRequest): Promise<Folder>;
  deleteFolder(id: number): Promise<void>;
  
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByIds(ids: number[]): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  getDocMessages(): Promise<DocMessage[]>;
  createDocMessage(msg: InsertDocMessage): Promise<DocMessage>;
}

export class DatabaseStorage implements IStorage {
  async getFolders(): Promise<Folder[]> {
    // Sort by ID for stability, or could add an 'order' field later
    return await db.select().from(folders).orderBy(folders.id);
  }

  async getFolder(id: number): Promise<Folder | undefined> {
    const [folder] = await db.select().from(folders).where(eq(folders.id, id));
    return folder;
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const [folder] = await db.insert(folders).values(insertFolder).returning();
    return folder;
  }

  async updateFolder(id: number, updates: UpdateFolderRequest): Promise<Folder> {
    const [updated] = await db
      .update(folders)
      .set(updates)
      .where(eq(folders.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Folder with id ${id} not found`);
    }
    
    return updated;
  }

  async deleteFolder(id: number): Promise<void> {
    await db.delete(folders).where(eq(folders.id, id));
  }

  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async getDocumentsByIds(ids: number[]): Promise<Document[]> {
    if (ids.length === 0) return [];
    return await db.select().from(documents).where(inArray(documents.id, ids));
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getDocMessages(): Promise<DocMessage[]> {
    return await db.select().from(docMessages).orderBy(docMessages.createdAt);
  }

  async createDocMessage(msg: InsertDocMessage): Promise<DocMessage> {
    const [newMsg] = await db.insert(docMessages).values(msg).returning();
    return newMsg;
  }
}

export const storage = new DatabaseStorage();
