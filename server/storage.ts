import {
  FolderModel,
  FolderItemModel,
  DocumentModel,
  DocMessageModel,
  MailingListModel,
  ContextModel,
  type Folder,
  type InsertFolder,
  type UpdateFolderRequest,
  type FolderItem,
  type InsertFolderItem,
  type Document,
  type InsertDocument,
  type DocMessage,
  type InsertDocMessage,
  type MailingList,
  type InsertMailingList,
  type Context,
  type InsertContext,
} from "@shared/schema";
import mongoose from "mongoose";

export interface IStorage {
  getFolders(): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: string, updates: UpdateFolderRequest): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;

  getFolderItems(folderId: string): Promise<FolderItem[]>;
  createFolderItem(item: InsertFolderItem): Promise<FolderItem>;
  updateFolderItem(folderId: string, itemId: string, updates: Partial<InsertFolderItem>): Promise<FolderItem>;
  deleteFolderItem(folderId: string, itemId: string): Promise<void>;

  getDocuments(): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByIds(ids: string[]): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: { name?: string }): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  getDocMessages(): Promise<DocMessage[]>;
  createDocMessage(msg: InsertDocMessage): Promise<DocMessage>;

  getMailingLists(): Promise<MailingList[]>;
  getMailingList(id: string): Promise<MailingList | undefined>;
  createMailingList(list: InsertMailingList): Promise<MailingList>;
  updateMailingList(id: string, updates: Partial<InsertMailingList>): Promise<MailingList>;
  deleteMailingList(id: string): Promise<void>;

  getContext(): Promise<Context | undefined>;
  createOrUpdateContext(contextData: string): Promise<Context>;
}

// Helper to convert Mongoose doc to API format
function toFolderResponse(doc: any): Folder {
  return {
    id: doc._id.toString(),
    name: doc.name,
    x: doc.x,
    y: doc.y,
  };
}

function toDocumentResponse(doc: any): Document {
  return {
    id: doc._id.toString(),
    name: doc.name,
    originalName: doc.originalName,
    content: doc.content,
    fileUrl: doc.fileUrl,
    fileId: doc.fileId,
    createdAt: doc.createdAt,
  };
}

function toDocMessageResponse(doc: any): DocMessage {
  return {
    id: doc._id.toString(),
    documentId: doc.documentId ? doc.documentId.toString() : null,
    role: doc.role,
    content: doc.content,
    referencedDocs: doc.referencedDocs,
    createdAt: doc.createdAt,
  };
}

function toMailingListResponse(doc: any): MailingList {
  return {
    id: doc._id.toString(),
    name: doc.name,
    emails: doc.emails,
    createdAt: doc.createdAt,
  };
}

function toContextResponse(doc: any): Context {
  return {
    id: doc._id.toString(),
    contextData: doc.contextData,
    updatedAt: doc.updatedAt,
  };
}

