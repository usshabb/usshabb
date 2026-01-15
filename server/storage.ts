import {
  FolderModel,
  DocumentModel,
  DocMessageModel,
  MailingListModel,
  type Folder,
  type InsertFolder,
  type UpdateFolderRequest,
  type Document,
  type InsertDocument,
  type DocMessage,
  type InsertDocMessage,
  type MailingList,
  type InsertMailingList,
} from "@shared/schema";
import mongoose from "mongoose";

export interface IStorage {
  getFolders(): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder): Promise<Folder>;
  updateFolder(id: string, updates: UpdateFolderRequest): Promise<Folder>;
  deleteFolder(id: string): Promise<void>;

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
    await FolderModel.findByIdAndDelete(id);
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
}

export const storage = new DatabaseStorage();
