
import { db } from "./db";
import { folders, type Folder, type InsertFolder, type UpdateFolderRequest } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  getFolders(): Promise<Folder[]>;
  getFolder(id: number): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: number, updates: UpdateFolderRequest): Promise<Folder>;
  deleteFolder(id: number): Promise<void>;
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
}

export const storage = new DatabaseStorage();