function toFolderItemResponse(doc: any): FolderItem {
  return {
    id: doc._id.toString(),
    folderId: doc.folderId.toString(),
    type: doc.type,
    name: doc.name,
    x: doc.x,
    y: doc.y,
    fileUrl: doc.fileUrl,
    fileId: doc.fileId,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    url: doc.url,
    faviconUrl: doc.faviconUrl,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class DatabaseStorage implements IStorage {
  async getFolders(): Promise<Folder[]> {
    const folders = await FolderModel.find().sort({ _id: 1 }).lean();
    return folders.map(toFolderResponse);
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const folder = await FolderModel.findById(id).lean();
    return folder ? toFolderResponse(folder) : undefined;
  }

  async createFolder(insertFolder: InsertFolder): Promise<Folder> {
    const folder = await FolderModel.create(insertFolder);
    return toFolderResponse(folder);
  }

  async updateFolder(id: string, updates: UpdateFolderRequest): Promise<Folder> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid folder id: ${id}`);
    }

    const updated = await FolderModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      throw new Error(`Folder with id ${id} not found`);
    }

    return toFolderResponse(updated);
  }

  async deleteFolder(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;

    // Cascade delete folder items (via middleware in model)
    const folder = await FolderModel.findById(id);
    if (folder) {
      await folder.deleteOne(); // Triggers pre-remove hook
    }
  }

  async getFolderItems(folderId: string): Promise<FolderItem[]> {
    if (!mongoose.Types.ObjectId.isValid(folderId)) return [];
    const items = await FolderItemModel.find({ folderId }).sort({ _id: 1 }).lean();
    return items.map(toFolderItemResponse);
  }

  async createFolderItem(insertItem: InsertFolderItem): Promise<FolderItem> {
    const data = {
      ...insertItem,
      folderId: new mongoose.Types.ObjectId(insertItem.folderId),
    };
    const item = await FolderItemModel.create(data);
    return toFolderItemResponse(item);
  }

  async updateFolderItem(folderId: string, itemId: string, updates: Partial<InsertFolderItem>): Promise<FolderItem> {
    if (!mongoose.Types.ObjectId.isValid(folderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      throw new Error(`Invalid folder or item id`);
    }

    const updated = await FolderItemModel.findOneAndUpdate(
      { _id: itemId, folderId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      throw new Error(`Folder item with id ${itemId} not found in folder ${folderId}`);
    }

    return toFolderItemResponse(updated);
  }

  async deleteFolderItem(folderId: string, itemId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(folderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return;
    }

    // Find and delete to trigger pre-remove hooks
    const item = await FolderItemModel.findOne({ _id: itemId, folderId });
    if (item) {
      await item.deleteOne(); // Triggers pre-remove hook
    }
  }

  async getDocuments(): Promise<Document[]> {
    const docs = await DocumentModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(toDocumentResponse);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const doc = await DocumentModel.findById(id).lean();
    return doc ? toDocumentResponse(doc) : undefined;
  }

  async getDocumentsByIds(ids: string[]): Promise<Document[]> {
    if (ids.length === 0) return [];
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    const docs = await DocumentModel.find({ _id: { $in: validIds } }).lean();
    return docs.map(toDocumentResponse);
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const newDoc = await DocumentModel.create(doc);
    return toDocumentResponse(newDoc);
  }

  async updateDocument(id: string, updates: { name?: string }): Promise<Document> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid document id: ${id}`);
    }

    const updated = await DocumentModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      throw new Error(`Document with id ${id} not found`);
    }

    return toDocumentResponse(updated);
  }

  async deleteDocument(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;

    // Cascade delete doc_messages (via middleware in model)
    const doc = await DocumentModel.findById(id);
    if (doc) {
      await doc.deleteOne(); // Triggers pre-remove hook
    }
  }

  async getDocMessages(): Promise<DocMessage[]> {
    const messages = await DocMessageModel.find().sort({ createdAt: 1 }).lean();
    return messages.map(toDocMessageResponse);
  }

  async createDocMessage(msg: InsertDocMessage): Promise<DocMessage> {
    // Convert documentId string to ObjectId if present
    const data = {
      ...msg,
      documentId: msg.documentId
        ? new mongoose.Types.ObjectId(msg.documentId)
        : null,
    };

    const newMsg = await DocMessageModel.create(data);
    return toDocMessageResponse(newMsg);
  }

  async getMailingLists(): Promise<MailingList[]> {
    const lists = await MailingListModel.find().sort({ createdAt: -1 }).lean();
    return lists.map(toMailingListResponse);
  }

  async getMailingList(id: string): Promise<MailingList | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const list = await MailingListModel.findById(id).lean();
    return list ? toMailingListResponse(list) : undefined;
  }

  async createMailingList(list: InsertMailingList): Promise<MailingList> {
    const newList = await MailingListModel.create(list);
    return toMailingListResponse(newList);
  }

  async updateMailingList(id: string, updates: Partial<InsertMailingList>): Promise<MailingList> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Invalid mailing list id: ${id}`);
    }

    const updated = await MailingListModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      throw new Error(`Mailing list with id ${id} not found`);
    }

    return toMailingListResponse(updated);
  }

  async deleteMailingList(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await MailingListModel.findByIdAndDelete(id);
  }

  async getContext(): Promise<Context | undefined> {
    const context = await ContextModel.findOne().sort({ updatedAt: -1 }).lean();
    return context ? toContextResponse(context) : undefined;
  }

  async createOrUpdateContext(contextData: string): Promise<Context> {
    // Check if context already exists
    const existing = await ContextModel.findOne();

    if (existing) {
      // Update existing context
      existing.contextData = contextData;
      existing.updatedAt = new Date();
      await existing.save();
      return toContextResponse(existing);
    } else {
      // Create new context
      const newContext = await ContextModel.create({ contextData });
      return toContextResponse(newContext);
    }
  }
}

export const storage = new DatabaseStorage();
